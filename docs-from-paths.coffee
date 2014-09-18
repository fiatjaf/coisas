R = require 'ramda'

concatPath = require './concat-path.coffee'

firstOrEmpty = (arr) -> if arr[0] then arr[0] else ''
getSecondUniq = R.compose R.uniq, R.map R.compose firstOrEmpty, R.tail
removeLast = R.compose R.map R.compose R.reverse, R.tail, R.reverse
mergeFirstIntoSecond = (f, s, others...) -> if s then R.concat [concatPath [f, s]], others else []
groupPaths = R.compose R.mapObj(R.compose R.filter(R.identity), getSecondUniq), R.groupBy(firstOrEmpty)
childrenPaths = R.compose R.filter(R.not R.isEmpty), R.map((p) -> mergeFirstIntoSecond.apply @, p)

docsFromPaths = (paths) ->
  if R.isEmpty paths
    return []

  docs = R.map ((pair) ->
    path: pair[0]
    children: R.map((slug) -> {slug: slug}) pair[1]
  ), R.toPairs groupPaths paths

  docs = docs.concat docsFromPaths childrenPaths paths
  return docs

module.exports = R.compose docsFromPaths, removeLast, R.map(R.compose R.prepend(''), R.split '/')
