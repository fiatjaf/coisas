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
    editingDoc: 'home'

  publish: ->
    @props.store.publishTree()

  handleUpdateDoc: (docid, change) ->
    doc = @props.store.getDocToEdit docid
    for field, value of change
      doc[field] = value
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
      doc = @props.store.getDocToEdit base
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
      movedDoc = @props.store.getDocToEdit childid
      movedDoc.parents.splice movedDoc.parents.indexOf(fromid), 1
      movedDoc.parents.push targetid
      @props.store.updateDoc movedDoc
      @forceUpdate()

      return true

  render: ->
    (div className: 'pure-g',
      (aside className: 'pure-u-1-5',
        (ul {},
          @transferPropsTo(Doc
            doc: @props.store.getDocToEdit 'home'
            selected: true
            immediateParent: null
            onSelect: @handleSelectDoc
            onAddSon: @handleAddSon
            onMovedChild: @handleMovingChilds
          )
        )
      ),
      (main className: 'pure-u-4-5',
        @transferPropsTo(Menu
          globalDoc: @props.store.getDocToEdit 'global'
          onClickPublish: @publish
          onGlobalDocChange: @handleUpdateDoc.bind @, 'global'
        ),
        @transferPropsTo(DocEditable
          doc: @props.store.getDocToEdit @state.editingDoc
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
    movedOk = @props.onMovedChild childid, fromid, @props.doc._id
    if movedOk
      @select()

  preventDefault: (e) -> e.preventDefault()

  select: ->
    @props.onSelect @props.doc._id
    @setState selected: true

  clickRetract: ->
    @setState selected: false

  clickAdd: ->
    @select()
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
        (button
          className: 'pure-button delete'
          onClick: @clickDelete
        , 'x') if @state.selected and sons.length == 0
        (button
          className: 'pure-button retract'
          onClick: @clickRetract
        , '<'),
        (h4
          draggable: true
          onDragStart: @dragStart
          onClick: @select.bind(@, false)
          @props.doc.title or @props.doc._id),
        (button
          className: 'pure-button add'
          onClick: @clickAdd
        , '+')
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
  handleChange: (attr, e) ->
    if attr == 'parents'
      value = (parent.trim() for parent in e.target.value.split(','))
    else
      value = e.target.value

    change = {}
    change[attr] = value
    @props.onUpdateDocAttr @props.doc._id, change

  render: ->
    if not @props.doc
      (article {})
    else
      (article className: 'editing',
        (h3 {}, "editing #{@props.doc._id}"),
        (form
          className: 'pure-form pure-form-aligned'
          onSubmit: @handleSubmit
        ,
          (div className: 'pure-control-group',
            (label htmlFor: 'kind', 'kind: ')
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
            (label htmlFor: 'title', 'title: ')
            (input
              id: 'title'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'title'
              value: @props.doc.title),
          ),
          (div className: 'pure-control-group',
            (label {}, 'parents: ')
            (input
              onChange: @handleChange.bind @, 'parents'
              value: @props.doc.parents.join(', ')),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'text', 'text: ')
            (textarea
              id: 'text'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'text'
              value: @props.doc.text),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'data', 'data: ')
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
  handleGlobalDocChange: (e) ->
    change =
      text: e.target.value
    @props.onGlobalDocChange change
    e.preventDefault()

  handleClickPublish: (e) ->
    @props.onClickPublish()
    e.preventDefault()

  render: ->
    (header {},
      (div className: 'pure-g-r',
        (div className: 'pure-u-4-5',
          (form className: 'pure-form',
            (textarea
              className: 'pure-input-1'
              onChange: @handleGlobalDocChange
              value: @props.globalDoc.text
            )
          ),
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
