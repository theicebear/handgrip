var hbs = require("handlebars");
var log = console.log.bind(console);


hbs.registerHelper("a", function(name, options) {
  log("name is: ", name);
  log("options are: ", options);
  options.Q = "Q";
  //log("ctx is: ", this);

  var out = '{{b "second"}}';

  return new hbs.SafeString(out)
  //return hbs.compile(out)(this);
});

hbs.registerHelper("b", function(name, options) {
  log("name is: ", name);
  log("options are: ", options);
  //log("ctx is: ", this);
  return false;
});

log( hbs.helpers);

log();

log(hbs.VM );


var tpl = '{{a "first"}} this is end';

var fn = hbs.compile(tpl);

console.log(fn({hello: "world"}))

//log( fn, Object.keys(fn) );


//log(hbs.helpers.a.call(null, {hello: "world"}, {ok: 1}));
