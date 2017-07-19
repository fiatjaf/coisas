const gh = require('./helpers/github')
const page = require('page')
const {atom, derive, transact} = require('derivable')
const matter = require('gray-matter')

var state = {
  route: atom({
    component: 'div',
    ctx: {}
  }),
  tree: atom([]),

  owner: derive(() => state.route.get().ctx.params.owner),
  repo: derive(() => state.route.get().ctx.params.repo),
  slug: derive(() => state.owner.get() + '/' + state.repo.get()),

  bysha: derive(() => {
    var bysha = {}
    for (let i = 0; i < state.tree.get().length; i++) {
      let f = state.tree.get()[i]
      bysha[f.sha] = f
    }
    return bysha
  }),

  bypath: derive(() => {
    var bypath = {}
    for (let i = 0; i < state.tree.get().length; i++) {
      let f = state.tree.get()[i]
      bypath[f.path] = f
    }
    return bypath
  }),

  file: {
    loading: atom(null),
    loaded: atom(false),
    selected: atom(null),
    data: atom(null),

    saved: derive(() => {
      if (!state.file.data.get()) return {}
      let {data: metadata, content} = matter(state.file.data.get())
      return {metadata, content}
    }),

    edited: {
      content: atom(null),
      metadata: atom(null)
    },

    shown: {
      content: derive(() => typeof state.file.edited.content.get() === 'string'
        ? state.file.edited.content.get()
        : state.file.saved.get().content),
      metadata: derive(() =>
        state.file.edited.metadata.get() || state.file.saved.get().metadata || {})
    },

    ext: derive(() => state.file.selected.get()
      ? state.file.selected.get().split('.').slice(-1)[0]
      : ''),
    finishedLoading: derive(() => state.file.loaded.get() === state.file.selected.get())
  }
}
module.exports = state

page('/', ctx => {
  state.route.set({componentName: 'index', ctx})
})

page('/:owner/:repo/*', ctx => {
  state.route.set({componentName: 'repo', ctx})

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      currentRepo: state.slug.get()
    })
  }

  gh.get(`repos/${state.slug.get()}/git/refs/heads/master`)
  .then(ref =>
    gh.get(
     `repos/${state.slug.get()}/git/trees/${ref.object.sha}`,
     {recursive: 5}
    )
  )
  .then(tree => {
    transact(() => {
      state.file.selected.set(ctx.params[0])
      state.file.loading.set(null)

      for (let i = 0; i < tree.tree.length; i++) {
        let f = tree.tree[i]
        f.collapsed = true
        f.active = false
      }

      state.tree.set(
        // sort to show directories first
        tree.tree.sort((a, b) => a.type === 'blob' ? 1 : -1)
      )
    })
  })
})

state.file.selected.react(() => {
  let justSelected = state.file.selected.get()

  if (!justSelected ||
      state.file.loading.get() === justSelected) return

  if (state.file.ext.get().match(/jpe?g|png|gif|svg/)) {
    state.file.loaded.set(justSelected)
    return
  }

  transact(() => {
    state.file.loading.set(justSelected)
    state.file.edited.content.set(null)
    state.file.edited.metadata.set({})
  })

  setTimeout(() => {
    var updatedTree = []
    for (let i = 0; i < state.tree.get().length; i++) {
      let f = state.tree.get()[i]

      // open all directories up to the selected file
      if (justSelected.slice(0, f.path.length) === f.path) {
        f.collapsed = false
      }

      // reset active state
      f.active = false

      updatedTree.push(f)
    }

    // mark the currently selected as active
    state.bypath.get()[justSelected].active = true
    state.tree.set(updatedTree)
  }, 1)

  gh.get(`repos/${state.slug.get()}/contents/${justSelected}`,
     {ref: 'master', headers: {'Accept': 'application/vnd.github.v3.raw'}})
  .then(res => {
    transact(() => {
      state.file.loaded.set(justSelected)
      state.file.data.set(res)
    })
  })
})

page({hashbang: true})
