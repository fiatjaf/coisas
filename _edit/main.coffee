React = require 'react'
Feed = require 'feed'
Handlebars = require 'handlebars'
Taffy = require 'taffydb'
curl = require 'curl-amd'
GitHub = require './github.coffee'
kinds = require './kinds.coffee'

# react
{main, aside, article, header, div, ul, li, span,
 table, thead, tbody, tfoot, tr, td, th,
 b, i, a, h1, h2, h3, h4, small,
 form, label, input, select, option, textarea, button} = React.DOM

# github client
gh_data = /([\w-_]+)\.github\.((io|com)\/)([\w-_]*)/.exec(location.href)
if gh_data
  user = gh_data[1]
  repo = gh_data[4] or "#{user}.github.#{gh_data[3]}"
else
  user = localStorage.getItem location.href + '-user'
  if not user
    user = prompt "Your GitHub username for this blog:"
    localStorage.setItem location.href + '-user', user

  repo = localStorage.getItem location.href + '-repo'
  if not repo
    repo = prompt "The name of the repository in which this blog is hosted:"
    localStorage.setItem location.href + '-repo', repo

pass = prompt "Password for the user #{user}:"
gh = new GitHub user
gh.password pass
gh.repo repo

curl
  baseUrl: location.href
  pluginPath: 'curl'

# templates to load
templateNames = []
templateAddresses = []
for name, kind of kinds
  templateNames.push name
  templateAddresses.push 'text!' + kind.template

Main = React.createClass
  getInitialState: ->
    templatesReady: false

  componentWillMount: ->
    @db = Taffy.taffy()
    @db.settings
      template:
        parents: ['home']
        data: ''
        kind: 'article'
        title: ''
        text: ''
      onInsert: ->
        if not this._id
          this._id = "xyxxyxxx".replace /[xy]/g, (c) ->
            r = Math.random() * 16 | 0
            v = (if c is "x" then r else (r & 0x3 | 0x8))
            v.toString 16
      cacheSize: 0

    if not @db().count()
      @db.insert
        _id: 'home'
        parents: []
        kind: 'list'
        title: 'home'
        text: 'this is the text of the home page
               of this website about anything'

  setDocs: (docs) ->
    @db.merge(docs, '_id', true)
    @forceUpdate()

  setTemplatesReady: -> @setState templatesReady: true

  handleUpdateDoc: (docid, change) ->
    @db({_id: docid}).update(change)
    @forceUpdate()

  handleSelectDoc: (docid) ->
    @setState
      editingDoc: docid

  handleAddSon: (son) ->
    @db.insert(son)
    @forceUpdate()

  handleDeleteDoc: (docid) ->
    @db({_id: docid}).remove()
    @forceUpdate()

  render: ->
    (div className: 'pure-g',
      (aside className: 'pure-u-1-5',
        (ul {},
          (Doc
            data: @db({_id: 'home'}).first()
            selected: true
            onSelect: @handleSelectDoc
            onAddSon: @handleAddSon
            db: @db
          )
        )
      ),
      (main className: 'pure-u-4-5',
        (DocEditable
          data: @db({_id: @state.editingDoc}).first()
          onUpdateDocAttr: @handleUpdateDoc
          onDelete: @handleDeleteDoc
          db: @db
        )
      )
    )

Doc = React.createClass
  getInitialState: ->
    selected: @props.selected

  select: ->
    @props.onSelect @props.data._id
    @setState
      selected: true

  clickRetract: ->
    @setState
      selected: false

  clickAdd: ->
    @select()
    @props.onAddSon {parents: [@props.data._id]}

  render: ->
    sons = @props.db(
      parents:
        has: @props.data._id
    ).get()

    if not sons.length
      sons = [{_id: ''}]

     if @props.data._id then (li {},
      (header {},
        (button
          className: 'pure-button retract'
          onClick: @clickRetract
        , '<'),
        (h4
          onClick: @select.bind(@, false)
          @props.data.title or @props.data._id),
        (button
          className: 'pure-button add'
          onClick: @clickAdd
        , '+')
      ),
      (ul {},
        @transferPropsTo (Doc
          data: son
          selected: false
          key: son._id
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
    @props.onUpdateDocAttr @props.data._id, change

  confirmDelete: ->
    if confirm "are you sure you want to delete 
        #{@props.data.title or @props.data._id}"
      @props.onDelete @props.data._id

  render: ->
    if not @props.data
      (article {})
    else
      (article className: 'editing',
        (h3 {}, 'editando ' + @props.data._id),
        (button
          className: 'pure-button del'
          onClick: @confirmDelete
        , 'x') if not @props.db({parents: {has: @props.data._id}}).count()
        (form
          className: 'pure-form pure-form-aligned'
          onSubmit: @handleSubmit
        ,
          (div className: 'pure-control-group',
            (label htmlFor: 'kind', 'kind: ')
            (select
              id: 'kind'
              onChange: @handleChange.bind @, 'kind'
              value: @props.data.kind
            ,
              (option
                value: kindName
                key: kindName
              , kindName) for kindName of kinds
            ),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'title', 'title: ')
            (input
              id: 'title'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'title'
              value: @props.data.title),
          ),
          (div className: 'pure-control-group',
            (label {}, 'parents: ')
            (input
              onChange: @handleChange.bind @, 'parents'
              value: @props.data.parents.join(', ')),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'text', 'text: ')
            (textarea
              id: 'text'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'text'
              value: @props.data.text),
          ),
          (div className: 'pure-control-group',
            (label htmlFor: 'data', 'data: ')
            (textarea
              wrap: 'off'
              id: 'data'
              className: 'pure-input-2-3'
              onChange: @handleChange.bind @, 'data'
              value: @props.data.data),
          ),
        )
      )

# render component without any docs
MAIN = React.renderComponent Main(templatesReady: false), document.body

# prepare docs to load
gh.listDir '_docs', (files) ->
  if Array.isArray files
    docAddresses = ('json!' + f.path for f in files when f.type == 'file')
  else
    docAddresses = []
  # load docs
  curl(docAddresses).then( (docs...) ->
    MAIN.setDocs docs

  # load templates and register Handlebars partials
  ).next(templateAddresses).then( (templates...) ->
    for template, i in templates
      Handlebars.registerPartial templateNames[i], template
    MAIN.setTemplatesReady()
  )
