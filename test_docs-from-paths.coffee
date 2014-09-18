paths = [
  'README.md',
  'x/README.md'
  'x/y/README.md'
  'a/README.md'
  'a/b/README.md'
  'a/c/README.md'
  'a/c/d/README.md'
  'a/c/f/README.md'
]

docsFromPaths = require './docs-from-paths.coffee'
pretty = (x) ->
  console.log JSON.stringify x, null, 2

pretty docsFromPaths paths
