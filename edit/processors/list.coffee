module.exports = (doc) ->
  doc.items = doc._data or doc.children
  return doc
