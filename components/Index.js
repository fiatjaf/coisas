const h = require('react-hyperscript')
const page = require('page')

module.exports = function Index (ctx) {
  return h('#Index', [
    h('center', [
      h('form', {
        onSubmit: e => {
          e.preventDefault()
          let v = e.target.repo.value
          let slug = /(github.com\/)?([^\/]+)\/([^\/]+)(\/.*)?/.exec(v).slice(2, 4).join('/')
          page('#!/' + slug + '/')
        }
      }, [
        h('p', 'Type your GitHub repository name'),
        h('input.input.is-large', {name: 'repo', placeholder: 'fiatjaf/coisas'}),
        h('button.button.is-large.is-dark', 'Go')
      ])
    ])
  ])
}
