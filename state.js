const gh = require('./helpers/github')
const page = require('page')
const {observable, observe} = require('@nx-js/observer-util')

var state = observable({
  route: {
    component: 'div',
    ctx: {}
  },
  tree: [],
  file: {
    loading: null,
    loaded: false,
    selected: null,
    content: null
  }
})
module.exports = state

page('/', ctx => {
  state.route = {component: components['index'], ctx}
})

page('/:user/:repo/*', ctx => {
  state.route = {component: components['repo'], ctx}
  state.user = ctx.params.user
  state.repo = ctx.params.repo

  gh.get(`repos/${state.user}/${state.repo}/git/refs/heads/master`)
  .then(ref =>
    gh.get(
     `repos/${state.user}/${state.repo}/git/trees/${ref.object.sha}`,
     {recursive: 5}
    )
  )
  .then(tree => {
    state.tree = tree.tree
    state.file.selected = ctx.params[0]
  })
})

observe(() => {
  let willLoad = state.file.selected

  if (!willLoad || state.file.loading === willLoad) {
    return
  }
  state.file.loading = willLoad
  state.file.editedContent = null

  gh.get(`repos/${state.user}/${state.repo}/contents/${willLoad}`,
     {ref: 'master', headers: {'Accept': 'application/vnd.github.v3.raw'}})
  .then(res => {
    state.file.loaded = willLoad
    state.file.content = res
  })
})

const components = require('./components')

page({hashbang: true})

