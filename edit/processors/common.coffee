slug = require 'slug'
fm = require 'front-matter'
parse = require './parsers/universal.coffee'

process = (doc, children) ->
  # parse extra fields and metadata
  parsed = fm doc.text
  doc.text = parsed.body
  for field, value of parsed.attributes
    doc[field] = value

  # make a slug
  if not doc.slug
    doc.slug = doc.slug or if doc.title then slug doc.title else doc._id
  if doc.slug in ['docs', 'edit', 'assets']
    doc.slug = doc.slug + '2'

  # process the children
  if children
    doc.children = (process child for child in children)

  # process the data
  doc.data = parse doc.data

  return doc

module.exports = process
