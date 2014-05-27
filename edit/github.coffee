req = require 'superagent'

GitHub = (user) ->
  base: 'https://api.github.com'
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
    if repo == "#{@user}.github.io" or repo == "#{@user}.github.com"
      @branch = 'master'
    else
      @branch = 'gh-pages'
  listDocs: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/docs")
       .set(@headers)
       .query(branch: @branch)
       .end (res) -> cb res.body

  getLastTree: (cb) ->
    # get last commit sha
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
       .set(@headers)
       .end (res) =>
         @last_commit_sha = res.body.commit.sha
         @last_tree_sha = res.body.commit.commit.tree.sha

         # get fixed content from the last tree
         req.get(@base + "/repos/#{@user}/#{@repo}/git/trees/#{@last_tree_sha}")
            .set(@headers)
            .query(recursive: 100)
            .end (res) =>
              cb res.body.tree

  deploy: (tree, cb) ->
    # post new tree
    console.log tree

    req.post(@base + "/repos/#{@user}/#{@repo}/git/trees")
       .set(@headers)
       .send(tree: tree)
       .end (res) =>
         new_tree_sha = res.body.sha

         # abort if deployment is unchanged / commit empty
         if @last_tree_sha == new_tree_sha
           return true

         # commit the tree
         req.post(@base + "/repos/#{@user}/#{@repo}/git/commits")
            .set(@headers)
            .send(
              message: 'P U B L I S H'
              tree: new_tree_sha
              parents: [@last_commit_sha]
            )
            .end (res) =>
              new_commit_sha = res.body.sha

              # update the branch with the commit
              req.patch(@base + "/repos/#{@user}/#{@repo}/git/refs/heads/#{@branch}")
                 .set(@headers)
                 .send(sha: new_commit_sha, force: true)
                 .end (res) =>
                   if res.status == 200
                     cb(res.body)

module.exports = GitHub
