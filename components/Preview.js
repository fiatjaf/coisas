const h = require('react-hyperscript')
const {append: renderMedia} = require('render-media')
const ReadableBlobStream = require('readable-blob-stream')
const based = require('based-blob')

module.exports = function Preview ({children, name, string, base64, blobURL, blob}) {
  if (base64 && !blob) {
    try {
      blob = based.toBlob(base64)
    } catch (e) {
      console.warn(e)
    }
  }

  var readableStream
  if (blob) {
    readableStream = new ReadableBlobStream(blob)
  }

  return h('.preview', {
    ref: el => {
      if (el) {
        var fp = el.getElementsByClassName('file')[0]
        if (!fp) {
          fp = document.createElement('div')
          fp.className = 'file'
          el.insertBefore(fp, el.childNodes[0])
        }

        fp.innerHTML = ''
        renderMedia({
          name,
          createReadStream: () => readableStream
        }, fp, console.log.bind(console, 'render-media'))
      }
    }
  }, children)
}
