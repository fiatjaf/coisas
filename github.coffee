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

  gitStatus: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
       .set(@headers)
       .end (res) =>
         @master_commit_sha = res.body.commit.sha
         @last_tree_sha = res.body.commit.commit.tree.sha

         cb(res.body) if typeof cb == 'function'

  deploy: (tree, cb) ->
    # post new tree
    req.post(@base + "/repos/#{@user}/#{@repo}/git/trees")
       .set(@headers)
       .send(tree: tree)
       .end (res) =>
         new_tree_sha = res.body.sha

         # abort if deployment is unchanged / commit empty
         if @last_tree_sha == new_tree_sha
           return true

         # commit the tree merging the two branches
         req.post(@base + "/repos/#{@user}/#{@repo}/git/commits")
            .set(@headers)
            .send(
              message: 'P U B L I S H'
              tree: new_tree_sha
              parents: [@master_commit_sha]
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
