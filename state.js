const gh = require('./helpers/github')
const page = require('page')
const {atom, derive, transact, proxy} = require('derivable')
const matter = require('gray-matter')
const mimeTypes = require('render-media/lib/mime.json')
const based = require('based-blob')

const base64 = require('./helpers/base64')
const log = require('./log')

// modes
const ADD = '<creating a new text file>'
const REPLACE = '<replacing an existing file with an uploaded file>'
const UPLOAD = '<uploading a new file>'
const EDIT = '<updating a text file>'
const DIRECTORY = '<a directory path, does nothing>'

/* STATE */

var state = {
  loggedUser: atom(null),

  route: atom({
    componentName: 'div',
    ctx: {params: {}}
  }),

  owner: derive(() => state.route.get().ctx.params.owner),
  repo: derive(() => state.route.get().ctx.params.repo),
  slug: derive(() => state.owner.get() + '/' + state.repo.get()),

  editedValues: {},

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
        : state.current.directory.get() + '/' + state.current.givenName.get()
    ),
    name: derive(() => state.current.path.get().split('/').slice(-1)[0]),
    ext: derive(() => state.current.name.get().split('.').slice(-1)[0]),
    mime: derive(() => mimeTypes['.' + state.current.ext.get()]),
    frontmatter: derive(() =>
      state.current.mime.get() === 'text/x-markdown' ||
      state.current.mime.get() === 'text/html'
    ),

    loaded: atom(null),
    deleting: atom(false),
    loading: derive(() => state.current.loaded.get() === state.current.path.get()),

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
    blob: derive(() => {
      let r = state.current.gh_contents.get()
      if (!r || !r.content) return ''

      try {
        return based.toBlob(r.content)
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
          let cur = state.current.path.get()
          let th = state.editedValues[cur] || {}
          return th.content || null
        },
        set: (val) => {
          let cur = state.current.path.get()
          let th = state.editedValues[cur] || {}
          th.content = val
          state.editedValues[cur] = th
        }
      }),
      metadata: proxy({
        get: () => {
          let cur = state.current.path.get()
          let th = state.editedValues[cur] || {}
          return th.metadata || null
        },
        set: (val) => {
          let cur = state.current.path.get()
          let th = state.editedValues[cur] || {}
          th.metadata = th.metadata || {}
          th.metadata = val
          state.editedValues[cur] = th
        }
      })
    },

    stored: derive(() => {
      let data = state.current.data.get()
      if (!data) return {}
      if (state.current.frontmatter.get()) {
        let {data: metadata, content} = matter(data)
        return {metadata, content}
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
    },
    toSave: derive(() => {
      var body = {
        message: `created ${state.current.path.get()}.`
      }

      if (state.current.gh_contents.get()) {
        body.sha = state.current.gh_contents.get().sha
        body.message = `updated ${state.current.path.get()}.`
      }

      if (state.current.upload.base64.get()) {
        body.content = state.current.upload.base64.get()
        if (state.existing.get()) {
          body.message = `replaced ${state.current.path.get()} with upload.`
        } else {
          body.message = `uploaded ${state.current.path.get()}`
        }
      } else if (state.current.frontmatter.get()) {
        let rawgithuburl = RegExp(
            '\\]\\(https:\\/\\/raw.githubusercontent.com\\/' + state.slug.get() + '\\/master', 'g')

        let metadata = state.current.shown.metadata.get()

        var full = ''

        if (metadata && Object.keys(metadata).length) {
          let meta = Object.keys(state.current.shown.metadata.get()).map(k =>
            `${k}: ${state.current.shown.metadata.get()[k]}`
          ).join('\n')

          full += '---\n' + meta + '\n---\n\n'
        }

        full += state.current.shown.content.get().replace(rawgithuburl, '](')
        body.content = base64.encode(full)
      } else {
        body.content = base64.encode(state.current.shown.content.get())
      }

      return [`repos/${state.slug.get()}/contents/${state.current.path.get()}`, body]
    })
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
  state.current.loaded.set(null)
  state.current.upload.file.set(null)
  state.current.upload.base64.set(null)
}

module.exports.loadFile = loadFile
function loadFile (path) {
  log.info(`Loading ${path} from GitHub.`)
  gh.get(`repos/${state.slug.get()}/contents/${path}`, {ref: 'master'})
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

module.exports.loadTree = loadTree
function loadTree () {
  gh.get(`repos/${state.slug.get()}/git/refs/heads/master`)
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
      tree.tree.sort((a, b) => a.type === 'blob' ? 1 : -1)
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
  gh.get('user')
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
      transact(() => {
        state.route.set({componentName: 'repo', ctx})
        clearCurrent()
        state.mode.set(EDIT)
      })


      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          currentRepo: state.slug.get()
        })
      }

      loadUser()
      loadTree()
      loadFile(ctx.params[0])
    })
})
page({hashbang: true})


module.exports.modes = {ADD, REPLACE, UPLOAD, EDIT, DIRECTORY}
