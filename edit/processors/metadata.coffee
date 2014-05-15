slug = require 'slug'
yaml = require 'js-yaml'
fm = require 'front-matter'

standardAttributes = ['parents', 'data', 'kind', 'text',
                      'title', '_id', '_sha', '_created_at',
                      '___id', '___s', 'path']

module.exports =
  preProcess: (doc) ->
    # get saved metadata
    meta = {}
    for field, value of doc when field not in standardAttributes
      meta[field] = value

    # render saved metadata to yaml front matter
    doc.text =
      '---\n' +
      yaml.dump(meta) +
      '---\n\n' +
      fm(doc.text).body

  postProcess: (doc) ->
    # make a slug
    if not doc.slug
      doc.slug = doc.slug or if doc.title then slug doc.title else doc._id
    if doc.slug in ['docs', 'edit', 'assets']
      doc.slug = doc.slug + '2'

    # parse fields
    meta = {}
    parsed = fm doc.text
    for field, value of parsed.attributes when field not in standardAttributes
      meta[field] = value

      # delete the field if it is marked as null
      if meta[field] is null
        delete meta[field]
        delete doc[field]

    # save new metadata to doc
    for field, value of meta
      doc[field] = value

    # save clean text body to doc
    doc.text = parsed.body
