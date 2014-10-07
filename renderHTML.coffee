collate = require 'pouchdb-collate'
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
      if page.sort
        if typeof page.sort is 'string' and page.sort[0] == '-'
          invert = true
          sort = page.sort.substr(1)
        else
          invert = false
          sort = page.sort

        a = a[sort] or a.order
        b = b[sort] or b.order
      else
        invert = false
        a = a.order or a.date or a.title
        b = b.order or b.date or b.title

      if typeof a is 'string' and a[0] == '-'
        invert = !invert
        a = a.slice 1
      if typeof b is 'string' and b[0] == '-'
        invert = !invert
        b = b.slice 1

      return collate.collate(a, b) * (if invert then -1 else 1)

  return page

module.exports = (d) ->
  data =
    site: makePage d.site
    page: addChildrenAttrs makePage d.doc

  return template data
