R = require 'ramda'

firstOrEmpty = (arr) -> if arr[0] then arr[0] else ''
getFirstUniq = R.compose R.uniq, R.map(firstOrEmpty)
getSecondUniq = R.compose R.uniq, R.map R.compose firstOrEmpty, R.tail
removeLast = R.compose R.map R.compose R.reverse, R.tail, R.reverse
removeFirst = R.tail
groupPaths = R.compose R.mapObj(getSecondUniq), R.groupBy(firstOrEmpty)
childrenPaths = R.compose R.filter(R.not R.isEmpty), R.map(removeFirst)

docsFromPaths = (paths) ->
  if R.isEmpty paths
    return []
  groups = groupPaths paths
  docs = R.map ((path) ->
    path: R.join('/') R.filter R.identity, path
    children: R.filter(R.size) getFirstUniq groups[path[0]]
  ), paths
  docs = docs.concat docsFromPaths childrenPaths paths
  return docs

module.exports = R.compose docsFromPaths, removeLast, R.map(R.compose R.prepend(''), R.split '/')
