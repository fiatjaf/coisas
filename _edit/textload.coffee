req = require 'superagent'

TextLoad = (files, callback) ->
  if typeof files == 'string'
    files = [files]

  waitingFor = files.length
  results = []

  for addr in files
    req.get(addr)
       .end (res) ->
         results.push res.text
         waitingFor--
         if waitingFor == 0
           callback.apply @, results

  if waitingFor == 0
    callback.apply @, results

module.exports = TextLoad
