React = require 'react'
Modal = require './Modal'
Docs = require './docs.coffee'

concatPath = require './concat-path.coffee'

{html, body, head, title,
 img, b, small, span, i, a, p,
 script, link, meta, div, header, button,
 fieldset, legend, label, input, form, textarea,
 table, thead, tbody, tr, th, td, tfoot,
 dl, dt, dd, ul, li,
 h1, h2, h3, h4, h5, h6} = React.DOM

Main = React.createClass
  getInitialState: ->
    editingPath: null
    status: null

  startEditing: (path) ->
    @setState
      editingPath: path

  publish: ->
    # get password
    if not @pass
      @pass = prompt "Your GitHub password:"
      if @pass
        DOCS.password @pass

    # build tree and deploy
    @setState status: 'Fetching your files and building your HTML'
    DOCS.buildGitHubTree (err, tree) =>
      console.log err if err
      if not err
        @setState status: 'Deploying to GitHub'
        DOCS.deploy tree, (err, res) =>
          console.log err, res
          @setState status: null
          location.reload()

  republishAll: ->
    @setState status: 'Marking all files to rerender'
    DOCS.touchAll (err) =>
      @publish() if not err

  render: ->
    (div className: 'row',
      (div className: 'fourth',
        (ul className: 'tree',
          (DocTree
            key: ''
            title: ''
            onSelect: @startEditing
            defaultOpened: true)
        )
        (div className: 'button-container',
          (button
            className: 'deploy warning'
            onClick: @publish
          , 'Publish')
        )
        (div className: 'button-container',
          (button
            className: 'deploy error'
            onClick: @republishAll
          , 'Rerender and republish all')
        )
      )
      (div className: 'three-fourth',
        (Edit
          path: @state.editingPath
          onDelete: @onDelete
        )
      )
      (Modal visible: @state.status,
        (h1 {}, @state.status)
      )
    )

  onDelete: ->
    @setState editingPath: null

DocTree = React.createClass
  getInitialState: ->
    opened: if @props.defaultOpened then true else false

  openTree: (e) ->
    e.preventDefault() if e
    @setState opened: !@state.opened

  editDocument: (e) ->
    e.preventDefault()
    @props.onSelect @props.key

  addDocumentHere: (e) ->
    e.preventDefault()
    slug = prompt('Choose a slug for the new page (something that looks nice in a URL, like "my-new-page"):')
    if slug
      DOCS.addDoc concatPath [@props.key, slug]
      if @state.opened
        @forceUpdate()
      else
        @openTree()

  render: ->
    children = DOCS.doc_index[@props.key].children

    (li {},
      (a
        href: '#'
        onClick: @openTree
      , if @state.opened then '⇡' else '⇣') if children.length
      (a
        href: '#'
        onClick: @editDocument
      , @props.title + '/')
      (a
        href: '#'
        onClick: @addDocumentHere
      , ' +')
      (ul {},
        (DocTree
          key: concatPath [@props.key, child.slug]
          title: child.slug
          onSelect: @props.onSelect
        ) for child in children
      ) if @state.opened
    )

Edit = React.createClass
  getInitialState: ->
    raw: ''

  componentDidMount: ->
    @fetch @props.path

  componentWillReceiveProps: (nextProps) ->
    @setState raw: ''
    @fetch nextProps.path

  fetch: (path) ->
    if typeof path isnt 'string'
      return
    DOCS.fetchRaw path, (err, raw) =>
      @setState raw: raw

  handleChange: (e) ->
    @setState raw: e.target.value

  save: (e) ->
    e.preventDefault() if e
    DOCS.modifyRaw @props.path, @state.raw

  delete: (e) ->
    e.preventDefault()
    if confirm('Are you sure you want to delete ' + @props.path + '?')
      DOCS.deleteDoc @props.path
      @props.onDelete()

  render: ->
    (div className: 'edit three-fourth',
      (form
        onSubmit: @save
      ,
        (fieldset {},
          (label {}, @props.path)
          (button
            className: 'warning'
            onClick: @delete
          , 'delete this')
          (textarea
            value: @state.raw
            onChange: @handleChange
          )
          (div className: 'button-container',
            (button
              className: 'primary'
            , 'Save')
          )
        )
      ) if typeof @props.path is 'string'
    )

# github client
gh_data = /([\w-_]+)\.github\.((io|com)\/)([^/]*)\/?([^/]*)/.exec(location.href)
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

DOCS = new Docs user, repo
DOCS.init ->
  React.renderComponent Main(), document.body
