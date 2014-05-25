slug = require 'slug'
yaml = require 'js-yaml'
fm = require 'front-matter'

standardAttributes = ['parents', 'data', 'kind', 'text',
                      'title', '_id', '_sha', '_created_at',
                      '___id', '___s', 'path',
                      '_changed', '_deleted', '_relocated']

module.exports =
  beforeEdit: (db) ->
    for doc in db().get()
      # get saved metadata
      meta = {}
      for field, value of doc when field not in standardAttributes
        meta[field] = value

      # add paths
      doc.paths = getPaths doc, db if not doc.paths

      # render saved metadata to yaml front matter
      doc.text =
        '---\n' +
        yaml.dump(meta) +
        '---\n' +
        fm(doc.text).body

  dinamicallyParseMetadata: (doc, db) ->
    # parse fields
    parsed = fm doc.text
    for field, value of parsed.attributes when field not in standardAttributes
      doc[field] = value

    for field of doc when field not in standardAttributes
      # delete field from doc if it is not in the front-matter
      if field not of parsed.attributes
        delete doc[field]

    # make a slug if it not exists
    doc.slug = doc.slug or if doc.title then slug doc.title else slug doc._id
    if doc.slug in ['docs', 'edit', 'assets']
      doc.slug = doc.slug + '2'

    # add paths
    doc.paths = getPaths doc, db

  cloneAndClearBeforePush: (doc, db) ->
    _doc = JSON.parse JSON.stringify doc

    # save clean text body to _doc
    parsed = fm _doc.text
    _doc.text = parsed.body

    # add paths
    doc.paths = getPaths _doc, db

    # delete fields only useful during editing
    delete _doc.___id
    delete _doc.___s
    delete _doc._changed
    delete _doc._relocated
    delete _doc._deleted

    return _doc

getPaths = (doc, db) ->
  oldPaths = doc.paths

  getPathComponents = (parent) ->
    paths = []
    q = db({_id: parent.parents}).order('_id')
    if q.count()
      for grandparent in q.get()
        for pathComponent in getPathComponents(grandparent)
          paths.push(pathComponent + parent.slug + '/')
    else
      paths.push ''
    return paths

  paths = []
  for path in getPathComponents(doc)
    paths.push(path + 'index.html')

  # add relocation marker if paths differ
  if oldPaths != JSON.stringify(paths) and typeof oldPaths != 'undefined'
    doc._relocated = {} if not doc._relocated
    for oldPath, i in oldPaths
      newPath = paths[i]
      doc._relocated[newPath] = oldPath

  return paths
