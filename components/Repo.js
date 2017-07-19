const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const TreeView = require('react-treeview')
const {pure} = require('react-derivable')
const ReadableBlobStream = require('readable-blob-stream')
const {append: renderMedia} = require('render-media')
const based = require('based-blob')
const mimeTypes = require('render-media/lib/mime.json')

const ProseMirror = require('./ProseMirror')
const base64 = require('../helpers/base64')
const state = require('../state')
const log = require('../log')
const gh = require('../helpers/github')

module.exports = pure(() => {
  return h('.columns.is-mobile', [
    h('.column.is-3', [ h(Menu, {name: 'menu'}) ]),
    h('.column.is-7', [
      state.mode.get() === 'add'
        ? h(Add)
        : state.mode.get() === 'edit'
          ? h(Edit)
          : h('div')
    ]),
    h('.column.is-2', [
      h(Save),
      h(Images)
    ])
  ])
})

const Menu = pure(() =>
  h('.menu', [
    h('ul.menu-list', state.tree.get()
      .filter(f => f.path.split('/').length === 1)
      .map(f => h(Folder, {f}))
      .concat(
        h('li', [
          h('a', {
            href: `#!/${state.slug.get()}/`,
            onClick: () => {
              state.file.selected.set('')
            }
          }, '+ new file')
        ])
      )
    )
  ])
)

const Folder = pure(({f}) => {
  if (f.type === 'blob') {
    return h('li', {
      key: f.path
    }, [
      h('a', {
        className: f.active ? 'is-active' : '',
        href: `#!/${state.slug.get()}/${f.path}`,
        onClick: () => {
          state.file.selected.set(f.path)
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
            h('a', {
              className: dir.active ? 'is-active' : '',
              href: `#!/${state.slug.get()}/${dir.path}/`,
              onClick: () => {
                state.file.selected.set(f.path)
              }
            }, '+ new file')
          ])
        )
      )
    ])
  )
}).withEquality((prevF, nextF) => prevF.active !== nextF.active)

const Add = pure(() => {
  return h('#Add', [
    h('h2.title.is-2', state.file.selected.get() + '/'),
    h('.upload', [
      h('label', [
        'Upload a file:',
        h('input.input', {
          type: 'file',
          onChange: e => {
            let file = e.target.files[0]
            state.upload.file.set(file)
            var reader = new window.FileReader()
            reader.onload = event => {
              let binary = event.target.result
              state.upload.base64.set(window.btoa(binary))
            }
            reader.readAsBinaryString(file)
          }
        }),
        state.upload.file.get()
          ? h('div', [
            'Preview:',
            h(Preview, {
              file: {
                name: state.upload.file.get().name,
                createReadStream: () => new ReadableBlobStream(state.upload.file.get())
              }
            })
          ])
          : null
      ])
    ])
  ])
})

const Preview = pure(({file}) => {
  return h('.preview', {
    ref: el => {
      if (el) {
        el.innerHTML = ''
        renderMedia(file, el, console.log.bind(console, 'render-media'))
      }
    }
  })
})

const Edit = pure(() => {
  var editor
  let mime = mimeTypes['.' + state.file.ext.get()]
  switch (mime) {
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
    default:
      editor = h(Preview, {
        file: {
          name: state.file.selected.get().split('/').slice(-1)[0],
          createReadStream: () =>
            new ReadableBlobStream(based.toBlob(state.file.data.get()))
        }
      })
  }

  return h('#Edit.content', [
    h('h2.title.is-2', state.file.selected.get()),
    state.file.finishedLoading.get()
    ? editor
    : h('div', 'loading file contents from GitHub')
  ])
})

const EditMarkdown = pure(() => {
  return h('div', [
    h(Json, {
      value: state.file.shown.metadata.get(),
      onChange: metadata => {
        state.file.edited.metadata.set(metadata)
      }
    }),
    h(ProseMirror, {
      value: state.file.shown.content.get(),
      onChange: content => {
        state.file.edited.content.set(content)
      }
    })
  ])
})

const EditCode = pure(() => {
  if (state.file.shown.content.get() === null) {
    return h('cannot render this file here.')
  }

  return h('div', [
    state.file.ext.get() === 'html' && h(Json, {
      value: state.file.shown.metadata.get(),
      onChange: metadata => {
        state.file.edited.metadata.set(metadata)
      }
    }),
    h(CodeMirror, {
      value: state.file.shown.content.get(),
      onChange: v => state.file.edited.content.set(),
      options: {
        viewportMargin: Infinity,
        mode: state.file.ext.get()
      }
    })
  ])
})

const Images = pure(() => {
  return h('#Images', [
    'drag an image to the editor to insert it.',
    h('.list', state.tree.get()
      .filter(f => f.path.match(/(jpe?g|gif|png|svg)$/))
      .map(f =>
        h('img', {
          key: f.path,
          src: f.path,
          title: f.path
        })
    ))
  ])
})

const Save = pure(() => {
  return h('#Save', [
    h('button.button.is-large.is-primary', {
      disabled:
        !state.file.shown.content.get() &&
        !Object.keys(state.file.shown.metadata.get()).length &&
        !state.upload.base64,
      onClick: () => Promise.resolve().then(() => {
        log.info(`Saving ${state.file.selected.get()} to GitHub.`)

        if (state.file.shown.content.get()) {
          return gh
            .put(`repos/${state.slug.get()}/contents/${state.file.selected.get()}`, {
              message: `updated ${state.file.selected.get()}.`,
              sha: state.bypath.get()[state.file.selected].sha,
              content: base64.encode(state.file.ext.get().match(/md|html/)
                ? `---
${Object.keys(state.file.shown.metadata.get()).map(k => `
${k}: ${state.file.shown.metadata.get()[k]}`
)}

---

${state.file.shown.content.get()}
`
                : state.file.shown.content.get())
            })
        }

        if (state.upload.base64.get()) {
          let path = state.file.selected.get() + '/' + state.upload.name.get()
          return gh
            .put(`repos/${state.slug.get()}/contents/${state.upload.name.get()}`, {
              message: `uploaded ${path}.`,
              content: state.upload.base64.get()
            })
        }
      }).then(() => log.success('Saved.')).catch(log.error)
    }, state.mode.get() === 'add' ? 'Add file' : 'Save changes')
  ])
})
