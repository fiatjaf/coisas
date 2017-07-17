const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const matter = require('gray-matter')

const ProseMirror = require('./ProseMirror')
const {observer} = require('../helpers/nx-react')
const state = require('../state')
const log = require('../log')
const gh = require('../helpers/github')

module.exports = observer(() => {
  return h('.columns.is-mobile', [
    h('.column.is-3', [ h(Menu) ]),
    h('.column.is-8', [ h(Edit) ]),
    h('.column.is-1', [ h(Save) ])
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
  var editor
  switch (state.file.ext()) {
    case 'md':
      editor = h(EditMarkdown)
      break
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      h('img', {src: `https://raw.githubusercontent.com/${state.user}/${state.repo}/master/${state.file.selected}`})
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
      onChange: metadata => {
        state.file.edited.metadata = metadata
        state.file.edited.content = state.file.edited.content || content
      }
    }),
    h(ProseMirror, {
      value: state.file.editedContent || content,
      onChange: content => {
        state.file.edited.content = content
        state.file.edited.metadata = data
      }
    })
  ])
})

const EditCode = observer(() => {
  return h('div', [
    h(CodeMirror, {
      value: state.file.editedContent || state.file.content,
      onChange: v => state.file.editedContent,
      options: {
        viewportMargin: Infinity,
        mode: state.file.ext()
      }
    })
  ])
})

const Save = observer(() => {
  return h('div', [
    h('div', [
      state.file.edited.content || Object.keys(state.file.edited.metadata).length
      ? h('button.button', {
        onClick: () => {
          log.info(`Saving ${state.file.selected}.`)
          gh.put(`repos/${state.user}/${state.repo}/contents/${state.file.selected}`, {
            message: `updated ${state.file.selected}.`,
            sha: state.tree.filter(f => f.path === state.file.selected)[0].sha,
            content: state.file.ext() === 'md'
              ? `---

${Object.keys(state.file.edited.metadata).map(k => `
${k}: ${state.file.edited.metadata[k]}`
)}

---

${state.file.edited.content}
`
              : state.file.edited.content
          })
          .then(() => log.success('Saved.'))
          .catch(log.error)
        }
      }, 'Save changes')
      : null
    ])
  ])
})
