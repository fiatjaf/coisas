React = require 'react'
Docs = require './docs.coffee'

{html, body, head, title,
 img, b, small, span, i, a, p,
 script, link, meta, div, button,
 fieldset, legend, label, input, form, textarea,
 table, thead, tbody, tr, th, td, tfoot,
 dl, dt, dd, ul, li,
 h1, h2, h3, h4, h5, h6} = React.DOM

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

DOCS = new Docs user
pass = prompt "Password for the user #{user}:"
if pass
  DOCS.password pass
DOCS.repo repo

Main = React.createClass
  getInitialState: ->
    editingPath: null

  startEditing: (path) ->
    @setState
      editingPath: path

  publish: ->
    DOCS.buildGitHubTree (tree) =>
      DOCS.deploy tree, (res) =>
        console.log res

  render: ->
    (div className: 'row',
      (div className: 'fourth',
        (button
          className: 'deploy warning'
          onClick: @publish
        , 'Publish')
        (ul className: 'tree',
          (DocTree
            key: ''
            children: DOCS.docIndex[''].children
            onSelect: @startEditing
            defaultOpened: true)
        )
      )
      (div className: 'three-fourth',
        (Edit
          path: @state.editingPath
        )
      )
    )

DocTree = React.createClass
  getInitialState: ->
    opened: if @props.defaultOpened then true else false

  openTree: (e) ->
    e.preventDefault()
    @setState opened: !@state.opened

  editDocument: (e) ->
    e.preventDefault()
    @props.onSelect @props.key

  render: ->
    (li {},
      (a
        href: '#'
        onClick: @openTree
      , if @state.opened then '⇡' else '⇣') if @state.children.length
      (a
        href: '#'
        onClick: @editDocument
      , @props.title + '/')
      (ul {},
        (DocTree
          key: @props.key
          children: DOCS.docIndex[@props.key].children
          title: DOCS.docIndex[@props.key].path.slice(-1)[0]
          onSelect: @props.onSelect
        ) for child in @props.children
      ) if @state.opened
    )

Edit = React.createClass
  getInitialState: ->
    raw: ''

  componentDidMount: ->
    @fetch()

  componentWillUpdate: ->
    @setState raw: ''

  componentDidUpdate: ->
    @fetch()

  fetch: ->
    DOCS.fetchRaw @props.path, (raw) =>
      @setState raw: raw

  handleChange: (e) ->
    @setState raw: e.target.value

  save: (e) ->
    e.preventDefault() if e
    DOCS.modifyRaw @props.path, @state.raw

  render: ->
    (div className: 'edit',
      (form
        onSubmit: @save
      ,
        (fieldset {},
          (label {}, @props.path)
          (textarea
            value: @state.raw
            onChange: @handleChange
          )
          (button
            className: 'primary'
          , 'Save')
        )
      ) if @props.path
    )

React.renderComponent Main(), container
