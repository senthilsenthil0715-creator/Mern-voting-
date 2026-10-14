const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const getStatus = require('../utils/status');

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [voters, votes, elections] = await Promise.all([
      User.countDocuments({ role: 'voter', verified: true }),
      Vote.countDocuments(),
      Election.find().select('startDate endDate').lean(),
    ]);
    res.json({
      voters,
      votes,
      elections: elections.length,
      activeElections: elections.filter((e) => getStatus(e) === 'active').length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
