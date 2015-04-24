var checkout = require('../lib/checkout');
var parse = require('../lib/parse');
var should = require('should'); // jshint ignore:line

describe('parse.js', function() {
  this.timeout(5000);
  it('checkout r211', function(done) {
    checkout(211)
      .then(function() {
        return parse(211);
      })
      .then(function(result) {
        describe('parse 211.txt', function() {
          it('should have property', function() {
            result.should.have.property('241');
          });
        });
      })
      .then(done)
      .catch(function(err) {
        console.log(err.stack);
      });
  });
});
