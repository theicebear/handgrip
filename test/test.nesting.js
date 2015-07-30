var assert = require("chai").assert;
var sinon = require("sinon");
var co = require("co");
var _hbs = require("../");

suite("generator helper nesting", function() {
  test("generator helper nesting", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    var hbs = _hbs.create();
    
    var mockyB = "Inception";
    var mockyA = "Alice says hi ";

    var subtemplate = '{{request mockyB}}';
    var template = '1.{{request mockyA}}2.{{request mockyB}}';
    var data = { mockyB: mockyB, mockyA: mockyA };

    hbs.registerGeneratorHelper("request", function(name) {
      return function*(next) {
        job.call();
        var resA = yield Promise.resolve(name);

        var subres = "";

        // prevent infinite loop
        if (name === mockyA) {
          var xtra = hbs.compile(subtemplate);
          subres = xtra(this);
        }

        yield next;
        
        return resA + subres;
      };
    });

    var cache = hbs.render(template);

    co(function*(){
      var output = yield *cache(data);
      assert(job.called);
      assert.equal(output, "1.Alice says hi Inception2.Inception");
      done();
    });
  });

  test("generator helper nesting inside block helper", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    var hbs = _hbs.create();
    
    var mockyB = "Inception";
    var mockyA = "Alice says hi ";

    var subtemplate = '{{request mockyB}}';
    var helperTemplate = '1.{{request mockyA}}2.{{request mockyB}}';
    var template = "{{#helper}}{{/helper}}";
    var data = { mockyB: mockyB, mockyA: mockyA };

    hbs.registerGeneratorHelper("request", function(name) {
      return function*(next) {
        job.call();
        var resA = yield Promise.resolve(name);

        var subres = "";

        // prevent infinite loop
        if (name === mockyA) {
          var xtra = hbs.compile(subtemplate);
          subres = xtra(this);
        }

        yield next;
        
        return resA + subres;
      };
    });

    hbs.registerGeneratorHelper("helper", function(name) {
      return hbs.compile(helperTemplate)(this);
    });


    var cache = hbs.render(template);

    co(function*(){
      var output = yield *cache(data);
      assert(job.called);
      assert.equal(output, "1.Alice says hi Inception2.Inception");
      done();
    });
  });

  test("generator helper nesting inside each loop helper", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    var hbs = _hbs.create();
    
    var mockyB = "Inception";
    var mockyA = "Alice says hi ";

    var subtemplate = '{{request mockyB}}';
    var helperTemplate = '1.{{request mockyA}}2.{{request mockyB}}';
    var template = "{{#each set}}{{#helper}}{{/helper}}{{/each}}";
    var data = { set: [1, 2], mockyB: mockyB, mockyA: mockyA };

    hbs.registerGeneratorHelper("request", function(name) {
      return function*(next) {
        job.call();
        var resA = yield Promise.resolve(name);

        var subres = "";

        // prevent infinite loop
        if (name === mockyA) {
          var xtra = hbs.compile(subtemplate);
          subres = xtra(this);
        }

        yield next;
        
        return resA + subres;
      };
    });

    hbs.registerGeneratorHelper("helper", function(options) {
      return hbs.compile(helperTemplate)(options.data.root);
    });


    var cache = hbs.render(template);

    co(function*(){
      var output = yield *cache(data);
      assert(job.called);
      assert.equal(output, "1.Alice says hi Inception2.Inception1.Alice says hi Inception2.Inception");
      done();
    });
  });


  test("generator helper nesting in complex situation", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    var hbs = _hbs.create();
    
    var mockyB = "Inception";
    var mockyA = "Alice says hi ";

    var subtemplate = '{{request mockyB}}';
    var substitueTemplate = '{{request mockyA}}';
    var inclusiveTemplate = "1.{{request mockyA}}2.{{request mockyB}}";
    var helperTemplate = '{{include "template"}}';
    var eachTemplate = "{{#each set}}{{sub}}{{/each}}"
    var template = "{{#each set}}{{#helper}}{{/helper}}{{/each}}";
    var data = { set: [1, 2], mockyB: mockyB, mockyA: mockyA };

    hbs.registerGeneratorHelper("request", function(name) {
      return function*(next) {
        job.call();
        var resA = yield Promise.resolve(name);

        var subres = "";

        // prevent infinite loop
        if (name === mockyA) {
          var xtra = hbs.compile(subtemplate);
          subres = xtra(this);
        }

        yield next;
        
        return resA + subres;
      };
    });

    hbs.registerGeneratorHelper("helper", function(options) {
      return new hbs.SafeString(hbs.compile(helperTemplate)(options.data.root));
    });

    hbs.registerGeneratorHelper("include", function(name, options) {
      return new hbs.SafeString(hbs.compile(eachTemplate)(options.data.root));
    });

    hbs.registerGeneratorHelper("sub", function(options) {
      return new hbs.SafeString(hbs.compile(substitueTemplate)(options.data.root));      
    });


    var cache = hbs.render(template);

    var ex = console.error.bind(console);

    co(function*(){
      var output = yield *cache(data);
      assert(job.called);
      console.log(output);
      //assert.equal(output, "1.Alice says hi Inception2.Inception1.Alice says hi Inception2.Inception");
      done();
    }).catch(ex);
  });

});
