YAML = require 'js-yaml'
CSV = require './csv.js'

module.exports = (data) ->
  if not data
    return data

  try
    JSON.parse data
  catch e
    try
      CSV.RELAXED = true
      parsed = CSV.parse data
      headers = parsed[0]
      output = []
      for row in parsed.slice(1)
        entry = {}
        for cell, i in row
          value = cell
          if typeof value is 'string'
            value = value.trim()
          unless isNaN value
            value = parseFloat value
          entry[headers[i]] = value
        output.push entry
      output
    catch e
      try
        YAML.safeLoad data
      catch e
        ({line: line} for line in data.split '\n')
