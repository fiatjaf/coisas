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
    req.get(@base + "/repos/#{@user}/#{@repo}/branches")
       .set(@headers)
       .end (res) ->
         dontCreateDataBranch = false

         for branch in res.body
           if branch.name == 'data'
             dontCreateDataBranch = true
             @data_last_commit_sha = branch.commit.sha
           if branch.name == 'gh-pages'
             @gh_pages_last_commit_sha

         unless dontCreateDataBranch
           req.post(@base + "/repos/#{}/#{}/git/refs")
              .set(@headers)
              .send({
                sha: @gh_pages_last_commit_sha
                ref: 'refs/heads/data'
              })
              .end (res) ->
                @data_last_commit_sha = res.body.object.sha

  listDocs: (cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/_docs")
       .set(@headers)
       .query(branch: 'data')
       .end (res) -> cb res.body
  fetchDoc: (id, cb) ->
    req.get(@base + "/repos/#{@user}/#{@repo}/contents/_docs/#{id}.json")
       .set(@headers)
       .query(branch: 'data')
       .end (res) =>
         doc = JSON.parse atob res.body.content
         doc._sha = res.body.sha
         cb doc
  saveDoc: (doc, cb) ->
    if not doc._id
      doc._id = id()
    document = btoa JSON.stringify doc
    req.put(@base + "/repos/#{@user}/#{@repo}/contents/_docs/#{doc._id}.json")
       .set(@headers)
       .send({
          branch: 'data'
          path: "_docs/#{doc._id}.json"
          sha: doc._sha if doc._sha
          content: document
          message: doc._id
        })
       .end (res) ->
         @data_last_commit_sha = res.body.commit.sha
         cb res.body
  deploy: (processedDocs, cb) ->
    # get last commit sha
    req.get(@base + "/repos/#{@user}/#{@repo}/branches/gh-pages")
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
                   req.patch(@base + "/repos/#{@user}/#{@repo}/git/refs/heads/gh-pages")
                      .set(@headers)
                      .send(sha: new_commit_sha, force: true)
                      .end (res) =>
                        if res.status == 200
                          cb(res.body)

module.exports = GitHub
