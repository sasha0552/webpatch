// evaluate script in specifc context
function evalInContext(script, context) {
  return function () {
    with (this) {
      return eval(script);
    }
  }.call(context);
}

module.exports = {
  evalInContext,
};
