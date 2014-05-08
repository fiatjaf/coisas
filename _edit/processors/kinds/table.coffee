module.exports = (doc) ->
  properties = doc.display_properties
  order = doc.order

  doc.headers = properties
  doc.rows = []

  for item in doc.items
    row = []
    for prop in properties
      row.push doc[property]
    doc.rows.push row

  return doc
