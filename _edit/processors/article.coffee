marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

yaml = (text) ->
  parsed = require('front-matter').fm(text)
  parsed.attributes.__content = parsed.body
  return parsed.attributes

module.exports = (doc) ->
  doc.html = marked doc.text
  return doc
