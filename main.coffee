React = require 'react'
GitHub = require './github.coffee'
Baby = require 'babyparse'
templateDefault = require './template-default.coffee'
yaml = require 'yaml-js'
fm = require 'front-matter'
marked = require 'marked'
mori = require 'mori'

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

gh = new GitHub

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

  contentFilenames: mori.set ['data.json', 'data.csv', 'data.yaml', 'text.md', 'text.html']
  componentDidMount: ->
    gh.fetch @props.key, (children) =>
      if children.length # is array
        for file in children
          if file.type == 'dir' and file.path isnt 'assets'
            @state.children = mori.conj @state.children, file
          else if file.type == 'file'
            filename = mori.last mori.filter mori.identity, file.path.split '/'
            if mori.has_key @contentFilenames, filename
              kind = mori.first filename.split '.'
              @state.content = mori.assoc @state.content, kind, file
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

  componentDidUpdate: (prevProps) ->
    # do these things if it is a new file
    if prevProps.path != @props.path
      # text
      textPath = (mori.get(@props.content, 'text') or {}).path
      if textPath
        gh.fetch textPath, (file) =>
          @setState
            text:
              path: file.path + '?' + file.sha
              content: file.content
      else
        @setState
          text:
            path: @props.path + '/text.md'
            content: ''
        
      # data
      dataPath = (mori.get(@props.content, 'data') or {}).path
      if dataPath
        gh.fetch dataPath, (file) =>
          @setState
            data:
              path: file.path + '?' + file.sha
              content: file.content
      else
        @setState
          data:
            path: @props.path + '/data.yaml'
            content: ''

  renderHTML: ->
    textType = mori.last (mori.get @props.content, 'text').split '.'
    html = switch textType
      when 'html' then @state.text.content
      when 'md'
        p = fm @state.text.content
        meta = p.attributes
        text = marked p.body

        # data only matters when text is .md
        dataType = mori.last (mori.get @props.content, 'data').split '.'
        parseData = switch dataType
          when 'csv' then (data) -> Baby.parse(csv).data
          when 'yaml' then yaml.load
          when 'json' then JSON.parse
        try
          data = parseData @state.data.content
        catch (e)
          data = {}

        # processor and template
        if not meta.template
          @setState
            html: templateDefault text, meta, data, @props.children
        else
          Templates.load meta.template, (template) =>
            @setState
              template: template text, meta, data, @props.children

  handleChange: (attr, e) ->
    @state[attr].content = e.target.value
    @renderHTML()
    @setState @state

  publish: (e) ->
    e.preventDefault() if e
    gh.save
      path: @state.path
      @state.content

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

React.renderComponent Main(), document.getElementById 'main'
