slug = require 'slug'

yaml = (text) ->
  parsed = require('front-matter').fm(text)
  parsed.attributes.__content = parsed.body
  return parsed.attributes

process = (doc, children) ->
  # parse extra fields and metadata
  extra = yaml doc.text
  for field, value of extra
    doc[field] = value

  # make a slug
  if not doc.slug or doc.newSlug == true
    doc.slug = doc.slug or if doc.title then slug doc.title else doc._id

  # process the children
  if children and not doc.items
    doc.items = process child for child in children

  # process according to each type
  if doc.kind of kinds
    operate = kinds[doc.kind]
    doc = operate doc

  return doc

module.exports = process
