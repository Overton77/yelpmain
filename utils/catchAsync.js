module.exports = function (func) {
  return function (req, res, next) {
    return func(req, res, next).catch((e) => next(e));
  };
};
