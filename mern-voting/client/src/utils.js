export const errMsg = (err) =>
  (err && err.response && err.response.data && err.response.data.message) ||
  'Cannot reach the server. Check that the API is running.';

export const formatDate = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

// ISO string -> value for <input type="datetime-local">
export const toLocalInput = (iso) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const statusLabel = { active: 'Open for voting', upcoming: 'Upcoming', ended: 'Closed' };
