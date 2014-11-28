Handlebars = require 'handlebars'
TextLoad = require './textload.coffee'
collate = require 'pouchdb-collate'
fm = require 'front-matter'
marked = require 'marked'
strip = require 'strip'

marked.setOptions
  gfm: true
  tables: true
  smartLists: true

makePage = (doc) ->
  parsed = fm doc.raw
  page = parsed.attributes
  page.path = if doc.path then doc.path.split('/') else []
  page.slug = if page.path.length then page.path[page.path.length-1] else '⌂'
  page.fullPath = doc.path
  page.fullPaths = (->
    fullPaths = []
    makeFullPath = (pos) ->
      fullpath = []
      for p in [pos..0]
        fullpath.unshift doc.path.split('/')[p]
      return fullpath.join '/'
    for fragment, i in page.path
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
  # author name, picture and external profiles
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

  # webmention endpoint
  site.webmention_endpoint = site.webmention or site.webmentions or site.webmention_endpoint

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
        a = if typeof a.order is undefined then a.date or a.title else a.order
        b = if typeof b.order is undefined then b.date or b.title else b.order

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

getHandlebarsTemplate = (->
  @template = null

  # start loading the template here, don't care when it finishes
  TextLoad [
    'template.html'
    'https://rawgit.com/fiatjaf/coisas/master/template.html'
  ], (err, template, basetemplate) =>
    @template = Handlebars.compile(template or basetemplate)

  # return the template if it finished loading, otherwise fail
  return =>
    if typeof @template is 'function'
      return @template
    throw new Error('template not yet loaded')

)()

module.exports = (d) ->
  data =
    site: addSiteAttrs makePage d.site
    page: addMeta addChildrenAttrs makePage d.doc

  return getHandlebarsTemplate()(data)

