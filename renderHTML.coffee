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
  page.children = doc.children
  return page

addChildrenAttrs = (page) ->
  if page.children.length
    page.children = (makePage child for child in page.children)
    page.children.sort (a, b) ->
      a = a.order
      b = b.order

      invert = false
      if typeof a is 'string' and a[0] == '-'
        invert = !invert
        a = a.slice 1
      if typeof b is 'string' and b[0] == '-'
        invert = !invert
        b = b.slice 1

      return if invert then (a - b) else not (a - b)
    
  return page

module.exports = (d) ->
  data =
    site: makePage d.site
    page: addChildrenAttrs makePage d.doc

  return template data
