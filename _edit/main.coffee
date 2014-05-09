React = require 'react'
Feed = require 'feed'
Handlebars = require 'handlebars'
Taffy = require 'taffydb'
curl = require 'curl-amd'
GitHub = require './github.coffee'
kinds = require './kinds.coffee'

# react
{main, aside, article, div, ul, li, span,
 table, thead, tbody, tfoot, tr, td, th,
 b, i, a, h1, h2, h3, h4, small,
 form, input, select, option, textarea, button} = React.DOM

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
        text: 'this is the text of the home page
               of this website about anything'

  setDocs: (docs) ->
    @db.merge(docs, '_id', true)
    @forceUpdate()

  setTemplatesReady: -> @setState templatesReady: true

  handleUpdateDoc: (newDoc) ->
    @db({_id: newDoc._id}).update(newDoc)

  handleSelectDoc: (docid, forceSelect=false) ->
    if not @state.editingDoc or @state.editingDoc._id != docid or forceSelect
      # case for select
      doc = @db({_id: docid}).first()
    else
      # case for unselect
      doc = null

    @setState
      editingDoc: doc

  handleAddSon: (son) ->
    @db.insert(son)
    @forceUpdate()

  render: ->
    (div {},
      (aside {},
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
      (main {},
        (DocEditable
          data: @state.editingDoc
          onDocUpdate: @props.handleUpdateDoc
        )
      )
    )

Doc = React.createClass
  getInitialState: ->
    selected: @props.selected

  select: (forceSelect) ->
    @props.onSelect @props.data._id, forceSelect
    @setState
      selected: if forceSelect then true else not @state.selected

  clickAdd: ->
    @select.apply @, [true]
    @props.onAddSon {parents: [@props.data._id]}

  render: ->
    sons = @props.db(
      parents:
        has: @props.data._id
    ).get()

    (li {},
      (h2
        onClick: @select.bind(@, false)
        @props.data.title or @props.data._id),
      (button onClick: @clickAdd, '+')
      (ul {},
        @transferPropsTo (Doc
          data: son
          selected: false
        ,
          son.title or son._id) for son in sons
      ) if @state.selected
    )

DocEditable = React.createClass
  handleSubmit: ->
    doc =
      kind: @refs.kind.getDOMNode().value
      parents: (x.trim() for x in @refs.parents.getDOMNode().value.split(','))
      text: @refs.text.getDOMNode().value
      data: @refs.data.getDOMNode().value
    @props.onUpdateDoc doc

  render: ->
    if not @props.data
      (article {})
    else
      (article className: 'editing',
        (h4 {}, 'editando ' + @props.data._id),
        (form onSubmit: @handleSubmit,
          (select ref: 'type',
            (option {value: kindName}, kindName) for kindName of kinds
          ),
          (input ref: 'parents', @props.data.parents.join(', ')),
          (textarea ref: 'text', @props.data.title),
          (textarea ref: 'data', @props.data.data)
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
