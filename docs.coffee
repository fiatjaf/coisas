R = require 'ramda'
req = require 'superagent'
series = require 'run-series'
textload = require './textload.coffee'
renderHTML = require './renderHTML.coffee'
concatPath = require './concat-path.coffee'
docsFromPaths = require './docs-from-paths.coffee'
parentFromPath = require './parent-from-path.coffee'
req = require 'superagent'

class Docs
  constructor: (@user, @repo) ->
  base: 'https://api.github.com'
  headers:
    'Content-Type': 'application/json'

  password: (pass) ->
    @headers['Authorization'] = 'Basic ' + btoa(@user + ':' + pass)

  token: (token) ->
    @headers['Authorization'] = 'token ' + token

  init: (cb) ->
    if @repo == "#{@user}.github.io" or @repo == "#{@user}.github.com"
      @branch = 'master'
    else
      @branch = 'gh-pages'

    @gitStatus =>
      @getTree =>
        @fetchRaw '', cb

  gitStatus: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
       .set(@headers)
       .end (res) =>
         @master_commit_sha = res.body.commit.sha
         @last_tree_sha = res.body.commit.commit.tree.sha

         cb(res.body) if typeof cb == 'function'

  deploy: (tree, cb) ->
    # post new tree
    req.post(@base + "/repos/#{@user}/#{@repo}/git/trees")
       .set(@headers)
       .send(tree: tree)
       .end (res) =>
         new_tree_sha = res.body.sha

         # abort if deployment is unchanged / commit empty
         if @last_tree_sha == new_tree_sha
           return true

         # commit the tree merging the two branches
         req.post(@base + "/repos/#{@user}/#{@repo}/git/commits")
            .set(@headers)
            .send(
              message: 'P U B L I S H'
              tree: new_tree_sha
              parents: [@master_commit_sha]
            )
            .end (res) =>
              new_commit_sha = res.body.sha

              # update the branch with the commit
              req.patch(@base + "/repos/#{@user}/#{@repo}/git/refs/heads/#{@branch}")
                 .set(@headers)
                 .send(sha: new_commit_sha, force: true)
                 .end (res) =>
                   if res.status == 200
                     cb(res.body)

  last_tree_index: {}
  doc_index: {}

  getTree: (cb) ->
    paths = []
    req.get(@base + "/repos/#{@user}/#{@repo}/git/trees/#{@last_tree_sha}?recursive=15")
       .set(@headers)
       .query(branch: @branch)
       .end (res) =>
      for file in res.body.tree
        @last_tree_index[file.path] = file
        if file.path.split('/').slice(-1)[0] == 'README.md'
          paths.push file.path

      @doc_index = {}
      for doc in docsFromPaths paths
        @doc_index[doc.path] = doc

      cb()

  getFullDoc: (path, cb) ->
    @fetchRaw path, (raw) =>
      doc =
        path: path
        raw: raw
        slug: @doc_index[path][0]
        children: @doc_index[path].children
      cb doc

  rawCache: {}
  fetchRaw: (path, cb) ->
    cached = @rawCache[path]
    if cached
      cb cached
    else
      docPath = path
      url = "http://rawgit.com/#{@user}/#{@repo}/#{@branch}/#{path}/README.md"
      textload url, (contents) =>
        @rawCache[docPath] = contents
        cb contents

  modifiedDocs: {}
  modifyRaw: (path, raw) ->
    @rawCache[path] = raw
    @modifiedDocs[path] = true
    @modifiedDocs[parentFromPath path] = true

  addDoc: (path) ->
    @rawCache[path] = ''
    @modifiedDocs[path] = true
    @modifiedDocs[parentFromPath path] = true
    @doc_index[parentFromPath path].children.push path.split '/'

  deletedDocs: {}
  deleteDoc: (path) ->
    @deletedDocs[path] = true
    @modifiedDocs[parentFromPath path] = true

  buildGitHubTree: (cb) ->

    # this function will run serially and fetch all docs needed to render
    # the modified docs (including parents and siblings)
    fetchAllDocs = R.map ((path) =>
      (callback) =>
        if path of @deletedDocs
          callback null, [path, null]
        else if path of @modifiedDocs or parentFromPath(path) of @modifiedDocs
          @getFullDoc path, (fullDoc) =>
            callback null, [path, fullDoc]
        else
          callback null, [path, null]
    ), (R.keys @doc_index)

    series fetchAllDocs, (err, results) =>
      # after fetching everything, we make an index of it
      fullDocIndex = R.fromPairs results

      # complete the 'children' props with all the available info
      for _, fullDoc of fullDocIndex
        if fullDoc
          for child in fullDoc.children
            child.path = concatPath [fullDoc.path, child.slug]
            if child.path of fullDocIndex and fullDocIndex[child.path]
              for attr, val of fullDocIndex[child.path]
                child[attr] = val

      # start building the tree
      tree = []
      for path, fullDoc of fullDocIndex
        readmeblob =
          mode: '100644'
          type: 'blob'
          path: concatPath [path, 'README.md']
        htmlblob =
          mode: '100644'
          type: 'blob'
          path: concatPath [path, 'index.html']
        if fullDoc
          readmeblob.content = @rawCache[path]
          htmlblob.content = renderHTML
            site: {raw: @rawCache['']}
            doc: fullDoc
        else if path of @deletedDocs
          continue
        else
          readmeblob.sha = @last_tree_index[concatPath [path, 'README.md']].sha
          htmlblob.sha = @last_tree_index[concatPath [path, 'index.html']].sha

        tree.push readmeblob
        tree.push htmlblob

      cb null, tree

module.exports = Docs
