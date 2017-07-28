const gh = require('./helpers/github')
const page = require('page')
const {atom, derive, transact, proxy} = require('derivable')
const matter = require('gray-matter')
const mimeTypes = require('render-media/lib/mime.json')

const {ADD, REPLACE, UPLOAD, EDIT, DIRECTORY} = require('./constants').modes
const base64 = require('./helpers/base64')
const log = require('./log')

/* STATE */

var state = {
  loggedUser: atom(null),

  route: atom({
    componentName: 'div',
    ctx: {params: {}}
  }),

  owner: derive(() => state.route.get().ctx.params.owner),
  repo: derive(() => state.route.get().ctx.params.repo),
  slug: derive(() =>
    state.repo.get()
      ? state.owner.get() + '/' + state.repo.get()
      : null
  ),

  editedValues: atom({}),

  tree: atom([]),
  bypath: derive(() => {
    var bypath = {}
    for (let i = 0; i < state.tree.get().length; i++) {
      let f = state.tree.get()[i]
      bypath[f.path] = f
    }
    return bypath
  }),
  images: derive(() => state.tree.get().filter(f => f.path.match(/(jpe?g|gif|png|svg)$/))),

  mode: atom(ADD),
  existing: derive(() => {
    switch (state.mode.get()) {
      case EDIT:
      case REPLACE:
      case DIRECTORY:
        return true
      case ADD:
      case UPLOAD:
        return false
    }
  }),

  current: {
    directory: atom(''),
    gh_contents: atom(null),
    givenName: atom(''),

    path: derive(() =>
      state.current.gh_contents.get()
        ? state.current.gh_contents.get().path
        : [state.current.directory.get(), state.current.givenName.get()]
            .filter(x => x)
            .join('/')
    ),
    name: derive(() => state.current.path.get().split('/').slice(-1)[0]),
    ext: derive(() => state.current.name.get().split('.').slice(-1)[0]),
    mime: derive(() => mimeTypes['.' + state.current.ext.get()]),
    frontmatter: derive(() =>
      state.current.mime.get() === 'text/x-markdown' ||
      state.current.mime.get() === 'text/html'
    ),

    deleting: atom(false),
    loading: derive(() =>
      state.existing.get() && !state.current.gh_contents.get()
    ),

    data: derive(() => {
      let r = state.current.gh_contents.get()
      if (!r || !r.content) return ''

      try {
        return base64.decode(r.content)
      } catch (e) {
        console.warn(e)
        return null
      }
    }),
    upload: {
      file: atom(null),
      base64: atom(null)
    },

    edited: {
      content: proxy({
        get: () => {
          state.current.path.get() // side-effects to the rescue

          let cur = location.hash
          let th = state.editedValues.get()[cur] || {}
          return th.content || null
        },
        set: (val) => {
          state.current.path.get() // side-effects to the rescue

          let ed = {...{}, ...state.editedValues.get()}
          let cur = location.hash
          let th = ed[cur] || {}
          th.content = val
          ed[cur] = th
          state.editedValues.set(ed)
        }
      }),
      metadata: proxy({
        get: () => {
          state.current.path.get() // side-effects to the rescue

          let cur = location.hash
          let th = state.editedValues.get()[cur] || {}
          return th.metadata || null
        },
        set: (val) => {
          state.current.path.get() // side-effects to the rescue

          let ed = {...{}, ...state.editedValues.get()}
          let cur = location.hash
          let th = ed[cur] || {}
          th.metadata = th.metadata || {}
          th.metadata = val
          ed[cur] = th
          state.editedValues.set(ed)
        }
      })
    },

    stored: derive(() => {
      let data = state.current.data.get()
      if (!data) return {}
      if (state.current.frontmatter.get()) {
        try {
          let {data: metadata, content} = matter(data)
          return {metadata, content}
        } catch (e) {
          return {metadata: {}, content: data}
        }
      } else {
        return {content: data}
      }
    }),
    shown: {
      content: derive(() =>
        typeof state.current.edited.content.get() === 'string'
          ? state.current.edited.content.get()
          : state.current.stored.get().content
      ),
      metadata: derive(() =>
        state.current.edited.metadata.get() || state.current.stored.get().metadata || {})
    }
  },

  mediaUpload: {
    file: atom(null),
    base64: atom(null)
  }
}
module.exports = state


/* REACTIONS */

