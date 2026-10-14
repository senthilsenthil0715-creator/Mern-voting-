const router = require('express').Router();
const mongoose = require('mongoose');
const { auth, adminOnly } = require('../middleware/auth');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const getStatus = require('../utils/status');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: 'Invalid election id' });

// Validates and cleans admin input for create / update
function parseElectionBody(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const candidates = (Array.isArray(body.candidates) ? body.candidates : [])
    .map((c) => ({
      name: String((c && c.name) || '').trim(),
      party: String((c && c.party) || '').trim(),
      description: String((c && c.description) || '').trim(),
    }))
    .filter((c) => c.name);

  if (!title) return { error: 'Enter an election title' };
  if (title.length > 120) return { error: 'Title is too long (120 characters max)' };
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return { error: 'Enter valid start and end dates' };
  if (endDate <= startDate) return { error: 'The end date must be after the start date' };
  if (candidates.length < 2) return { error: 'Add at least 2 candidates' };
  if (candidates.length > 10) return { error: 'You can add up to 10 candidates' };
  if (candidates.some((c) => c.name.length > 60 || c.party.length > 60 || c.description.length > 300))
    return { error: 'A candidate field is too long' };

  return { data: { title, description, startDate, endDate, candidates } };
}

const publicElection = (e) => ({
  _id: String(e._id),
  title: e.title,
  description: e.description,
  startDate: e.startDate,
  endDate: e.endDate,
  status: getStatus(e),
  candidates: e.candidates.map((c) => ({
    _id: String(c._id),
    name: c.name,
    party: c.party,
    description: c.description,
  })),
});

// List all elections
router.get('/', auth, async (req, res) => {
  try {
    const elections = await Election.find().sort({ startDate: -1 }).lean();
    const myVotes = await Vote.find({ voter: req.user.id }).select('election').lean();
    const voted = new Set(myVotes.map((v) => String(v.election)));
    const counts = await Vote.aggregate([{ $group: { _id: '$election', n: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

    res.json(
      elections.map((e) => {
        const status = getStatus(e);
        const showTotal = req.user.role === 'admin' || status === 'ended';
        return {
          _id: String(e._id),
          title: e.title,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate,
          status,
          candidateCount: e.candidates.length,
          hasVoted: voted.has(String(e._id)),
          totalVotes: showTotal ? countMap.get(String(e._id)) || 0 : null,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// One election. Results are only included once it has ended (or for admins).
router.get('/:id', auth, validId, async (req, res) => {
  try {
    const e = await Election.findById(req.params.id).lean();
    if (!e) return res.status(404).json({ message: 'Election not found' });

    const status = getStatus(e);
    const hasVoted = !!(await Vote.exists({ election: e._id, voter: req.user.id }));

    let results = null;
    let totalVotes = null;
    if (status === 'ended' || req.user.role === 'admin') {
      const counts = await Vote.aggregate([
        { $match: { election: e._id } },
        { $group: { _id: '$candidate', n: { $sum: 1 } } },
      ]);
      const map = new Map(counts.map((c) => [String(c._id), c.n]));
      results = e.candidates.map((c) => ({ candidateId: String(c._id), votes: map.get(String(c._id)) || 0 }));
      totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
    }

    res.json({ election: publicElection(e), hasVoted, results, totalVotes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cast a vote (voters only, one per election)
router.post('/:id/vote', auth, validId, async (req, res) => {
  try {
    if (req.user.role !== 'voter') return res.status(403).json({ message: 'Only voters can cast votes' });

    const e = await Election.findById(req.params.id);
    if (!e) return res.status(404).json({ message: 'Election not found' });
    if (getStatus(e) !== 'active') return res.status(400).json({ message: 'Voting is not open for this election' });

    const candidateId = String(req.body.candidateId || '');
    const candidate = e.candidates.find((c) => String(c._id) === candidateId);
    if (!candidate) return res.status(400).json({ message: 'Choose a candidate' });

    try {
      await Vote.create({ election: e._id, voter: req.user.id, candidate: candidate._id });
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ message: 'You have already voted in this election' });
      throw err;
    }
    res.status(201).json({ message: 'Your vote has been recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Admin ----
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { error, data } = parseElectionBody(req.body);
    if (error) return res.status(400).json({ message: error });
    const election = await Election.create({ ...data, createdBy: req.user.id });
    res.status(201).json({ _id: String(election._id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, adminOnly, validId, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (await Vote.exists({ election: election._id }))
      return res.status(400).json({ message: 'Votes have already been cast, so this election can no longer be edited' });

    const { error, data } = parseElectionBody(req.body);
    if (error) return res.status(400).json({ message: error });

    Object.assign(election, data);
    await election.save();
    res.json({ _id: String(election._id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, adminOnly, validId, async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    await Vote.deleteMany({ election: election._id });
    res.json({ message: 'Election deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
