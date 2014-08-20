(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var GitHub, branch, p, repo, request, user;

request = window.superagent;

p = location.href.split('/');

user = p[2].split('.')[0];

switch (false) {
  case !p[4]:
    repo = p[3];
    branch = 'gh-pages';
    break;
  default:
    repo = user + '.github.io';
    branch = 'master';
}

GitHub = (function() {
  function GitHub(user, repo, pass) {
    this.user = user;
    this.repo = repo;
    this.pass = pass;
    this.headers = {
      'Content-type': 'application/json',
      'Authorization': 'Basic ' + btoa(this.user + ':' + this.pass)
    };
  }

  GitHub.prototype.base = 'https://api.github.com';

  GitHub.prototype.deploy = function(tree, cb) {
    return req.post(this.base + ("/repos/" + this.user + "/" + this.repo + "/git/trees")).set(this.headers).send({
      tree: tree
    }).end((function(_this) {
      return function(res) {
        var new_tree_sha;
        new_tree_sha = res.body.sha;
        if (_this.last_tree_sha === new_tree_sha) {
          return true;
        }
        return req.post(_this.base + ("/repos/" + _this.user + "/" + _this.repo + "/git/commits")).set(_this.headers).send({
          message: 'P U B L I S H',
          tree: new_tree_sha,
          parents: [_this.master_commit_sha, _this.data_commit_sha]
        }).end(function(res) {
          var new_commit_sha;
          new_commit_sha = res.body.sha;
          return req.patch(_this.base + ("/repos/" + _this.user + "/" + _this.repo + "/git/refs/heads/" + _this.branch)).set(_this.headers).send({
            sha: new_commit_sha,
            force: true
          }).end(function(res) {
            if (res.status === 200) {
              return cb(res.body);
            }
          });
        });
      };
    })(this));
  };

  return GitHub;

})();

module.exports = GitHub;



},{}],2:[function(require,module,exports){
var DocTree, Edit, GitHub, Main, YAML, a, b, body, button, container, dd, div, dl, dt, fieldset, fm, form, h1, h2, h3, h4, h5, h6, head, html, i, img, input, label, legend, li, link, marked, meta, p, script, small, span, table, tbody, td, templateDefault, textarea, tfoot, th, thead, title, tr, ul, _ref;

GitHub = require('./github.coffee');

YAML = require('yaml-js');

templateDefault = require('./template-default.coffee');

fm = require('front-matter');

marked = require('marked');

require('./rs.coffee');

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  smartypants: true
});

_ref = React.DOM, html = _ref.html, body = _ref.body, head = _ref.head, title = _ref.title, img = _ref.img, b = _ref.b, small = _ref.small, span = _ref.span, i = _ref.i, a = _ref.a, p = _ref.p, script = _ref.script, link = _ref.link, meta = _ref.meta, div = _ref.div, button = _ref.button, fieldset = _ref.fieldset, legend = _ref.legend, label = _ref.label, input = _ref.input, form = _ref.form, textarea = _ref.textarea, table = _ref.table, thead = _ref.thead, tbody = _ref.tbody, tr = _ref.tr, th = _ref.th, td = _ref.td, tfoot = _ref.tfoot, dl = _ref.dl, dt = _ref.dt, dd = _ref.dd, ul = _ref.ul, li = _ref.li, h1 = _ref.h1, h2 = _ref.h2, h3 = _ref.h3, h4 = _ref.h4, h5 = _ref.h5, h6 = _ref.h6;

Main = React.createClass({
  getInitialState: function() {
    return {
      editingPath: null
    };
  },
  startEditing: function(path) {
    return this.setState({
      editingPath: path
    });
  },
  render: function() {
    return div({
      className: 'pure-g'
    }, div({
      className: 'pure-u-1-4'
    }, ul({
      className: 'tree'
    }, DocTree({
      key: '/',
      onSelect: this.startEditing,
      defaultOpened: true
    }))), div({
      className: 'pure-u-3-4'
    }, Edit({
      path: this.state.editingPath
    })));
  }
});

DocTree = React.createClass({
  getInitialState: function() {
    return {
      children: [],
      opened: this.props.defaultOpened ? true : false
    };
  },
  componentDidMount: function() {
    return remoteStorage.coisas.listChildrenNames(this.props.key, (function(_this) {
      return function(children) {
        return _this.setState({
          children: children
        });
      };
    })(this));
  },
  openTree: function(e) {
    e.preventDefault();
    return this.setState({
      opened: !this.state.opened
    });
  },
  editDocument: function(e) {
    e.preventDefault();
    return this.props.onSelect(this.props.key);
  },
  render: function() {
    var child;
    return li({}, this.state.children.length ? a({
      href: '#',
      onClick: this.openTree
    }, this.state.opened ? '⇡' : '⇣') : void 0, a({
      href: '#',
      onClick: this.editDocument
    }, this.props.title || this.props.key), this.state.opened ? ul({}, (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.state.children;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        child = _ref1[_i];
        _results.push(DocTree({
          key: this.props.key + child.path,
          title: child.title,
          onSelect: this.props.onSelect
        }));
      }
      return _results;
    }).call(this)) : void 0);
  }
});

Edit = React.createClass({
  getInitialState: function() {
    return {
      meta: {},
      text: {},
      data: {}
    };
  },
  componentDidMount: function() {
    return remoteStorage.coisas.getNode(this.props.path, (function(_this) {
      return function(meta, text, data) {
        return _this.setState({
          meta: meta,
          text: text,
          data: data
        });
      };
    })(this));
  },
  handleChange: function(attr, e) {
    this.state[attr].content = e.target.value;
    return this.setState(this.state);
  },
  save: function(e) {
    if (e) {
      e.preventDefault();
    }
    return remoteStorage.coisas.putNode(this.props.path, this.state.meta, this.state.text, this.state.data, function() {
      return console.log('saved ' + this.props.path);
    });
  },
  render: function() {
    return div({
      className: 'edit'
    }, this.props.path ? form({
      className: 'pure-form pure-form-stacked',
      onSubmit: this.save
    }, fieldset({}, label({}, this.state.text.path), textarea({
      value: this.state.text.content,
      onChange: this.handleChange.bind(this, 'text')
    }), label({}, this.state.data.path), textarea({
      value: this.state.data.content,
      onChange: this.handleChange.bind(this, 'data')
    }), button({
      className: 'pure-button pure-burron-primary'
    }, 'Save'))) : void 0);
  }
});

remoteStorage.access.claim('coisas', 'rw');

remoteStorage.displayWidget();

remoteStorage.setSyncInterval(1000000);

container = document.getElementById('main');

