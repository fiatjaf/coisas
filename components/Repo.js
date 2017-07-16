const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const matter = require('gray-matter')

const ProseMirror = require('./ProseMirror')
const {observer} = require('../helpers/nx-react')
const state = require('../state')

module.exports = observer(() => {
  return h('.columns', [
    h('.column.is-4', [ h(Menu) ]),
    h('.column.is-8', [ h(Edit) ])
  ])
})

const Menu = observer(() =>
  h('.menu', [
    h('ul.menu-list', state.tree.filter(item => item.type !== 'tree').map(file =>
      h('li', {key: file.path}, [
        h('a', {
          href: `#!/${state.user}/${state.repo}/${file.path}`,
          onClick: () => state.file.selected = file.path,
          className: state.file.selected === file.path ? 'is-active' : ''
        }, file.path)
      ])
    ))
  ])
)

const Edit = observer(() => {
  let ext = state.file.selected
    ? state.file.selected.split('.').slice(-1)[0]
    : ''

  var editor
  switch (ext) {
    case 'md':
      editor = h(EditMarkdown)
      break
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      h('img')
      break
    case 'docx':
      editor = h('div', "can't edit this type of file here.")
      break
    default:
      editor = h(EditCode)
  }

  return h('.content', [
    h('h3.title.is-3', state.file.selected),
    state.file.loaded === state.file.selected
    ? editor
    : h('div', 'loading file contents from GitHub')
  ])
})

const EditMarkdown = observer(() => {
  let {content, data} = matter(state.file.content)

  return h('div', [
    h(Json, {
      value: data,
      onChange: ch => {
        console.log(ch)
      }
    }),
    h(ProseMirror, {
      value: state.file.editedContent || content,
      onChange: ch => {
        console.log(ch)
      }
    })
  ])
})

const EditCode = observer(() => {
  return h('div', [
    h(CodeMirror, {
      value: state.file.editedContent || state.file.content,
      onChange: v => state.file.editedContent
    })
  ])
})
