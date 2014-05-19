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
    @branch = if repo == "#{@user}.github.io" then 'master' else 'gh-pages'
  listDocs: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/docs")
       .set(@headers)
       .query(branch: @branch)
       .end (res) -> cb res.body
  deleteFile: (path, cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/#{path}")
       .set(@headers)
       .query(ref: @branch)
       .end (res) =>
         return cb() if res.status != 200
         req.del(@base + "/repos/#{@user}/#{@repo}/contents/#{path}")
            .set(@headers)
            .query({
              sha: res.body.sha
              message: "DELETE #{path}"
              branch: @branch
            })
            .end (res) ->
              if res.status == 200
                cb res.body
  deploy: (processedDocs, cb) ->
    # get last commit sha
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/#{@branch}")
       .set(@headers)
       .end (res) =>
         last_commit_sha = res.body.commit.sha
         last_tree_sha = res.body.commit.commit.tree.sha

         # create new tree
         tree = []
         for path, content of processedDocs
           tree.push
             path: path
             mode: '100644'
             type: 'blob'
             content: content

         # post new tree
         req.post(@base + "/repos/#{@user}/#{@repo}/git/trees")
            .set(@headers)
            .send({
              base_tree: last_tree_sha
              tree: tree
            })
            .end (res) =>
              new_tree_sha = res.body.sha

              # abort if deployment is unchanged / commit empty
              if last_tree_sha == new_tree_sha
                return true

              # commit the tree
              req.post(@base + "/repos/#{@user}/#{@repo}/git/commits")
                 .set(@headers)
                 .send(
                   message: 'P U B L I S H'
                   tree: new_tree_sha
                   parents: [last_commit_sha]
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
