React = require 'react'
Handlebars = require 'handlebars'
TextLoad = require './textload.coffee'
GitHub = require './github.coffee'
Store = require './store.coffee'

BaseTemplate = 'templates/base.html'
Templates =
  names: [
    'article',
    'table',
    'list',
    'chart',
    'plaintext',
  ]
  addresses: [
    'templates/article.html',
    'templates/table.html',
    'templates/list.html',
    'templates/chart.html',
    'templates/plaintext.html',
  ]

# handlebars helpers
Handlebars.registerHelper 'cleanPath', (path) ->
  if path == 'index.html'
    return ''
  return path.replace /\/index\.html?$/, ''

# react
{main, aside, article, header, div, ul, li, span,
 table, thead, tbody, tfoot, tr, td, th,
 b, i, a, h1, h2, h3, h4, small,
 form, label, input, select, option, textarea, button} = React.DOM

# github client
gh_data = /([\w-_]+)\.github\.((io|com)\/)([\w-_]*)\/?(.*)/.exec(location.href)
if gh_data
  user = gh_data[1]
  repo = if gh_data[5] then gh_data[4] else "#{user}.github.#{gh_data[3]}"
else
  user = localStorage.getItem location.href + '-user'
  if not user
    user = prompt "Your GitHub username for this blog:"
    localStorage.setItem location.href + '-user', user

  repo = localStorage.getItem location.href + '-repo'
  if not repo
    repo = prompt "The name of the repository in which this blog is hosted:"
    localStorage.setItem location.href + '-repo', repo

  console.log "will connect to the repo #{user}/#{repo}"

gh = new GitHub user
pass = prompt "Password for the user #{user}:"
if pass
  gh.password pass

gh.repo repo

Main = React.createClass
  getInitialState: ->
    editingDoc: null

  publish: ->
    @props.store.publishTree()

  handleUpdateDoc: (docid, change) ->
    doc = @props.store.getDoc docid
    for field, value of change
      if value != null
        doc[field] = value
      else
        delete doc[field]
    @props.store.updateDoc doc
    @forceUpdate()

  handleSelectDoc: (docid) ->
    @setState editingDoc: docid

  handleAddSon: (son) ->
    son = @props.store.newDoc(son)
    @forceUpdate()
    return son._id

  handleDeleteDoc: (docid) ->
    @props.store.deleteDoc docid
    @forceUpdate()

  handleMovingChilds: (childid, fromid, targetid) ->
    isAncestor = (base, potentialAncestor) =>
      doc = @props.store.getDoc base
      if not doc.parents.length
        return false
      for parent in doc.parents
        if parent == potentialAncestor
          return true
        else
          return isAncestor parent, potentialAncestor

    if isAncestor targetid, childid
      return false
    else
      movedDoc = @props.store.getDoc childid
      movedDoc.parents.splice movedDoc.parents.indexOf(fromid), 1
      movedDoc.parents.push targetid
      @props.store.updateDoc movedDoc
      @forceUpdate()

      return true

  render: ->
    (div className: 'pure-g-r',
      (aside className: 'pure-u-6-24',
        (ul {},
          @transferPropsTo(Doc
            doc: @props.store.getDoc 'home'
            selected: true
            immediateParent: null
            onSelect: @handleSelectDoc
            onDelete: @handleDeleteDoc
            onAddSon: @handleAddSon
            onMovedChild: @handleMovingChilds
          )
        )
        (ul {},
          @transferPropsTo(Doc
            doc: @props.store.getDoc 'global'
            selected: false
            immediateParent: null
            onSelect: @handleSelectDoc
          )
        )
      ),
      (main className: 'pure-u-18-24',
        @transferPropsTo(Menu
          onClickPublish: @publish
        ),
        @transferPropsTo(DocEditable
          doc: @props.store.getDoc @state.editingDoc
          onUpdateDocAttr: @handleUpdateDoc
        )
      )
    )

Doc = React.createClass
  getInitialState: ->
    selected: @props.selected

  dragStart: (e) ->
    console.log 'started dragging ' + @props.doc._id
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData 'docid', @props.doc._id
    e.dataTransfer.setData 'fromid', @props.immediateParent

  drop: (e) ->
    e.preventDefault()
    e.stopPropagation()
    childid = e.dataTransfer.getData 'docid'
    fromid = e.dataTransfer.getData 'fromid'
    console.log childid + ' dropped here (at ' + @props.doc._id + ') from ' + fromid
    if fromid == @props.doc._id
      console.log 'it is the same place'
      return
    if @props.doc._id == childid
      console.log 'is itself'
      return

    movedOk = @props.onMovedChild childid, fromid, @props.doc._id
    if movedOk
      @state.selected = false
      @clickName()

  preventDefault: (e) -> e.preventDefault()

  clickDelete: ->
    if confirm """Are you sure you want to delete "#{@props.doc.title or @props.doc._id}"?"""
      @props.onDelete @props.doc._id

  clickName: ->
    if @state.selected == false
      @props.onSelect @props.doc._id
      @setState selected: true

    else if @state.selected == true
      @props.onSelect null
      @setState selected: false

  clickAdd: ->
    sonid = @props.onAddSon {parents: [@props.doc._id]}

  render: ->
    sons = @props.store.getSons(@props.doc._id)

    if not sons.length
      sons = [{_id: ''}]

    if @props.doc._id then (li {},
      (header
        onDragOver: @preventDefault
        onDrop: @drop
      ,
        (h4
          draggable: if @props.onMovedChild then true else false
          onDragStart: @dragStart
          onClick: @clickName
          @props.doc.title or @props.doc._id),
        (button
          className: 'pure-button delete'
          onClick: @clickDelete
        , 'x') if @state.selected and sons.length == 1 and sons[0]._id == '' and @props.onDelete
        (button
          className: 'pure-button add'
          onClick: @clickAdd
        , '+') if @state.selected and @props.onAddSon
      ),
      (ul {},
        @transferPropsTo(Doc
          doc: son
          selected: false
          key: son._id
          ref: son._id
          immediateParent: @props.doc._id
        ,
          son.title or son._id) for son in sons
      ) if @state.selected
    ) else (li {})

