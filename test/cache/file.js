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

  cache.write('herp', 'derp', 5, function (err) {
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
    , duration = 5

  cache.write('herp', 'derp', duration, function (err) {
    assert.ok(!err)

    cache.read('herp', function (err, value) {
      assert.ok(!err)
      assert.equal(value, 'derp')

      cache.getCurrentTime = function () {
        return (new Date()).getTime() + duration
      }

      cache.read('herp', function (err, value) {
        assert.ok(!err)
        assert.ok(typeof value === 'undefined')
        done()
      })
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