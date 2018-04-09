const page = require('page')
const {observable, computed, autorun} = require('mobx')
const matter = require('gray-matter')
const mimeTypes = require('render-media/lib/mime.json')

const gh = require('./helpers/github')
const {ADD, REPLACE, UPLOAD, EDIT, DIRECTORY} = require('./constants').modes
const base64 = require('./helpers/base64')
const log = require('./log')
const storage = require('./helpers/storage')

/* STATE */

var state = {
  loggedUser: observable.box(null),

  route: observable.box({
    componentName: 'div',
    ctx: {params: {}}
  }),

  owner: computed(() => state.route.get().ctx.params.owner),
  repo: computed(() => state.route.get().ctx.params.repo),
  slug: computed(() =>
    state.repo.get()
      ? state.owner.get() + '/' + state.repo.get()
      : null
  ),

  editedValues: observable.box({}),

  tree: observable.box([]),
  bypath: computed(() => {
    var bypath = {}
    for (let i = 0; i < state.tree.get().length; i++) {
      let f = state.tree.get()[i]
      bypath[f.path] = f
    }
    return bypath
  }),
  images: computed(() => state.tree.get().filter(f => f.path.match(/(jpe?g|gif|png|svg)$/))),

  mode: observable.box(ADD),
  existing: computed(() => {
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
  fullscreen: observable.box(false),

  current: {
    directory: observable.box(''),
    gh_contents: observable.box(null),
    givenName: observable.box(''),

    path: computed(() =>
      state.current.gh_contents.get()
        ? state.current.gh_contents.get().path
        : [state.current.directory.get(), state.current.givenName.get()]
            .filter(x => x)
            .join('/')
    ),
    name: computed(() => state.current.path.get().split('/').slice(-1)[0]),
    ext: computed(() =>
      state.current.name.get().split('.')[1]
        ? '.' + state.current.name.get().split('.')[1]
        : ''
    ),
    mime: computed(() => mimeTypes[state.current.ext.get()]),
    frontmatter: computed(() =>
      state.current.mime.get() === 'text/x-markdown' ||
      state.current.mime.get() === 'text/html'
    ),
    editable: computed(() =>
      (state.mode.get() === ADD || state.mode.get() === EDIT) && ({
        'text/x-markdown': true,
        'text/html': true,
        'text/plain': true,
        'text/css': true,
        'text/yaml': true,
        'application/json': true,
        'application/javascript': true
      })[state.current.mime.get()]),

    deleting: observable.box(false),
    previewing: observable.box(false),
    loading: computed(() =>
      state.existing.get() && !state.current.gh_contents.get()
    ),

    data: computed(() => {
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
      file: observable.box(null),
      base64: observable.box(null)
    },

    edited: {
      set (what, val) {
        state.current.path.get() // side-effects to the rescue

        let ed = {...{}, ...state.editedValues.get()}
        let cur = location.hash
        let th = ed[cur] || {}

        switch (what) {
          case 'content':
            th.content = val
            ed[cur] = th
            state.editedValues.set(ed)
            break
          case 'metadata':
            th.metadata = th.metadata || {}
            th.metadata = val
            ed[cur] = th
            state.editedValues.set(ed)
            break
        }
      },
      content: computed(() => {
        state.current.path.get() // side-effects to the rescue

        let cur = location.hash
        let th = state.editedValues.get()[cur] || {}
        return th.content || null
      }),
      metadata: computed(() => {
        state.current.path.get() // side-effects to the rescue

        let cur = location.hash
        let th = state.editedValues.get()[cur] || {}
        return th.metadata || null
      })
    },

    stored: computed(() => {
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
      content: computed(() =>
        typeof state.current.edited.content.get() === 'string'
          ? state.current.edited.content.get()
          : state.current.stored.get().content
      ),
      metadata: computed(() =>
        state.current.edited.metadata.get() || state.current.stored.get().metadata || {})
    }
  },

  mediaUpload: {
    file: observable.box(null),
    base64: observable.box(null)
  }
}
module.exports = state


/* REACTIONS */

autorun(() => {
  if (!state.tree.get().length) return

  let res = state.current.gh_contents.get()
  if (!res) return

  resetTreeForCurrent()
})


/* ACTIONS */

module.exports.clearCurrent = clearCurrent
function clearCurrent () {
  state.current.deleting.set(false)
  state.current.previewing.set(false)
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
      if (res.path) {
        state.current.gh_contents.set(res)
        state.mode.set(EDIT)
        log.info(`Loaded ${path}.`)
      } else if (Array.isArray(res)) {
        state.current.directory.set(path)
        state.mode.set(DIRECTORY)
      } else {
        console.error('Got a strange result:', res)
      }
    })
    .catch(err => {
      console.log(err)
    })
}

module.exports.newFile = newFile
function newFile (dirpath) {
  return window.coisas.defaultNewFile(dirpath)
    .then(({name, content, metadata}) => {
      clearCurrent()
      state.current.directory.set(dirpath)
      state.current.givenName.set(name)
      state.mode.set(ADD)

      setTimeout(() => {
        if (state.current.edited.content.get() === null) {
          state.current.edited.set('content', content)
          state.current.edited.set('metadata', metadata)
        }
      }, 1)
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
  const repoName = ctx.params.owner + '/' + ctx.params.repo
  storage.storeRepo(repoName)
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
