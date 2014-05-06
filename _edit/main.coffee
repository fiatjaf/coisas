React = require 'react'
Feed = require 'feed'
Handlebars = require 'handlebars'
kinds = require './kinds.coffee'
req = require 'superagent'

{div, ul, li, a, h1, h2, textarea} = React.DOM

for name, kind of kinds
  Handlebars.registerPartial name, kind.template

# github client
gh_data = /([\w-_]+)\.github\.((io|com)\/)([\w-_]*)/.exec(location.href)
if gh_data
  user = gh_data[1]
  repo = gh_data[4] or "#{user}.github.#{gh_data[3]}"
else
  user = prompt "Your GitHub username for this blog:"
  repo = prompt "The name of the repository in which this blog is hosted:"

pass = prompt "Password for the user #{user}:"

GitHub = (user) ->
  base: 'https://api.github.com/'
  user: user
  repo: null
  headers:
    'Content-Type': 'application/json'
  password: (pass) ->
    @headers['Authorization'] = 'Basic ' + btoa(@user + ':' + pass)
  token: (token) ->
    @headers['Authorization'] = 'token ' + token
  repo: (repo) ->
    @repo = repo
  listDir: (path, cb) ->
    if not @repo
      return false
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/")
       .set(@headers)
       .end (res) -> cb res.body
  fetchDoc: (id, cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/_docs/#{id}.json")
       .set(@headers)
       .end (res) =>
         doc = JSON.parse atob res.body.content
         cb doc
  saveDoc: (doc, cb) ->
    document = btoa JSON.stringify doc
    req.put(@base + "/repos/#{@user}/#{@repo}/contents/_docs/#{doc._id}.json")
       .set(@headers)
       .send(
         branch: 'gh-pages'
         path: "_docs/#{doc._id}.json"
         sha: doc._sha if doc._sha
         content: document
         message: doc._id
        )
       .end (res) -> cb res.body
  deploy: (processedDocs, cb) ->
    # get last commit sha
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/gh-pages")
       .set(@headers)
       .end (res) =>
         last_commit_sha = res.body.commit.sha
         last_tree_sha = res.body.commit.tree.sha

         # create new tree
         tree = []
         for doc in processedDocs
           tree.push
             path: doc.path
             mode: '100644'
             type: 'blob'
             content: doc.rendered

         # post new tree
         req.post(@base + "/repos/#{@user}/#{@repo}/git/trees")
            .set(@headers)
            .send(base_tree: last_tree_sha, tree: tree)
            .end (res) =>
              new_tree_sha = res.body.sha

              # abort if deployment is unchanged / commit empty
              if new_tree_sha == res.body.sha
                return true

              # commit the tree
              req.post(@base + "/repos/#{@user}/#{@repo}/git/commits")
                 .set(@headers)
                 .send(
                   message: 'deployment'
                   tree: new_tree_sha
                   parents: [last_commit_sha]
                 )
                 .end (res) =>
                   new_commit_sha = res.body.sha

                   # update the branch with the commit
                   req.patch(@base + "/repos/#{@user}/#{@repo}/git/refs/heads/gh-pages")
                      .set(@headers)
                      .send(sha: new_commit_sha, force: true)
                      .end (res) =>
                        if res.status == 200
                          cb(res.body)

gh = new Github user, pass, repo

Main = React.createClass
  getInitialState: ->
    presentPath: ''
    shownDocs: []

  componentDidMount: ->
    @DOCS = TAFFY()

  onChangeDoc: (docid) ->
    

  render: ->
    (div {},
      (Organizer
        path: @state.presentPath
        listDocs: @DOCS parent: @state.presentPath + '/index.html'
        onChangeDoc: @handleSelectDoc),
      (div className: 'docs',
        (Doc data: doc for doc in @state.shownDocs)
      )
    )

Organizer = React.createClass
  render: ->
    (div {},
      (h2 {}, @props.path + '/'),
      (ul {},
        (li {}, doc.path) for doc in @propslistDocs
      )
    )

Doc = React.createClass
  render: ->
    (div {})

React.renderComponent Main(), document.body
