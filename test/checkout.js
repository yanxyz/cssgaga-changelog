var checkout = require('../lib/checkout');
var should = require('should'); // jshint ignore:line

describe('checkout.js', function() {
  this.timeout(15000);
  it('should get four files', function(done) {
    checkout(116, 119).then(function(results) {
        results.length.should.be.equal(4);
        done();
      })
      .catch(function(err) {
        console.log(err);
      });
  });
});
