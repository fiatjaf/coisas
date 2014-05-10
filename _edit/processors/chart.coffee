module.exports = (doc) ->
  doc.chart_type = doc.chart_type or 'line'
  doc.querystring = (item.value for item in doc.items).join(',')
  return doc
