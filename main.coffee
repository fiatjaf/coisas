GitHub = require './github.coffee'
YAML = require 'yaml-js'
templateDefault = require './template-default.coffee'
fm = require 'front-matter'
marked = require 'marked'

marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

{html, body, head, title,
 img, b, small, span, i, a, p,
 script, link, meta, div, button,
 fieldset, legend, label, input, form, textarea,
 table, thead, tbody, tr, th, td, tfoot,
 dl, dt, dd, ul, li,
 h1, h2, h3, h4, h5, h6} = React.DOM

Main = React.createClass
  getInitialState: ->
    editingPath: null
    editingContent: null

  startEditing: (path, content) ->
    @setState
      editingPath: path
      editingContent: content

  render: ->
    (div className: 'pure-g',
      (div className: 'pure-u-1-3',
        (ul className: 'tree',
          (DocTree
            key: ''
            onSelect: @startEditing
            defaultOpened: true)
        )
      )
      (div className: 'pure-u-2-3',
        (Edit
          path: @state.editingPath
          content: @state.editingContent)
      )
    )

DocTree = React.createClass
  getInitialState: ->
    children: mori.list()
    content: mori.hash_map()
    opened: if @props.defaultOpened then true else false

  componentDidMount: ->
    coisas.getListing(@props.key).then (listing) =>
      for path, data of listing
        if path.slice(-1)[0] == '/'
          @state.children = mori.conj @state.children, path
        else
          @state.content = mori.assoc @state.content, data.mimeType, path
      @setState @state

  openTree: (e) ->
    e.preventDefault()
    @setState opened: !@state.opened

  editDocument: (e) ->
    e.preventDefault()
    @props.onSelect @props.key, @state.content

  render: ->
    (li {},
      (a
        href: '#'
        onClick: @openTree
      , if @state.opened then '⇡' else '⇣') if mori.count @state.children
      (a
        href: '#'
        onClick: @editDocument
      , '/' + mori.last mori.filter mori.identity, @props.key.split '/')
      (ul {},
        (mori.into_array mori.map ((file) =>
          (DocTree
            key: file.path
            onSelect: @props.onSelect
          )
        ), @state.children)
      ) if @state.opened
    )

Edit = React.createClass
  getInitialState: ->
    text: {}
    data: {}
    output: null

  renderHTML: ->

  handleChange: (attr, e) ->
    @state[attr].content = e.target.value
    @renderHTML()
    @setState @state

  publish: (e) ->
    e.preventDefault() if e
    gh = new GitHub

  render: ->
    (form
      className: 'pure-form pure-form-stacked edit'
      onSubmit: @publish
    ,
      (fieldset {},
        (label {}, @state.text.path)
        (textarea
          value: @state.text.content
          onChange: @handleChange.bind @, 'text'
        )
        (label {}, @state.data.path)
        (textarea
          value: @state.data.content
          onChange: @handleChange.bind @, 'data'
        )
        (button className: 'pure-button pure-burron-primary',
          'Save and publish')
      )
    )

remoteStorage.access.claim 'coisas', 'rw'
remoteStorage.displayWidget()
coisas = remoteStorage.scope '/coisas/'

React.renderComponent Main(), document.getElementById 'main'
