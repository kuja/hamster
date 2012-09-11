var sax = require('sax')
  , Client = require('./client')

/**
 * @namespace
 */
var hamster = new Client()

module.exports = hamster

hamster.Client = Client

/**
 * @namespace
 */
hamster.cache = {}
hamster.cache.Cache = require('./cache/cache')
hamster.cache.FileCache = require('./cache/file')
hamster.cache.MemoryCache = require('./cache/memory')