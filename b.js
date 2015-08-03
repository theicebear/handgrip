var _hbs = require("./")

var tpl = '>{{a}}<'

function a(options) {
  return function* (next) {

    var out = yield Promise.resolve("aa")

    yield next

    return out
  }
}



var co = require("co")
/*
co(function*() {
  var hbs = _hbs.create()

  hbs.registerGeneratorHelper("a", a)
    
  var f = hbs.render(tpl)

  var out = yield f({})

  console.log(out)
}).catch(function(e) {
  console.error()
  console.error(e)
})
*/
co(function*() {
  var template = "{{gn 'foo'}}";
  var hbs = _hbs.create();
  hbs.registerGeneratorHelper("gn", function(name) {
    return function *(next) {
      yield next;

      return new hbs.SafeString( name );
    };
  });

  var compiled = hbs.render(template);

  var res = yield *compiled({});

  console.log(res)
}).catch(function(e) {
  console.error()
  console.error(e)
})
