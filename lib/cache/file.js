var fs = require('fs')
  , Cache = require('./cache')

module.exports = FileCache

/**
 * File cache.
 *
 * The following options are recognized:
 * <ul>
 *   <li><strong>path</strong>: Path to directory where cache files will be saved</li>
 *   <li><strong>prefix</strong>: Prefix to be used in cache file names (default: <tt>''</tt>)</li>
 * </ul>
 *
 * @exports FileCache as hamster.cache.FileCache
 * @param {Object} options
 * @constructor
 */
function FileCache(options) {
  Cache.call(this)
  options = options || {}
  this.setPath(options.path || process.env.TMPDIR || process.env.TEMP || '')
  this.setPrefix(options.prefix || 'hamster_')
}

FileCache.prototype = Object.create(Cache.prototype)

/**
 * Set path to cache directory.
 *
 * @param {String} path Directory path
 */
FileCache.prototype.setPath = function (path) {
  this._path = path
}

/**
 * Get path to cache directory.
 *
 * @return {String} Directory path
 */
FileCache.prototype.getPath = function () {
  return this._path
}

/**
 * Set file name prefix.
 *
 * @param {String} prefix Prefix string
 */
FileCache.prototype.setPrefix = function (prefix) {
  this._prefix = prefix
}

/**
 * Get file name prefix.
 *
 * @return {String} Prefix string
 */
FileCache.prototype.getPrefix = function () {
  return this._prefix
}

/**
 * Get path to file identified by the specified cache key.
 *
 * @param  {String} key Cache key
 * @return {String}     Path
 */
FileCache.prototype.getFilePath = function (key) {
  return [this.getPath(), this.getPrefix() + key].join('/')
}

/**
 * Store value in cache.
 *
 * @param {String}   key      Cache key
 * @param {String}   value    Cache Value
 * @param {Number}   duration Number of seconds this cache entry will live
 * @param {Function} cb       Callback
 */
FileCache.prototype.write = function (key, value, duration, cb) {
  var path = this.getFilePath(key)

  fs.open(path, 'w', function (err, fd) {
    if (err) return cb(err)

    var meta = JSON.stringify({'expireTime': (new Date()).getTime() + duration})
      , data = [meta, value].join('\n')

    fs.write(fd, data, 0, data.length, function (err, written, buffer) {
      if (err) return cb(err)
      fs.close(fd, function () { cb(null) })
    })
  })
}

/**
 * Retrieve value from cache.
 *
 * @param  {String}   key Cache key
 * @param  {Function} cb  Callback
 * @return {String}       Cache value
 */
FileCache.prototype.read = function (key, cb) {
  var path = this.getFilePath(key)
    , self = this

  fs.readFile(path, function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') return cb(null)
      return cb(err)
    }

    data = data.toString().split('\n', 2)
    var meta = JSON.parse(data[0])

    if (self.getCurrentTime() >= meta.expireTime) {
      fs.unlink(path, function (err) { cb(err) })
    } else {
      cb(null, data[1])
    }
  })
}