Taffy = require 'taffydb'
CommonProcessor = require './processors/common.coffee'

diff = require('deep-diff').diff
slug = require 'slug'
yaml = require 'js-yaml'
fm = require 'front-matter'
JSON.stringifyAligned = require 'json-align'

standardAttributes = ['parents', 'data', 'kind', 'text',
                      'title', '_id', '_created_at',
                      '___id', '___s']

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
        this.text = '---\n' + (new Date()).toISOString() + '\n---\n' if not this.text
        this.data = '' if not this.data
        this.title = '' if not this.title
        this.kind = 'article' if not this.kind
        this.parents = [] if not this.parents
      cacheSize: 0

    @tree = {}
    @gh.getLastTree (tree) =>
      @tree[file.path] = {
        mode: file.mode
        type: file.type
        sha: file.sha
      } for file in tree when file.type isnt 'tree'

    @paths = {}
    for doc in docs
      @paths[doc._id] = @computePath doc

  parseMetadata: (editedDoc) ->
    parsed = fm editedDoc.text
    editedDoc.text = parsed.body
    editedDoc[field] = value for field, value of parsed.attributes
    return editedDoc

  clearDoc: (doc) ->
    clear = JSON.parse JSON.stringify doc
    delete clear.___id
    delete clear.___s
    return clear

  updateDoc: (editedDoc) ->
    newDoc = @parseMetadata editedDoc

    oldDoc = @taffy({_id: newDoc._id}).first()
    differences = diff oldDoc, newDoc

    # save changes to taffy
    @taffy({_id: newDoc._id}).update(newDoc)

    # change path of json file
    delete @tree['docs/' + newDoc._id + '.json'].sha
    @tree['docs/' + newDoc._id + '.json'].content = JSON.stringifyAligned @clearDoc newDoc, false, 2

    for difference in differences
      if difference.path[0] in ['slug', 'parents']
        @changePathInTree newDoc
        break

    for difference in differences
      if difference.path not in ['slug', 'parents']
        @changeContentInTree newDoc
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

  changeContentInTree: (doc) ->
    # in this case, change the edited doc and its parents.

    rerender = (doc) =>
      path = @paths[doc._id]
      delete @tree[path].sha if @tree[path]
      @tree[path].content = @render doc

    rerender doc
    for parent in @taffy(_id: doc.parents).get()
      rerender parent

  deleteDoc: (_id) ->
    delete @tree[@paths[_id]]
    @taffy(_id: _id).remove()

  newDoc: (doc) ->
    createdDoc = @taffy.insert @parseMetadata doc
    return @getDocToEdit createdDoc.first()._id

  getDocToEdit: (_id) ->
    editing = JSON.parse JSON.stringify @taffy(_id: _id).first()

    meta = {}
    for field, value of editing when field not in standardAttributes
      meta[field] = value

    editing.text =
      '---\n' +
      yaml.dump(meta) +
      '---\n' +
      fm(editing.text).body

    return editing

  getSons: (_id) ->
    sons = []
    for doc in @taffy(parents: {has: _id}).order('order,date,_created_at').get()
      sons.push @getDocToEdit doc._id
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
      if grandparent
        path = getPathComponent(grandparent) + parent.slug + '/'
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
    arrayTree = []
    for path, file of @tree
      b = file
      b.path = path
      arrayTree.push b

    @gh.deploy arrayTree, ->
      console.log 'deployed!'

module.exports = Store
