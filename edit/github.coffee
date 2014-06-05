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

  fetchDataSha: (cb) ->
    # get last commit sha from 'data' branch
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/data")
       .set(@headers)
       .end (res) =>
         if res.body.commit
           @data_commit_sha = res.body.commit.sha
           cb(res.body) if typeof cb == 'function'
         else
           # get last commit sha from master/gh-pages branch
           req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
              .set(@headers)
              .end (res) =>
                commit_sha = res.body.commit.sha

                # create a branch named 'data' to hold docs and published html
                req.post(@base + "/repos/#{@user}/#{@repo}/git/refs")
                   .set(@headers)
                   .send(ref: 'refs/heads/data', sha: commit_sha)
                   .end (res) =>
                     @data_commit_sha = res.body.object.sha
                     cb(res.body) if typeof cb == 'function'

  fetchMasterSha: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
       .set(@headers)
       .end (res) =>
         @master_commit_sha = res.body.commit.sha
         @last_tree_sha = res.body.commit.commit.tree.sha

         cb(res.body) if typeof cb == 'function'

  getLastTree: (cb) ->
    # get fixed content from the last tree
    req.get(@base + "/repos/#{@user}/#{@repo}/git/trees/#{@last_tree_sha}")
       .set(@headers)
       .query(recursive: 100)
       .end (res) =>
         cb res.body.tree

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
              parents: [@master_commit_sha, @data_commit_sha]
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
