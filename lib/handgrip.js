/**
 * Extend Handlebars to support generator helper
 *
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var util = require("./wrapper")
var compose = require("./compose")
var handlebars = require("handlebars")

var isGeneratorFunction = require("./isgen")

// the callee may have null as prototype
function has(o, k) {
  return Object.prototype.hasOwnProperty.call(o, k)
}

var Q = "__GeneratorHelperQueue__"


module.exports = Handgrip()


function Handgrip() {
  var hbs = handlebars.create()
  
  hbs.create = Handgrip

  hbs.registerGeneratorHelper = registerGeneratorHelper

  hbs.render = render
  hbs.createRenderer = createRenderer

  hbs.createHandlebars = handlebars.create

  return hbs
}

function registerGeneratorHelper(fnName, fn) {
  var hbs = this

  if (typeof fnName === "object") {
    for (var n in fnName) {
      if (has(fnName, n)) {
        hbs.registerGeneratorHelper(n, fnName[n])
      }
    }

    return
  }

  hbs.registerHelper(fnName, function helper() {
    var len = arguments.length
    var args = Array(len)
    while(len--) args[len] = arguments[len]

    var tuple = fn.apply(this, args)

    if (!isGeneratorFunction(tuple)) return tuple

    tuple = util.wrap(tuple)

    // XXX: check for gid collision

    var root = args[args.length - 1].data.root

    createQueue(root)

    console.log("inserting:", tuple.gid.slice(0,8), args[0] + args[1].hash.order)
    console.log("pos:",root[Q].index, root.spliceOffset)

    console.log(" >", root[Q].map(function(q) {return q.gid.slice(0,8)}))

    root[Q].splice(root[Q].index + root.spliceOffset, 0, tuple)

    
    console.log("--")
    console.log(">>", root[Q].map(function(q) {return q.gid.slice(0,8)}))

    console.log("==")
    console.log(root, root[Q])
    console.log()
    
    root.spliceOffset++

    return new handlebars.SafeString(
      util.toPlaceholder(tuple)
    )
  })
}

function createQueue(data) {
  if (data === null) data = Object.create(data)
  if (!(Q in data)) {
    Object.defineProperty(data, Q, {
      value: [],
      enumerable: false,
      configurable: false,
    })
  }
  // data[Q] = data[Q] || []

  data[Q].index = data[Q].index || 0
  data.spliceOffset = data.spliceOffset || 0
}

function render() {
  var len = arguments.length

  var args = Array(len)
  while(len--) args[len] = arguments[len]

  return createRenderer(
      this.compile.apply(this, args)
  )
}

function createRenderer(compiled) {
  return function* (context) {
    createQueue(context)

    var len = arguments.length

    var args = Array(len)
    while(len-- > 0) args[len] = arguments[len]

    args[0] = context

    var out = compiled.apply(null, args)

    console.log("queue is: ", context[Q].map(function(q) {return q.gid.slice(0,8)}))

    return yield replace.call(context, context[Q], out)

  }
}

var maxExecutionCount = 9999

function* replace(queue, result) {
  var ret = yield compose.call(this, queue, util.unwrap)

  var retObj = {}

  var retArray = Array(queue.length)

  queue.forEach(function(q, i) {
    var item = q.toString()
    retArray[i] = q
    retObj[q] = ret[i]
  })

  var gidRegExp = util.toRegExp( retArray )

  function lookup(match, gid) {
    return retObj[gid]
  }

  do {
    result = result.replace(gidRegExp, lookup)
  } while (gidRegExp.test(result) && maxExecutionCount--)

  retArray = retObj = null

  return result
}
