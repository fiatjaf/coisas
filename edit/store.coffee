Taffy = require 'taffydb'
CommonProcessor = require './processors/common.coffee'

diff = require('deep-diff').diff
slug = require 'slug'
yaml = require 'js-yaml'
JSON.stringifyAligned = require 'json-align'

class Store
  constructor: (gh, compiledTemplate, docs) ->
    @gh = gh
    @template = compiledTemplate

    @taffy = Taffy.taffy docs
    @taffy.settings
      onInsert: ->
        if not this._id
          this._id = "xyxxyxxx".replace /[xy]/g, (c) ->
            r = Math.random() * 16 | 0
            v = (if c is "x" then r else (r & 0x3 | 0x8))
            v.toString 16
        if not this._created_at
          this._created_at = (new Date()).getTime()
        this.slug = this._id if not this.slug
        this.text = '' if not this.text
        this.data = '' if not this.data
        this.title = '' if not this.title
        this.kind = 'article' if not this.kind
        this.parents = [] if not this.parents
      cacheSize: 0

    @tree = {}
    @gh.fetchMasterSha =>
      @gh.getLastTree (tree) =>
        @tree[file.path] = {
          mode: file.mode
          type: file.type
          sha: file.sha
        } for file in tree when file.type isnt 'tree'
    @gh.fetchDataSha()

    @paths = {}
    for doc in docs
      @paths[doc._id] = @computePath doc

  clearDoc: (doc) ->
    clear = JSON.parse JSON.stringify doc
    delete clear.___id
    delete clear.___s
    return clear

  updateDoc: (editedDoc) ->
    oldDoc = JSON.parse JSON.stringify @taffy({_id: editedDoc._id}).first()
    differences = diff(oldDoc, editedDoc)
    return if not differences

    # save changes to taffy
    @taffy({_id: editedDoc._id}).remove()
    @taffy.insert(editedDoc, false)

    # change content of json file
    delete @tree['docs/' + editedDoc._id + '.json'].sha
    @tree['docs/' + editedDoc._id + '.json'].content = JSON.stringifyAligned @clearDoc editedDoc, false, 2

    # change paths of doc and sons, change content of parents
    for difference in differences
      if difference.path[0] in ['slug', 'parents']
        # update the tree
        @changePathInTree editedDoc

        # rerender the html of both the new parents and the old ones
        allParents = JSON.parse JSON.stringify editedDoc.parents
        allParents.push p for p in oldDoc.parents when p not in allParents
        for parent in @taffy(_id: allParents).get()
          @changeContent parent

        break

    # change content of doc and parents
    for difference in differences
      if difference.path[0] not in ['slug', 'parents']
        @changeContent editedDoc
        for parent in @taffy(_id: editedDoc.parents).get()
          @changeContent parent
        break

  changePathInTree: (doc) ->
    # in this case, change the edited doc path and all of its
    # descendants paths.

    @traverseDown doc, (doc) =>
      oldPath = @paths[doc._id]
      newPath = @computePath doc

      # change path of html file
      @tree[newPath] = @tree[oldPath]
      delete @tree[oldPath]

      @paths[doc._id] = newPath
        
  changeContent: (doc) ->
    path = @paths[doc._id]
    delete @tree[path].sha if @tree[path]
    @tree[path].content = @render doc

  deleteDoc: (_id) ->
    # delete from tree
    delete @tree[@paths[_id]]
    delete @tree['docs/' + _id + '.json']

    # get the doc for subsequently getting its parents
    doc = @taffy(_id: _id).first()

    # delete the doc now so the parents can render themselves without it
    @taffy(_id: _id).remove()

    # rerender parents
    for parent in @taffy(_id: doc.parents).get()
      @changeContent parent


  newDoc: (doc) ->
    doc.date = (new Date()).toISOString()
    createdDoc = @taffy.insert(doc).first()

    @paths[createdDoc._id] = @computePath createdDoc

    @tree['docs/' + createdDoc._id + '.json'] =
      mode: '100644'
      type: 'blob'
      content: JSON.stringifyAligned createdDoc
    @tree[@paths[createdDoc._id]] =
      mode: '100644'
      type: 'blob'
      content: @render createdDoc
    return @getDoc createdDoc._id

  getDoc: (_id) ->
    return JSON.parse JSON.stringify @taffy(_id: _id).first()

  getSons: (_id) ->
    sons = []
    for doc in @taffy(parents: {has: _id}).order('order,date desc,_created_at desc').get()
      sons.push @getDoc doc._id
    return sons

  traverseDown: (from, fn) ->
    fn from
    for son in @taffy(parents: {has: from._id}).get()
      @traverseDown son, fn

  computePath: (doc) ->
    # each doc only has one path.
    # if it has more than one parent, just the first is valid for pathmaking

    getPathComponent = (parent) =>
      grandparent = @taffy({_id: parent.parents[0]}).first()

      # compute slug at path time
      thisSlug = parent.slug or if parent.title then slug parent.title else parent._id

      if grandparent
        path = getPathComponent(grandparent) + thisSlug + '/'
      else
        path = ''
      return path

    return getPathComponent(doc) + 'index.html'

  render: (doc) ->
    children = (JSON.parse(JSON.stringify(child)) for child in @taffy(parents: {has: doc._id}).get())
    processed = CommonProcessor JSON.parse(JSON.stringify(doc)), children
    processed.path = @paths[doc._id]
    site = CommonProcessor JSON.parse JSON.stringify @taffy(_id: 'global').first()
    @template
      doc: processed
      site: site

  publishTree: ->
    console.log @tree
    arrayTree = []
    for path, file of @tree
      b = file
      b.path = path
      arrayTree.push b

    @gh.deploy arrayTree, ->
      console.log 'deployed!'
      location.reload()

module.exports = Store
