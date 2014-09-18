Github = require './github.coffee'
fm = require 'front-matter'
textload = require './textload.coffee'
renderHTML = require './renderHTML.coffee'
docsFromPaths = require './docs-from-paths.coffee'
req = require 'superagent'

class Docs extends Github
  last_tree: []
  last_tree_index: {}
  docs: []
  docIndex: {}

  init: ->
    @gitStatus =>
      @getTree()
    @fetchRaw '', ->

  getTree: ->
    paths = []
    req.get(@base + "/repos/#{@user}/#{@repo}/git/trees/#{@last_tree_sha}?recursive=15")
       .set(@headers)
       .query(branch: @branch)
       .end (res) =>
      @last_tree = res.body.tree
      for file in res.body.tree
        @last_tree_index[file.path] = file
        if doc.path.split('/').slice(-1, 0)[0] == 'README.md'
          paths.push file.path

      @docs = docsFromPaths paths
      @docIndex = {}
      for doc in @docs
        @docIndex[doc.path] = doc

  getDoc: (path, cb) ->
    @fetchRaw path, (raw) =>
      parsed = fm raw
      doc =
        path: path
        text: parsed.body
        slug: @docIndex[path][0]
        children: @docIndex[path].children
      for attr, val of parsed.attributes
        doc[attr] = val
      cb doc

  rawCache: {}
  fetchRaw: (path, cb) ->
    cached = @rawCache[path]
    if cached
      cb cached
    else
      docPath = path
      url = "http://#{@user}.github.io/#{if @repo != 'master' then @repo + '/' else ''}#{path}/README.md"
      rawload url, (contents) =>
        @rawCache[docPath] = contents
        cb contents

  modifiedDocs: {}
  modifyRaw: (path, raw) ->
    @rawCache[path] = raw
    @modifiedDocs[path] = true

  deletedDocs: {}
  deleteDoc: (path) ->
    @deletedDocs[path] = true

  buildGitHubTree: (cb) ->
    tree = []
    for doc in @docs
      readmeblob =
        mode: '100644'
        type: 'blob'
        path: doc.path + '/README.md'
      htmlblob =
        mode: '100644'
        type: 'blob'
        path: doc.path + '/index.html'
      if doc.path of @modifiedDocs
        readmeblob.content = @rawCache[doc.path]
        htmlblob.content = renderHTML
          site: @rawCache['']
          rawDoc: @rawCache[doc.path]
          path: doc.path
          children: doc.children
      else if doc.path of @deletedDocs
        continue
      else
        readmeblob.sha = @last_tree_index[doc.path + '/README.md'].sha
        htmlblob.sha = @last_tree_index[doc.path + '/index.html'].sha

    cb tree


