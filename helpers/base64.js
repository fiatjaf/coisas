module.exports = {
  encode: toBase64,
  decode: fromBase64
}

function toBase64 (str) {
  return window.btoa(unescape(encodeURIComponent(str)))
}

function fromBase64 (str) {
  return decodeURIComponent(escape(window.atob(str)))
}
