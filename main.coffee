GitHub = require './github.coffee'
YAML = require 'yaml-js'
templateDefault = require './template-default.coffee'
fm = require 'front-matter'
marked = require 'marked'

require './rs.coffee'

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

  startEditing: (path) ->
    @setState
      editingPath: path

  render: ->
    (div className: 'pure-g',
      (div className: 'pure-u-1-4',
        (ul className: 'tree',
          (DocTree
            key: '/'
            onSelect: @startEditing
            defaultOpened: true)
        )
      )
      (div className: 'pure-u-3-4',
        (Edit
          path: @state.editingPath
        )
      )
    )

DocTree = React.createClass
  getInitialState: ->
    children: []
    opened: if @props.defaultOpened then true else false

  componentDidMount: ->
    remoteStorage.coisas.listChildrenNames @props.key, (children) =>
      @setState children: children

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
      , @props.title or @props.key)
      (ul {},
        (DocTree
          key: @props.key + child.path
          title: child.title
          onSelect: @props.onSelect
        ) for child in @state.children
      ) if @state.opened
    )

Edit = React.createClass
  getInitialState: ->
    meta: {}
    text: {}
    data: {}

  componentDidMount: ->
    remoteStorage.coisas.getNode @props.path, (meta, text, data) =>
      @setState
        meta: meta
        text: text
        data: data

  handleChange: (attr, e) ->
    @state[attr].content = e.target.value
    @setState @state

  save: (e) ->
    e.preventDefault() if e
    remoteStorage.coisas.putNode @props.path, @state.meta, @state.text, @state.data, ->
      console.log 'saved ' + @props.path

  render: ->
    (div className: 'edit',
      (form
        className: 'pure-form pure-form-stacked'
        onSubmit: @save
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
            'Save')
        )
      ) if @props.path
    )

remoteStorage.access.claim 'coisas', 'rw'
remoteStorage.displayWidget()
remoteStorage.setSyncInterval 1000000
container = document.getElementById 'main'
remoteStorage.on 'ready', ->

  remoteStorage.on 'disconnected', ->
    React.unMountComponentAtNode container

  React.renderComponent Main(), container
