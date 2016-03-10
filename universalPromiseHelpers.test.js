"use strict";

var helpers = require("./universalPromiseHelpers");
var _ = require("lodash");
var Promise = require("bluebird");
var bluebirdTimeout = _.partial(helpers.timeout, Promise);
var assert = require("chai").assert;

describe('promiseHelpers', function() {
  describe('timeout promise', function() {

    this.timeout(150);

    it('timeouts if not fulfilled', function(done) {
      bluebirdTimeout(10, new Promise(function() {
        
      }))
      .then(function() {
        done(new Error("should not have been resolved")) 
      })
      .catch(function(err) {
        assert.equal(err.message, "Timeout"); 
        done();
      });
    })

    it('no timeout if rejected', function(done) {
      bluebirdTimeout(10, new Promise(function(resolve, reject) {
        reject(new Error("explicit"));  
      }))
      .then(function() {
        done(new Error("should not have been resolved")) 
      })
      .catch(function(err) {
        assert.equal(err.message, "explicit"); 
        done();
      });
    })

    it('no timeout if resolved', function(done) {
      bluebirdTimeout(10, new Promise(function(resolve) {
        resolve("yay")
      }))
      .then(function(result) {
        assert.equal(result, "yay");
        done(); 
      })
      .catch(done);
    })
      
  })

  describe('promisify', function() {

    it('handles passing', function() {
      var promisifed = helpers.promisify(Promise, callWith(null, "ok"))
      return promisifed()
        .then(function(r) {
          assert.equal(r, "ok"); 
        })
    })

    it('handles fails', function(done) {
      helpers.promisify(Promise, callWith(Error("not ok")))()
        .then(function(r) {
          assert("should not have been called")
        })
        .catch(function(e) {
          assert.equal(e.message, "not ok")
          done();
        });
    })

    it('handles throws', function(done) {
      helpers.promisify(Promise, function() {
        throw Error("not ok") 
      })()
        .then(function(r) {
          assert("should not have been called")
        })
        .catch(function(e) {
          assert.equal(e.message, "not ok")
          done();
        });
        
    })

    it('handles multiple results by passing array', function() {
      return helpers.promisify(Promise, function(cb) {
        cb(null, 1, 2, 3);
      })()
        .then(function(r) {
          assert.deepEqual(r, [1,2,3]);
        })
        
    })

    it('passes through args ok', function() {
      var a = {};
      var b = [];
      var c = 1234;

      return helpers.promisify(Promise, function(ai, bi, ci, cb) {
        cb(null, [ai,bi,ci]);
      })(a,b,c)
        .then(function(r) {
          assert.deepEqual(r, [a,b,c]);
        })
        
    })

    function callWith(err, r) {
      return function(cb) {
        cb(err, r); 
      }
    }
      
  })

})
