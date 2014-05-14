slug = require 'slug'
fm = require 'front-matter'
parse = require './parsers/universal.coffee'
marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

process = (doc, children) ->
  # parse extra fields and metadata
  parsed = fm doc.text
  doc._text = parsed.body
  for field, value of parsed.attributes
    doc[field] = value

  # parse markdown to html
  doc.html = marked doc._text

  # make a slug
  if not doc.slug
    doc.slug = doc.slug or if doc.title then slug doc.title else doc._id
  if doc.slug in ['docs', 'edit', 'assets']
    doc.slug = doc.slug + '2'

  # process the children
  if children
    doc.children = (process child for child in children)

  # process the data
  doc._data = JSON.parse JSON.stringify parse doc.data

  return doc

module.exports = process
