/**
 * Check if function is generator function
 **/
module.exports = isGeneratorFunction

function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === "GeneratorFunction"
}
