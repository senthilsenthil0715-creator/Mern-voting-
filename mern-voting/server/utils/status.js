// upcoming | active | ended
module.exports = function getStatus(election, now = new Date()) {
  if (now < new Date(election.startDate)) return 'upcoming';
  if (now > new Date(election.endDate)) return 'ended';
  return 'active';
};
