var url = require('url')
  , crypto = require('crypto')
  , https = require('https')
  , http = require('http')
  , querystring = require('querystring')
  , sax = require('sax')
  , MemoryCache = require('./cache/memory')

module.exports = Client

/**
 * EVE API client.
 *
 * The following list of options are recognized:
 * <ul>
 *   <li><strong>url</strong>: Fully qualified HTTP(s) URL to EVE API server</li>
 *   <li><strong>cache</strong>: Cache object that handles persisting and retrieving results from cache</li>
 * </ul>
 *
 * @exports Client as hamster.Client
 * @param {Object} options Client options
 * @see hamster.cache.File
 * @constructor
 */
function Client(options) {
  options = options || {}
  this.setUrl(options.url || 'https://api.eveonline.com')
  this.setCache(options.cache || new MemoryCache())
}

/**
 * Set server URL.
 *
 * @param {String|Object} strOrObj URL string
 */
Client.prototype.setUrl = function (urlStr) {
  this._url = url.parse(urlStr)
}

/**
 * Get server URL.
 *
 * @param  {Boolean}       returnUrlObj Pass true to return URL object instead of string
 * @return {String|Object}              URL string or object
 */
Client.prototype.getUrl = function (returnUrlObj) {
  return returnUrlObj ? this._url : url.format(this._url)
}

/**
 * Set the cache object for this client.
 *
 * The cache object is responsible for storing and retrieving cached responses.
 *
 * Any cache object implementing <tt>set(key, value, duration)</tt> and
 * <tt>get(key)</tt> methods can be used as a cache backend.
 *
 * @param {Object} cache Cache object
 */
Client.prototype.setCache = function (cache) {
  this._cache = cache
}

/**
 * Get cache object.
 *
 * @return {Object} Cache object
 */
Client.prototype.getCache = function () {
  return this._cache
}

/**
 * Gets a path name relative to the current path set with Client#setUrl().
 *
 * This method also supports a short hand syntax for path names, e.g.,
 * <tt>'server:ServerStatus'</tt> would translate to <tt>/server/ServerStatus.xml.aspx</tt>.
 *
 * @param  {String} path Relative path
 * @return {String}      Full path name
 */
