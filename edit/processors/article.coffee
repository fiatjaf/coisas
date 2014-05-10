marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

module.exports = (doc) ->
  doc.html = marked doc.text
  return doc
