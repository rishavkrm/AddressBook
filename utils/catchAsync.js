
// making function to avoid rewriting try, catch in async functions
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