Client.prototype.getPathName = function (path) {
  var basePath = this.getUrl(true).pathname.replace(/^\/*|\/*$/g, '')

  if (path[0] !== '/') {
    path = path.replace(':', '/')  + '.xml.aspx'
  }
  if (basePath) {
    basePath = '/' + basePath
  }
  return basePath + '/' + path.replace(/^\/*|\/*$/g, '')
}

/**
 * Get request URL with specified path and params as a URL object.
 *
 * @param  {String} path   Request path
 * @param  {Object} params Query string parameters
 * @return {Object}        URL object
 */
Client.prototype.getRequestUrl = function (path, params) {
  var hasParams = false
    , baseUrl = this.getUrl(true)
    , requestUrl = {}

  for (var key in baseUrl) {
    requestUrl[key] = baseUrl[key]
  }
  for (var key in params) {
    hasParams = true
    break
  }

  requestUrl.pathname = this.getPathName(path)
  requestUrl.path = requestUrl.pathname

  if (hasParams) {
    requestUrl.search = '?' + querystring.stringify(params)
    requestUrl.path += requestUrl.search
  }
  return requestUrl
}

/**
 * [getCacheKey description]
 * @param  {[type]} urlObj [description]
 * @return {[type]}        [description]
 */
Client.prototype.getCacheKey = function (urlObj) {
  var keys = []
    , newUrlObj = {}
    , hash = crypto.createHash('sha1')
    , newQuery = {}
    , oldQuery

  for (var key in urlObj) {
    newUrlObj[key] = urlObj[key]
  }

  if (urlObj.search) {
    oldQuery = querystring.parse(urlObj.search.substr(1))

    for (var key in oldQuery) {
      keys.push(key)
    }

    // Reconstruct query with alphabetical key ordering
    keys.sort().forEach(function (key) {
      newQuery[key] = oldQuery[key]
    })

    // Insertion order should be guaranteed.
    newUrlObj.search = '?' + querystring.stringify(newQuery)
    newUrlObj.path = newUrlObj.pathname + newUrlObj.search
  }

  hash.update(url.format(newUrlObj))

  return hash.digest('hex')
}

/**
 * Parses an EVE API response from either an XML string or a readable stream.
 * A callback will be invoked and passed either an error or result object.
 *
 * @param  {String|Stream} xml API response
 * @param  {Function}      cb  Result callback
 */
Client.prototype.parse = function (xml, cb) {
  var parser = sax.createStream(true, {trim: true})
    , result = {}
    , current = result
    , parents = []
    , currentTag
    , rowKey

  parser.on('error', function (err) {
    cb(err)
  })

  parser.on('end', function () {
    var err = null
      , res = undefined

    if (result && result.eveapi && result.eveapi.error) {
      err = new Error(result.eveapi.error)
      err.code = result.eveapi.errorCode
    } else if (!result || !result.eveapi || !result.eveapi.result) {
      err = new Error('Invalid API response structure.')
    } else {
      if (result.eveapi.currentTime) result.eveapi.result.currentTime = result.eveapi.currentTime
      if (result.eveapi.cachedUntil) result.eveapi.result.cachedUntil = result.eveapi.cachedUntil
      res = result.eveapi.result
    }

    cb(err, res)
  })

  parser.on('opentag', function (tag) {
    currentTag = tag
    tag.alias = tag.name
    tag.result = current
    parents.push(tag)

    if (tag.name === 'row') {
      var key = tag.attributes[rowKey]
      current[key] = {}
      current = current[key]

      for (var attr in tag.attributes) {
        current[attr] = tag.attributes[attr]
      }
    } else {
      if (tag.name === 'rowset') {
        rowKey = tag.attributes.key
        tag.alias = tag.attributes.name
      } else if (tag.name === 'error') {
        current.errorCode = tag.attributes.code ? tag.attributes.code : null
      }

      current[tag.alias] = {}
      current = current[tag.alias]
    }
  })

  parser.on('closetag', function (tagName) {
    current = parents.pop().result
    var parentTag = parents[parents.length - 1]

    if (parentTag && parentTag.name === 'rowset') {
      rowKey = parentTag.attributes.key
    }
  })

  parser.on('text', function (text) {
    parents[parents.length - 1].result[currentTag.name] = text
  })

  if (xml.pipe) {
    xml.pipe(parser)
  } else {
    parser.write(xml)
    parser.end()
  }
}

/**
 * Send HTTP request to API server and parse response.
 *
 * @param  {String}   path   Request path
 * @param  {Object}   params Query string parameters
 * @param  {Function} cb     Result callback
 */
Client.prototype.fetch = function (path, params, cb) {
  var options = this.getRequestUrl(path, params)
    , cacheKey = this.getCacheKey(options)
    , cache = this.getCache()
    , self = this

  if (!cb) cb = params

  cache.read(cacheKey, function (err, value) {
    if (err) return cb(err)
    if (typeof value === 'string') return cb(null, JSON.parse(value))

    var httpObj = options.protocol === 'https:' ? https : http
      , request = httpObj.get(options)

    options.headers = {'User-Agent': 'hamster.js'}

    request.on('error', function (err) {
      cb(err)
    })

    request.on('response', function (response) {
      if (response.statusCode !== 200) {
        var err = new Error('Bad response: ' + response.statusCode)
        err.response = response
        cb(err)
      } else {
        self.parse(response, function (err, result) {
          if (err) return cb(err)

          var currentTime = Date.parse(result.currentTime)
            , cachedUntil = Date.parse(result.cachedUntil)
            , duration = cachedUntil - currentTime

          cache.store(cacheKey, JSON.stringify(result), duration, function (err) {
            if (err) return cb(err)
            cb(null, result)
          })
        })
      }
    })
  })
}