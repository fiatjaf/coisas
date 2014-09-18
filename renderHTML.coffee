Handlebars = require 'handlebars'
fm = require 'front-matter'
marked = require 'marked'
template = require 'template.html'

marked.setOptions
  gfm: true
  tables: true
  smartLists: true

t = Handlebars.compile template

module.exports = (d) ->
  data =
    site: d.site
    page:
      path: d.path
      children: d.children

  for attr, val of fm(d.rawDoc).attributes
    data.page[attr] = val

  return t data
