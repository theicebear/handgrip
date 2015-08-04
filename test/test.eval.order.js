var assert = require("chai").assert;
var sinon = require("sinon");
var co = require("co");
var _hbs = require("../");
suite("generator helper evaluation order", function() {
    test("evaluation orde of nested helpers", function (done) {
        this.timeout(1000);
        var job = sinon.spy();
        var hbs = _hbs.create();

        var mockyB = "B";
        var mockyA = "A";

        var subtemplate = '{{gn mockyB order=11}}';
        var template = '1.{{gn mockyA order=10}}2.{{gn mockyB order=20}}';
        var data = { mockyB: mockyB, mockyA: mockyA };

        var evalOrder = [];

        hbs.registerGeneratorHelper("gn", function(name, options) {
            return function*(next) {
                job.call();
                var resA = yield Promise.resolve(name);

                evalOrder.push(options.hash.order + "-");

                var subres = "";

                // prevent infinite loop
                if (name === mockyA) {
                    var xtra = hbs.compile(subtemplate);
                    subres = xtra(Object.create(this));
                    //subres = xtra(hbs.createFrame(options.data))
                }

                yield next;

                evalOrder.push(options.hash.order + "+");
                
                return resA + subres;
            };
        });

        var cache = hbs.render(template);

        co(function*(){
            var output = yield *cache(data);
            assert(job.called);
            console.log(output, "\n", evalOrder.toString())
            assert.equal(output.toString(), "1.AB2.B");
            assert.equal(evalOrder.toString(), "10-,11-,20-,20+,11+,10+");
            done();
        }).catch(function(e) {
          done();
          console.log(e.stack)
        });
    });

/*
    test("evaluation orde of nested helpers with partial", function (done) {
>>>>>>> Stashed changes
        this.timeout(1000);
        var job = sinon.spy();
        var hbs = _hbs.create();

        var mockyB = "B";
        var mockyA = "A";

        var subtemplate = '{{>pa}}';
        var pa = "{{gn mockyB order=11}}";
        var template = '1.{{gn mockyA order=10}}2.{{gn mockyB order=20}}';
        var data = { mockyB: mockyB, mockyA: mockyA };

        var evalOrder = [];

        var p = hbs.compile(pa);
        hbs.registerPartial("pa", p);

        hbs.registerGeneratorHelper("gn", function(name, options) {
            return function*(next) {
                job.call();
                var resA = yield Promise.resolve(name);

                evalOrder.push(options.hash.order + "-");

                var subres = "";

                // prevent infinite loop
                if (name === mockyA) {
                    var xtra = hbs.compile(subtemplate);
                    subres = xtra(Object.create(this));
                }

                yield next;

                evalOrder.push(options.hash.order + "+");
                
                return resA + subres;
            };
        });

        var cache = hbs.render(template);

        co(function*(){
            var output = yield *cache(data);
            assert(job.called);
            assert.equal(output.toString(), "1.AB2.B");
            assert.equal(evalOrder.toString(), "1-,1.1-,2-,2+,1.1+,1+");
            done();
        }).catch(function(e) {
          done();
          console.log(e.stack)
        });
    });
*/
});
