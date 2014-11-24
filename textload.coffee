req = require 'superagent'

TextLoad = (files, callback) ->
  if typeof files == 'string'
    files = [files]

  waitingFor = files.length
  results = {}

  for addr in files
    results[addr] = null
    req.get(addr)
       .end (err, res) ->
         results[res.req.url] = if err or res.statusType == 4 then '' else res.text
         waitingFor--
         if waitingFor == 0
           callback.apply @, [null].concat (text for r, text of results)

  if waitingFor == 0
    callback.apply @, [null].concat (text for r, text of results)

module.exports = TextLoad
