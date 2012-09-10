module.exports = MemoryCache
exports.CacheEntry = CacheEntry

/**
 * Process memory cache.
 *
 * @exports Memory as hamster.cache.MemoryCache
 * @constructor
 */
function MemoryCache() {
  this._cache = {}
}

/**
 * Store value in cache.
 *
 * @param {String}   key      Cache key
 * @param {String}   value    Cache Value
 * @param {Number}   duration Number of seconds this cache entry will live
 * @param {Function} cb       Callback
 */
MemoryCache.prototype.store = function (key, value, duration, cb) {
  this._cache[key] = new CacheEntry(value, duration)
  cb(null)
}

/**
 * Retrieve value from cache.
 *
 * @param  {String}   key Cache key
 * @param  {Function} cb  Callback
 * @return {String}       Cache value
 */
MemoryCache.prototype.read = function (key, cb) {
  var value

  if (this._cache[key] && !this._cache[key].isExpired()) {
    value = this._cache[key].value
  }

  cb(null, value)
}

/**
 * Cache entry.
 *
 * @exports CacheValue as hamster.cache.MemoryCache.CacheEntry
 * @param {String} value    Cache value
 * @param {Number} duration Number of seconds this cache entry will live
 * @constructor
 */
function CacheEntry(value, duration) {
  this.value = value
  this._expireTime = (new Date()).getTime() + duration
}

/**
 * Check if entry has expired.
 *
 * @return {Boolean}
 */
CacheEntry.prototype.isExpired = function () {
  return (new Date()).getTime() >= this._expireTime
}