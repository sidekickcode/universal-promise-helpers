"use strict";

/**
 * returns new promise that'll be rejected with Timeout
 *
 *   timeoutPromise(milliseconds : number, Promise<any>) => Promise<any>
 */
exports.timeout = timeoutPromise;
exports.fromCallback = fromCallback;
exports.callback = callback;
exports.eventToPromise = eventToPromise;
exports.deferred = deferred;
exports.promisify = promisify;

var doesNotUsePromiseConstructor = {
  callback: true,
};

exports.withConstructor = function(constructor) {
  var wrapped = {};

  // all methods that require a custom constructor
  for(var name in exports) {
    if(name === "withConstructor") continue;
    var original = exports[name];
    wrapped[name] = doesNotUsePromiseConstructor[name] ?
      original : original.bind(null, constructor);
  }

  return wrapped;
};

function timeoutPromise(PromiseConstructor, n, promise, message) {
  if(isNaN(n)) {
    throw new Error(n + " must be a timeout number");
  }

  if(typeof promise.then !== "function") {
    throw new Error("must be provided a promise");
  }

  return new PromiseConstructor(function(resolve, reject) {

    var resolved = false;

    promise.then(function(v) {
      resolved = true;
      resolve(v);
    }, function(e) {
      resolved = true;
      reject(e);
    });

    setTimeout(function() {
      if(!resolved) {
        var error = new Error(message || "Timeout");
        error.duration = n;
        reject(error);
      }
    }, n);
  });
}

function fromCallback(PromiseConstructor, fn) {
  return new PromiseConstructor(function(resolve, reject) {
    fn(function(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}

// handles standard, single result functions like cb(err, result) as
//
//    .then(fn(result))
//
// handles multi-arg callback fns like cb(err, result1 ... resultN) by passing
// results in an array:
//
//   .then(fn([result1, ... resultN]))
//
function promisify(PromiseConstructor, fn) {
  return function() {
    var args = arguments;

    return new PromiseConstructor(function(resolve, reject) {
      var invokeArgs = [].slice.call(args).concat(cb);
      fn.apply(null, invokeArgs);
      function cb(err) {
        var results = [].slice.call(arguments, 1);
        var result = results.length === 1 ? results[0] : results;

        err ? reject(err) : resolve(result);
      }
    });
  };
}

function callback(promise, cb) {
  promise.then(function(result) {
    cb(null, result);
  }, function(err) {
    if(!(err instanceof Error)) {
      var original = err;
      err = new Error("Promise rejected with non-error (on .original)");
      err.original = original;
    }
    cb(err);
  });
}

function eventToPromise(PromiseConstructor, object, event) {
  return new PromiseConstructor(function(resolve) {
    object.once(event, resolve);
  });
}

function deferred(PromiseConstructor) {
  var d = {};
  d.promise = new PromiseConstructor(function(resolve, reject) {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
}