DocEditable = React.createClass
  standardAttributes: ['parents', 'data', 'kind', 'text',
                       'title', '_id', '_created_at',
                       '___id', '___s']

  getInitialState: ->
    _new: ''

  handleChange: (attr, e) ->
    if attr == 'parents'
      value = (parent.trim() for parent in e.target.value.split(','))
    else
      value = e.target.value

    if attr != '_new'
      change = {}
      change[attr] = value
      @props.onUpdateDocAttr @props.doc._id, change

    else
      @setState _new: value

  handleChangeMetaAttr: (prevAttr, e) ->
    attr = e.target.innerText
    if prevAttr != attr and attr != '_new' or attr == '' and prevAttr == '_new'

      if prevAttr == '_new'
        value = @state._new
        @state._new = ''
      else
        value = @props.doc[prevAttr]

      change = {}
      change[prevAttr] = null

      if attr
        change[attr] = value

      if attr not in @standardAttributes
        @props.onUpdateDocAttr @props.doc._id, change

  componentDidUpdate: (nextProps) ->
    for ref, component of @refs
      node = component.getDOMNode()
      node.innerText = if ref == '_new' then '' else ref

  render: ->
    if not @props.doc
      (article {})
    else
      meta = {}
      for field, value of @props.doc when field not in @standardAttributes
        meta[field] = value
      meta._new = @state._new

      (article className: 'editing',
        (h3 {}, "editing #{@props.doc._id}"),
        (form
          className: 'pure-form pure-form-aligned'
          onSubmit: @handleSubmit
        ,
          (div className: 'pure-control-group',
            (label htmlFor: 'kind', 'kind')
            (select
              id: 'kind'
              onChange: @handleChange.bind @, 'kind'
              value: @props.doc.kind
            ,
              (option
                value: kind
                key: kind
              , kind) for kind in Templates.names
            ),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'title', 'title')
            (input
              id: 'title'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'title'
              value: @props.doc.title),
          ),
          (div className: 'pure-control-group',
            (label {}, 'parents')
            (input
              onChange: @handleChange.bind @, 'parents'
              value: @props.doc.parents.join(', ')),
          ),
          (div className: 'meta',
            ((div
              className: 'pure-control-group'
              key: attr
              ,
              (label
                contentEditable: true
                ref: attr
                onBlur: @handleChangeMetaAttr.bind @, attr
              , if attr == '_new' then '' else attr)
              (input
                onChange: @handleChange.bind @, attr
                value: value),
            ) for attr, value of meta)
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'text', 'text')
            (textarea
              id: 'text'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'text'
              value: @props.doc.text),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'data', 'data')
            (textarea
              wrap: 'off'
              id: 'data'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'data'
              value: @props.doc.data),
          ),
        )
      )

Menu = React.createClass
  handleClickPublish: (e) ->
    @props.onClickPublish()
    e.preventDefault()

  render: ->
    (header {},
      (div className: 'pure-g-r',
        (div className: 'pure-u-4-5',
        ),
        (div className: 'pure-u-1-5',
          (button
            className: 'pure-button publish'
            onClick: @handleClickPublish
          , 'Publish!')
        )
      ),
    )

# prepare docs to load
gh.listDocs (files) ->
  if Array.isArray files
    docAddresses = ('../' + f.path for f in files when f.type == 'file')
  else
    docAddresses = []
  # load docs
  TextLoad docAddresses, (docs...) ->

    # load templates and precompile them
    TextLoad Templates.addresses, (templates...) ->
      dynamicTemplates = {}
      for templateString, i in templates
        dynamicTemplates[Templates.names[i]] = Handlebars.compile templateString

      Handlebars.registerHelper 'dynamicTemplate', (kind, opts) ->
        template = dynamicTemplates[kind]
        return new Handlebars.SafeString template opts.data.root

      # load the base template separatedly
      TextLoad BaseTemplate, (baseTemplateString) ->
        baseTemplate = Handlebars.compile baseTemplateString

        store = new Store gh, baseTemplate, docs.map JSON.parse
        React.renderComponent Main(store: store), document.body
