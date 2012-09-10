var assert = require('assert')
  , MemoryCache = require(__dirname + '/../../lib/cache/memory')

suite('hamster.cache.MemoryCache')

test('#read() retrieves value from cache', function (done) {
  var cache = new MemoryCache()

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
  var cache = new MemoryCache()

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