var assert = require('assert')
  , fs = require('fs')
  , FileCache = require(__dirname + '/../../lib/cache/file')

suite('hamster.cache.FileCache')

test('#getFilePath() returns path to cache entry', function () {
  var cache = new FileCache({path: '/tmp'})

  assert.equal(cache.getFilePath('herp'), '/tmp/hamster_herp')
})

test('#getFilePath() prepends prefix to file name', function () {
  var cache = new FileCache({path: '/tmp', prefix: 'herp_'})

  assert.equal(cache.getFilePath('derp'), '/tmp/herp_derp')
})

test('#read() retrieves value from cache', function (done) {
  var cache = new FileCache({prefix: 'test1_'})

  cache.store('herp', 'derp', 5, function (err) {
    assert.ok(!err)

    cache.read('herp', function (err, value) {
      assert.ok(!err)
      assert.equal(value, 'derp')

      cache.read('herp', function (err, value) {
        assert.ok(!err)
        assert.equal(value, 'derp')
        done()
      })
    })
  })
})

test('#read() passes undefined for expired entry', function (done) {
  var cache = new FileCache({prefix: 'test2_'})

  cache.store('herp', 'derp', 3, function (err) {
    assert.ok(!err)

    cache.read('herp', function (err, value) {
      assert.ok(!err)
      assert.equal(value, 'derp')

      setTimeout(function () {
        cache.read('herp', function (err, value) {
          assert.ok(!err)
          assert.ok(typeof value === 'undefined')
          done()
        })
      }, 1500)
    })
  })
})

test('#read() does not error on ENOENT', function (done) {
  var cache = new FileCache({prefix: 'test3_'})

  cache.read('herp', function (err, value) {
    assert.ok(!err)
    assert.ok(typeof value === 'undefined')
    done()
  })
})