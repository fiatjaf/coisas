module.exports = (doc) ->
  unless Array.isArray doc._data
    doc._data = [doc._data]

  table =
    head: []
    body: []
    foot: null

  keys = {}
  
  # build the complete set of
  # available keys and respective
  # types
  for item in doc._data
    for key, value of item
      if key not of keys
        keys[key] = typeof value
      else
        if keys[key] is 'number' and typeof value isnt 'number'
          keys[key] = typeof value

  # if one of the types is numerical,
  # add a foot to the table
  for key, type of keys
    if type is 'number'
      table.foot = []
      footSums = {}
      for key of keys
        footSums[key] = null
      break
        
  # get the keys as a list
  table.head = Object.keys keys

  # add data to the table in the correct order
  for item in doc._data
    row = []
    for key in table.head
      row.push item[key]

      # the foot part
      type = keys[key]
      if table.foot and type == 'number'
        footSums[key] += item[key]
      #

    table.body.push row

  # sort the list according to some criteria
  criteria = doc.sortBy or doc.orderBy
  if criteria
    pos = table.head indexOf criteria
    if pos isnt -1
      table.body = table.body.sort (a, b) ->
        return -1 if a[pos] < b[pos]
        return 1 if a[pos] > b[pos]
        return 0

  # add the foot to the table in the correct order
  if table.foot
    for key in table.head
      table.foot.push footSums[key]

  doc.table = table
  return doc
