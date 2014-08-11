React = require 'react'
TreeView = require 'react-treeview'
GitHub = require './github.coffee'
I = require 'immutable'

{html, body, head, title,
 img, b, small, span, i, a, p,
 script, link, meta, div, button,
 fieldset, legend, label, input, form, textarea,
 table, thead, tbody, tr, th, td, tfoot,
 dl, dt, dd, ul, li,
 h1, h2, h3, h4, h5, h6} = React.DOM

gh = new GitHub

Tree = React.createClass
  getInitialState: ->
    dir: {}
    opened: '/'

  componentDidMount: -> @fetchOpenDir()
  componentDidUpdate: -> @fetchOpenDir()
  fetchOpenDir: ->
    gh.fetch @state.opened

  handleClick: (nodePath, e) ->
    @setState opened: nodePath

  render: ->
    children = (parent) ->
      if parent not of @state.dir
        return []

      nodeChildren = @state.dir[parent].children
      elements = []
      for node in nodeChildren
        nodePath = parent + node.slug + '/'
        elements.push (TreeView
          onClick: @handleClick
          key: nodePath
          collapsed: RegExp('^' + nodePath).exec(@state.opened).length
        , children(nodePath))

    (div {},
      (TreeView
        key: '/'
        onClick: @handleClick
        collapsed: @state.opened != '/'
      , children('/'))
    )


