React = require 'react'
Feed = require 'feed'
request = require 'superagent'
Handlebars = require 'handlebars'
TAFFY = require 'taffydb'

{div, ul, li, a, h1, h2, textarea} = React.DOM

yaml = (text) ->
  parsed = require('front-matter').fm(text)
  parsed.attributes.__content = parsed.body
  return parsed.attributes
slug = require 'slug'
marked = require 'marked'
marked.setOptions
  gfm: true
  tables: true
  breaks: true
  smartypants: true

# github client
gh_data = /([\w-_]+)\.github\.((io|com)\/)([\w-_]*)/.exec(location.href)
if gh_data
  user = gh_data[1]
  repo = gh_data[4] or "#{user}.github.#{gh_data[3]}"
else
  user = prompt "Your GitHub username for this blog:"
  repo = prompt "The name of the repository in which this blog is hosted:"

pass = prompt "Password for the user #{user}:"
gh = new Github
  username: user
  password: pass
  auth: 'basic'

repo = gh.getRepo user, repo
branch = repo.bind @, 'gh-pages'
publish = (documents) ->
  # 1 get templates from _base folder
  # 2 mix then with the preprocessed documents
  # 3 build the html pages
  # 4 commit them to github

  # get the templates
  curl "text!#{site.baseUrl}/_templates/base.html", (base) ->
    request.get

    Handlebars.registerPartial ''

    # feed
    #feed = new Feed
    #  title: meta.blogname
    #  description: meta.description
    #  link: meta.link
    #  image: @link + '/image.png'
    #  author: meta.author
    #for post in posts.slice(0, 5)
    #  feed.item
    #    title: post.title
    #    link: meta.link + '/' + post.id
    #    author: [meta.author]
    #    date: post.date
    #    description: post.html
    #tree['atom.xml'] = feed.render 'atom-1.0'

    # send commit 
    branch.write tree
  )

ListPosts = React.createClass
  getInitialState: ->
    posts: []
    selected: -1

  componentDidMount: ->
    branch.contents('_posts').done (contents) =>
      for file in contents when file.type is 'file'
          branch.contents(file.path).done (content) =>
            @state.posts.push atob content.content

  handleListClick: (n) ->
    @state.selected = n

  handlePostChange: (rawContent) ->
    if @state.selected
      @state.posts[@state.selected] = rawContent
    else
      @state.posts.push(rawContent)
      @state.selected = @state.posts.length-1

  publish: (e) ->
    # get parameters
    params =
      posts_per_page: 3
    meta =
      blogname: ''
      description: ''
      domain: location.host
      link: location.href.split('/').slice(0, -1).join('/')
      author:
        gravatar_id: ''
        name: ''
        email: ''
    #sections =
    #  last_posts:
    #    label: 'last posts'
    #    posts: posts



  e.preventDefault()

  render: ->
    posts = []
    for rawContent in @state.posts
      post = yaml rawContent
      post.id = post.id or slug post.title
    if @state.selected >= 0
      editing = posts[@state.selected]
    else
      editing = false

    (div {},
      (List posts: posts, reportClick: @handleListClick),
      (Post editing: editing, reportChange: @handlePostChange),
      (a href: '#', onClick: @publish, 'publish')
    )

List = React.createClass
  handleClick: (n, e) ->
    @props.reportClick n
    e.preventDefault()

  render: ->
    (div {},
      (ul {}, (
        (li {onClick: handleClick.bind @, n}, "#{post.date} - #{post.title}")
      ) for post, n in @props.posts)
    )

Post = React.createClass
  handleChange: (e) ->
    @props.reportChange e.target.value

  render: ->
    if 'editing' not of @props
      editing =
        title: ''
        date: ''
        __content: '---
              title: 
              date: 
              ---

             '
    else
      editing = @props.editing

    (div {},
      (h2 {}, editing.title),
      (h1 {}, editing.date),
      (textarea
        value: editing.__content
        onChange: @handleChange
      )
    )

React.renderComponent ListPosts(), document.getElementById 'edit'
