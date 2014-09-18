fm = require 'front-matter'
marked = require 'marked'
template = require './template.handlebars'

marked.setOptions
  gfm: true
  tables: true
  smartLists: true

makePage = (doc) ->
  parsed = fm doc.raw
  page = parsed.attributes
  page.path = doc.path.split('/') if doc.path
  page.text = parsed.body
  page.html = marked page.text
  return page

addChildrenAttrs = (page) ->
  if page.children
    page.children = (makePage child for child in doc.children)
  return page

module.exports = (d) ->
  data =
    site: makePage d.site
    page: addChildrenAttrs makePage d.doc

  return template data
