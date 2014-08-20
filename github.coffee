request = window.superagent

p = location.href.split('/')
user = p[2].split('.')[0]
switch
  when p[4]
    repo = p[3]
    branch = 'gh-pages'
  else
    repo = user + '.github.io'
    branch = 'master'

class GitHub
  constructor: (@user, @repo, @pass) ->
    @headers =
      'Content-type': 'application/json'
      'Authorization': 'Basic ' + btoa(@user + ':' + @pass)

  base: 'https://api.github.com'

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
