# hamster.js [![](https://secure.travis-ci.org/kuja/hamster.png)](http://travis-ci.org/#!/kuja/hamster)
**An asynchronous EVE Online API client for Node.js**


### Examples

```javascript
var hamster = require('hamster')

// Print a list of skill groups
hamster.fetch('eve:SkillTree', function (err, result) {
  if (err) throw err

  for (var groupID in result.skillGroups) {
    console.log(result.skillGroups[groupID].groupName)
  }
})

// Set default parameters (useful for setting keyID and vCode)
hamster.setParams({
  keyID: '1234567',
  vCode: 'some random vcode'
})

// Default parameters will get merged with the parameters passed into fetch().
// The actual request will include all three parameters: keyID, vCode and characterID
hamster.fetch('char:AccountBalance', {characterID: 12345}, function (err, result) {
  if (err) throw err
  // do stuff
})
```


### Client object

The `hamster` object is multi-purpose in that it is both a namespace container and an instance of `hamster.Client`. Client objects individually maintain their own cache state and server details. If you do not want to use the default `hamster` object, feel free to construct your own client objects as you see fit.

```javascript
var hamster = require('hamster')
  , client = new hamster.Client({url: url, cache: cache})

client.fetch('...', function (err, result) {
  // ...
})
```


### Caching

* Easily extendible
* Asynchronous store/read
* Ships with `hamster.cache.FileCache` and `hamster.cache.MemoryCache`
* Defaults to `hamster.cache.MemoryCache` (it is highly recommended you switch to FileCache)

```javascript
var hamster = require('hamster')

hamster.setCache(new hamster.cache.FileCache({path: '...'}))
```

### Tests

Hamster is mostly tested, but not completely. Any contributions, especially to tests are greatly appreciated.

Run tests with (requires mocha):
```
npm test
```

### License

Hamser is licensed under the MIT license:
```
Copyright (c) 2012 Matt Harris

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```