XLS = require 'xls'
XLSX = require 'xlsx'
YAML = require 'yaml'
CSV = require './papaparser.coffee'

module.exports = (text) ->
  try
    JSON.parse text
  catch (e)
    try
      CSV.parse text
    catch (e)
      try
        YAML.parse text
      catch (e)
        try
          XLS.parse text
        catch (e)
          try
            XLSX.parse text
          catch
            ({line: line} for line in text.split '\n')
