const h = require('react-hyperscript')
const {pure} = require('react-derivable')

const {loadUser} = require('./state')
const state = require('./state')
const log = require('./log')

module.exports = pure(() => {
  return (
    h('div', [
      h('nav.nav', [
        h('.nav-left', [
          h('a.nav-item', {href: '#!/'}, [
            h('img', {src: '/icon.png'})
          ]),
          h('a.nav-item', {href: '#!/'}, 'coisas')
        ]),
        h('.nav-center', [
          state.loggedUser.get()
            ? h('.nav-item', [
              state.loggedUser.get(),
              h('span', {style: {marginRight: '5px'}}, ', '),
              h('a', {
                onClick: () =>
                  window.coisas.authorizationRemove()
                    .then(loadUser)
              }, 'logout')
            ])
            : h('a.nav-item', {
              onClick: () => {
                window.coisas.authorizationInit()
                  .then(() => {
                    log.success('Got GitHub token and stored it locally.')
                    loadUser()
                  })
                  .catch(log.error)
              }
            }, 'authorize on GitHub')
        ])
      ]),
      h(components[state.route.get().componentName])
    ])
  )
})

const components = require('./components')
