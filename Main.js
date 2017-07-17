const h = require('react-hyperscript')

const {observer} = require('./helpers/nx-react')
const state = require('./state')

module.exports = observer(() => {
  return (
    h('div', [
      h('nav.nav', [
        h('.nav-left', [
          h('a.nav-item', {href: '#!/'}, 'coisas')
        ]),
        h('.nav-center', [
          // h('a.nav-item', {href: `/${route}/`}, route)
        ])
      ]),
      h('main.columns', [
        h('.column.is-10.is-offset-1', [
          h(state.route.component)
        ])
      ])
    ])
  )
})
