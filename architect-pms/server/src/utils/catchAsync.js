/**
  Wraps asynchronous route handlers to pass errors automatically to the Express error handling middleware.
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
