collate = require 'pouchdb-collate'
fm = require 'front-matter'
marked = require 'marked'
strip = require 'strip'
template = require './template.handlebars'

marked.setOptions
  gfm: true
  tables: true
  smartLists: true

makePage = (doc) ->
  parsed = fm doc.raw
  page = parsed.attributes
  page.path = doc.path.split('/') if doc.path
  page.fullPath = doc.path
  page.fullPaths = (->
    fullPaths = []
    makeFullPath = (pos) ->
      fullpath = []
      for p in [pos..0]
        fullpath.unshift doc.path.split('/')[p]
      return fullpath.join '/'
    for fragment, i in doc.path.split('/')
      fullPaths.push({
        fragment: fragment
        full: makeFullPath i
      })
    return fullPaths
  )() if doc.path
  page.text = parsed.body
  page.html = marked page.text
  page.children = doc.children
  return page

addSiteAttrs = (site) ->
  if site.author
    author = {}
    if typeof site.author is 'string'
      author.name = site.author
    else
      author.external_profiles = []
      for k, v of site.author
        if k == 'name'
          author.name = v
        else if /(pic|image|img|photo)/i.exec k
          author.image = v
        else if /(note|desc|intro)/i.exec k
          author.note = marked v
        else
          if /(tel|phone|sms)/i.exec v
            url = 'sms:' + (if v[0] == '+' then '' else '+') + v.replace /\D/g, ''
            name = v
          else if /mail/i.exec v
            url = 'mailto:' + v.trim()
            name = v
          else
            url = v.trim()
            name = k.trim()

          author.external_profiles.push {
            name: name
            url: url
          }
  site.author = author
  return site

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

addMeta = (page) ->
  page.meta_description = page.description or strip(page.html.substr(0, 500)).substr(0, 250)
  return page

module.exports = (d) ->
  data =
    site: addSiteAttrs makePage d.site
    page: addMeta addChildrenAttrs makePage d.doc

  return template data
