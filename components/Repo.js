const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const TreeView = require('react-treeview')
const {pure} = require('react-derivable')

const ProseMirror = require('./ProseMirror')
const state = require('../state')
const log = require('../log')
const gh = require('../helpers/github')

module.exports = pure(() => {
  return h('.columns.is-mobile', [
    h('.column.is-3', [ h(Menu, {name: 'menu'}) ]),
    h('.column.is-8', [ h(Edit) ]),
    h('.column.is-1', [
      h(Images),
      h(Save)
    ])
  ])
})

const Menu = pure(() =>
  h('.menu', [
    h('ul.menu-list', state.tree.get().filter(f => f.path.split('/').length === 1).map(f =>
      h(Folder, {f})
    ))
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
        onClick: () => state.file.selected.set(f.path)
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
      )
    ])
  )
}).withEquality((prevF, nextF) => prevF.active !== nextF.active)

const Edit = pure(() => {
  var editor
  switch (state.file.ext.get()) {
    case 'md':
      editor = h(EditMarkdown)
      break
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      h('img', {src: `https://raw.githubusercontent.com/${state.slug.get()}/master/${state.file.selected.get()}`})
      break
    case 'docx':
    case 'xlsx':
    case 'webm':
    case 'mp4':
    case 'avi':
      editor = h('div', "can't edit this type of file here.")
      break
    default:
      editor = h(EditCode)
  }

  return h('.content', [
    h('h3.title.is-3', state.file.selected.get()),
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
  return h('div')
})

const Save = pure(() => {
  return h('div', [
    h('div', [
      state.file.shown.content.get() || Object.keys(state.file.shown.metadata.get()).length
      ? h('button.button.is-primary', {
        onClick: () => {
          log.info(`Saving ${state.file.selected.get()}.`)
          gh.put(`repos/${state.slug.get()}/contents/${state.file.selected.get()}`, {
            message: `updated ${state.file.selected.get()}.`,
            sha: state.bypath.get()[state.file.selected].sha,
            content: window.btoa(unescape(encodeURIComponent(state.file.ext.get().match(/md|html/)
              ? `---
${Object.keys(state.file.shown.metadata.get()).map(k => `
${k}: ${state.file.shown.metadata.get()[k]}`
)}

---

${state.file.shown.content.get()}
`
              : state.file.shown.content.get())))
          })
          .then(() => log.success('Saved.'))
          .catch(log.error)
        }
      }, 'Save changes')
      : null
    ])
  ])
})
