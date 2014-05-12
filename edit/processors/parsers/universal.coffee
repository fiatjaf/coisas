XLS = require 'xlsjs'
XLSX = require 'xlsx'
YAML = require 'js-yaml'
CSV = require './csv.js'

module.exports = (text) ->
  try
    JSON.parse text
  catch e
    try
      CSV.RELAXED = true
      parsed = CSV.parse text
      headers = parsed[0]
      output = []
      for row in parsed.slice(1)
        entry = {}
        for cell, i in row
          entry[headers[i]] = cell
        output.push entry
      output
    catch e
      try
        YAML.safeLoad text
      catch e
        try
          XLS.parse text
        catch e
          try
            XLSX.parse text
          catch
            ({line: line} for line in text.split '\n')