state.current.gh_contents.react(() => {
  if (!state.tree.get().length) return

  let res = state.current.gh_contents.get()
  if (!res) return

  resetTreeForCurrent()
})


/* ACTIONS */

module.exports.clearCurrent = clearCurrent
function clearCurrent () {
  state.current.deleting.set(false)
  state.current.directory.set('')
  state.current.gh_contents.set(null)
  state.current.givenName.set('')
  state.current.upload.file.set(null)
  state.current.upload.base64.set(null)
}

module.exports.loadFile = loadFile
function loadFile (path) {
  log.info(`Loading ${path} from GitHub.`)
  return gh.get(`repos/${state.slug.get()}/contents/${path}`, {ref: 'master'})
    .then(res => {
      transact(() => {
        if (res.path) {
          state.current.gh_contents.set(res)
          state.mode.set(EDIT)
          log.info(`Loaded ${path}.`)
        } else if (Array.isArray(res)) {
          state.current.directory.set(path)
          state.mode.set(DIRECTORY)
        }
      })
    })
    .catch(log.error)
}

module.exports.newFile = newFile
function newFile (dirpath) {
  return window.coisas.defaultNewFile(dirpath)
    .then(({name, content, metadata}) => {
      transact(() => {
        clearCurrent()
        state.current.directory.set(dirpath)
        state.current.givenName.set(name)
        state.mode.set(ADD)
      })

      setTimeout(() => transact(() => {
        if (state.current.edited.content.get() === null) {
          state.current.edited.content.set(content)
          state.current.edited.metadata.set(metadata)
        }
      }), 1)
    })
}

module.exports.loadTree = loadTree
function loadTree () {
  return gh.get(`repos/${state.slug.get()}/git/refs/heads/master`)
  .then(ref =>
    gh.get(
     `repos/${state.slug.get()}/git/trees/${ref.object.sha}`,
     {recursive: 5}
    )
  )
  .then(tree => {
    // add a fake top level dir
    tree.tree.unshift({
      mode: '040000',
      path: '',
      sha: '~',
      type: 'tree',
      url: '~'
    })

    tree.tree = tree.tree.filter(window.coisas.filterTreeFiles)

    for (let i = 0; i < tree.tree.length; i++) {
      let f = tree.tree[i]
      f.collapsed = true
      f.active = false
    }

    state.tree.set(
      // sort to show directories first
      tree.tree.sort((a, b) => {
        if (a.type === 'blob' && b.type === 'tree') return 1
        else if (a.type === 'tree' && b.type === 'blob') return -1
        else return a.path < b.path ? -1 : 1
      })
    )
  })
  .catch(log.error)
}

module.exports.resetTreeForCurrent = resetTreeForCurrent
function resetTreeForCurrent () {
  let path = state.current.path.get()

  var updatedTree = []
  for (let i = 0; i < state.tree.get().length; i++) {
    let f = state.tree.get()[i]

    // open all directories up to the selected file
    if (path.slice(0, f.path.length) === f.path) {
      f.collapsed = false
    }

    // reset active state
    f.active = false

    updatedTree.push(f)
  }

  if (state.existing.get()) {
    // mark the currently selected file as active
    state.bypath.get()[path].active = true
  } else {
    // mark the currently selected directory as active
    state.bypath.get()[state.current.directory.get()].active = true
  }

  state.tree.set(updatedTree)
}

module.exports.loadUser = loadUser
function loadUser () {
  return gh.get('user')
    .then(res => {
      state.loggedUser.set(res.login)
      log.info(`Logged as ${res.login}.`)
    })
    .catch(e => {
      console.log('could not load GitHub token or used an invalid token.', e)
      state.loggedUser.set(null)
    })
}


/* ROUTES */

page('/', ctx => state.route.set({componentName: 'index', ctx}))
page('/:owner/:repo/*', ctx => {
  window.tc && window.tc(2)

  window.coisas.loadPreferences(ctx)
    .then(() => {
      state.route.set({componentName: 'repo', ctx})

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          currentRepo: state.slug.get()
        })
      }

      let [k, dirpath] = ctx.querystring.split('=')
      let filePromise = k === 'new-file-at'
        ? newFile(dirpath)
        : loadFile(ctx.params[0])

      loadUser()
      Promise.all([
        filePromise,
        loadTree()
      ]).then(() => {
        resetTreeForCurrent()
      })
    })
})
page({hashbang: true})
