const h = require('react-hyperscript')
const Dropzone = require('react-dropzone')

module.exports = function FileUpload ({
  onFile = () => {},
  onBase64 = () => {}}
) {
  return h(Dropzone, {
    multiple: false,
    disablePreview: true,
    className: 'dropzone',
    onDrop: files => {
      let file = files[0]
      onFile(file)
      var reader = new window.FileReader()
      reader.onload = event => {
        let binary = event.target.result
        let b64 = window.btoa(binary)
        onBase64(b64)
      }
      reader.readAsBinaryString(file)
    }
  }, [
    h('.placeholder', 'Click or drop files here to upload')
  ])
}
