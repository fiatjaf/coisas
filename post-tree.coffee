R = require 'ramda'
req = require 'superagent'
runSeries = require 'run-series'

endpoint = null
headers = null

postBlob = (blob, cb) ->
  if blob.sha
    return cb null, blob

  ((file) ->
    req.post(endpoint + '/blobs')
       .set(headers)
       .send(content: blob.content, encoding: 'utf-8')
       .end (err, res) ->
      return cb err if err
      cb null, {
        path: file.path
        mode: file.mode
        type: file.type
        sha: res.body.sha
      }
  )(blob)

postTree = (prefix, tree, cb) ->
  ((path) ->
    req.post(endpoint + '/trees')
       .set(headers)
       .send(tree: tree)
       .end (err, res) ->
      return cb err if err
      cb null, {
        path: path
        mode: '040000'
        type: 'tree'
        sha: res.body.sha
      }
  )(prefix)

sendNestedTree = (prefix, tree, cb) ->
  series = []
  subtrees = {}
  for file in tree
    # the files of this tree can be blobs (README.md, index.html etc.)
    # or descriptors of a subtree (foo/README.md, or foo/bar/index.html)

    if '/' not in file.path
      # blob
      series.push ((file) ->
        (callback) -> postBlob file, callback
      )(file)

    else
      # descriptor of a subtree
      subprefix = getFirst file.path
      file.path = removeFirst file.path
      subtrees[subprefix] = subtrees[subprefix] or []
      subtrees[subprefix].push file

  for subprefix, tree of subtrees
    series.push ((subprefix, tree) ->
      (callback) -> sendNestedTree subprefix, tree, callback
    )(subprefix, tree)

  ((path) ->
    runSeries series, (err, files) ->
      # getting a list of files,
      # either describing blobs or trees,
      # we have to post this tree specifically
      postTree path, files, cb
  )(prefix)

getFirst = R.compose R.head, R.split('/')
removeFirst = R.compose R.join('/'), R.tail, R.split('/')

module.exports = (e, h, tree, cb) ->
  endpoint = e
  headers = h
  
  sendNestedTree '', tree, (err, file) ->
    cb err, file.sha
