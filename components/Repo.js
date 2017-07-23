const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const TreeView = require('react-treeview')
const {pure} = require('react-derivable')
const {transact} = require('derivable')
const ReadableBlobStream = require('readable-blob-stream')
const {append: renderMedia} = require('render-media')
const haikunate = require('haikunator-porreta')

const {ADD, REPLACE, UPLOAD, EDIT} = require('../state').modes
const {loadTree, resetTreeForCurrent, loadFile, clearCurrent} = require('../state')
const ProseMirror = require('./ProseMirror')
const state = require('../state')
const log = require('../log')
const gh = require('../helpers/github')

module.exports = pure(function Repo () {
  return h('.columns.is-mobile', [
    h('.column.is-3', [ h(Menu, {name: 'menu'}) ]),
    h('.column.is-7', [
      state.mode.switch(
        ADD, h(Page),
        REPLACE, h(Upload),
        UPLOAD, h(Upload),
        EDIT, h(Page)
      ).get()
    ]),
    h('.column.is-2', [
      h(Save),
      h(Images)
    ])
  ])
})

const Menu = pure(function Menu () {
  let topdir = state.bypath.get()['']

  if (!topdir) return h('div')

  return h('#Menu.menu', [
    h('ul.menu-list', state.tree.get()
      .filter(f => f.path)
      .filter(f => f.path.split('/').length === 1)
      .map(f => h(Folder, {f}))
      .concat(
        h('li', [
          h(ButtonAdd, {dir: topdir, active: topdir.active})
        ])
      )
    )
  ])
})

const Folder = pure(function Folder ({f}) {
  if (f.type === 'blob') {
    return h('li', {
      key: f.path
    }, [
      h('a', {
        className: f.active ? 'is-active' : '',
        href: `#!/${state.slug.get()}/${f.path}`,
        onClick: () => {
          transact(() => {
            clearCurrent()
            state.mode.set(EDIT)
            loadFile(f.path)
          })
        }
      }, f.path.split('/').slice(-1)[0])
    ])
  }

  let dir = f
  return (
    h(TreeView, {
      nodeLabel: dir.path,
      collapsed: dir.collapsed,
      onClick: () => {
        state.bypath.get()[dir.path].collapsed = !dir.collapsed
        state.tree.set(state.tree.get().concat() /* copy the array */)
      }
    }, [
      h('ul.menu-list', state.tree.get()
        .filter(f => f.path.slice(0, dir.path.length + 1) === dir.path + '/')
        .map(f => h(Folder, {key: f.path, f}))
        .concat(
          h('li', [
            h(ButtonAdd, {dir, active: dir.active})
          ])
        )
      )
    ])
  )
}).withEquality((prevF, nextF) =>
  prevF
  ? prevF.active !== nextF.active
  : true
)

const ButtonAdd = pure(function ButtonAdd ({dir, active}) {
  return h('a', {
    className: active ? 'is-active' : '',
    href: `#!/${state.slug.get()}/${dir.path}`,
    onClick: () => {
      transact(() => {
        clearCurrent()
        state.current.directory.set(dir.path)
        state.current.givenName.set(`${haikunate()}.md`)
        state.current.edited.content.set('~ write something here.')
        state.mode.set(ADD)
      })
      setTimeout(resetTreeForCurrent, 1)
    }
  }, '+ new file')
})

const Delete = pure(function Delete () {
  if (!state.existing.get()) return h('div')

  if (!state.current.deleting.get()) {
    return h('#Delete', [
      h('button.button.is-warning', {
        onClick: () => {
          state.current.deleting.set(true)
        }
      }, 'Delete this?')
    ])
  }

  return h('#Delete', [
    h('p', `Remove ${state.current.path.get()}?`),
    h('.level', [
      h('.level-left', [
        h('button.button.is-small', {
          onClick: () => state.current.deleting.set(false)
        }, 'Cancel')
      ]),
      h('.level-right', [
        h('button.button.is-large.is-danger', {
          onClick: () => {
            let [url, body] = state.current.toSave.get()
            delete body.content
            body.message = `deleted ${state.current.path.get()}.`
            gh.delete(url, body)
              .then(loadTree)
              .then(resetTreeForCurrent)
              .then(() => log.success('Removed.'))
              .catch(log.error)
          }
        }, 'Delete')
      ])
    ])
  ])
})