remoteStorage.on('ready', function() {
  remoteStorage.on('disconnected', function() {
    return React.unMountComponentAtNode(container);
  });
  return React.renderComponent(Main(), container);
});



},{"./github.coffee":1,"./rs.coffee":36,"./template-default.coffee":37,"front-matter":8,"marked":22,"yaml-js":35}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
var TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":5,"ieee754":6}],5:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],6:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
(function (process){

const parser = require('yaml-js')
const seperators = [ '---', '= yaml =']
const pattern = pattern = '^('
      + '((= yaml =)|(---))'
      + '$([\\s\\S]*?)'
      + '\\2'
      + '$'
      + (process.platform === 'win32' ? '\\r?' : '')
      + '(?:\\n)?)'
const regex = new RegExp(pattern, 'm')

module.exports = extractor
module.exports.test = test

function extractor(string) {
  string = string || ''

  if (regex.test(string)) return parse(string)
  else return { attributes: {}, body: string }
}

function parse(string) {
  var match = regex.exec(string)
  var yaml = match[match.length - 1].replace(/^\s+|\s+$/g, '')
  var attributes = parser.load(yaml) || {}
  var body = string.replace(match[0], '')

  return { attributes: attributes, body: body }
}

function test(string){
  string = string || ''

  return regex.test(string)
}

}).call(this,require('_process'))
},{"_process":7,"yaml-js":21}],9:[function(require,module,exports){
(function() {
  var MarkedYAMLError, events, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  events = require('./events');

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  this.ComposerError = (function(_super) {
    __extends(ComposerError, _super);

    function ComposerError() {
      _ref = ComposerError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ComposerError;

  })(MarkedYAMLError);

  this.Composer = (function() {
    function Composer() {
      this.anchors = {};
    }

    Composer.prototype.check_node = function() {
      if (this.check_event(events.StreamStartEvent)) {
        this.get_event();
      }
      return !this.check_event(events.StreamEndEvent);
    };

    /*
    Get the root node of the next document.
    */


    Composer.prototype.get_node = function() {
      if (!this.check_event(events.StreamEndEvent)) {
        return this.compose_document();
      }
    };

    Composer.prototype.get_single_node = function() {
      var document, event;

      this.get_event();
      document = null;
      if (!this.check_event(events.StreamEndEvent)) {
        document = this.compose_document();
      }
      if (!this.check_event(events.StreamEndEvent)) {
        event = this.get_event();
        throw new exports.ComposerError('expected a single document in the stream', document.start_mark, 'but found another document', event.start_mark);
      }
      this.get_event();
      return document;
    };

    Composer.prototype.compose_document = function() {
      var node;

      this.get_event();
      node = this.compose_node();
      this.get_event();
      this.anchors = {};
      return node;
    };

    Composer.prototype.compose_node = function(parent, index) {
      var anchor, event, node;

      if (this.check_event(events.AliasEvent)) {
        event = this.get_event();
        anchor = event.anchor;
        if (!(anchor in this.anchors)) {
          throw new exports.ComposerError(null, null, "found undefined alias " + anchor, event.start_mark);
        }
        return this.anchors[anchor];
      }
      event = this.peek_event();
      anchor = event.anchor;
      if (anchor !== null && anchor in this.anchors) {
        throw new exports.ComposerError("found duplicate anchor " + anchor + "; first occurence", this.anchors[anchor].start_mark, 'second occurrence', event.start_mark);
      }
      this.descend_resolver(parent, index);
      if (this.check_event(events.ScalarEvent)) {
        node = this.compose_scalar_node(anchor);
      } else if (this.check_event(events.SequenceStartEvent)) {
        node = this.compose_sequence_node(anchor);
      } else if (this.check_event(events.MappingStartEvent)) {
        node = this.compose_mapping_node(anchor);
      }
      this.ascend_resolver();
      return node;
    };

    Composer.prototype.compose_scalar_node = function(anchor) {
      var event, node, tag;

      event = this.get_event();
      tag = event.tag;
      if (tag === null || tag === '!') {
        tag = this.resolve(nodes.ScalarNode, event.value, event.implicit);
      }
      node = new nodes.ScalarNode(tag, event.value, event.start_mark, event.end_mark, event.style);
      if (anchor !== null) {
        this.anchors[anchor] = node;
      }
      return node;
    };

    Composer.prototype.compose_sequence_node = function(anchor) {
      var end_event, index, node, start_event, tag;

      start_event = this.get_event();
      tag = start_event.tag;
      if (tag === null || tag === '!') {
        tag = this.resolve(nodes.SequenceNode, null, start_event.implicit);
      }
      node = new nodes.SequenceNode(tag, [], start_event.start_mark, null, start_event.flow_style);
      if (anchor !== null) {
        this.anchors[anchor] = node;
      }
      index = 0;
      while (!this.check_event(events.SequenceEndEvent)) {
        node.value.push(this.compose_node(node, index));
        index++;
      }
      end_event = this.get_event();
      node.end_mark = end_event.end_mark;
      return node;
    };

    Composer.prototype.compose_mapping_node = function(anchor) {
      var end_event, item_key, item_value, node, start_event, tag;

      start_event = this.get_event();
      tag = start_event.tag;
      if (tag === null || tag === '!') {
        tag = this.resolve(nodes.MappingNode, null, start_event.implicit);
      }
      node = new nodes.MappingNode(tag, [], start_event.start_mark, null, start_event.flow_style);
      if (anchor !== null) {
        this.anchors[anchor] = node;
      }
      while (!this.check_event(events.MappingEndEvent)) {
        item_key = this.compose_node(node);
        item_value = this.compose_node(node, item_key);
        node.value.push([item_key, item_value]);
      }
      end_event = this.get_event();
      node.end_mark = end_event.end_mark;
      return node;
    };

    return Composer;

  })();

}).call(this);

},{"./errors":11,"./events":12,"./nodes":14}],10:[function(require,module,exports){
(function (Buffer){
(function() {
  var MarkedYAMLError, nodes, util, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  util = require('./util');

  this.ConstructorError = (function(_super) {
    __extends(ConstructorError, _super);

    function ConstructorError() {
      _ref = ConstructorError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ConstructorError;

  })(MarkedYAMLError);

  this.BaseConstructor = (function() {
    BaseConstructor.prototype.yaml_constructors = {};

    BaseConstructor.prototype.yaml_multi_constructors = {};

    BaseConstructor.add_constructor = function(tag, constructor) {
      if (!this.prototype.hasOwnProperty('yaml_constructors')) {
        this.prototype.yaml_constructors = util.extend({}, this.prototype.yaml_constructors);
      }
      return this.prototype.yaml_constructors[tag] = constructor;
    };

    BaseConstructor.add_multi_constructor = function(tag_prefix, multi_constructor) {
      if (!this.prototype.hasOwnProperty('yaml_multi_constructors')) {
        this.prototype.yaml_multi_constructors = util.extend({}, this.prototype.yaml_multi_constructors);
      }
      return this.prototype.yaml_multi_constructors[tag_prefix] = multi_constructor;
    };

    function BaseConstructor() {
      this.constructed_objects = {};
      this.constructing_nodes = [];
      this.deferred_constructors = [];
    }

    /*
    Are there more documents available?
    */


    BaseConstructor.prototype.check_data = function() {
      return this.check_node();
    };

    /*
    Construct and return the next document.
    */


    BaseConstructor.prototype.get_data = function() {
      if (this.check_node()) {
        return this.construct_document(this.get_node());
      }
    };

    /*
    Ensure that the stream contains a single document and construct it.
    */


    BaseConstructor.prototype.get_single_data = function() {
      var node;

      node = this.get_single_node();
      if (node != null) {
        return this.construct_document(node);
      }
      return null;
    };

    BaseConstructor.prototype.construct_document = function(node) {
      var data;

      data = this.construct_object(node);
      while (!util.is_empty(this.deferred_constructors)) {
        this.deferred_constructors.pop()();
      }
      return data;
    };

    BaseConstructor.prototype.defer = function(f) {
      return this.deferred_constructors.push(f);
    };

    BaseConstructor.prototype.construct_object = function(node) {
      var constructor, object, tag_prefix, tag_suffix, _ref1;

      if (node.unique_id in this.constructed_objects) {
        return this.constructed_objects[node.unique_id];
      }
      if (_ref1 = node.unique_id, __indexOf.call(this.constructing_nodes, _ref1) >= 0) {
        throw new exports.ConstructorError(null, null, 'found unconstructable recursive node', node.start_mark);
      }
      this.constructing_nodes.push(node.unique_id);
      constructor = null;
      tag_suffix = null;
      if (node.tag in this.yaml_constructors) {
        constructor = this.yaml_constructors[node.tag];
      } else {
        for (tag_prefix in this.yaml_multi_constructors) {
          if (node.tag.indexOf(tag_prefix === 0)) {
            tag_suffix = node.tag.slice(tag_prefix.length);
            constructor = this.yaml_multi_constructors[tag_prefix];
            break;
          }
        }
        if (constructor == null) {
          if (null in this.yaml_multi_constructors) {
            tag_suffix = node.tag;
            constructor = this.yaml_multi_constructors[null];
          } else if (null in this.yaml_constructors) {
            constructor = this.yaml_constructors[null];
          } else if (node instanceof nodes.ScalarNode) {
            constructor = this.construct_scalar;
          } else if (node instanceof nodes.SequenceNode) {
            constructor = this.construct_sequence;
          } else if (node instanceof nodes.MappingNode) {
            constructor = this.construct_mapping;
          }
        }
      }
      object = constructor.call(this, tag_suffix != null ? tag_suffix : node, node);
      this.constructed_objects[node.unique_id] = object;
      this.constructing_nodes.pop();
      return object;
    };

    BaseConstructor.prototype.construct_scalar = function(node) {
      if (!(node instanceof nodes.ScalarNode)) {
        throw new exports.ConstructorError(null, null, "expected a scalar node but found " + node.id, node.start_mark);
      }
      return node.value;
    };

    BaseConstructor.prototype.construct_sequence = function(node) {
      var child, _i, _len, _ref1, _results;

      if (!(node instanceof nodes.SequenceNode)) {
        throw new exports.ConstructorError(null, null, "expected a sequence node but found " + node.id, node.start_mark);
      }
      _ref1 = node.value;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        child = _ref1[_i];
        _results.push(this.construct_object(child));
      }
      return _results;
    };

    BaseConstructor.prototype.construct_mapping = function(node) {
      var key, key_node, mapping, value, value_node, _i, _len, _ref1, _ref2;

      if (!(node instanceof nodes.MappingNode)) {
        throw new ConstructorError(null, null, "expected a mapping node but found " + node.id, node.start_mark);
      }
      mapping = {};
      _ref1 = node.value;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _ref2 = _ref1[_i], key_node = _ref2[0], value_node = _ref2[1];
        key = this.construct_object(key_node);
        if (typeof key === 'object') {
          throw new exports.ConstructorError('while constructing a mapping', node.start_mark, 'found unhashable key', key_node.start_mark);
        }
        value = this.construct_object(value_node);
        mapping[key] = value;
      }
      return mapping;
    };

    BaseConstructor.prototype.construct_pairs = function(node) {
      var key, key_node, pairs, value, value_node, _i, _len, _ref1, _ref2;

      if (!(node instanceof nodes.MappingNode)) {
        throw new exports.ConstructorError(null, null, "expected a mapping node but found " + node.id, node.start_mark);
      }
      pairs = [];
      _ref1 = node.value;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _ref2 = _ref1[_i], key_node = _ref2[0], value_node = _ref2[1];
        key = this.construct_object(key_node);
        value = this.construct_object(value_node);
        pairs.push([key, value]);
      }
      return pairs;
    };

    return BaseConstructor;

  })();

  this.Constructor = (function(_super) {
    var BOOL_VALUES, TIMESTAMP_PARTS, TIMESTAMP_REGEX;

    __extends(Constructor, _super);

    function Constructor() {
      _ref1 = Constructor.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    BOOL_VALUES = {
      on: true,
      off: false,
      "true": true,
      "false": false,
      yes: true,
      no: false
    };

    TIMESTAMP_REGEX = /^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:(?:[Tt]|[\x20\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\.([0-9]*))?(?:[\x20\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?)?$/;

    TIMESTAMP_PARTS = {
      year: 1,
      month: 2,
      day: 3,
      hour: 4,
      minute: 5,
      second: 6,
      fraction: 7,
      tz: 8,
      tz_sign: 9,
      tz_hour: 10,
      tz_minute: 11
    };

    Constructor.prototype.yaml_constructors = {};

    Constructor.prototype.yaml_multi_constructors = {};

    Constructor.prototype.construct_scalar = function(node) {
      var key_node, value_node, _i, _len, _ref2, _ref3;

      if (node instanceof nodes.MappingNode) {
        _ref2 = node.value;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          _ref3 = _ref2[_i], key_node = _ref3[0], value_node = _ref3[1];
          if (key_node.tag === 'tag:yaml.org,2002:value') {
            return this.construct_scalar(value_node);
          }
        }
      }
      return Constructor.__super__.construct_scalar.call(this, node);
    };

    Constructor.prototype.flatten_mapping = function(node) {
      var index, key_node, merge, submerge, subnode, value, value_node, _i, _j, _len, _len1, _ref2, _ref3;

      merge = [];
      index = 0;
      while (index < node.value.length) {
        _ref2 = node.value[index], key_node = _ref2[0], value_node = _ref2[1];
        if (key_node.tag === 'tag:yaml.org,2002:merge') {
          node.value.splice(index, 1);
          if (value_node instanceof nodes.MappingNode) {
            this.flatten_mapping(value_node);
            merge = merge.concat(value_node.value);
          } else if (value_node instanceof nodes.SequenceNode) {
            submerge = [];
            _ref3 = value_node.value;
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              subnode = _ref3[_i];
              if (!(subnode instanceof nodes.MappingNode)) {
                throw new exports.ConstructorError('while constructing a mapping', node.start_mark, "expected a mapping for merging, but found " + subnode.id, subnode.start_mark);
              }
              this.flatten_mapping(subnode);
              submerge.push(subnode.value);
            }
            submerge.reverse();
            for (_j = 0, _len1 = submerge.length; _j < _len1; _j++) {
              value = submerge[_j];
              merge = merge.concat(value);
            }
          } else {
            throw new exports.ConstructorError('while constructing a mapping', node.start_mark, "expected a mapping or list of mappings for            merging but found " + value_node.id, value_node.start_mark);
          }
        } else if (key_node.tag === 'tag:yaml.org,2002:value') {
          key_node.tag = 'tag:yaml.org,2002:str';
          index++;
        } else {
          index++;
        }
      }
      if (merge.length) {
        return node.value = merge.concat(node.value);
      }
    };

    Constructor.prototype.construct_mapping = function(node) {
      if (node instanceof nodes.MappingNode) {
        this.flatten_mapping(node);
      }
      return Constructor.__super__.construct_mapping.call(this, node);
    };

    Constructor.prototype.construct_yaml_null = function(node) {
      this.construct_scalar(node);
      return null;
    };

    Constructor.prototype.construct_yaml_bool = function(node) {
      var value;

      value = this.construct_scalar(node);
      return BOOL_VALUES[value.toLowerCase()];
    };

    Constructor.prototype.construct_yaml_int = function(node) {
      var base, digit, digits, part, sign, value, _i, _len, _ref2;

      value = this.construct_scalar(node);
      value = value.replace(/_/g, '');
      sign = value[0] === '-' ? -1 : 1;
      if (_ref2 = value[0], __indexOf.call('+-', _ref2) >= 0) {
        value = value.slice(1);
      }
      if (value === '0') {
        return 0;
      } else if (value.indexOf('0b') === 0) {
        return sign * parseInt(value.slice(2), 2);
      } else if (value.indexOf('0x') === 0) {
        return sign * parseInt(value.slice(2), 16);
      } else if (value.indexOf('0o') === 0) {
        return sign * parseInt(value.slice(2), 8);
      } else if (value[0] === '0') {
        return sign * parseInt(value, 8);
      } else if (__indexOf.call(value, ':') >= 0) {
        digits = (function() {
          var _i, _len, _ref3, _results;

          _ref3 = value.split(/:/g);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            part = _ref3[_i];
            _results.push(parseInt(part));
          }
          return _results;
        })();
        digits.reverse();
        base = 1;
        value = 0;
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
          digit = digits[_i];
          value += digit * base;
          base *= 60;
        }
        return sign * value;
      } else {
        return sign * parseInt(value);
      }
    };

    Constructor.prototype.construct_yaml_float = function(node) {
      var base, digit, digits, part, sign, value, _i, _len, _ref2;

      value = this.construct_scalar(node);
      value = value.replace(/_/g, '').toLowerCase();
      sign = value[0] === '-' ? -1 : 1;
      if (_ref2 = value[0], __indexOf.call('+-', _ref2) >= 0) {
        value = value.slice(1);
      }
      if (value === '.inf') {
        return sign * Infinity;
      } else if (value === '.nan') {
        return NaN;
      } else if (__indexOf.call(value, ':') >= 0) {
        digits = (function() {
          var _i, _len, _ref3, _results;

          _ref3 = value.split(/:/g);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            part = _ref3[_i];
            _results.push(parseFloat(part));
          }
          return _results;
        })();
        digits.reverse();
        base = 1;
        value = 0.0;
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
          digit = digits[_i];
          value += digit * base;
          base *= 60;
        }
        return sign * value;
      } else {
        return sign * parseFloat(value);
      }
    };

    Constructor.prototype.construct_yaml_binary = function(node) {
      var error, value;

      value = this.construct_scalar(node);
      try {
        if (typeof window !== "undefined" && window !== null) {
          return atob(value);
        }
        return new Buffer(value, 'base64').toString('ascii');
      } catch (_error) {
        error = _error;
        throw new exports.ConstructorError(null, null, "failed to decode base64 data: " + error, node.start_mark);
      }
    };

    Constructor.prototype.construct_yaml_timestamp = function(node) {
      var date, day, fraction, hour, index, key, match, millisecond, minute, month, second, tz_hour, tz_minute, tz_sign, value, values, year;

      value = this.construct_scalar(node);
      match = node.value.match(TIMESTAMP_REGEX);
      values = {};
      for (key in TIMESTAMP_PARTS) {
        index = TIMESTAMP_PARTS[key];
        values[key] = match[index];
      }
      year = parseInt(values.year);
      month = parseInt(values.month) - 1;
      day = parseInt(values.day);
      if (!values.hour) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = parseInt(values.hour);
      minute = parseInt(values.minute);
      second = parseInt(values.second);
      millisecond = 0;
      if (values.fraction) {
        fraction = values.fraction.slice(0, 6);
        while (fraction.length < 6) {
          fraction += '0';
        }
        fraction = parseInt(fraction);
        millisecond = Math.round(fraction / 1000);
      }
      if (values.tz_sign) {
        tz_sign = values.tz_sign === '-' ? 1 : -1;
        if (tz_hour = parseInt(values.tz_hour)) {
          hour += tz_sign * tz_hour;
        }
        if (tz_minute = parseInt(values.tz_minute)) {
          minute += tz_sign * tz_minute;
        }
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
      return date;
    };

    Constructor.prototype.construct_yaml_pair_list = function(type, node) {
      var list,
        _this = this;

      list = [];
      if (!(node instanceof nodes.SequenceNode)) {
        throw new exports.ConstructorError("while constructing " + type, node.start_mark, "expected a sequence but found " + node.id, node.start_mark);
      }
      this.defer(function() {
        var key, key_node, subnode, value, value_node, _i, _len, _ref2, _ref3, _results;

        _ref2 = node.value;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          subnode = _ref2[_i];
          if (!(subnode instanceof nodes.MappingNode)) {
            throw new exports.ConstructorError("while constructing " + type, node.start_mark, "expected a mapping of length 1 but found " + subnode.id, subnode.start_mark);
          }
          if (subnode.value.length !== 1) {
            throw new exports.ConstructorError("while constructing " + type, node.start_mark, "expected a mapping of length 1 but found " + subnode.id, subnode.start_mark);
          }
          _ref3 = subnode.value[0], key_node = _ref3[0], value_node = _ref3[1];
          key = _this.construct_object(key_node);
          value = _this.construct_object(value_node);
          _results.push(list.push([key, value]));
        }
        return _results;
      });
      return list;
    };

    Constructor.prototype.construct_yaml_omap = function(node) {
      return this.construct_yaml_pair_list('an ordered map', node);
    };

    Constructor.prototype.construct_yaml_pairs = function(node) {
      return this.construct_yaml_pair_list('pairs', node);
    };

    Constructor.prototype.construct_yaml_set = function(node) {
      var data,
        _this = this;

      data = [];
      this.defer(function() {
        var item, _results;

        _results = [];
        for (item in _this.construct_mapping(node)) {
          _results.push(data.push(item));
        }
        return _results;
      });
      return data;
    };

    Constructor.prototype.construct_yaml_str = function(node) {
      return this.construct_scalar(node);
    };

    Constructor.prototype.construct_yaml_seq = function(node) {
      var data,
        _this = this;

      data = [];
      this.defer(function() {
        var item, _i, _len, _ref2, _results;

        _ref2 = _this.construct_sequence(node);
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          item = _ref2[_i];
          _results.push(data.push(item));
        }
        return _results;
      });
      return data;
    };

    Constructor.prototype.construct_yaml_map = function(node) {
      var data,
        _this = this;

      data = {};
      this.defer(function() {
        var key, value, _ref2, _results;

        _ref2 = _this.construct_mapping(node);
        _results = [];
        for (key in _ref2) {
          value = _ref2[key];
          _results.push(data[key] = value);
        }
        return _results;
      });
      return data;
    };

    Constructor.prototype.construct_yaml_object = function(node, klass) {
      var data,
        _this = this;

      data = new klass;
      this.defer(function() {
        var key, value, _ref2, _results;

        _ref2 = _this.construct_mapping(node, true);
        _results = [];
        for (key in _ref2) {
          value = _ref2[key];
          _results.push(data[key] = value);
        }
        return _results;
      });
      return data;
    };

    Constructor.prototype.construct_undefined = function(node) {
      throw new exports.ConstructorError(null, null, "could not determine a constructor for the tag " + node.tag, node.start_mark);
    };

    return Constructor;

  })(this.BaseConstructor);

  this.Constructor.add_constructor('tag:yaml.org,2002:null', this.Constructor.prototype.construct_yaml_null);

  this.Constructor.add_constructor('tag:yaml.org,2002:bool', this.Constructor.prototype.construct_yaml_bool);

  this.Constructor.add_constructor('tag:yaml.org,2002:int', this.Constructor.prototype.construct_yaml_int);

  this.Constructor.add_constructor('tag:yaml.org,2002:float', this.Constructor.prototype.construct_yaml_float);

  this.Constructor.add_constructor('tag:yaml.org,2002:binary', this.Constructor.prototype.construct_yaml_binary);

  this.Constructor.add_constructor('tag:yaml.org,2002:timestamp', this.Constructor.prototype.construct_yaml_timestamp);

  this.Constructor.add_constructor('tag:yaml.org,2002:omap', this.Constructor.prototype.construct_yaml_omap);

  this.Constructor.add_constructor('tag:yaml.org,2002:pairs', this.Constructor.prototype.construct_yaml_pairs);

  this.Constructor.add_constructor('tag:yaml.org,2002:set', this.Constructor.prototype.construct_yaml_set);

  this.Constructor.add_constructor('tag:yaml.org,2002:str', this.Constructor.prototype.construct_yaml_str);

  this.Constructor.add_constructor('tag:yaml.org,2002:seq', this.Constructor.prototype.construct_yaml_seq);

  this.Constructor.add_constructor('tag:yaml.org,2002:map', this.Constructor.prototype.construct_yaml_map);

  this.Constructor.add_constructor(null, this.Constructor.prototype.construct_undefined);

}).call(this);

}).call(this,require("buffer").Buffer)
},{"./errors":11,"./nodes":14,"./util":20,"buffer":4}],11:[function(require,module,exports){
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Mark = (function() {
    function Mark(name, line, column, buffer, pointer) {
      this.name = name;
      this.line = line;
      this.column = column;
      this.buffer = buffer;
      this.pointer = pointer;
    }

    Mark.prototype.get_snippet = function(indent, max_length) {
      var break_chars, end, head, start, tail, _ref, _ref1;

      if (indent == null) {
        indent = 4;
      }
      if (max_length == null) {
        max_length = 75;
      }
      if (this.buffer == null) {
        return null;
      }
      break_chars = '\x00\r\n\x85\u2028\u2029';
      head = '';
      start = this.pointer;
      while (start > 0 && (_ref = this.buffer[start - 1], __indexOf.call(break_chars, _ref) < 0)) {
        start--;
        if (this.pointer - start > max_length / 2 - 1) {
          head = ' ... ';
          start += 5;
          break;
        }
      }
      tail = '';
      end = this.pointer;
      while (end < this.buffer.length && (_ref1 = this.buffer[end], __indexOf.call(break_chars, _ref1) < 0)) {
        end++;
        if (end - this.pointer > max_length / 2 - 1) {
          tail = ' ... ';
          end -= 5;
          break;
        }
      }
      return "" + ((new Array(indent)).join(' ')) + head + this.buffer.slice(start, end) + tail + "\n" + ((new Array(indent + this.pointer - start + head.length)).join(' ')) + "^";
    };

    Mark.prototype.toString = function() {
      var snippet, where;

      snippet = this.get_snippet();
      where = "  in \"" + this.name + "\", line " + (this.line + 1) + ", column " + (this.column + 1);
      if (snippet) {
        return where;
      } else {
        return "" + where + ":\n" + snippet;
      }
    };

    return Mark;

  })();

  this.YAMLError = (function(_super) {
    __extends(YAMLError, _super);

    function YAMLError() {
      YAMLError.__super__.constructor.call(this);
      this.stack = this.toString() + '\n' + (new Error).stack.split('\n').slice(1).join('\n');
    }

    return YAMLError;

  })(Error);

  this.MarkedYAMLError = (function(_super) {
    __extends(MarkedYAMLError, _super);

    function MarkedYAMLError(context, context_mark, problem, problem_mark, note) {
      this.context = context;
      this.context_mark = context_mark;
      this.problem = problem;
      this.problem_mark = problem_mark;
      this.note = note;
      MarkedYAMLError.__super__.constructor.call(this);
    }

    MarkedYAMLError.prototype.toString = function() {
      var lines;

      lines = [];
      if (this.context != null) {
        lines.push(this.context);
      }
      if ((this.context_mark != null) && ((this.problem == null) || (this.problem_mark == null) || this.context_mark.name !== this.problem_mark.name || this.context_mark.line !== this.problem_mark.line || this.context_mark.column !== this.problem_mark.column)) {
        lines.push(this.context_mark.toString());
      }
      if (this.problem != null) {
        lines.push(this.problem);
      }
      if (this.problem_mark != null) {
        lines.push(this.problem_mark.toString());
      }
      if (this.note != null) {
        lines.push(this.note);
      }
      return lines.join('\n');
    };

    return MarkedYAMLError;

  })(this.YAMLError);

}).call(this);

},{}],12:[function(require,module,exports){
(function() {
  var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Event = (function() {
    function Event(start_mark, end_mark) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return Event;

  })();

  this.NodeEvent = (function(_super) {
    __extends(NodeEvent, _super);

    function NodeEvent(anchor, start_mark, end_mark) {
      this.anchor = anchor;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return NodeEvent;

  })(this.Event);

  this.CollectionStartEvent = (function(_super) {
    __extends(CollectionStartEvent, _super);

    function CollectionStartEvent(anchor, tag, implicit, start_mark, end_mark) {
      this.anchor = anchor;
      this.tag = tag;
      this.implicit = implicit;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return CollectionStartEvent;

  })(this.NodeEvent);

  this.CollectionEndEvent = (function(_super) {
    __extends(CollectionEndEvent, _super);

    function CollectionEndEvent() {
      _ref = CollectionEndEvent.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return CollectionEndEvent;

  })(this.Event);

  this.StreamStartEvent = (function(_super) {
    __extends(StreamStartEvent, _super);

    function StreamStartEvent(start_mark, end_mark, explicit, version, tags) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.explicit = explicit;
      this.version = version;
      this.tags = tags;
    }

    return StreamStartEvent;

  })(this.Event);

  this.StreamEndEvent = (function(_super) {
    __extends(StreamEndEvent, _super);

    function StreamEndEvent() {
      _ref1 = StreamEndEvent.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return StreamEndEvent;

  })(this.Event);

  this.DocumentStartEvent = (function(_super) {
    __extends(DocumentStartEvent, _super);

    function DocumentStartEvent(start_mark, end_mark, explicit, version, tags) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.explicit = explicit;
      this.version = version;
      this.tags = tags;
    }

    return DocumentStartEvent;

  })(this.Event);

  this.DocumentEndEvent = (function(_super) {
    __extends(DocumentEndEvent, _super);

    function DocumentEndEvent(start_mark, end_mark, explicit) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.explicit = explicit;
    }

    return DocumentEndEvent;

  })(this.Event);

  this.AliasEvent = (function(_super) {
    __extends(AliasEvent, _super);

    function AliasEvent() {
      _ref2 = AliasEvent.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    return AliasEvent;

  })(this.NodeEvent);

  this.ScalarEvent = (function(_super) {
    __extends(ScalarEvent, _super);

    function ScalarEvent(anchor, tag, implicit, value, start_mark, end_mark, style) {
      this.anchor = anchor;
      this.tag = tag;
      this.implicit = implicit;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.style = style;
    }

    return ScalarEvent;

  })(this.NodeEvent);

  this.SequenceStartEvent = (function(_super) {
    __extends(SequenceStartEvent, _super);

    function SequenceStartEvent() {
      _ref3 = SequenceStartEvent.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    return SequenceStartEvent;

  })(this.CollectionStartEvent);

  this.SequenceEndEvent = (function(_super) {
    __extends(SequenceEndEvent, _super);

    function SequenceEndEvent() {
      _ref4 = SequenceEndEvent.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    return SequenceEndEvent;

  })(this.CollectionEndEvent);

  this.MappingStartEvent = (function(_super) {
    __extends(MappingStartEvent, _super);

    function MappingStartEvent() {
      _ref5 = MappingStartEvent.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    return MappingStartEvent;

  })(this.CollectionStartEvent);

  this.MappingEndEvent = (function(_super) {
    __extends(MappingEndEvent, _super);

    function MappingEndEvent() {
      _ref6 = MappingEndEvent.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    return MappingEndEvent;

  })(this.CollectionEndEvent);

}).call(this);

},{}],13:[function(require,module,exports){
(function() {
  var composer, constructor, parser, reader, resolver, scanner, util;

  util = require('./util');

  reader = require('./reader');

  scanner = require('./scanner');

  parser = require('./parser');

  composer = require('./composer');

  resolver = require('./resolver');

  constructor = require('./constructor');

  this.make_loader = function(Reader, Scanner, Parser, Composer, Resolver, Constructor) {
    if (Reader == null) {
      Reader = reader.Reader;
    }
    if (Scanner == null) {
      Scanner = scanner.Scanner;
    }
    if (Parser == null) {
      Parser = parser.Parser;
    }
    if (Composer == null) {
      Composer = composer.Composer;
    }
    if (Resolver == null) {
      Resolver = resolver.Resolver;
    }
    if (Constructor == null) {
      Constructor = constructor.Constructor;
    }
    return (function() {
      var component, components;

      components = [Reader, Scanner, Parser, Composer, Resolver, Constructor];

      util.extend.apply(util, [_Class.prototype].concat((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = components.length; _i < _len; _i++) {
          component = components[_i];
          _results.push(component.prototype);
        }
        return _results;
      })()));

      function _Class(stream) {
        var _i, _len, _ref;

        components[0].call(this, stream);
        _ref = components.slice(1);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          component = _ref[_i];
          component.call(this);
        }
      }

      return _Class;

    })();
  };

  this.Loader = this.make_loader();

}).call(this);

},{"./composer":9,"./constructor":10,"./parser":15,"./reader":16,"./resolver":17,"./scanner":18,"./util":20}],14:[function(require,module,exports){
(function() {
  var unique_id, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  unique_id = 0;

  this.Node = (function() {
    function Node(tag, value, start_mark, end_mark) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.unique_id = "node_" + (unique_id++);
    }

    return Node;

  })();

  this.ScalarNode = (function(_super) {
    __extends(ScalarNode, _super);

    ScalarNode.prototype.id = 'scalar';

    function ScalarNode(tag, value, start_mark, end_mark, style) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.style = style;
      ScalarNode.__super__.constructor.apply(this, arguments);
    }

    return ScalarNode;

  })(this.Node);

  this.CollectionNode = (function(_super) {
    __extends(CollectionNode, _super);

    function CollectionNode(tag, value, start_mark, end_mark, flow_style) {
      this.tag = tag;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.flow_style = flow_style;
      CollectionNode.__super__.constructor.apply(this, arguments);
    }

    return CollectionNode;

  })(this.Node);

  this.SequenceNode = (function(_super) {
    __extends(SequenceNode, _super);

    function SequenceNode() {
      _ref = SequenceNode.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SequenceNode.prototype.id = 'sequence';

    return SequenceNode;

  })(this.CollectionNode);

  this.MappingNode = (function(_super) {
    __extends(MappingNode, _super);

    function MappingNode() {
      _ref1 = MappingNode.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    MappingNode.prototype.id = 'mapping';

    return MappingNode;

  })(this.CollectionNode);

}).call(this);

},{}],15:[function(require,module,exports){
(function() {
  var MarkedYAMLError, events, tokens, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  events = require('./events');

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  tokens = require('./tokens');

  this.ParserError = (function(_super) {
    __extends(ParserError, _super);

    function ParserError() {
      _ref = ParserError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ParserError;

  })(MarkedYAMLError);

  this.Parser = (function() {
    var DEFAULT_TAGS;

    DEFAULT_TAGS = {
      '!': '!',
      '!!': 'tag:yaml.org,2002:'
    };

    function Parser() {
      this.current_event = null;
      this.yaml_version = null;
      this.tag_handles = {};
      this.states = [];
      this.marks = [];
      this.state = 'parse_stream_start';
    }

    /*
    Reset the state attributes.
    */


    Parser.prototype.dispose = function() {
      this.states = [];
      return this.state = null;
    };

    /*
    Check the type of the next event.
    */


    Parser.prototype.check_event = function() {
      var choice, choices, _i, _len;

      choices = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.current_event === null) {
        if (this.state != null) {
          this.current_event = this[this.state]();
        }
      }
      if (this.current_event !== null) {
        if (choices.length === 0) {
          return true;
        }
        for (_i = 0, _len = choices.length; _i < _len; _i++) {
          choice = choices[_i];
          if (this.current_event instanceof choice) {
            return true;
          }
        }
      }
      return false;
    };

    /*
    Get the next event.
    */


    Parser.prototype.peek_event = function() {
      if (this.current_event === null && (this.state != null)) {
        this.current_event = this[this.state]();
      }
      return this.current_event;
    };

    /*
    Get the event and proceed further.
    */


    Parser.prototype.get_event = function() {
      var event;

      if (this.current_event === null && (this.state != null)) {
        this.current_event = this[this.state]();
      }
      event = this.current_event;
      this.current_event = null;
      return event;
    };

    /*
    Parse the stream start.
    */


    Parser.prototype.parse_stream_start = function() {
      var event, token;

      token = this.get_token();
      event = new events.StreamStartEvent(token.start_mark, token.end_mark);
      this.state = 'parse_implicit_document_start';
      return event;
    };

    /*
    Parse an implicit document.
    */


    Parser.prototype.parse_implicit_document_start = function() {
      var end_mark, event, start_mark, token;

      if (!this.check_token(tokens.DirectiveToken, tokens.DocumentStartToken, tokens.StreamEndToken)) {
        this.tag_handles = DEFAULT_TAGS;
        token = this.peek_token();
        start_mark = end_mark = token.start_mark;
        event = new events.DocumentStartEvent(start_mark, end_mark, false);
        this.states.push('parse_document_end');
        this.state = 'parse_block_node';
        return event;
      } else {
        return this.parse_document_start();
      }
    };

    /*
    Parse an explicit document.
    */


    Parser.prototype.parse_document_start = function() {
      var end_mark, event, start_mark, tags, token, version, _ref1;

      while (this.check_token(tokens.DocumentEndToken)) {
        this.get_token();
      }
      if (!this.check_token(tokens.StreamEndToken)) {
        start_mark = this.peek_token().start_mark;
        _ref1 = this.process_directives(), version = _ref1[0], tags = _ref1[1];
        if (!this.check_token(tokens.DocumentStartToken)) {
          throw new exports.ParserError("expected '<document start>', but found " + (this.peek_token().id), this.peek_token().start_mark);
        }
        token = this.get_token();
        end_mark = token.end_mark;
        event = new events.DocumentStartEvent(start_mark, end_mark, true, version, tags);
        this.states.push('parse_document_end');
        this.state = 'parse_document_content';
      } else {
        token = this.get_token();
        event = new events.StreamEndEvent(token.start_mark, token.end_mark);
        if (this.states.length !== 0) {
          throw new Error('assertion error, states should be empty');
        }
        if (this.marks.length !== 0) {
          throw new Error('assertion error, marks should be empty');
        }
        this.state = null;
      }
      return event;
    };

    /*
    Parse the document end.
    */


    Parser.prototype.parse_document_end = function() {
      var end_mark, event, explicit, start_mark, token;

      token = this.peek_token();
      start_mark = end_mark = token.start_mark;
      explicit = false;
      if (this.check_token(tokens.DocumentEndToken)) {
        token = this.get_token();
        end_mark = token.end_mark;
        explicit = true;
      }
      event = new events.DocumentEndEvent(start_mark, end_mark, explicit);
      this.state = 'parse_document_start';
      return event;
    };

    Parser.prototype.parse_document_content = function() {
      var event;

      if (this.check_token(tokens.DirectiveToken, tokens.DocumentStartToken, tokens.DocumentEndToken, tokens.StreamEndToken)) {
        event = this.process_empty_scalar(this.peek_token().start_mark);
        this.state = this.states.pop();
        return event;
      } else {
        return this.parse_block_node();
      }
    };

    Parser.prototype.process_directives = function() {
      var handle, major, minor, prefix, tag_handles_copy, token, value, _ref1, _ref2, _ref3;

      this.yaml_version = null;
      this.tag_handles = {};
      while (this.check_token(tokens.DirectiveToken)) {
        token = this.get_token();
        if (token.name === 'YAML') {
          if (this.yaml_version !== null) {
            throw new exports.ParserError(null, null, 'found duplicate YAML directive', token.start_mark);
          }
          _ref1 = token.value, major = _ref1[0], minor = _ref1[1];
          if (major !== 1) {
            throw new exports.ParserError(null, null, 'found incompatible YAML document (version 1.* is required)', token.start_mark);
          }
          this.yaml_version = token.value;
        } else if (token.name === 'TAG') {
          _ref2 = this.tag_handles, handle = _ref2[0], prefix = _ref2[1];
          if (handle in this.tag_handles) {
            throw new exports.ParserError(null, null, "duplicate tag handle " + handle, token.start_mark);
          }
          this.tag_handles[handle] = prefix;
        }
      }
      tag_handles_copy = null;
      _ref3 = this.tag_handles;
      for (handle in _ref3) {
        if (!__hasProp.call(_ref3, handle)) continue;
        prefix = _ref3[handle];
        if (tag_handles_copy == null) {
          tag_handles_copy = {};
        }
        tag_handles_copy[handle] = prefix;
      }
      value = [this.yaml_version, tag_handles_copy];
      for (handle in DEFAULT_TAGS) {
        if (!__hasProp.call(DEFAULT_TAGS, handle)) continue;
        prefix = DEFAULT_TAGS[handle];
        if (!(prefix in this.tag_handles)) {
          this.tag_handles[handle] = prefix;
        }
      }
      return value;
    };

    Parser.prototype.parse_block_node = function() {
      return this.parse_node(true);
    };

    Parser.prototype.parse_flow_node = function() {
      return this.parse_node();
    };

    Parser.prototype.parse_block_node_or_indentless_sequence = function() {
      return this.parse_node(true, true);
    };

    Parser.prototype.parse_node = function(block, indentless_sequence) {
      var anchor, end_mark, event, handle, implicit, node, start_mark, suffix, tag, tag_mark, token;

      if (block == null) {
        block = false;
      }
      if (indentless_sequence == null) {
        indentless_sequence = false;
      }
      if (this.check_token(tokens.AliasToken)) {
        token = this.get_token();
        event = new events.AliasEvent(token.value, token.start_mark, token.end_mark);
        this.state = this.states.pop();
      } else {
        anchor = null;
        tag = null;
        start_mark = end_mark = tag_mark = null;
        if (this.check_token(tokens.AnchorToken)) {
          token = this.get_token();
          start_mark = token.start_mark;
          end_mark = token.end_mark;
          anchor = token.value;
          if (this.check_token(tokens.TagToken)) {
            token = this.get_token();
            tag_mark = token.start_mark;
            end_mark = token.end_mark;
            tag = token.value;
          }
        } else if (this.check_token(tokens.TagToken)) {
          token = this.get_token();
          start_mark = tag_mark = token.start_mark;
          end_mark = token.end_mark;
          tag = token.value;
          if (this.check_token(tokens.AnchorToken)) {
            token = this.get_token();
            end_mark = token.end_mark;
            anchor = token.value;
          }
        }
        if (tag !== null) {
          handle = tag[0], suffix = tag[1];
          if (handle !== null) {
            if (!(handle in this.tag_handles)) {
              throw new exports.ParserError('while parsing a node', start_mark, "found undefined tag handle " + handle, tag_mark);
            }
            tag = this.tag_handles[handle] + suffix;
          } else {
            tag = suffix;
          }
        }
        if (start_mark === null) {
          start_mark = end_mark = this.peek_token().start_mark;
        }
        event = null;
        implicit = tag === null || tag === '!';
        if (indentless_sequence && this.check_token(tokens.BlockEntryToken)) {
          end_mark = this.peek_token().end_mark;
          event = new events.SequenceStartEvent(anchor, tag, implicit, start_mark, end_mark);
          this.state = 'parse_indentless_sequence_entry';
        } else {
          if (this.check_token(tokens.ScalarToken)) {
            token = this.get_token();
            end_mark = token.end_mark;
            if ((token.plain && tag === null) || tag === '!') {
              implicit = [true, false];
            } else if (tag === null) {
              implicit = [false, true];
            } else {
              implicit = [false, false];
            }
            event = new events.ScalarEvent(anchor, tag, implicit, token.value, start_mark, end_mark, token.style);
            this.state = this.states.pop();
          } else if (this.check_token(tokens.FlowSequenceStartToken)) {
            end_mark = this.peek_token().end_mark;
            event = new events.SequenceStartEvent(anchor, tag, implicit, start_mark, end_mark, true);
            this.state = 'parse_flow_sequence_first_entry';
          } else if (this.check_token(tokens.FlowMappingStartToken)) {
            end_mark = this.peek_token().end_mark;
            event = new events.MappingStartEvent(anchor, tag, implicit, start_mark, end_mark, true);
            this.state = 'parse_flow_mapping_first_key';
          } else if (block && this.check_token(tokens.BlockSequenceStartToken)) {
            end_mark = this.peek_token().end_mark;
            event = new events.SequenceStartEvent(anchor, tag, implicit, start_mark, end_mark, false);
            this.state = 'parse_block_sequence_first_entry';
          } else if (block && this.check_token(tokens.BlockMappingStartToken)) {
            end_mark = this.peek_token().end_mark;
            event = new events.MappingStartEvent(anchor, tag, implicit, start_mark, end_mark, false);
            this.state = 'parse_block_mapping_first_key';
          } else if (anchor !== null || tag !== null) {
            event = new events.ScalarEvent(anchor, tag, [implicit, false], '', start_mark, end_mark);
            this.state = this.states.pop();
          } else {
            if (block) {
              node = 'block';
            } else {
              node = 'flow';
            }
            token = this.peek_token();
            throw new exports.ParserError("while parsing a " + node + " node", start_mark, "expected the node content, but found " + token.id, token.start_mark);
          }
        }
      }
      return event;
    };

    Parser.prototype.parse_block_sequence_first_entry = function() {
      var token;

      token = this.get_token();
      this.marks.push(token.start_mark);
      return this.parse_block_sequence_entry();
    };

    Parser.prototype.parse_block_sequence_entry = function() {
      var event, token;

      if (this.check_token(tokens.BlockEntryToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.BlockEntryToken, tokens.BlockEndToken)) {
          this.states.push('parse_block_sequence_entry');
          return this.parse_block_node();
        } else {
          this.state = 'parse_block_sequence_entry';
          return this.process_empty_scalar(token.end_mark);
        }
      }
      if (!this.check_token(tokens.BlockEndToken)) {
        token = this.peek_token();
        throw new exports.ParserError('while parsing a block collection', this.marks.slice(-1)[0], "expected <block end>, but found " + token.id, token.start_mark);
      }
      token = this.get_token();
      event = new events.SequenceEndEvent(token.start_mark, token.end_mark);
      this.state = this.states.pop();
      this.marks.pop();
      return event;
    };

    Parser.prototype.parse_indentless_sequence_entry = function() {
      var event, token;

      if (this.check_token(tokens.BlockEntryToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.BlockEntryToken, tokens.KeyToken, tokens.ValueToken, tokens.BlockEndToken)) {
          this.states.push('parse_indentless_sequence_entry');
          return this.parse_block_node();
        } else {
          this.state = 'parse_indentless_sequence_entry';
          return this.process_empty_scalar(token.end_mark);
        }
      }
      token = this.peek_token();
      event = new events.SequenceEndEvent(token.start_mark, token.start_mark);
      this.state = this.states.pop();
      return event;
    };

    Parser.prototype.parse_block_mapping_first_key = function() {
      var token;

      token = this.get_token();
      this.marks.push(token.start_mark);
      return this.parse_block_mapping_key();
    };

    Parser.prototype.parse_block_mapping_key = function() {
      var event, token;

      if (this.check_token(tokens.KeyToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.KeyToken, tokens.ValueToken, tokens.BlockEndToken)) {
          this.states.push('parse_block_mapping_value');
          return this.parse_block_node_or_indentless_sequence();
        } else {
          this.state = 'parse_block_mapping_value';
          return this.process_empty_scalar(token.end_mark);
        }
      }
      if (!this.check_token(tokens.BlockEndToken)) {
        token = this.peek_token();
        throw new exports.ParserError('while parsing a block mapping', this.marks.slice(-1)[0], "expected <block end>, but found " + token.id, token.start_mark);
      }
      token = this.get_token();
      event = new events.MappingEndEvent(token.start_mark, token.end_mark);
      this.state = this.states.pop();
      this.marks.pop();
      return event;
    };

    Parser.prototype.parse_block_mapping_value = function() {
      var token;

      if (this.check_token(tokens.ValueToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.KeyToken, tokens.ValueToken, tokens.BlockEndToken)) {
          this.states.push('parse_block_mapping_key');
          return this.parse_block_node_or_indentless_sequence();
        } else {
          this.state = 'parse_block_mapping_key';
          return this.process_empty_scalar(token.end_mark);
        }
      } else {
        this.state = 'parse_block_mapping_key';
        token = this.peek_token();
        return this.process_empty_scalar(token.start_mark);
      }
    };

    Parser.prototype.parse_flow_sequence_first_entry = function() {
      var token;

      token = this.get_token();
      this.marks.push(token.start_mark);
      return this.parse_flow_sequence_entry(true);
    };

    Parser.prototype.parse_flow_sequence_entry = function(first) {
      var event, token;

      if (first == null) {
        first = false;
      }
      if (!this.check_token(tokens.FlowSequenceEndToken)) {
        if (!first) {
          if (this.check_token(tokens.FlowEntryToken)) {
            this.get_token();
          } else {
            token = this.peek_token();
            throw new exports.ParserError('while parsing a flow sequence', this.marks.slice(-1)[0], "expected ',' or ']', but got " + token.id, token.start_mark);
          }
        }
        if (this.check_token(tokens.KeyToken)) {
          token = this.peek_token();
          event = new events.MappingStartEvent(null, null, true, token.start_mark, token.end_mark, true);
          this.state = 'parse_flow_sequence_entry_mapping_key';
          return event;
        } else if (!this.check_token(tokens.FlowSequenceEndToken)) {
          this.states.push('parse_flow_sequence_entry');
          return this.parse_flow_node();
        }
      }
      token = this.get_token();
      event = new events.SequenceEndEvent(token.start_mark, token.end_mark);
      this.state = this.states.pop();
      this.marks.pop();
      return event;
    };

    Parser.prototype.parse_flow_sequence_entry_mapping_key = function() {
      var token;

      token = this.get_token();
      if (!this.check_token(tokens.ValueToken, tokens.FlowEntryToken, tokens.FlowSequenceEndToken)) {
        this.states.push('parse_flow_sequence_entry_mapping_value');
        return this.parse_flow_node();
      } else {
        this.state = 'parse_flow_sequence_entry_mapping_value';
        return this.process_empty_scalar(token.end_mark);
      }
    };

    Parser.prototype.parse_flow_sequence_entry_mapping_value = function() {
      var token;

      if (this.check_token(tokens.ValueToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.FlowEntryToken, tokens.FlowSequenceEndToken)) {
          this.states.push('parse_flow_sequence_entry_mapping_end');
          return this.parse_flow_node();
        } else {
          this.state = 'parse_flow_sequence_entry_mapping_end';
          return this.process_empty_scalar(token.end_mark);
        }
      } else {
        this.state = 'parse_flow_sequence_entry_mapping_end';
        token = this.peek_token();
        return this.process_empty_scalar(token.start_mark);
      }
    };

    Parser.prototype.parse_flow_sequence_entry_mapping_end = function() {
      var token;

      this.state = 'parse_flow_sequence_entry';
      token = this.peek_token();
      return new events.MappingEndEvent(token.start_mark, token.start_mark);
    };

    Parser.prototype.parse_flow_mapping_first_key = function() {
      var token;

      token = this.get_token();
      this.marks.push(token.start_mark);
      return this.parse_flow_mapping_key(true);
    };

    Parser.prototype.parse_flow_mapping_key = function(first) {
      var event, token;

      if (first == null) {
        first = false;
      }
      if (!this.check_token(tokens.FlowMappingEndToken)) {
        if (!first) {
          if (this.check_token(tokens.FlowEntryToken)) {
            this.get_token();
          } else {
            token = this.peek_token();
            throw new exports.ParserError('while parsing a flow mapping', this.marks.slice(-1)[0], "expected ',' or '}', but got " + token.id, token.start_mark);
          }
        }
        if (this.check_token(tokens.KeyToken)) {
          token = this.get_token();
          if (!this.check_token(tokens.ValueToken, tokens.FlowEntryToken, tokens.FlowMappingEndToken)) {
            this.states.push('parse_flow_mapping_value');
            return this.parse_flow_node();
          } else {
            this.state = 'parse_flow_mapping_value';
            return this.process_empty_scalar(token.end_mark);
          }
        } else if (!this.check_token(tokens.FlowMappingEndToken)) {
          this.states.push('parse_flow_mapping_empty_value');
          return this.parse_flow_node();
        }
      }
      token = this.get_token();
      event = new events.MappingEndEvent(token.start_mark, token.end_mark);
      this.state = this.states.pop();
      this.marks.pop();
      return event;
    };

    Parser.prototype.parse_flow_mapping_value = function() {
      var token;

      if (this.check_token(tokens.ValueToken)) {
        token = this.get_token();
        if (!this.check_token(tokens.FlowEntryToken, tokens.FlowMappingEndToken)) {
          this.states.push('parse_flow_mapping_key');
          return this.parse_flow_node();
        } else {
          this.state = 'parse_flow_mapping_key';
          return this.process_empty_scalar(token.end_mark);
        }
      } else {
        this.state = 'parse_flow_mapping_key';
        token = this.peek_token();
        return this.process_empty_scalar(token.start_mark);
      }
    };

    Parser.prototype.parse_flow_mapping_empty_value = function() {
      this.state = 'parse_flow_mapping_key';
      return this.process_empty_scalar(this.peek_token().start_mark);
    };

    Parser.prototype.process_empty_scalar = function(mark) {
      return new events.ScalarEvent(null, null, [true, false], '', mark, mark);
    };

    return Parser;

  })();

}).call(this);

},{"./errors":11,"./events":12,"./tokens":19}],16:[function(require,module,exports){
(function() {
  var Mark, YAMLError, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('./errors'), Mark = _ref.Mark, YAMLError = _ref.YAMLError;

  this.ReaderError = (function(_super) {
    __extends(ReaderError, _super);

    function ReaderError(name, position, character, reason) {
      this.name = name;
      this.position = position;
      this.character = character;
      this.reason = reason;
      ReaderError.__super__.constructor.call(this);
    }

    ReaderError.prototype.toString = function() {
      return "unacceptable character " + (this.character.charCodeAt()) + ": " + this.reason + "\n  in \"" + this.name + "\", position " + this.position;
    };

    return ReaderError;

  })(YAMLError);

  /*
  Reader:
    checks if characters are within the allowed range
    add '\x00' to the end
  */


  this.Reader = (function() {
    var NON_PRINTABLE;

    NON_PRINTABLE = /[^\x09\x0A\x0D\x20-\x7E\x85\xA0-\uD7FF\uE000-\uFFFD]/;

    function Reader(string) {
      this.string = string;
      this.line = 0;
      this.column = 0;
      this.index = 0;
      this.check_printable();
      this.string += '\x00';
    }

    Reader.prototype.peek = function(index) {
      if (index == null) {
        index = 0;
      }
      return this.string[this.index + index];
    };

    Reader.prototype.prefix = function(length) {
      if (length == null) {
        length = 1;
      }
      return this.string.slice(this.index, this.index + length);
    };

    Reader.prototype.forward = function(length) {
      var char, _results;

      if (length == null) {
        length = 1;
      }
      _results = [];
      while (length) {
        char = this.string[this.index];
        this.index++;
        if (__indexOf.call('\n\x85\u2082\u2029', char) >= 0 || (char === '\r' && this.string[this.index] !== '\n')) {
          this.line++;
          this.column = 0;
        } else {
          this.column++;
        }
        _results.push(length--);
      }
      return _results;
    };

    Reader.prototype.get_mark = function() {
      return new Mark(this.name, this.line, this.column, this.string, this.index);
    };

    Reader.prototype.check_printable = function() {
      var character, match, position;

      match = NON_PRINTABLE.exec(this.string);
      if (match) {
        character = match[0];
        position = (this.string.length - this.index) + match.index;
        throw new exports.ReaderError(this.name, position, character.charCodeAt(), 'special characters are not allowed');
      }
    };

    return Reader;

  })();

}).call(this);

},{"./errors":11}],17:[function(require,module,exports){
(function() {
  var YAMLError, nodes, util, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  nodes = require('./nodes');

  util = require('./util');

  YAMLError = require('./errors').YAMLError;

  this.ResolverError = (function(_super) {
    __extends(ResolverError, _super);

    function ResolverError() {
      _ref = ResolverError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ResolverError;

  })(YAMLError);

  this.BaseResolver = (function() {
    var DEFAULT_MAPPING_TAG, DEFAULT_SCALAR_TAG, DEFAULT_SEQUENCE_TAG;

    DEFAULT_SCALAR_TAG = 'tag:yaml.org,2002:str';

    DEFAULT_SEQUENCE_TAG = 'tag:yaml.org,2002:seq';

    DEFAULT_MAPPING_TAG = 'tag:yaml.org,2002:map';

    BaseResolver.prototype.yaml_implicit_resolvers = {};

    BaseResolver.prototype.yaml_path_resolvers = {};

    BaseResolver.add_implicit_resolver = function(tag, regexp, first) {
      var char, _base, _i, _len, _ref1, _results;

      if (first == null) {
        first = [null];
      }
      if (!this.prototype.hasOwnProperty('yaml_implicit_resolvers')) {
        this.prototype.yaml_implicit_resolvers = util.extend({}, this.prototype.yaml_implicit_resolvers);
      }
      _results = [];
      for (_i = 0, _len = first.length; _i < _len; _i++) {
        char = first[_i];
        _results.push(((_ref1 = (_base = this.prototype.yaml_implicit_resolvers)[char]) != null ? _ref1 : _base[char] = []).push([tag, regexp]));
      }
      return _results;
    };

    function BaseResolver() {
      this.resolver_exact_paths = [];
      this.resolver_prefix_paths = [];
    }

    BaseResolver.prototype.descend_resolver = function(current_node, current_index) {
      var depth, exact_paths, kind, path, prefix_paths, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;

      if (util.is_empty(this.yaml_path_resolvers)) {
        return;
      }
      exact_paths = {};
      prefix_paths = [];
      if (current_node) {
        depth = this.resolver_prefix_paths.length;
        _ref1 = this.resolver_prefix_paths.slice(-1)[0];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          _ref2 = _ref1[_i], path = _ref2[0], kind = _ref2[1];
          if (this.check_resolver_prefix(depth, path, kind, current_node, current_index)) {
            if (path.length > depth) {
              prefix_paths.push([path, kind]);
            } else {
              exact_paths[kind] = this.yaml_path_resolvers[path][kind];
            }
          }
        }
      } else {
        _ref3 = this.yaml_path_resolvers;
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          _ref4 = _ref3[_j], path = _ref4[0], kind = _ref4[1];
          if (!path) {
            exact_paths[kind] = this.yaml_path_resolvers[path][kind];
          } else {
            prefix_paths.push([path, kind]);
          }
        }
      }
      this.resolver_exact_paths.push(exact_paths);
      return this.resolver_prefix_paths.push(prefix_paths);
    };

    BaseResolver.prototype.ascend_resolver = function() {
      if (util.is_empty(this.yaml_path_resolvers)) {
        return;
      }
      this.resolver_exact_paths.pop();
      return this.resolver_prefix_paths.pop();
    };

    BaseResolver.prototype.check_resolver_prefix = function(depth, path, kind, current_node, current_index) {
      var index_check, node_check, _ref1;

      _ref1 = path[depth - 1], node_check = _ref1[0], index_check = _ref1[1];
      if (typeof node_check === 'string') {
        if (current_node.tag !== node_check) {
          return;
        }
      } else if (node_check !== null) {
        if (!(current_node instanceof node_check)) {
          return;
        }
      }
      if (index_check === true && current_index !== null) {
        return;
      }
      if ((index_check === false || index_check === null) && current_index === null) {
        return;
      }
      if (typeof index_check === 'string') {
        if (!(current_index instanceof nodes.ScalarNode) && index_check === current_index.value) {
          return;
        }
      } else if (typeof index_check === 'number') {
        if (index_check !== current_index) {
          return;
        }
      }
      return true;
    };

    BaseResolver.prototype.resolve = function(kind, value, implicit) {
      var empty, exact_paths, k, regexp, resolvers, tag, _i, _len, _ref1, _ref2, _ref3, _ref4;

      if (kind === nodes.ScalarNode && implicit[0]) {
        if (value === '') {
          resolvers = (_ref1 = this.yaml_implicit_resolvers['']) != null ? _ref1 : [];
        } else {
          resolvers = (_ref2 = this.yaml_implicit_resolvers[value[0]]) != null ? _ref2 : [];
        }
        resolvers = resolvers.concat((_ref3 = this.yaml_implicit_resolvers[null]) != null ? _ref3 : []);
        for (_i = 0, _len = resolvers.length; _i < _len; _i++) {
          _ref4 = resolvers[_i], tag = _ref4[0], regexp = _ref4[1];
          if (value.match(regexp)) {
            return tag;
          }
        }
        implicit = implicit[1];
      }
      empty = true;
      for (k in this.yaml_path_resolvers) {
        if ({}[k] == null) {
          empty = false;
        }
      }
      if (!empty) {
        exact_paths = this.resolver_exact_paths.slice(-1)[0];
        if (__indexOf.call(exact_paths, kind) >= 0) {
          return exact_paths[kind];
        }
        if (__indexOf.call(exact_paths, null) >= 0) {
          return exact_paths[null];
        }
      }
      if (kind === nodes.ScalarNode) {
        return DEFAULT_SCALAR_TAG;
      }
      if (kind === nodes.SequenceNode) {
        return DEFAULT_SEQUENCE_TAG;
      }
      if (kind === nodes.MappingNode) {
        return DEFAULT_MAPPING_TAG;
      }
    };

    return BaseResolver;

  })();

  this.Resolver = (function(_super) {
    __extends(Resolver, _super);

    function Resolver() {
      _ref1 = Resolver.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return Resolver;

  })(this.BaseResolver);

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:bool', /^(?:yes|Yes|YES|true|True|TRUE|on|On|ON|no|No|NO|false|False|FALSE|off|Off|OFF)$/, 'yYnNtTfFoO');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:float', /^(?:[-+]?(?:[0-9][0-9_]*)\.[0-9_]*(?:[eE][-+][0-9]+)?|\.[0-9_]+(?:[eE][-+][0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/, '-+0123456789.');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:int', /^(?:[-+]?0b[01_]+|[-+]?0[0-7_]+|[-+]?(?:0|[1-9][0-9_]*)|[-+]?0x[0-9a-fA-F_]+|[-+]?0o[0-7_]+|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$/, '-+0123456789');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:merge', /^(?:<<)$/, '<');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:null', /^(?:~|null|Null|NULL|)$/, ['~', 'n', 'N', '']);

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:timestamp', /^(?:[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]|[0-9][0-9][0-9][0-9]-[0-9][0-9]?-[0-9][0-9]?(?:[Tt]|[\x20\t]+)[0-9][0-9]?:[0-9][0-9]:[0-9][0-9](?:\.[0-9]*)?(?:[\x20\t]*(?:Z|[-+][0-9][0-9]?(?::[0-9][0-9])?))?)$/, '0123456789');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:value', /^(?:=)$/, '=');

  this.Resolver.add_implicit_resolver('tag:yaml.org,2002:yaml', /^(?:!|&|\*)$/, '!&*');

}).call(this);

},{"./errors":11,"./nodes":14,"./util":20}],18:[function(require,module,exports){
(function() {
  var MarkedYAMLError, SimpleKey, tokens, util, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  tokens = require('./tokens');

  util = require('./util');

  /*
  The Scanner throws these.
  */


  this.ScannerError = (function(_super) {
    __extends(ScannerError, _super);

    function ScannerError() {
      _ref = ScannerError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ScannerError;

  })(MarkedYAMLError);

  /*
  Represents a possible simple key.
  */


  SimpleKey = (function() {
    function SimpleKey(token_number, required, index, line, column, mark) {
      this.token_number = token_number;
      this.required = required;
      this.index = index;
      this.line = line;
      this.column = column;
      this.mark = mark;
    }

    return SimpleKey;

  })();

  /*
  The Scanner class deals with converting a YAML stream into a token stream.
  */


  this.Scanner = (function() {
    var C_LB, C_NUMBERS, C_WS, ESCAPE_CODES, ESCAPE_REPLACEMENTS;

    C_LB = '\r\n\x85\u2028\u2029';

    C_WS = '\t ';

    C_NUMBERS = '0123456789';

    ESCAPE_REPLACEMENTS = {
      '0': '\x00',
      'a': '\x07',
      'b': '\x08',
      't': '\x09',
      '\t': '\x09',
      'n': '\x0A',
      'v': '\x0B',
      'f': '\x0C',
      'r': '\x0D',
      'e': '\x1B',
      ' ': '\x20',
      '"': '"',
      '\\': '\\',
      'N': '\x85',
      '_': '\xA0',
      'L': '\u2028',
      'P': '\u2029'
    };

    ESCAPE_CODES = {
      'x': 2,
      'u': 4,
      'U': 8
    };

    /*
    Initialise the Scanner
    */


    function Scanner() {
      this.done = false;
      this.flow_level = 0;
      this.tokens = [];
      this.fetch_stream_start();
      this.tokens_taken = 0;
      this.indent = -1;
      this.indents = [];
      this.allow_simple_key = true;
      this.possible_simple_keys = {};
    }

    /*
    Check if the next token is one of the given types.
    */


    Scanner.prototype.check_token = function() {
      var choice, choices, _i, _len;

      choices = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        if (choices.length === 0) {
          return true;
        }
        for (_i = 0, _len = choices.length; _i < _len; _i++) {
          choice = choices[_i];
          if (this.tokens[0] instanceof choice) {
            return true;
          }
        }
      }
      return false;
    };

    /*
    Return the next token, but do not delete it from the queue.
    */


    Scanner.prototype.peek_token = function() {
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        return this.tokens[0];
      }
    };

    /*
    Return the next token, and remove it from the queue.
    */


    Scanner.prototype.get_token = function() {
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        this.tokens_taken++;
        return this.tokens.shift();
      }
    };

    Scanner.prototype.need_more_tokens = function() {
      if (this.done) {
        return false;
      }
      if (this.tokens.length === 0) {
        return true;
      }
      this.stale_possible_simple_keys();
      if (this.next_possible_simple_key() === this.tokens_taken) {
        return true;
      }
      return false;
    };

    Scanner.prototype.fetch_more_tokens = function() {
      var char;

      this.scan_to_next_token();
      this.stale_possible_simple_keys();
      this.unwind_indent(this.column);
      char = this.peek();
      if (char === '\x00') {
        return this.fetch_stream_end();
      }
      if (char === '%' && this.check_directive()) {
        return this.fetch_directive();
      }
      if (char === '-' && this.check_document_start()) {
        return this.fetch_document_start();
      }
      if (char === '.' && this.check_document_end()) {
        return this.fetch_document_end();
      }
      if (char === '[') {
        return this.fetch_flow_sequence_start();
      }
      if (char === '{') {
        return this.fetch_flow_mapping_start();
      }
      if (char === ']') {
        return this.fetch_flow_sequence_end();
      }
      if (char === '}') {
        return this.fetch_flow_mapping_end();
      }
      if (char === ',') {
        return this.fetch_flow_entry();
      }
      if (char === '-' && this.check_block_entry()) {
        return this.fetch_block_entry();
      }
      if (char === '?' && this.check_key()) {
        return this.fetch_key();
      }
      if (char === ':' && this.check_value()) {
        return this.fetch_value();
      }
      if (char === '*') {
        return this.fetch_alias();
      }
      if (char === '&') {
        return this.fetch_anchor();
      }
      if (char === '!') {
        return this.fetch_tag();
      }
      if (char === '|' && this.flow_level === 0) {
        return this.fetch_literal();
      }
      if (char === '>' && this.flow_level === 0) {
        return this.fetch_folded();
      }
      if (char === '\'') {
        return this.fetch_single();
      }
      if (char === '"') {
        return this.fetch_double();
      }
      if (this.check_plain()) {
        return this.fetch_plain();
      }
      throw new exports.ScannerError('while scanning for the next token', null, "found character " + char + " that cannot start any token", this.get_mark());
    };

    /*
    Return the number of the nearest possible simple key.
    */


    Scanner.prototype.next_possible_simple_key = function() {
      var key, level, min_token_number, _ref1;

      min_token_number = null;
      _ref1 = this.possible_simple_keys;
      for (level in _ref1) {
        if (!__hasProp.call(_ref1, level)) continue;
        key = _ref1[level];
        if (min_token_number === null || key.token_number < min_token_number) {
          min_token_number = key.token_number;
        }
      }
      return min_token_number;
    };

    /*
    Remove entries that are no longer possible simple keys.  According to the
    YAML spec, simple keys:
      should be limited to a single line
      should be no longer than 1024 characters
    Disabling this procedure will allow simple keys of any length and height
    (may cause problems if indentation is broken though).
    */


    Scanner.prototype.stale_possible_simple_keys = function() {
      var key, level, _ref1, _results;

      _ref1 = this.possible_simple_keys;
      _results = [];
      for (level in _ref1) {
        if (!__hasProp.call(_ref1, level)) continue;
        key = _ref1[level];
        if (key.line === this.line && this.index - key.index <= 1024) {
          continue;
        }
        if (!key.required) {
          _results.push(delete this.possible_simple_keys[level]);
        } else {
          throw new exports.ScannerError('while scanning a simple key', key.mark, 'could not find expected \':\'', this.get_mark());
        }
      }
      return _results;
    };

    /*
    The next token may start a simple key.  We check if it's possible and save
    its position.  This function is called for ALIAS, ANCHOR, TAG,
    SCALAR (flow),'[' and '{'.
    */


    Scanner.prototype.save_possible_simple_key = function() {
      var required, token_number;

      required = this.flow_level === 0 && this.indent === this.column;
      if (required && !this.allow_simple_key) {
        throw new Error('logic failure');
      }
      if (!this.allow_simple_key) {
        return;
      }
      this.remove_possible_simple_key();
      token_number = this.tokens_taken + this.tokens.length;
      return this.possible_simple_keys[this.flow_level] = new SimpleKey(token_number, required, this.index, this.line, this.column, this.get_mark());
    };

    /*
    Remove the saved possible simple key at the current flow level.
    */


    Scanner.prototype.remove_possible_simple_key = function() {
      var key;

      if (!(key = this.possible_simple_keys[this.flow_level])) {
        return;
      }
      if (!key.required) {
        return delete this.possible_simple_keys[this.flow_level];
      } else {
        throw new exports.ScannerError('while scanning a simple key', key.mark, 'could not find expected \':\'', this.get_mark());
      }
    };

    /*
    In flow context, tokens should respect indentation.
    Actually the condition should be `self.indent >= column` according to
    the spec. But this condition will prohibit intuitively correct
    constructions such as
      key : {
      }
    */


    Scanner.prototype.unwind_indent = function(column) {
      var mark, _results;

      if (this.flow_level !== 0) {
        return;
      }
      _results = [];
      while (this.indent > column) {
        mark = this.get_mark();
        this.indent = this.indents.pop();
        _results.push(this.tokens.push(new tokens.BlockEndToken(mark, mark)));
      }
      return _results;
    };

    /*
    Check if we need to increase indentation.
    */


    Scanner.prototype.add_indent = function(column) {
      if (!(column > this.indent)) {
        return false;
      }
      this.indents.push(this.indent);
      this.indent = column;
      return true;
    };

    Scanner.prototype.fetch_stream_start = function() {
      var mark;

      mark = this.get_mark();
      return this.tokens.push(new tokens.StreamStartToken(mark, mark, this.encoding));
    };

    Scanner.prototype.fetch_stream_end = function() {
      var mark;

      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_possible_simple_key = false;
      this.possible_simple_keys = {};
      mark = this.get_mark();
      this.tokens.push(new tokens.StreamEndToken(mark, mark));
      return this.done = true;
    };

    Scanner.prototype.fetch_directive = function() {
      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_directive());
    };

    Scanner.prototype.fetch_document_start = function() {
      return this.fetch_document_indicator(tokens.DocumentStartToken);
    };

    Scanner.prototype.fetch_document_end = function() {
      return this.fetch_document_indicator(tokens.DocumentEndToken);
    };

    Scanner.prototype.fetch_document_indicator = function(TokenClass) {
      var start_mark;

      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_simple_key = false;
      start_mark = this.get_mark();
      this.forward(3);
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_sequence_start = function() {
      return this.fetch_flow_collection_start(tokens.FlowSequenceStartToken);
    };

    Scanner.prototype.fetch_flow_mapping_start = function() {
      return this.fetch_flow_collection_start(tokens.FlowMappingStartToken);
    };

    Scanner.prototype.fetch_flow_collection_start = function(TokenClass) {
      var start_mark;

      this.save_possible_simple_key();
      this.flow_level++;
      this.allow_simple_key = true;
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_sequence_end = function() {
      return this.fetch_flow_collection_end(tokens.FlowSequenceEndToken);
    };

    Scanner.prototype.fetch_flow_mapping_end = function() {
      return this.fetch_flow_collection_end(tokens.FlowMappingEndToken);
    };

    Scanner.prototype.fetch_flow_collection_end = function(TokenClass) {
      var start_mark;

      this.remove_possible_simple_key();
      this.flow_level--;
      this.allow_simple_key = false;
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_entry = function() {
      var start_mark;

      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.FlowEntryToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_block_entry = function() {
      var mark, start_mark;

      if (this.flow_level === 0) {
        if (!this.allow_simple_key) {
          throw new exports.ScannerError(null, null, 'sequence entries are not allowed here', this.get_mark());
        }
        if (this.add_indent(this.column)) {
          mark = this.get_mark();
          this.tokens.push(new tokens.BlockSequenceStartToken(mark, mark));
        }
      }
      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.BlockEntryToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_key = function() {
      var mark, start_mark;

      if (this.flow_level === 0) {
        if (!this.allow_simple_key) {
          throw new exports.ScannerError(null, null, 'mapping keys are not allowed here', this.get_mark());
        }
        if (this.add_indent(this.column)) {
          mark = this.get_mark();
          this.tokens.push(new tokens.BlockMappingStartToken(mark, mark));
        }
      }
      this.allow_simple_key = !this.flow_level;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.KeyToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_value = function() {
      var key, mark, start_mark;

      if (key = this.possible_simple_keys[this.flow_level]) {
        delete this.possible_simple_keys[this.flow_level];
        this.tokens.splice(key.token_number - this.tokens_taken, 0, new tokens.KeyToken(key.mark, key.mark));
        if (this.flow_level === 0) {
          if (this.add_indent(key.column)) {
            this.tokens.splice(key.token_number - this.tokens_taken, 0, new tokens.BlockMappingStartToken(key.mark, key.mark));
          }
        }
        this.allow_simple_key = false;
      } else {
        if (this.flow_level === 0) {
          if (!this.allow_simple_key) {
            throw new exports.ScannerError(null, null, 'mapping values are not allowed here', this.get_mark());
          }
          if (this.add_indent(this.column)) {
            mark = this.get_mark();
            this.tokens.push(new tokens.BlockMappingStartToken(mark, mark));
          }
        }
        this.allow_simple_key = !this.flow_level;
        this.remove_possible_simple_key();
      }
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.ValueToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_alias = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_anchor(tokens.AliasToken));
    };

    Scanner.prototype.fetch_anchor = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_anchor(tokens.AnchorToken));
    };

    Scanner.prototype.fetch_tag = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_tag());
    };

    Scanner.prototype.fetch_literal = function() {
      return this.fetch_block_scalar('|');
    };

    Scanner.prototype.fetch_folded = function() {
      return this.fetch_block_scalar('>');
    };

    Scanner.prototype.fetch_block_scalar = function(style) {
      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      return this.tokens.push(this.scan_block_scalar(style));
    };

    Scanner.prototype.fetch_single = function() {
      return this.fetch_flow_scalar('\'');
    };

    Scanner.prototype.fetch_double = function() {
      return this.fetch_flow_scalar('"');
    };

    Scanner.prototype.fetch_flow_scalar = function(style) {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_flow_scalar(style));
    };

    Scanner.prototype.fetch_plain = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_plain());
    };

    /*
    DIRECTIVE: ^ '%'
    */


    Scanner.prototype.check_directive = function() {
      if (this.column === 0) {
        return true;
      }
      return false;
    };

    /*
    DOCUMENT-START: ^ '---' (' '|'\n')
    */


    Scanner.prototype.check_document_start = function() {
      var _ref1;

      if (this.column === 0 && this.prefix(3) === '---' && (_ref1 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) {
        return true;
      }
      return false;
    };

    /*
    DOCUMENT-END: ^ '...' (' '|'\n')
    */


    Scanner.prototype.check_document_end = function() {
      var _ref1;

      if (this.column === 0 && this.prefix(3) === '...' && (_ref1 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) {
        return true;
      }
      return false;
    };

    /*
    BLOCK-ENTRY: '-' (' '|'\n')
    */


    Scanner.prototype.check_block_entry = function() {
      var _ref1;

      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    KEY (flow context):  '?'
    KEY (block context): '?' (' '|'\n')
    */


    Scanner.prototype.check_key = function() {
      var _ref1;

      if (this.flow_level !== 0) {
        return true;
      }
      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    VALUE (flow context):  ':'
    VALUE (block context): ':' (' '|'\n')
    */


    Scanner.prototype.check_value = function() {
      var _ref1;

      if (this.flow_level !== 0) {
        return true;
      }
      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    A plain scalar may start with any non-space character except:
      '-', '?', ':', ',', '[', ']', '{', '}',
      '#', '&', '*', '!', '|', '>', '\'', '"',
      '%', '@', '`'.
    
    It may also start with
      '-', '?', ':'
    if it is followed by a non-space character.
    
    Note that we limit the last rule to the block context (except the '-'
    character) because we want the flow context to be space independent.
    */


    Scanner.prototype.check_plain = function() {
      var char, _ref1;

      char = this.peek();
      return __indexOf.call(C_LB + C_WS + '\x00-?:,[]{}#&*!|>\'"%@`', char) < 0 || ((_ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) < 0) && (char === '-' || (this.flow_level === 0 && __indexOf.call('?:', char) >= 0)));
    };

    /*
    We ignore spaces, line breaks and comments.
    If we find a line break in the block context, we set the flag
    `allow_simple_key` on.
    The byte order mark is stripped if it's the first character in the stream.
    We do not yet support BOM inside the stream as the specification requires.
    Any such mark will be considered as a part of the document.
    
    TODO: We need to make tab handling rules more sane.  A good rule is
      Tabs cannot precede tokens BLOCK-SEQUENCE-START, BLOCK-MAPPING-START,
      BLOCK-END, KEY (block context), VALUE (block context), BLOCK-ENTRY
    So the tab checking code is
      @allow_simple_key = off if <TAB>
    We also need to add the check for `allow_simple_key is on` to
    `unwind_indent` before issuing BLOCK-END.  Scanners for block, flow and
    plain scalars need to be modified.
    */


    Scanner.prototype.scan_to_next_token = function() {
      var found, _ref1, _results;

      if (this.index === 0 && this.peek() === '\uFEFF') {
        this.forward();
      }
      found = false;
      _results = [];
      while (!found) {
        while (this.peek() === ' ') {
          this.forward();
        }
        if (this.peek() === '#') {
          while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
            this.forward();
          }
        }
        if (this.scan_line_break()) {
          if (this.flow_level === 0) {
            _results.push(this.allow_simple_key = true);
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(found = true);
        }
      }
      return _results;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive = function() {
      var end_mark, name, start_mark, value, _ref1;

      start_mark = this.get_mark();
      this.forward();
      name = this.scan_directive_name(start_mark);
      value = null;
      if (name === 'YAML') {
        value = this.scan_yaml_directive_value(start_mark);
        end_mark = this.get_mark();
      } else if (name === 'TAG') {
        value = this.scan_tag_directive_value(start_mark);
        end_mark = this.get_mark();
      } else {
        end_mark = this.get_mark();
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      this.scan_directive_ignored_line(start_mark);
      return new tokens.DirectiveToken(name, value, start_mark, end_mark);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive_name = function(start_mark) {
      var char, length, value;

      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
        length++;
        char = peek(length);
      }
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected alphanumeric or numeric character but found " + char, length === 0 ? this.get_mark() : void 0);
      value = this.prefix(length);
      this.forward(length);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected alphanumeric or numeric character but found " + char, __indexOf.call(C_LB + '\x00 ', char) < 0 ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_yaml_directive_value = function(start_mark) {
      var major, minor, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      major = this.scan_yaml_directive_number(start_mark);
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit or '.' but found " + (this.peek()), this.peek() !== '.' ? this.get_mark() : void 0);
      this.forward();
      minor = this.scan_yaml_directive_number(start_mark);
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit or ' ' but found " + (this.peek()), (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00 ', _ref1) < 0) ? this.get_mark() : void 0);
      return [major, minor];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_yaml_directive_number = function(start_mark) {
      var char, length, value, _ref1;

      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit but found " + char, !(('0' <= char && char <= '9')) ? this.get_mark() : void 0);
      length = 0;
      while (('0' <= (_ref1 = this.peek(length)) && _ref1 <= '9')) {
        length++;
      }
      value = parseInt(this.prefix(length));
      this.forward(length);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_value = function(start_mark) {
      var handle, prefix;

      while (this.peek() === ' ') {
        this.forward();
      }
      handle = this.scan_tag_directive_handle(start_mark);
      while (this.peek() === ' ') {
        this.forward();
      }
      prefix = this.scan_tag_directive_prefix(start_mark);
      return [handle, prefix];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_handle = function(start_mark) {
      var char, value;

      value = this.scan_tag_handle('directive', start_mark);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected ' ' but found " + char, char !== ' ' ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_prefix = function(start_mark) {
      var char, value;

      value = this.scan_tag_uri('directive', start_mark);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected ' ' but found " + char, __indexOf.call(C_LB + '\x00 ', char) < 0 ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive_ignored_line = function(start_mark) {
      var char, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      if (this.peek() === '#') {
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a comment or a line break but found " + char, __indexOf.call(C_LB + '\x00', char) < 0 ? this.get_mark() : void 0);
      return this.scan_line_break();
    };

    /*
    The specification does not restrict characters for anchors and aliases.
    This may lead to problems, for instance, the document:
      [ *alias, value ]
    can be interpteted in two ways, as
      [ "value" ]
    and
      [ *alias , "value" ]
    Therefore we restrict aliases to numbers and ASCII letters.
    */


    Scanner.prototype.scan_anchor = function(TokenClass) {
      var char, indicator, length, name, start_mark, value;

      start_mark = this.get_mark();
      indicator = this.peek();
      if (indicator === '*') {
        name = 'alias';
      } else {
        name = 'anchor';
      }
      this.forward();
      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
        length++;
        char = this.peek(length);
      }
      if (length === 0) {
        throw new exports.ScannerError("while scanning an " + name, start_mark, "expected alphabetic or numeric character but found '" + char + "'", this.get_mark());
      }
      value = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (__indexOf.call(C_LB + C_WS + '\x00' + '?:,]}%@`', char) < 0) {
        throw new exports.ScannerError("while scanning an " + name, start_mark, "expected alphabetic or numeric character but found '" + char + "'", this.get_mark());
      }
      return new TokenClass(value, start_mark, this.get_mark());
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag = function() {
      var char, handle, length, start_mark, suffix, use_handle;

      start_mark = this.get_mark();
      char = this.peek(1);
      if (char === '<') {
        handle = null;
        this.forward(2);
        suffix = this.scan_tag_uri('tag', start_mark);
        if (this.peek() !== '>') {
          throw new exports.ScannerError('while parsing a tag', start_mark, "expected '>' but found " + (this.peek()), this.get_mark());
        }
        this.forward();
      } else if (__indexOf.call(C_LB + C_WS + '\x00', char) >= 0) {
        handle = null;
        suffix = '!';
        this.forward();
      } else {
        length = 1;
        use_handle = false;
        while (__indexOf.call(C_LB + '\x00 ', char) < 0) {
          if (char === '!') {
            use_handle = true;
            break;
          }
          length++;
          char = this.peek(length);
        }
        if (use_handle) {
          handle = this.scan_tag_handle('tag', start_mark);
        } else {
          handle = '!';
          this.forward();
        }
        suffix = this.scan_tag_uri('tag', start_mark);
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00 ', char) < 0) {
        throw new exports.ScannerError('while scanning a tag', start_mark, "expected ' ' but found " + char, this.get_mark());
      }
      return new tokens.TagToken([handle, suffix], start_mark, this.get_mark());
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar = function(style) {
      var breaks, chomping, chunks, end_mark, folded, increment, indent, leading_non_space, length, line_break, max_indent, min_indent, start_mark, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;

      folded = style === '>';
      chunks = [];
      start_mark = this.get_mark();
      this.forward();
      _ref1 = this.scan_block_scalar_indicators(start_mark), chomping = _ref1[0], increment = _ref1[1];
      this.scan_block_scalar_ignored_line(start_mark);
      min_indent = this.indent + 1;
      if (min_indent < 1) {
        min_indent = 1;
      }
      if (increment == null) {
        _ref2 = this.scan_block_scalar_indentation(), breaks = _ref2[0], max_indent = _ref2[1], end_mark = _ref2[2];
        indent = Math.max(min_indent, max_indent);
      } else {
        indent = min_indent + increment - 1;
        _ref3 = this.scan_block_scalar_breaks(indent), breaks = _ref3[0], end_mark = _ref3[1];
      }
      line_break = '';
      while (this.column === indent && this.peek() !== '\x00') {
        chunks = chunks.concat(breaks);
        leading_non_space = (_ref4 = this.peek(), __indexOf.call(' \t', _ref4) < 0);
        length = 0;
        while (_ref5 = this.peek(length), __indexOf.call(C_LB + '\x00', _ref5) < 0) {
          length++;
        }
        chunks.push(this.prefix(length));
        this.forward(length);
        line_break = this.scan_line_break();
        _ref6 = this.scan_block_scalar_breaks(indent), breaks = _ref6[0], end_mark = _ref6[1];
        if (this.column === indent && this.peek() !== '\x00') {
          if (folded && line_break === '\n' && leading_non_space && (_ref7 = this.peek(), __indexOf.call(' \t', _ref7) < 0)) {
            if (util.is_empty(breaks)) {
              chunks.push(' ');
            }
          } else {
            chunks.push(line_break);
          }
        } else {
          break;
        }
      }
      if (chomping !== false) {
        chunks.push(line_break);
      }
      if (chomping === true) {
        chunks = chunks.concat(breaks);
      }
      return new tokens.ScalarToken(chunks.join(''), false, start_mark, end_mark, style);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_indicators = function(start_mark) {
      var char, chomping, increment;

      chomping = null;
      increment = null;
      char = this.peek();
      if (__indexOf.call('+-', char) >= 0) {
        chomping = char === '+';
        this.forward();
        char = this.peek();
        if (__indexOf.call(C_NUMBERS, char) >= 0) {
          increment = parseInt(char);
          if (increment === 0) {
            throw new exports.ScannerError('while scanning a block scalar', start_mark, 'expected indentation indicator in the range 1-9 but found 0', this.get_mark());
          }
          this.forward();
        }
      } else if (__indexOf.call(C_NUMBERS, char) >= 0) {
        increment = parseInt(char);
        if (increment === 0) {
          throw new exports.ScannerError('while scanning a block scalar', start_mark, 'expected indentation indicator in the range 1-9 but found 0', this.get_mark());
        }
        this.forward();
        char = this.peek();
        if (__indexOf.call('+-', char) >= 0) {
          chomping = char === '+';
          this.forward();
        }
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00 ', char) < 0) {
        throw new exports.ScannerError('while scanning a block scalar', start_mark, "expected chomping or indentation indicators, but found " + char, this.get_mark());
      }
      return [chomping, increment];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_ignored_line = function(start_mark) {
      var char, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      if (this.peek() === '#') {
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00', char) < 0) {
        throw new exports.ScannerError('while scanning a block scalar', start_mark, "expected a comment or a line break but found " + char, this.get_mark());
      }
      return this.scan_line_break();
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_indentation = function() {
      var chunks, end_mark, max_indent, _ref1;

      chunks = [];
      max_indent = 0;
      end_mark = this.get_mark();
      while (_ref1 = this.peek(), __indexOf.call(C_LB + ' ', _ref1) >= 0) {
        if (this.peek() !== ' ') {
          chunks.push(this.scan_line_break());
          end_mark = this.get_mark();
        } else {
          this.forward();
          if (this.column > max_indent) {
            max_indent = this.column;
          }
        }
      }
      return [chunks, max_indent, end_mark];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_breaks = function(indent) {
      var chunks, end_mark, _ref1;

      chunks = [];
      end_mark = this.get_mark();
      while (this.column < indent && this.peek() === ' ') {
        this.forward();
      }
      while (_ref1 = this.peek(), __indexOf.call(C_LB, _ref1) >= 0) {
        chunks.push(this.scan_line_break());
        end_mark = this.get_mark();
        while (this.column < indent && this.peek() === ' ') {
          this.forward();
        }
      }
      return [chunks, end_mark];
    };

    /*
    See the specification for details.
    Note that we loose indentation rules for quoted scalars. Quoted scalars
    don't need to adhere indentation because " and ' clearly mark the beginning
    and the end of them. Therefore we are less restrictive than the
    specification requires. We only need to check that document separators are
    not included in scalars.
    */


    Scanner.prototype.scan_flow_scalar = function(style) {
      var chunks, double, quote, start_mark;

      double = style === '"';
      chunks = [];
      start_mark = this.get_mark();
      quote = this.peek();
      this.forward();
      chunks = chunks.concat(this.scan_flow_scalar_non_spaces(double, start_mark));
      while (this.peek() !== quote) {
        chunks = chunks.concat(this.scan_flow_scalar_spaces(double, start_mark));
        chunks = chunks.concat(this.scan_flow_scalar_non_spaces(double, start_mark));
      }
      this.forward();
      return new tokens.ScalarToken(chunks.join(''), false, start_mark, this.get_mark(), style);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_non_spaces = function(double, start_mark) {
      var char, chunks, code, k, length, _i, _ref1;

      chunks = [];
      while (true) {
        length = 0;
        while (_ref1 = this.peek(length), __indexOf.call(C_LB + C_WS + '\'"\\\x00', _ref1) < 0) {
          length++;
        }
        if (length !== 0) {
          chunks.push(this.prefix(length));
          this.forward(length);
        }
        char = this.peek();
        if (!double && char === '\'' && this.peek(1) === '\'') {
          chunks.push('\'');
          this.forward(2);
        } else if ((double && char === '\'') || (!double && __indexOf.call('"\\', char) >= 0)) {
          chunks.push(char);
          this.forward();
        } else if (double && char === '\\') {
          this.forward();
          char = this.peek();
          if (char in ESCAPE_REPLACEMENTS) {
            chunks.push(ESCAPE_REPLACEMENTS[char]);
            this.forward();
          } else if (char in ESCAPE_CODES) {
            length = ESCAPE_CODES[char];
            this.forward();
            for (k = _i = 0; 0 <= length ? _i < length : _i > length; k = 0 <= length ? ++_i : --_i) {
              if (this.peek(__indexOf.call(C_NUMBERS + 'ABCDEFabcdef', k) < 0)) {
                throw new exports.ScannerError('while scanning a double-quoted scalar', start_mark, "expected escape sequence of " + length + " hexadecimal numbers, but              found " + (this.peek(k)), this.get_mark());
              }
            }
            code = parseInt(this.prefix(length), 16);
            chunks.push(String.fromCharCode(code));
            this.forward(length);
          } else if (__indexOf.call(C_LB, char) >= 0) {
            this.scan_line_break();
            chunks = chunks.concat(this.scan_flow_scalar_breaks(double, start_mark));
          } else {
            throw new exports.ScannerError('while scanning a double-quoted scalar', start_mark, "found unknown escape character " + char, this.get_mark());
          }
        } else {
          return chunks;
        }
      }
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_spaces = function(double, start_mark) {
      var breaks, char, chunks, length, line_break, whitespaces, _ref1;

      chunks = [];
      length = 0;
      while (_ref1 = this.peek(length), __indexOf.call(C_WS, _ref1) >= 0) {
        length++;
      }
      whitespaces = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (char === '\x00') {
        throw new exports.ScannerError('while scanning a quoted scalar', start_mark, 'found unexpected end of stream', this.get_mark());
      }
      if (__indexOf.call(C_LB, char) >= 0) {
        line_break = this.scan_line_break();
        breaks = this.scan_flow_scalar_breaks(double, start_mark);
        if (line_break !== '\n') {
          chunks.push(line_break);
        } else if (!breaks) {
          chunks.push(' ');
        }
        chunks = chunks.concat(breaks);
      } else {
        chunks.push(whitespaces);
      }
      return chunks;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_breaks = function(double, start_mark) {
      var chunks, prefix, _ref1, _ref2;

      chunks = [];
      while (true) {
        prefix = this.prefix(3);
        throw new exports.ScannerError('while scanning a quoted scalar', start_mark, 'found unexpected document separator', prefix === '---' || prefix === '...' && this.peek(__indexOf.call(C_LB + C_WS + '\x00', 3) >= 0) ? this.get_mark() : void 0);
        while (_ref1 = this.peek(), __indexOf.call(C_WS, _ref1) >= 0) {
          this.forward();
        }
        if (_ref2 = this.peek(), __indexOf.call(C_LB, _ref2) >= 0) {
          chunks.push(this.scan_line_break());
        } else {
          return chunks;
        }
      }
    };

    /*
    See the specification for details.
    We add an additional restriction for the flow context:
      plain scalars in the flow context cannot contain ',', ':' and '?'.
    We also keep track of the `allow_simple_key` flag here.
    Indentation rules are loosed for the flow context.
    */


    Scanner.prototype.scan_plain = function() {
      var char, chunks, end_mark, indent, length, spaces, start_mark, _ref1, _ref2;

      chunks = [];
      start_mark = end_mark = this.get_mark();
      indent = this.indent + 1;
      spaces = [];
      while (true) {
        length = 0;
        if (this.peek() === '#') {
          break;
        }
        while (true) {
          char = this.peek(length);
          if (__indexOf.call(C_LB + C_WS + '\x00', char) >= 0 || (this.flow_level === 0 && char === ':' && (_ref1 = this.peek(length + 1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) || (this.flow_level !== 0 && __indexOf.call(',:?[]{}', char) >= 0)) {
            break;
          }
          length++;
        }
        if (this.flow_level !== 0 && char === ':' && (_ref2 = this.peek(length + 1), __indexOf.call(C_LB + C_WS + '\x00,[]{}', _ref2) < 0)) {
          this.forward(length);
          throw new exports.ScannerError('while scanning a plain scalar', start_mark, 'found unexpected \':\'', this.get_mark(), 'Please check http://pyyaml.org/wiki/YAMLColonInFlowContext');
        }
        if (length === 0) {
          break;
        }
        this.allow_simple_key = false;
        chunks = chunks.concat(spaces);
        chunks.push(this.prefix(length));
        this.forward(length);
        end_mark = this.get_mark();
        spaces = this.scan_plain_spaces(indent, start_mark);
        if ((spaces == null) || spaces.length === 0 || this.peek() === '#' || (this.flow_level === 0 && this.column < indent)) {
          break;
        }
      }
      return new tokens.ScalarToken(chunks.join(''), true, start_mark, end_mark);
    };

    /*
    See the specification for details.
    The specification is really confusing about tabs in plain scalars.
    We just forbid them completely. Do not use tabs in YAML!
    */


    Scanner.prototype.scan_plain_spaces = function(indent, start_mark) {
      var breaks, char, chunks, length, line_break, prefix, whitespaces, _ref1, _ref2;

      chunks = [];
      length = 0;
      while (_ref1 = this.peek(length), __indexOf.call(' ', _ref1) >= 0) {
        length++;
      }
      whitespaces = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (__indexOf.call(C_LB, char) >= 0) {
        line_break = this.scan_line_break();
        this.allow_simple_key = true;
        prefix = this.prefix(3);
        if (prefix === '---' || prefix === '...' && this.peek(__indexOf.call(C_LB + C_WS + '\x00', 3) >= 0)) {
          return;
        }
        breaks = [];
        while (_ref2 = this.peek(), __indexOf.call(C_LB + ' ', _ref2) >= 0) {
          if (this.peek() === ' ') {
            this.forward();
          } else {
            breaks.push(this.scan_line_break());
            prefix = this.prefix(3);
            if (prefix === '---' || prefix === '...' && this.peek(__indexOf.call(C_LB + C_WS + '\x00', 3) >= 0)) {
              return;
            }
          }
        }
        if (line_break !== '\n') {
          chunks.push(line_break);
        } else if (breaks.length === 0) {
          chunks.push(' ');
        }
        chunks = chunks.concat(breaks);
      } else if (whitespaces) {
        chunks.push(whitespaces);
      }
      return chunks;
    };

    /*
    See the specification for details.
    For some strange reasons, the specification does not allow '_' in tag
    handles. I have allowed it anyway.
    */


    Scanner.prototype.scan_tag_handle = function(name, start_mark) {
      var char, length, value;

      char = this.peek();
      if (char !== '!') {
        throw new exports.ScannerError("while scanning a " + name, start_mark, "expected '!' but found " + char, this.get_mark());
      }
      length = 1;
      char = this.peek(length);
      if (char !== ' ') {
        while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
          length++;
          char = this.peek(length);
        }
        if (char !== '!') {
          this.forward(length);
          throw new exports.ScannerError("while scanning a " + name, start_mark, "expected '!' but found " + char, this.get_mark());
        }
        length++;
      }
      value = this.prefix(length);
      this.forward(length);
      return value;
    };

    /*
    See the specification for details.
    Note: we do not check if URI is well-formed.
    */


    Scanner.prototype.scan_tag_uri = function(name, start_mark) {
      var char, chunks, length;

      chunks = [];
      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-;/?:@&=+$,_.!~*\'()[]%', char) >= 0) {
        if (char === '%') {
          chunks.push(this.prefix(length));
          this.forward(length);
          length = 0;
          chunks.push(this.scan_uri_escapes(name, start_mark));
        } else {
          length++;
        }
        char = this.peek(length);
      }
      if (length !== 0) {
        chunks.push(this.prefix(length));
        this.forward(length);
        length = 0;
      }
      if (chunks.length === 0) {
        throw new exports.ScannerError("while parsing a " + name, start_mark, "expected URI but found " + char, this.get_mark());
      }
      return chunks.join('');
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_uri_escapes = function(name, start_mark) {
      var bytes, k, mark, _i;

      bytes = [];
      mark = this.get_mark();
      while (this.peek() === '%') {
        this.forward();
        for (k = _i = 0; _i <= 2; k = ++_i) {
          throw new exports.ScannerError("while scanning a " + name, start_mark, "expected URI escape sequence of 2 hexadecimal numbers but found          " + (this.peek(k)), this.get_mark());
        }
        bytes.push(String.fromCharCode(parseInt(this.prefix(2), 16)));
        this.forward(2);
      }
      return bytes.join('');
    };

    /*
    Transforms:
      '\r\n'      :   '\n'
      '\r'        :   '\n'
      '\n'        :   '\n'
      '\x85'      :   '\n'
      '\u2028'    :   '\u2028'
      '\u2029     :   '\u2029'
      default     :   ''
    */


    Scanner.prototype.scan_line_break = function() {
      var char;

      char = this.peek();
      if (__indexOf.call('\r\n\x85', char) >= 0) {
        if (this.prefix(2) === '\r\n') {
          this.forward(2);
        } else {
          this.forward();
        }
        return '\n';
      } else if (__indexOf.call('\u2028\u2029', char) >= 0) {
        this.forward();
        return char;
      }
      return '';
    };

    return Scanner;

  })();

}).call(this);

},{"./errors":11,"./tokens":19,"./util":20}],19:[function(require,module,exports){
(function() {
  var _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Token = (function() {
    function Token(start_mark, end_mark) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return Token;

  })();

  this.DirectiveToken = (function(_super) {
    __extends(DirectiveToken, _super);

    DirectiveToken.prototype.id = '<directive>';

    function DirectiveToken(name, value, start_mark, end_mark) {
      this.name = name;
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return DirectiveToken;

  })(this.Token);

  this.DocumentStartToken = (function(_super) {
    __extends(DocumentStartToken, _super);

    function DocumentStartToken() {
      _ref = DocumentStartToken.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DocumentStartToken.prototype.id = '<document start>';

    return DocumentStartToken;

  })(this.Token);

  this.DocumentEndToken = (function(_super) {
    __extends(DocumentEndToken, _super);

    function DocumentEndToken() {
      _ref1 = DocumentEndToken.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DocumentEndToken.prototype.id = '<document end>';

    return DocumentEndToken;

  })(this.Token);

  this.StreamStartToken = (function(_super) {
    __extends(StreamStartToken, _super);

    StreamStartToken.prototype.id = '<stream start>';

    function StreamStartToken(start_mark, end_mark, encoding) {
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.encoding = encoding;
    }

    return StreamStartToken;

  })(this.Token);

  this.StreamEndToken = (function(_super) {
    __extends(StreamEndToken, _super);

    function StreamEndToken() {
      _ref2 = StreamEndToken.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    StreamEndToken.prototype.id = '<stream end>';

    return StreamEndToken;

  })(this.Token);

  this.BlockSequenceStartToken = (function(_super) {
    __extends(BlockSequenceStartToken, _super);

    function BlockSequenceStartToken() {
      _ref3 = BlockSequenceStartToken.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    BlockSequenceStartToken.prototype.id = '<block sequence start>';

    return BlockSequenceStartToken;

  })(this.Token);

  this.BlockMappingStartToken = (function(_super) {
    __extends(BlockMappingStartToken, _super);

    function BlockMappingStartToken() {
      _ref4 = BlockMappingStartToken.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    BlockMappingStartToken.prototype.id = '<block mapping end>';

    return BlockMappingStartToken;

  })(this.Token);

  this.BlockEndToken = (function(_super) {
    __extends(BlockEndToken, _super);

    function BlockEndToken() {
      _ref5 = BlockEndToken.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    BlockEndToken.prototype.id = '<block end>';

    return BlockEndToken;

  })(this.Token);

  this.FlowSequenceStartToken = (function(_super) {
    __extends(FlowSequenceStartToken, _super);

    function FlowSequenceStartToken() {
      _ref6 = FlowSequenceStartToken.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    FlowSequenceStartToken.prototype.id = '[';

    return FlowSequenceStartToken;

  })(this.Token);

  this.FlowMappingStartToken = (function(_super) {
    __extends(FlowMappingStartToken, _super);

    function FlowMappingStartToken() {
      _ref7 = FlowMappingStartToken.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    FlowMappingStartToken.prototype.id = '{';

    return FlowMappingStartToken;

  })(this.Token);

  this.FlowSequenceEndToken = (function(_super) {
    __extends(FlowSequenceEndToken, _super);

    function FlowSequenceEndToken() {
      _ref8 = FlowSequenceEndToken.__super__.constructor.apply(this, arguments);
      return _ref8;
    }

    FlowSequenceEndToken.prototype.id = ']';

    return FlowSequenceEndToken;

  })(this.Token);

  this.FlowMappingEndToken = (function(_super) {
    __extends(FlowMappingEndToken, _super);

    function FlowMappingEndToken() {
      _ref9 = FlowMappingEndToken.__super__.constructor.apply(this, arguments);
      return _ref9;
    }

    FlowMappingEndToken.prototype.id = '}';

    return FlowMappingEndToken;

  })(this.Token);

  this.KeyToken = (function(_super) {
    __extends(KeyToken, _super);

    function KeyToken() {
      _ref10 = KeyToken.__super__.constructor.apply(this, arguments);
      return _ref10;
    }

    KeyToken.prototype.id = '?';

    return KeyToken;

  })(this.Token);

  this.ValueToken = (function(_super) {
    __extends(ValueToken, _super);

    function ValueToken() {
      _ref11 = ValueToken.__super__.constructor.apply(this, arguments);
      return _ref11;
    }

    ValueToken.prototype.id = ':';

    return ValueToken;

  })(this.Token);

  this.BlockEntryToken = (function(_super) {
    __extends(BlockEntryToken, _super);

    function BlockEntryToken() {
      _ref12 = BlockEntryToken.__super__.constructor.apply(this, arguments);
      return _ref12;
    }

    BlockEntryToken.prototype.id = '-';

    return BlockEntryToken;

  })(this.Token);

  this.FlowEntryToken = (function(_super) {
    __extends(FlowEntryToken, _super);

    function FlowEntryToken() {
      _ref13 = FlowEntryToken.__super__.constructor.apply(this, arguments);
      return _ref13;
    }

    FlowEntryToken.prototype.id = ',';

    return FlowEntryToken;

  })(this.Token);

  this.AliasToken = (function(_super) {
    __extends(AliasToken, _super);

    AliasToken.prototype.id = '<alias>';

    function AliasToken(value, start_mark, end_mark) {
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return AliasToken;

  })(this.Token);

  this.AnchorToken = (function(_super) {
    __extends(AnchorToken, _super);

    AnchorToken.prototype.id = '<anchor>';

    function AnchorToken(value, start_mark, end_mark) {
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return AnchorToken;

  })(this.Token);

  this.TagToken = (function(_super) {
    __extends(TagToken, _super);

    TagToken.prototype.id = '<tag>';

    function TagToken(value, start_mark, end_mark) {
      this.value = value;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
    }

    return TagToken;

  })(this.Token);

  this.ScalarToken = (function(_super) {
    __extends(ScalarToken, _super);

    ScalarToken.prototype.id = '<scalar>';

    function ScalarToken(value, plain, start_mark, end_mark, style) {
      this.value = value;
      this.plain = plain;
      this.start_mark = start_mark;
      this.end_mark = end_mark;
      this.style = style;
    }

    return ScalarToken;

  })(this.Token);

}).call(this);

},{}],20:[function(require,module,exports){
(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  this.extend = function() {
    var destination, k, source, sources, v, _i, _len;

    destination = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      for (k in source) {
        v = source[k];
        destination[k] = v;
      }
    }
    return destination;
  };

  this.is_empty = function(obj) {
    var key;

    if (Array.isArray(obj) || typeof obj === 'string') {
      return obj.length === 0;
    }
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      return false;
    }
    return true;
  };

}).call(this);

},{}],21:[function(require,module,exports){
(function() {
  var fs;

  this.composer = require('./composer');

  this.constructor = require('./constructor');

  this.errors = require('./errors');

  this.events = require('./events');

  this.loader = require('./loader');

  this.nodes = require('./nodes');

  this.parser = require('./parser');

  this.reader = require('./reader');

  this.resolver = require('./resolver');

  this.scanner = require('./scanner');

  this.tokens = require('./tokens');

  /*
  Scan a YAML stream and produce scanning tokens.
  */


  this.scan = function(stream, Loader) {
    var loader, _results;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    _results = [];
    while (loader.check_token()) {
      _results.push(loader.get_token());
    }
    return _results;
  };

  /*
  Parse a YAML stream and produce parsing events.
  */


  this.parse = function(stream, Loader) {
    var loader, _results;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    _results = [];
    while (loader.check_event()) {
      _results.push(loader.get_event());
    }
    return _results;
  };

  /*
  Parse the first YAML document in a stream and produce the corresponding
  representation tree.
  */


  this.compose = function(stream, Loader) {
    var loader;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    return loader.get_single_node();
  };

  /*
  Parse all YAML documents in a stream and produce corresponding representation
  trees.
  */


  this.compose_all = function(stream, Loader) {
    var loader, _results;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    _results = [];
    while (loader.check_node()) {
      _results.push(loader.get_node());
    }
    return _results;
  };

  /*
  Parse the first YAML document in a stream and produce the corresponding
  Javascript object.
  */


  this.load = function(stream, Loader) {
    var loader;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    return loader.get_single_data();
  };

  /*
  Parse all YAML documents in a stream and produce the corresponing Javascript
  object.
  */


  this.load_all = function(stream, Loader) {
    var loader, _results;

    if (Loader == null) {
      Loader = exports.loader.Loader;
    }
    loader = new Loader(stream);
    _results = [];
    while (loader.check_data()) {
      _results.push(loader.get_data());
    }
    return _results;
  };

  /*
  Register .yml and .yaml requires with yaml-js
  */


  if ((typeof require !== "undefined" && require !== null) && require.extensions) {
    fs = require('fs');
    require.extensions['.yml'] = require.extensions['.yaml'] = function(module, filename) {
      return module.exports = exports.load_all(fs.readFileSync(filename, 'utf8'));
    };
  }

}).call(this);

},{"./composer":9,"./constructor":10,"./errors":11,"./events":12,"./loader":13,"./nodes":14,"./parser":15,"./reader":16,"./resolver":17,"./scanner":18,"./tokens":19,"fs":3}],22:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function() {
      var out, err;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],23:[function(require,module,exports){
module.exports=require(9)
},{"./errors":25,"./events":26,"./nodes":28}],24:[function(require,module,exports){
module.exports=require(10)
},{"./errors":25,"./nodes":28,"./util":34,"buffer":4}],25:[function(require,module,exports){
module.exports=require(11)
},{}],26:[function(require,module,exports){
module.exports=require(12)
},{}],27:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./composer":23,"./constructor":24,"./parser":29,"./reader":30,"./resolver":31,"./scanner":32,"./util":34}],28:[function(require,module,exports){
module.exports=require(14)
},{}],29:[function(require,module,exports){
module.exports=require(15)
},{"./errors":25,"./events":26,"./tokens":33}],30:[function(require,module,exports){
module.exports=require(16)
},{"./errors":25}],31:[function(require,module,exports){
module.exports=require(17)
},{"./errors":25,"./nodes":28,"./util":34}],32:[function(require,module,exports){
(function() {
  var MarkedYAMLError, SimpleKey, tokens, util, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  tokens = require('./tokens');

  util = require('./util');

  /*
  The Scanner throws these.
  */


  this.ScannerError = (function(_super) {
    __extends(ScannerError, _super);

    function ScannerError() {
      _ref = ScannerError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ScannerError;

  })(MarkedYAMLError);

  /*
  Represents a possible simple key.
  */


  SimpleKey = (function() {
    function SimpleKey(token_number, required, index, line, column, mark) {
      this.token_number = token_number;
      this.required = required;
      this.index = index;
      this.line = line;
      this.column = column;
      this.mark = mark;
    }

    return SimpleKey;

  })();

  /*
  The Scanner class deals with converting a YAML stream into a token stream.
  */


  this.Scanner = (function() {
    var C_LB, C_NUMBERS, C_WS, ESCAPE_CODES, ESCAPE_REPLACEMENTS;

    C_LB = '\r\n\x85\u2028\u2029';

    C_WS = '\t ';

    C_NUMBERS = '0123456789';

    ESCAPE_REPLACEMENTS = {
      '0': '\x00',
      'a': '\x07',
      'b': '\x08',
      't': '\x09',
      '\t': '\x09',
      'n': '\x0A',
      'v': '\x0B',
      'f': '\x0C',
      'r': '\x0D',
      'e': '\x1B',
      ' ': '\x20',
      '"': '"',
      '\\': '\\',
      'N': '\x85',
      '_': '\xA0',
      'L': '\u2028',
      'P': '\u2029'
    };

    ESCAPE_CODES = {
      'x': 2,
      'u': 4,
      'U': 8
    };

    /*
    Initialise the Scanner
    */


    function Scanner() {
      this.done = false;
      this.flow_level = 0;
      this.tokens = [];
      this.fetch_stream_start();
      this.tokens_taken = 0;
      this.indent = -1;
      this.indents = [];
      this.allow_simple_key = true;
      this.possible_simple_keys = {};
    }

    /*
    Check if the next token is one of the given types.
    */


    Scanner.prototype.check_token = function() {
      var choice, choices, _i, _len;

      choices = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        if (choices.length === 0) {
          return true;
        }
        for (_i = 0, _len = choices.length; _i < _len; _i++) {
          choice = choices[_i];
          if (this.tokens[0] instanceof choice) {
            return true;
          }
        }
      }
      return false;
    };

    /*
    Return the next token, but do not delete it from the queue.
    */


    Scanner.prototype.peek_token = function() {
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        return this.tokens[0];
      }
    };

    /*
    Return the next token, and remove it from the queue.
    */


    Scanner.prototype.get_token = function() {
      while (this.need_more_tokens()) {
        this.fetch_more_tokens();
      }
      if (this.tokens.length !== 0) {
        this.tokens_taken++;
        return this.tokens.shift();
      }
    };

    Scanner.prototype.need_more_tokens = function() {
      if (this.done) {
        return false;
      }
      if (this.tokens.length === 0) {
        return true;
      }
      this.stale_possible_simple_keys();
      if (this.next_possible_simple_key() === this.tokens_taken) {
        return true;
      }
      return false;
    };

    Scanner.prototype.fetch_more_tokens = function() {
      var char;

      this.scan_to_next_token();
      this.stale_possible_simple_keys();
      this.unwind_indent(this.column);
      char = this.peek();
      if (char === '\x00') {
        return this.fetch_stream_end();
      }
      if (char === '%' && this.check_directive()) {
        return this.fetch_directive();
      }
      if (char === '-' && this.check_document_start()) {
        return this.fetch_document_start();
      }
      if (char === '.' && this.check_document_end()) {
        return this.fetch_document_end();
      }
      if (char === '[') {
        return this.fetch_flow_sequence_start();
      }
      if (char === '{') {
        return this.fetch_flow_mapping_start();
      }
      if (char === ']') {
        return this.fetch_flow_sequence_end();
      }
      if (char === '}') {
        return this.fetch_flow_mapping_end();
      }
      if (char === ',') {
        return this.fetch_flow_entry();
      }
      if (char === '-' && this.check_block_entry()) {
        return this.fetch_block_entry();
      }
      if (char === '?' && this.check_key()) {
        return this.fetch_key();
      }
      if (char === ':' && this.check_value()) {
        return this.fetch_value();
      }
      if (char === '*') {
        return this.fetch_alias();
      }
      if (char === '&') {
        return this.fetch_anchor();
      }
      if (char === '!') {
        return this.fetch_tag();
      }
      if (char === '|' && this.flow_level === 0) {
        return this.fetch_literal();
      }
      if (char === '>' && this.flow_level === 0) {
        return this.fetch_folded();
      }
      if (char === '\'') {
        return this.fetch_single();
      }
      if (char === '"') {
        return this.fetch_double();
      }
      if (this.check_plain()) {
        return this.fetch_plain();
      }
      throw new exports.ScannerError('while scanning for the next token', null, "found character " + char + " that cannot start any token", this.get_mark());
    };

    /*
    Return the number of the nearest possible simple key.
    */


    Scanner.prototype.next_possible_simple_key = function() {
      var key, level, min_token_number, _ref1;

      min_token_number = null;
      _ref1 = this.possible_simple_keys;
      for (level in _ref1) {
        if (!__hasProp.call(_ref1, level)) continue;
        key = _ref1[level];
        if (min_token_number === null || key.token_number < min_token_number) {
          min_token_number = key.token_number;
        }
      }
      return min_token_number;
    };

    /*
    Remove entries that are no longer possible simple keys.  According to the
    YAML spec, simple keys:
      should be limited to a single line
      should be no longer than 1024 characters
    Disabling this procedure will allow simple keys of any length and height
    (may cause problems if indentation is broken though).
    */


    Scanner.prototype.stale_possible_simple_keys = function() {
      var key, level, _ref1, _results;

      _ref1 = this.possible_simple_keys;
      _results = [];
      for (level in _ref1) {
        if (!__hasProp.call(_ref1, level)) continue;
        key = _ref1[level];
        if (key.line === this.line && this.index - key.index <= 1024) {
          continue;
        }
        if (!key.required) {
          _results.push(delete this.possible_simple_keys[level]);
        } else {
          throw new exports.ScannerError('while scanning a simple key', key.mark, 'could not find expected \':\'', this.get_mark());
        }
      }
      return _results;
    };

    /*
    The next token may start a simple key.  We check if it's possible and save
    its position.  This function is called for ALIAS, ANCHOR, TAG,
    SCALAR (flow),'[' and '{'.
    */


    Scanner.prototype.save_possible_simple_key = function() {
      var required, token_number;

      required = this.flow_level === 0 && this.indent === this.column;
      if (required && !this.allow_simple_key) {
        throw new Error('logic failure');
      }
      if (!this.allow_simple_key) {
        return;
      }
      this.remove_possible_simple_key();
      token_number = this.tokens_taken + this.tokens.length;
      return this.possible_simple_keys[this.flow_level] = new SimpleKey(token_number, required, this.index, this.line, this.column, this.get_mark());
    };

    /*
    Remove the saved possible simple key at the current flow level.
    */


    Scanner.prototype.remove_possible_simple_key = function() {
      var key;

      if (!(key = this.possible_simple_keys[this.flow_level])) {
        return;
      }
      if (!key.required) {
        return delete this.possible_simple_keys[this.flow_level];
      } else {
        throw new exports.ScannerError('while scanning a simple key', key.mark, 'could not find expected \':\'', this.get_mark());
      }
    };

    /*
    In flow context, tokens should respect indentation.
    Actually the condition should be `self.indent >= column` according to
    the spec. But this condition will prohibit intuitively correct
    constructions such as
      key : {
      }
    */


    Scanner.prototype.unwind_indent = function(column) {
      var mark, _results;

      if (this.flow_level !== 0) {
        return;
      }
      _results = [];
      while (this.indent > column) {
        mark = this.get_mark();
        this.indent = this.indents.pop();
        _results.push(this.tokens.push(new tokens.BlockEndToken(mark, mark)));
      }
      return _results;
    };

    /*
    Check if we need to increase indentation.
    */


    Scanner.prototype.add_indent = function(column) {
      if (!(column > this.indent)) {
        return false;
      }
      this.indents.push(this.indent);
      this.indent = column;
      return true;
    };

    Scanner.prototype.fetch_stream_start = function() {
      var mark;

      mark = this.get_mark();
      return this.tokens.push(new tokens.StreamStartToken(mark, mark, this.encoding));
    };

    Scanner.prototype.fetch_stream_end = function() {
      var mark;

      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_possible_simple_key = false;
      this.possible_simple_keys = {};
      mark = this.get_mark();
      this.tokens.push(new tokens.StreamEndToken(mark, mark));
      return this.done = true;
    };

    Scanner.prototype.fetch_directive = function() {
      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_directive());
    };

    Scanner.prototype.fetch_document_start = function() {
      return this.fetch_document_indicator(tokens.DocumentStartToken);
    };

    Scanner.prototype.fetch_document_end = function() {
      return this.fetch_document_indicator(tokens.DocumentEndToken);
    };

    Scanner.prototype.fetch_document_indicator = function(TokenClass) {
      var start_mark;

      this.unwind_indent(-1);
      this.remove_possible_simple_key();
      this.allow_simple_key = false;
      start_mark = this.get_mark();
      this.forward(3);
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_sequence_start = function() {
      return this.fetch_flow_collection_start(tokens.FlowSequenceStartToken);
    };

    Scanner.prototype.fetch_flow_mapping_start = function() {
      return this.fetch_flow_collection_start(tokens.FlowMappingStartToken);
    };

    Scanner.prototype.fetch_flow_collection_start = function(TokenClass) {
      var start_mark;

      this.save_possible_simple_key();
      this.flow_level++;
      this.allow_simple_key = true;
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_sequence_end = function() {
      return this.fetch_flow_collection_end(tokens.FlowSequenceEndToken);
    };

    Scanner.prototype.fetch_flow_mapping_end = function() {
      return this.fetch_flow_collection_end(tokens.FlowMappingEndToken);
    };

    Scanner.prototype.fetch_flow_collection_end = function(TokenClass) {
      var start_mark;

      this.remove_possible_simple_key();
      this.flow_level--;
      this.allow_simple_key = false;
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new TokenClass(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_flow_entry = function() {
      var start_mark;

      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.FlowEntryToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_block_entry = function() {
      var mark, start_mark;

      if (this.flow_level === 0) {
        if (!this.allow_simple_key) {
          throw new exports.ScannerError(null, null, 'sequence entries are not allowed here', this.get_mark());
        }
        if (this.add_indent(this.column)) {
          mark = this.get_mark();
          this.tokens.push(new tokens.BlockSequenceStartToken(mark, mark));
        }
      }
      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.BlockEntryToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_key = function() {
      var mark, start_mark;

      if (this.flow_level === 0) {
        if (!this.allow_simple_key) {
          throw new exports.ScannerError(null, null, 'mapping keys are not allowed here', this.get_mark());
        }
        if (this.add_indent(this.column)) {
          mark = this.get_mark();
          this.tokens.push(new tokens.BlockMappingStartToken(mark, mark));
        }
      }
      this.allow_simple_key = !this.flow_level;
      this.remove_possible_simple_key();
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.KeyToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_value = function() {
      var key, mark, start_mark;

      if (key = this.possible_simple_keys[this.flow_level]) {
        delete this.possible_simple_keys[this.flow_level];
        this.tokens.splice(key.token_number - this.tokens_taken, 0, new tokens.KeyToken(key.mark, key.mark));
        if (this.flow_level === 0) {
          if (this.add_indent(key.column)) {
            this.tokens.splice(key.token_number - this.tokens_taken, 0, new tokens.BlockMappingStartToken(key.mark, key.mark));
          }
        }
        this.allow_simple_key = false;
      } else {
        if (this.flow_level === 0) {
          if (!this.allow_simple_key) {
            throw new exports.ScannerError(null, null, 'mapping values are not allowed here', this.get_mark());
          }
          if (this.add_indent(this.column)) {
            mark = this.get_mark();
            this.tokens.push(new tokens.BlockMappingStartToken(mark, mark));
          }
        }
        this.allow_simple_key = !this.flow_level;
        this.remove_possible_simple_key();
      }
      start_mark = this.get_mark();
      this.forward();
      return this.tokens.push(new tokens.ValueToken(start_mark, this.get_mark()));
    };

    Scanner.prototype.fetch_alias = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_anchor(tokens.AliasToken));
    };

    Scanner.prototype.fetch_anchor = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_anchor(tokens.AnchorToken));
    };

    Scanner.prototype.fetch_tag = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_tag());
    };

    Scanner.prototype.fetch_literal = function() {
      return this.fetch_block_scalar('|');
    };

    Scanner.prototype.fetch_folded = function() {
      return this.fetch_block_scalar('>');
    };

    Scanner.prototype.fetch_block_scalar = function(style) {
      this.allow_simple_key = true;
      this.remove_possible_simple_key();
      return this.tokens.push(this.scan_block_scalar(style));
    };

    Scanner.prototype.fetch_single = function() {
      return this.fetch_flow_scalar('\'');
    };

    Scanner.prototype.fetch_double = function() {
      return this.fetch_flow_scalar('"');
    };

    Scanner.prototype.fetch_flow_scalar = function(style) {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_flow_scalar(style));
    };

    Scanner.prototype.fetch_plain = function() {
      this.save_possible_simple_key();
      this.allow_simple_key = false;
      return this.tokens.push(this.scan_plain());
    };

    /*
    DIRECTIVE: ^ '%'
    */


    Scanner.prototype.check_directive = function() {
      if (this.column === 0) {
        return true;
      }
      return false;
    };

    /*
    DOCUMENT-START: ^ '---' (' '|'\n')
    */


    Scanner.prototype.check_document_start = function() {
      var _ref1;

      if (this.column === 0 && this.prefix(3) === '---' && (_ref1 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) {
        return true;
      }
      return false;
    };

    /*
    DOCUMENT-END: ^ '...' (' '|'\n')
    */


    Scanner.prototype.check_document_end = function() {
      var _ref1;

      if (this.column === 0 && this.prefix(3) === '...' && (_ref1 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) {
        return true;
      }
      return false;
    };

    /*
    BLOCK-ENTRY: '-' (' '|'\n')
    */


    Scanner.prototype.check_block_entry = function() {
      var _ref1;

      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    KEY (flow context):  '?'
    KEY (block context): '?' (' '|'\n')
    */


    Scanner.prototype.check_key = function() {
      var _ref1;

      if (this.flow_level !== 0) {
        return true;
      }
      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    VALUE (flow context):  ':'
    VALUE (block context): ':' (' '|'\n')
    */


    Scanner.prototype.check_value = function() {
      var _ref1;

      if (this.flow_level !== 0) {
        return true;
      }
      return _ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0;
    };

    /*
    A plain scalar may start with any non-space character except:
      '-', '?', ':', ',', '[', ']', '{', '}',
      '#', '&', '*', '!', '|', '>', '\'', '"',
      '%', '@', '`'.
    
    It may also start with
      '-', '?', ':'
    if it is followed by a non-space character.
    
    Note that we limit the last rule to the block context (except the '-'
    character) because we want the flow context to be space independent.
    */


    Scanner.prototype.check_plain = function() {
      var char, _ref1;

      char = this.peek();
      return __indexOf.call(C_LB + C_WS + '\x00-?:,[]{}#&*!|>\'"%@`', char) < 0 || ((_ref1 = this.peek(1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) < 0) && (char === '-' || (this.flow_level === 0 && __indexOf.call('?:', char) >= 0)));
    };

    /*
    We ignore spaces, line breaks and comments.
    If we find a line break in the block context, we set the flag
    `allow_simple_key` on.
    The byte order mark is stripped if it's the first character in the stream.
    We do not yet support BOM inside the stream as the specification requires.
    Any such mark will be considered as a part of the document.
    
    TODO: We need to make tab handling rules more sane.  A good rule is
      Tabs cannot precede tokens BLOCK-SEQUENCE-START, BLOCK-MAPPING-START,
      BLOCK-END, KEY (block context), VALUE (block context), BLOCK-ENTRY
    So the tab checking code is
      @allow_simple_key = off if <TAB>
    We also need to add the check for `allow_simple_key is on` to
    `unwind_indent` before issuing BLOCK-END.  Scanners for block, flow and
    plain scalars need to be modified.
    */


    Scanner.prototype.scan_to_next_token = function() {
      var found, _ref1, _results;

      if (this.index === 0 && this.peek() === '\uFEFF') {
        this.forward();
      }
      found = false;
      _results = [];
      while (!found) {
        while (this.peek() === ' ') {
          this.forward();
        }
        if (this.peek() === '#') {
          while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
            this.forward();
          }
        }
        if (this.scan_line_break()) {
          if (this.flow_level === 0) {
            _results.push(this.allow_simple_key = true);
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(found = true);
        }
      }
      return _results;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive = function() {
      var end_mark, name, start_mark, value, _ref1;

      start_mark = this.get_mark();
      this.forward();
      name = this.scan_directive_name(start_mark);
      value = null;
      if (name === 'YAML') {
        value = this.scan_yaml_directive_value(start_mark);
        end_mark = this.get_mark();
      } else if (name === 'TAG') {
        value = this.scan_tag_directive_value(start_mark);
        end_mark = this.get_mark();
      } else {
        end_mark = this.get_mark();
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      this.scan_directive_ignored_line(start_mark);
      return new tokens.DirectiveToken(name, value, start_mark, end_mark);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive_name = function(start_mark) {
      var char, length, value;

      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
        length++;
        char = peek(length);
      }
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected alphanumeric or numeric character but found " + char, length === 0 ? this.get_mark() : void 0);
      value = this.prefix(length);
      this.forward(length);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected alphanumeric or numeric character but found " + char, __indexOf.call(C_LB + '\x00 ', char) < 0 ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_yaml_directive_value = function(start_mark) {
      var major, minor, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      major = this.scan_yaml_directive_number(start_mark);
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit or '.' but found " + (this.peek()), this.peek() !== '.' ? this.get_mark() : void 0);
      this.forward();
      minor = this.scan_yaml_directive_number(start_mark);
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit or ' ' but found " + (this.peek()), (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00 ', _ref1) < 0) ? this.get_mark() : void 0);
      return [major, minor];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_yaml_directive_number = function(start_mark) {
      var char, length, value, _ref1;

      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a digit but found " + char, !(('0' <= char && char <= '9')) ? this.get_mark() : void 0);
      length = 0;
      while (('0' <= (_ref1 = this.peek(length)) && _ref1 <= '9')) {
        length++;
      }
      value = parseInt(this.prefix(length));
      this.forward(length);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_value = function(start_mark) {
      var handle, prefix;

      while (this.peek() === ' ') {
        this.forward();
      }
      handle = this.scan_tag_directive_handle(start_mark);
      while (this.peek() === ' ') {
        this.forward();
      }
      prefix = this.scan_tag_directive_prefix(start_mark);
      return [handle, prefix];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_handle = function(start_mark) {
      var char, value;

      value = this.scan_tag_handle('directive', start_mark);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected ' ' but found " + char, char !== ' ' ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag_directive_prefix = function(start_mark) {
      var char, value;

      value = this.scan_tag_uri('directive', start_mark);
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected ' ' but found " + char, __indexOf.call(C_LB + '\x00 ', char) < 0 ? this.get_mark() : void 0);
      return value;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_directive_ignored_line = function(start_mark) {
      var char, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      if (this.peek() === '#') {
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      char = this.peek();
      throw new exports.ScannerError('while scanning a directive', start_mark, "expected a comment or a line break but found " + char, __indexOf.call(C_LB + '\x00', char) < 0 ? this.get_mark() : void 0);
      return this.scan_line_break();
    };

    /*
    The specification does not restrict characters for anchors and aliases.
    This may lead to problems, for instance, the document:
      [ *alias, value ]
    can be interpteted in two ways, as
      [ "value" ]
    and
      [ *alias , "value" ]
    Therefore we restrict aliases to numbers and ASCII letters.
    */


    Scanner.prototype.scan_anchor = function(TokenClass) {
      var char, indicator, length, name, start_mark, value;

      start_mark = this.get_mark();
      indicator = this.peek();
      if (indicator === '*') {
        name = 'alias';
      } else {
        name = 'anchor';
      }
      this.forward();
      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
        length++;
        char = this.peek(length);
      }
      if (length === 0) {
        throw new exports.ScannerError("while scanning an " + name, start_mark, "expected alphabetic or numeric character but found '" + char + "'", this.get_mark());
      }
      value = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (__indexOf.call(C_LB + C_WS + '\x00' + '?:,]}%@`', char) < 0) {
        throw new exports.ScannerError("while scanning an " + name, start_mark, "expected alphabetic or numeric character but found '" + char + "'", this.get_mark());
      }
      return new TokenClass(value, start_mark, this.get_mark());
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_tag = function() {
      var char, handle, length, start_mark, suffix, use_handle;

      start_mark = this.get_mark();
      char = this.peek(1);
      if (char === '<') {
        handle = null;
        this.forward(2);
        suffix = this.scan_tag_uri('tag', start_mark);
        if (this.peek() !== '>') {
          throw new exports.ScannerError('while parsing a tag', start_mark, "expected '>' but found " + (this.peek()), this.get_mark());
        }
        this.forward();
      } else if (__indexOf.call(C_LB + C_WS + '\x00', char) >= 0) {
        handle = null;
        suffix = '!';
        this.forward();
      } else {
        length = 1;
        use_handle = false;
        while (__indexOf.call(C_LB + '\x00 ', char) < 0) {
          if (char === '!') {
            use_handle = true;
            break;
          }
          length++;
          char = this.peek(length);
        }
        if (use_handle) {
          handle = this.scan_tag_handle('tag', start_mark);
        } else {
          handle = '!';
          this.forward();
        }
        suffix = this.scan_tag_uri('tag', start_mark);
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00 ', char) < 0) {
        throw new exports.ScannerError('while scanning a tag', start_mark, "expected ' ' but found " + char, this.get_mark());
      }
      return new tokens.TagToken([handle, suffix], start_mark, this.get_mark());
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar = function(style) {
      var breaks, chomping, chunks, end_mark, folded, increment, indent, leading_non_space, length, line_break, max_indent, min_indent, start_mark, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;

      folded = style === '>';
      chunks = [];
      start_mark = this.get_mark();
      this.forward();
      _ref1 = this.scan_block_scalar_indicators(start_mark), chomping = _ref1[0], increment = _ref1[1];
      this.scan_block_scalar_ignored_line(start_mark);
      min_indent = this.indent + 1;
      if (min_indent < 1) {
        min_indent = 1;
      }
      if (increment == null) {
        _ref2 = this.scan_block_scalar_indentation(), breaks = _ref2[0], max_indent = _ref2[1], end_mark = _ref2[2];
        indent = Math.max(min_indent, max_indent);
      } else {
        indent = min_indent + increment - 1;
        _ref3 = this.scan_block_scalar_breaks(indent), breaks = _ref3[0], end_mark = _ref3[1];
      }
      line_break = '';
      while (this.column === indent && this.peek() !== '\x00') {
        chunks = chunks.concat(breaks);
        leading_non_space = (_ref4 = this.peek(), __indexOf.call(' \t', _ref4) < 0);
        length = 0;
        while (_ref5 = this.peek(length), __indexOf.call(C_LB + '\x00', _ref5) < 0) {
          length++;
        }
        chunks.push(this.prefix(length));
        this.forward(length);
        line_break = this.scan_line_break();
        _ref6 = this.scan_block_scalar_breaks(indent), breaks = _ref6[0], end_mark = _ref6[1];
        if (this.column === indent && this.peek() !== '\x00') {
          if (folded && line_break === '\n' && leading_non_space && (_ref7 = this.peek(), __indexOf.call(' \t', _ref7) < 0)) {
            if (util.is_empty(breaks)) {
              chunks.push(' ');
            }
          } else {
            chunks.push(line_break);
          }
        } else {
          break;
        }
      }
      if (chomping !== false) {
        chunks.push(line_break);
      }
      if (chomping === true) {
        chunks = chunks.concat(breaks);
      }
      return new tokens.ScalarToken(chunks.join(''), false, start_mark, end_mark, style);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_indicators = function(start_mark) {
      var char, chomping, increment;

      chomping = null;
      increment = null;
      char = this.peek();
      if (__indexOf.call('+-', char) >= 0) {
        chomping = char === '+';
        this.forward();
        char = this.peek();
        if (__indexOf.call(C_NUMBERS, char) >= 0) {
          increment = parseInt(char);
          if (increment === 0) {
            throw new exports.ScannerError('while scanning a block scalar', start_mark, 'expected indentation indicator in the range 1-9 but found 0', this.get_mark());
          }
          this.forward();
        }
      } else if (__indexOf.call(C_NUMBERS, char) >= 0) {
        increment = parseInt(char);
        if (increment === 0) {
          throw new exports.ScannerError('while scanning a block scalar', start_mark, 'expected indentation indicator in the range 1-9 but found 0', this.get_mark());
        }
        this.forward();
        char = this.peek();
        if (__indexOf.call('+-', char) >= 0) {
          chomping = char === '+';
          this.forward();
        }
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00 ', char) < 0) {
        throw new exports.ScannerError('while scanning a block scalar', start_mark, "expected chomping or indentation indicators, but found " + char, this.get_mark());
      }
      return [chomping, increment];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_ignored_line = function(start_mark) {
      var char, _ref1;

      while (this.peek() === ' ') {
        this.forward();
      }
      if (this.peek() === '#') {
        while (_ref1 = this.peek(), __indexOf.call(C_LB + '\x00', _ref1) < 0) {
          this.forward();
        }
      }
      char = this.peek();
      if (__indexOf.call(C_LB + '\x00', char) < 0) {
        throw new exports.ScannerError('while scanning a block scalar', start_mark, "expected a comment or a line break but found " + char, this.get_mark());
      }
      return this.scan_line_break();
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_indentation = function() {
      var chunks, end_mark, max_indent, _ref1;

      chunks = [];
      max_indent = 0;
      end_mark = this.get_mark();
      while (_ref1 = this.peek(), __indexOf.call(C_LB + ' ', _ref1) >= 0) {
        if (this.peek() !== ' ') {
          chunks.push(this.scan_line_break());
          end_mark = this.get_mark();
        } else {
          this.forward();
          if (this.column > max_indent) {
            max_indent = this.column;
          }
        }
      }
      return [chunks, max_indent, end_mark];
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_block_scalar_breaks = function(indent) {
      var chunks, end_mark, _ref1;

      chunks = [];
      end_mark = this.get_mark();
      while (this.column < indent && this.peek() === ' ') {
        this.forward();
      }
      while (_ref1 = this.peek(), __indexOf.call(C_LB, _ref1) >= 0) {
        chunks.push(this.scan_line_break());
        end_mark = this.get_mark();
        while (this.column < indent && this.peek() === ' ') {
          this.forward();
        }
      }
      return [chunks, end_mark];
    };

    /*
    See the specification for details.
    Note that we loose indentation rules for quoted scalars. Quoted scalars
    don't need to adhere indentation because " and ' clearly mark the beginning
    and the end of them. Therefore we are less restrictive than the
    specification requires. We only need to check that document separators are
    not included in scalars.
    */


    Scanner.prototype.scan_flow_scalar = function(style) {
      var chunks, double, quote, start_mark;

      double = style === '"';
      chunks = [];
      start_mark = this.get_mark();
      quote = this.peek();
      this.forward();
      chunks = chunks.concat(this.scan_flow_scalar_non_spaces(double, start_mark));
      while (this.peek() !== quote) {
        chunks = chunks.concat(this.scan_flow_scalar_spaces(double, start_mark));
        chunks = chunks.concat(this.scan_flow_scalar_non_spaces(double, start_mark));
      }
      this.forward();
      return new tokens.ScalarToken(chunks.join(''), false, start_mark, this.get_mark(), style);
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_non_spaces = function(double, start_mark) {
      var char, chunks, code, k, length, _i, _ref1, _ref2;

      chunks = [];
      while (true) {
        length = 0;
        while (_ref1 = this.peek(length), __indexOf.call(C_LB + C_WS + '\'"\\\x00', _ref1) < 0) {
          length++;
        }
        if (length !== 0) {
          chunks.push(this.prefix(length));
          this.forward(length);
        }
        char = this.peek();
        if (!double && char === '\'' && this.peek(1) === '\'') {
          chunks.push('\'');
          this.forward(2);
        } else if ((double && char === '\'') || (!double && __indexOf.call('"\\', char) >= 0)) {
          chunks.push(char);
          this.forward();
        } else if (double && char === '\\') {
          this.forward();
          char = this.peek();
          if (char in ESCAPE_REPLACEMENTS) {
            chunks.push(ESCAPE_REPLACEMENTS[char]);
            this.forward();
          } else if (char in ESCAPE_CODES) {
            length = ESCAPE_CODES[char];
            this.forward();
            for (k = _i = 0; 0 <= length ? _i < length : _i > length; k = 0 <= length ? ++_i : --_i) {
              if (_ref2 = this.peek(k), __indexOf.call(C_NUMBERS + 'ABCDEFabcdef', _ref2) < 0) {
                throw new exports.ScannerError('while scanning a double-quoted scalar', start_mark, "expected escape sequence of " + length + " hexadecimal numbers, but " + "found " + (this.peek(k)), this.get_mark());
              }
            }
            code = parseInt(this.prefix(length), 16);
            chunks.push(String.fromCharCode(code));
            this.forward(length);
          } else if (__indexOf.call(C_LB, char) >= 0) {
            this.scan_line_break();
            chunks = chunks.concat(this.scan_flow_scalar_breaks(double, start_mark));
          } else {
            throw new exports.ScannerError('while scanning a double-quoted scalar', start_mark, "found unknown escape character " + char, this.get_mark());
          }
        } else {
          return chunks;
        }
      }
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_spaces = function(double, start_mark) {
      var breaks, char, chunks, length, line_break, whitespaces, _ref1;

      chunks = [];
      length = 0;
      while (_ref1 = this.peek(length), __indexOf.call(C_WS, _ref1) >= 0) {
        length++;
      }
      whitespaces = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (char === '\x00') {
        throw new exports.ScannerError('while scanning a quoted scalar', start_mark, 'found unexpected end of stream', this.get_mark());
      }
      if (__indexOf.call(C_LB, char) >= 0) {
        line_break = this.scan_line_break();
        breaks = this.scan_flow_scalar_breaks(double, start_mark);
        if (line_break !== '\n') {
          chunks.push(line_break);
        } else if (!breaks) {
          chunks.push(' ');
        }
        chunks = chunks.concat(breaks);
      } else {
        chunks.push(whitespaces);
      }
      return chunks;
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_flow_scalar_breaks = function(double, start_mark) {
      var chunks, prefix, _ref1, _ref2, _ref3;

      chunks = [];
      while (true) {
        prefix = this.prefix(3);
        if (prefix === '---' || prefix === '...' && (_ref1 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) {
          throw new exports.ScannerError('while scanning a quoted scalar', start_mark, 'found unexpected document separator', this.get_mark());
        }
        while (_ref2 = this.peek(), __indexOf.call(C_WS, _ref2) >= 0) {
          this.forward();
        }
        if (_ref3 = this.peek(), __indexOf.call(C_LB, _ref3) >= 0) {
          chunks.push(this.scan_line_break());
        } else {
          return chunks;
        }
      }
    };

    /*
    See the specification for details.
    We add an additional restriction for the flow context:
      plain scalars in the flow context cannot contain ',', ':' and '?'.
    We also keep track of the `allow_simple_key` flag here.
    Indentation rules are loosed for the flow context.
    */


    Scanner.prototype.scan_plain = function() {
      var char, chunks, end_mark, indent, length, spaces, start_mark, _ref1, _ref2;

      chunks = [];
      start_mark = end_mark = this.get_mark();
      indent = this.indent + 1;
      spaces = [];
      while (true) {
        length = 0;
        if (this.peek() === '#') {
          break;
        }
        while (true) {
          char = this.peek(length);
          if (__indexOf.call(C_LB + C_WS + '\x00', char) >= 0 || (this.flow_level === 0 && char === ':' && (_ref1 = this.peek(length + 1), __indexOf.call(C_LB + C_WS + '\x00', _ref1) >= 0)) || (this.flow_level !== 0 && __indexOf.call(',:?[]{}', char) >= 0)) {
            break;
          }
          length++;
        }
        if (this.flow_level !== 0 && char === ':' && (_ref2 = this.peek(length + 1), __indexOf.call(C_LB + C_WS + '\x00,[]{}', _ref2) < 0)) {
          this.forward(length);
          throw new exports.ScannerError('while scanning a plain scalar', start_mark, 'found unexpected \':\'', this.get_mark(), 'Please check http://pyyaml.org/wiki/YAMLColonInFlowContext');
        }
        if (length === 0) {
          break;
        }
        this.allow_simple_key = false;
        chunks = chunks.concat(spaces);
        chunks.push(this.prefix(length));
        this.forward(length);
        end_mark = this.get_mark();
        spaces = this.scan_plain_spaces(indent, start_mark);
        if ((spaces == null) || spaces.length === 0 || this.peek() === '#' || (this.flow_level === 0 && this.column < indent)) {
          break;
        }
      }
      return new tokens.ScalarToken(chunks.join(''), true, start_mark, end_mark);
    };

    /*
    See the specification for details.
    The specification is really confusing about tabs in plain scalars.
    We just forbid them completely. Do not use tabs in YAML!
    */


    Scanner.prototype.scan_plain_spaces = function(indent, start_mark) {
      var breaks, char, chunks, length, line_break, prefix, whitespaces, _ref1, _ref2, _ref3, _ref4;

      chunks = [];
      length = 0;
      while (_ref1 = this.peek(length), __indexOf.call(' ', _ref1) >= 0) {
        length++;
      }
      whitespaces = this.prefix(length);
      this.forward(length);
      char = this.peek();
      if (__indexOf.call(C_LB, char) >= 0) {
        line_break = this.scan_line_break();
        this.allow_simple_key = true;
        prefix = this.prefix(3);
        if (prefix === '---' || prefix === '...' && (_ref2 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref2) >= 0)) {
          return;
        }
        breaks = [];
        while (_ref4 = this.peek(), __indexOf.call(C_LB + ' ', _ref4) >= 0) {
          if (this.peek() === ' ') {
            this.forward();
          } else {
            breaks.push(this.scan_line_break());
            prefix = this.prefix(3);
            if (prefix === '---' || prefix === '...' && (_ref3 = this.peek(3), __indexOf.call(C_LB + C_WS + '\x00', _ref3) >= 0)) {
              return;
            }
          }
        }
        if (line_break !== '\n') {
          chunks.push(line_break);
        } else if (breaks.length === 0) {
          chunks.push(' ');
        }
        chunks = chunks.concat(breaks);
      } else if (whitespaces) {
        chunks.push(whitespaces);
      }
      return chunks;
    };

    /*
    See the specification for details.
    For some strange reasons, the specification does not allow '_' in tag
    handles. I have allowed it anyway.
    */


    Scanner.prototype.scan_tag_handle = function(name, start_mark) {
      var char, length, value;

      char = this.peek();
      if (char !== '!') {
        throw new exports.ScannerError("while scanning a " + name, start_mark, "expected '!' but found " + char, this.get_mark());
      }
      length = 1;
      char = this.peek(length);
      if (char !== ' ') {
        while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-_', char) >= 0) {
          length++;
          char = this.peek(length);
        }
        if (char !== '!') {
          this.forward(length);
          throw new exports.ScannerError("while scanning a " + name, start_mark, "expected '!' but found " + char, this.get_mark());
        }
        length++;
      }
      value = this.prefix(length);
      this.forward(length);
      return value;
    };

    /*
    See the specification for details.
    Note: we do not check if URI is well-formed.
    */


    Scanner.prototype.scan_tag_uri = function(name, start_mark) {
      var char, chunks, length;

      chunks = [];
      length = 0;
      char = this.peek(length);
      while (('0' <= char && char <= '9') || ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || __indexOf.call('-;/?:@&=+$,_.!~*\'()[]%', char) >= 0) {
        if (char === '%') {
          chunks.push(this.prefix(length));
          this.forward(length);
          length = 0;
          chunks.push(this.scan_uri_escapes(name, start_mark));
        } else {
          length++;
        }
        char = this.peek(length);
      }
      if (length !== 0) {
        chunks.push(this.prefix(length));
        this.forward(length);
        length = 0;
      }
      if (chunks.length === 0) {
        throw new exports.ScannerError("while parsing a " + name, start_mark, "expected URI but found " + char, this.get_mark());
      }
      return chunks.join('');
    };

    /*
    See the specification for details.
    */


    Scanner.prototype.scan_uri_escapes = function(name, start_mark) {
      var bytes, k, mark, _i;

      bytes = [];
      mark = this.get_mark();
      while (this.peek() === '%') {
        this.forward();
        for (k = _i = 0; _i <= 2; k = ++_i) {
          throw new exports.ScannerError("while scanning a " + name, start_mark, "expected URI escape sequence of 2 hexadecimal numbers but found          " + (this.peek(k)), this.get_mark());
        }
        bytes.push(String.fromCharCode(parseInt(this.prefix(2), 16)));
        this.forward(2);
      }
      return bytes.join('');
    };

    /*
    Transforms:
      '\r\n'      :   '\n'
      '\r'        :   '\n'
      '\n'        :   '\n'
      '\x85'      :   '\n'
      '\u2028'    :   '\u2028'
      '\u2029     :   '\u2029'
      default     :   ''
    */


    Scanner.prototype.scan_line_break = function() {
      var char;

      char = this.peek();
      if (__indexOf.call('\r\n\x85', char) >= 0) {
        if (this.prefix(2) === '\r\n') {
          this.forward(2);
        } else {
          this.forward();
        }
        return '\n';
      } else if (__indexOf.call('\u2028\u2029', char) >= 0) {
        this.forward();
        return char;
      }
      return '';
    };

    return Scanner;

  })();

}).call(this);

},{"./errors":25,"./tokens":33,"./util":34}],33:[function(require,module,exports){
module.exports=require(19)
},{}],34:[function(require,module,exports){
module.exports=require(20)
},{}],35:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./composer":23,"./constructor":24,"./errors":25,"./events":26,"./loader":27,"./nodes":28,"./parser":29,"./reader":30,"./resolver":31,"./scanner":32,"./tokens":33,"fs":3}],36:[function(require,module,exports){
RemoteStorage.defineModule('coisas', function(privateClient) {
  var module;
  privateClient.declareType('metadata', {
    type: 'object',
    properties: {
      kind: {
        type: 'string'
      },
      title: {
        type: 'string'
      },
      created: {
        type: 'integer'
      },
      edited: {
        type: 'integer'
      },
      sortBy: {
        type: 'string'
      },
      reverse: {
        type: 'integer'
      }
    },
    required: ['kind', 'created']
  });
  module = {
    exports: {
      listChildrenNames: function(path, cb) {
        return privateClient.getAll(path).then(function(nodes) {
          var children, item, nodedata, reverse, sortBy;
          children = [];
          if (nodes.meta) {
            sortBy = children.meta.sortBy || 'created';
            reverse = children.meta.reverse || 1;
          }
          for (item in nodes) {
            nodedata = nodes[item];
            if (item.slice(-1)[0] === '/') {
              children.push({
                title: item.meta ? item.meta.title || path : path,
                path: item
              });
            }
          }
          children.sort(function(a, b) {
            return (-reverse) * (b[sortBy] - a[sortBy]);
          });
          if (cb) {
            return cb(children);
          }
        });
      },
      putNode: function(path, meta, text, data, cb) {
        var d, m, mime, t;
        if (typeof data === 'function') {
          cb = data;
          data = null;
        }
        mime = {
          'yaml': 'application/yaml; charset=UTF-8',
          'json': 'application/json; charset=UTF-8',
          'csv': 'application/csv; charset=UTF-8',
          'md': 'text/markdown; charset=UTF-8',
          'txt': 'text/plain; charset=UTF-8',
          'html': 'text/html; charset=UTF-8'
        };
        t = privateClient.storeFile(mime[text.type], path + 'text', text.content);
        m = privateClient.storeObject('metadata', path + 'meta', meta);
        d = (function() {
          switch (data) {
            case void 0:
            case null:
            case false:
              return {
                then: function() {}
              };
            default:
              return privateClient.storeFile(mime[data.type], path + 'data', data.content);
          }
        })();
        return t.then(function() {
          return m.then(function() {
            return d.then(function() {
              if (cb) {
                return cb(true);
              }
            });
          });
        });
      },
      getNode: function(path, cb) {
        var d, m, mime, t;
        m = privateClient.getObject(path + 'meta');
        t = privateClient.getFile(path + 'text');
        d = privateClient.getFile(path + 'data');
        mime = {
          'application/yaml; charset=UTF-8': 'yaml',
          'application/json; charset=UTF-8': 'json',
          'application/csv; charset=UTF-8': 'csv',
          'text/markdown; charset=UTF-8': 'md',
          'text/plain; charset=UTF-8': 'txt',
          'text/html; charset=UTF-8': 'html'
        };
        return this.listChildrenNames(path, function(children) {
          return m.then(function(meta) {
            meta = meta;
            return t.then(function(text) {
              text = {
                type: mime[text.mimeType],
                content: text.data
              };
              d.then(function(data) {
                return data = {
                  type: mime[data.mimeType],
                  content: data.data
                };
              });
              d.fail(function() {
                var data;
                return data = null;
              });
              return d.done(function() {
                if (cb) {
                  return cb(meta, text, data);
                }
              });
            });
          });
        });
      }
    }
  };
  return module;
});



},{}],37:[function(require,module,exports){
(function(text, meta, data, children) {
  return "<doctype !html>\n\n<title>" + meta.title + "</title>\n<h1>" + meta.title + "</h1>\n<div>\n  " + text + "\n</div>\n<ul>\n  " + (children.map(function(child) {
    return "<li><a href='/" + child.path + "'>" + (child.path.split('/').slice(-1)[0]) + "</a>";
  }));
});



},{}]},{},[2]);
