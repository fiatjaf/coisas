AsyncCache = require 'async-cache'
request = require 'superagent'
mori = require 'mori'

p = location.href.split('/')
user = p[2].split('.')[0]
switch
  when p[4]
    repo = p[3]
    branch = 'gh-pages'
  else
    repo = user + '.github.io'
    branch = 'master'

contents = new AsyncCache
  max: 1000
  maxAge: 1000 * 60 * 10
  load: (key, cb) ->
    if key.slice(-1)[0] == '/'
      key = key.slice(0, -1)
    request.get("https://api.github.com/repos/#{user}/#{repo}/contents/" + key)
           .set('Accept', 'application/vnd.github.v3+json')
           .set('Content-type', 'application/json')
           .query('ref': branch)
           .end (res) ->
      o = res.body
      if o.content
        o.content = atob o.content
      cb o

class GitHub
  constructor: ->

  fetch: (path, cb) ->
    contents.get(path, cb)

  save: (path, content, cb) ->
    p = path.split('?')
    path = p[0]
    sha = p[1]
    status = if sha then 'updated ' else 'created '
    req = request.put("https://api.github.com/repos/#{user}/#{repo}/contents/#{path}")
                 .set('Accept', 'application/vnd.github.v3+json')
                 .set('Content-type', 'application/json')
                 .set('Authorization', atob user + ':' + @password)
                 .query('branch', branch)
                 .query('message', status + path)
    if sha
      req.query('sha', sha)

    req.end (res) ->
      cb res.body

  setPass: (password) ->
    @password = password

module.exports = GitHub