const Upload = pure(function Upload () {
  return h('#Upload', [
    h('.upload', [
      h('label', [
        'Upload a file:',
        h('input.input', {
          type: 'file',
          onChange: e => {
            let file = e.target.files[0]
            state.current.upload.file.set(file)
            var reader = new window.FileReader()
            reader.onload = event => {
              let binary = event.target.result
              state.current.upload.base64.set(window.btoa(binary))
            }
            reader.readAsBinaryString(file)
          }
        }),
        state.current.upload.file.get()
          ? h('div', [
            'Preview:',
            h(Preview, {
              file: {
                name: state.current.upload.file.get().name,
                createReadStream: () =>
                  new ReadableBlobStream(state.current.upload.file.get()
                )
              }
            })
          ])
          : null
      ])
    ])
  ])
})

const Preview = pure(function ({file}) {
  return h('.preview', {
    ref: el => {
      if (el) {
        el.innerHTML = ''
        renderMedia(file, el, console.log.bind(console, 'render-media'))
      }
    }
  })
})

const Title = pure(function Title () {
  if (state.existing.get()) {
    return h('h3.title.is-3', state.current.path.get())
  } else {
    return h('input.input.is-large', {
      value: state.current.name.get(),
      onChange: v => state.current.givenName.set(v)
    })
  }
})

const Page = pure(function Page () {
  var editor

  switch (state.current.mime.get()) {
    case 'text/x-markdown':
      editor = h(EditMarkdown)
      break
    case 'text/html':
    case 'text/plain':
    case 'text/css':
    case 'text/yaml':
    case 'application/json':
    case 'application/javascript':
    case undefined:
      editor = h(EditCode)
      break
  }

  let preview = h(Preview, {
    file: {
      name: state.current.name.get(),
      createReadStream: () =>
        new ReadableBlobStream(state.current.blob.get())
    }
  })

  var components = state.current.loading.get()
    ? [ h('div', '...') ]
    : editor
      ? [ editor, h(Delete) ]
      : [ preview, h(Delete) ]

  return h('#Page', [
    h(Title),
    h('div', components)
  ])
})

const EditMarkdown = pure(function EditMarkdown () {
  return h('#EditMarkdown.content', [
    h(Json, {
      value: state.current.shown.metadata.get(),
      onChange: metadata => {
        state.current.edited.metadata.set(metadata)
      }
    }),
    h(ProseMirror, {
      value: state.current.shown.content.get(),
      onChange: content => {
        state.current.edited.content.set(content)
      }
    })
  ])
})

const EditCode = pure(function EditCode () {
  if (state.current.shown.content.get() === null) {
    return h('div', 'cannot render this file here.')
  }

  let value = state.current.shown.content.get()

  return h('#EditCode', [
    state.current.frontmatter.get() && h(Json, {
      value: state.current.shown.metadata.get(),
      onChange: metadata => {
        state.current.edited.metadata.set(metadata)
      }
    }),
    h(CodeMirror, {
      value,
      onChange: v => state.current.edited.content.set(v),
      options: {
        viewportMargin: Infinity,
        mode: state.current.mime.get()
      }
    })
  ])
})

const Images = pure(function Images () {
  let images = state.images.get()
  let mid = parseInt(images.length / 2)

  return h('#Images', [
    'drag an image to the editor to insert it.',
    h('.columns', [
      h('.column.is-half', images.slice(0, mid)
        .map(f =>
          h('img', {
            key: f.path,
            src: f.path,
            title: f.path
          })
      )),
      h('.column.is-half', images.slice(mid)
        .map(f =>
          h('img', {
            key: f.path,
            src: f.path,
            title: f.path
          })
      ))
    ])
  ])
})

const Save = pure(function Save () {
  return h('#Save', [
    h('button.button.is-large.is-primary', {
      disabled:
        !state.current.shown.content.get() &&
        !Object.keys(state.current.shown.metadata.get()).length &&
        !state.current.upload.base64,
      onClick: () => {
        log.info(`Saving ${state.current.path.get()} to GitHub.`)
        let [url, body] = state.current.toSave.get()
        gh.put(url, body)
          .then(() => {
            if (state.mode.get() === ADD || state.mode.get() === UPLOAD) {
              return loadTree()
                .then(() => loadFile(state.current.path.get()))
                .then(resetTreeForCurrent)
            }
          })
          .then(() => log.success('Saved.'))
          .catch(log.error)
      }
    }, state.mode.switch(
      ADD, 'Create file',
      REPLACE, 'Replace file',
      UPLOAD, 'Upload',
      EDIT, 'Save changes'
    ).get())
  ])
})
