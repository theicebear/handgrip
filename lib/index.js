/**
 * Extend Handlebars to support generator helper
 *
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var Wrapper = require("./wrapper");
var compose = require("./compose");
var handlebars = require("handlebars");

// the callee may have null as prototype
function has(o, k) {
  return Object.prototype.hasOwnProperty.call(o, k);
}

var Q = "__GeneratorHelperQueue__";

// export a new instance of Handgrip
module.exports = Handgrip();

/**
 * Augment Handlebars
 **/
function Handgrip() {
  // always create a new instance of Handlebars
  var hbs = handlebars.create();

  // export a method to retrive the raw handlebars
  hbs.createHandlebars = handlebars.create();

  // create a new instance of Handgrip
  hbs.create = Handgrip;

  // add three functions
  hbs.registerGeneratorHelper = registerGeneratorHelper;
  hbs.render = render;
  hbs.createRenderer = createRenderer;

  // export a method to retrive the raw handlebars
  hbs.createHandlebars = handlebars.create;

  return hbs;
}

/**
 * Register generator helpers
 * does not support object input
 **/
function registerGeneratorHelper(fnName, fn) {
  var hbs = this;
  if (typeof fnName === "object") {
    for (var n in fnName) {
      if (has(fnName, n)) {
        hbs.registerGeneratorHelper(n, fnName[n]);
      }
    }

    return;
  }

  return hbs.registerHelper(fnName, function() {
    // avoid memory leak by cloning arguments
    var len = arguments.length;
    var args = Array(len);
    while (len--) args[len] = arguments[len];

    // execute helper to examine
    // whether it is generatorHelper or not
    var tuple = fn.apply(this, args);

    // compatible with traditional `registerHelper` calls
    if (!isGeneratorFunction(tuple)) return tuple;

    // wrap generate function in a data structure
    tuple = Wrapper.wrap(tuple);

    var options = args[args.length - 1];

    var root = options.data.root;

    // check for UUID collison
    /*if (tuple.gid && root[Q]) {
      // re-generate uuid
      // if collison found
      if (tuple.gid in root[Q].listOfUUIDs) tuple = Wrapper.wrap(tuple);

      root[Q].listOfUUIDs[tuple.gid] = true;
    }*/

    // each order level has its own spliceOffset
    if (!has(root, "spliceOffset")) root.spliceOffset = 0;
    if (root[Q]) {

      console.log("inserting:", tuple.gid.slice(0,8), args[0] + args[1].hash.order)
    console.log("pos:",root[Q].index, root.spliceOffset)

      console.log(" >", root[Q].map(function(q) {return q.gid.slice(0,8)}))

    
      root[Q].splice(root[Q].index + root.spliceOffset, 0, tuple);

      console.log("--")
      console.log(">>", root[Q].map(function(q) {return q.gid.slice(0,8)}))

      console.log("==")

      console.log("rr", root)
      console.log("Q equal", root[Q] === root.__proto__[Q])
      console.log()
      console.log()

      root.spliceOffset++;
    }

    var placeholder = Wrapper.toPlaceholder(tuple);

    return new hbs.SafeString(placeholder);
  });
}

/**
 * Compile method for page(root scope) rendering only
 * does not apply to rendering in generator helper
 * use traditional handlebars.compile/tpl() inside generator helpers
 **/
function render() {
  // avoid memory leak by cloning arguments
  var len = arguments.length;
  var args = Array(len);
  while (len--) args[len] = arguments[len];

  var compiled = this.compile.apply(this, args);
  return createRenderer(compiled);
}

/**
 * Adapt normal handlebars compiled template
 * by filling placeholder created by generatorHelper
 **/
function createRenderer(compiled) {
  return function* (context) {
    createQueue(context);

    // avoid memory leak by cloning arguments
    var len = arguments.length;
    var args = Array(len);
    while (len--) args[len] = arguments[len];

    args[0] = context;

    var out = compiled.apply(null, args);

    return yield replace.call(context, context[Q], out);
  };
}

function createQueue(context) {
  if (Q in context) return context[Q];

  if (context === null) context = Object.create(context);

  if (!(Q in context)) {
    Object.defineProperty(context, Q, {
      value: [],
      enumerable: false,
      configurable: false,
    })
  }


  // cannot use defineProperty as context could be a primitive value
  context[Q] = [];

  // execution index;
  context[Q].index = context[Q].index || 0;

  // (Might be redunant): A list of generated UUIDs
  // to check against collison in a single rendering process.
  context[Q].listOfUUIDs = context[Q].listOfUUIDs || {};

  return context[Q];
}

/**
 * Replace generator helper placeholder with compiled content
 * requires valid context from its caller (hbs.render)
 **/
function *replace(fnArr, str) {
    // parse generator queue from leaft to right
    // this could mutate fnArr if new generator helpers are found
    var ret = yield compose.call(this, fnArr, Wrapper.unwrap);

    var retObj = {};
    for (var i = 0; i < fnArr.length; i++) {
      retObj[ fnArr[i] ] = ret[i];
    }

    // create an array of uuid from generator queue
    var gidRegExp = Wrapper.toRegExp( fnArr );

    function strReplace(match, gid) {
      return retObj[gid];
    }

    // replace all generator helper placeholder
    var executionCount = 9999;
    do {
      str = str.replace(gidRegExp, strReplace);
    } while (gidRegExp.test(str) && executionCount--);

    fnArr = null;

    return str;
}

/**
 * Check if function is generator function
 **/
function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === "GeneratorFunction";
}
