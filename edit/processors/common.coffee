parse = require './parsers/universal.coffee'
marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

Processors =
  article: require './article.coffee'
  table: require './table.coffee'
  list: require './list.coffee'
  chart: require './chart.coffee'
  plaintext: require './plaintext.coffee'

process = (doc, children) ->
  # clone
  doc = JSON.parse JSON.stringify doc

  # parse markdown to html
  doc.html = marked doc.text

  # process the children
  if children
    doc.children = (process child for child in children)

  # process the data
  doc._data = JSON.parse JSON.stringify parse doc.data

  # process the doc according to its kind
  doc = Processors[doc.kind](doc)

  return doc

module.exports = process
