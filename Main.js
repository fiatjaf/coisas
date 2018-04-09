const h = require('react-hyperscript')
const {observer} = require('mobx-react')

const {loadUser} = require('./state')
const state = require('./state')
const log = require('./log')

module.exports = observer(() => {
  return (
    h('div', [
      h('nav.nav', [
        h('.nav-left', [
          h('a.nav-item', {href: '#!/'}, [
            h('img', {src: 'https://raw.githubusercontent.com/fiatjaf/coisas/master/icon.png'})
          ]),
          h('a.nav-item', {href: '#!/'}, 'coisas')
        ]),
        h('.nav-center', [
          window.coisas.liveSiteURL
            ? h('a.nav-item', {
              href: window.coisas.liveSiteURL,
              title: window.coisas.liveSiteURL,
              target: '_blank'
            }, [
              h('span.icon', [ h('i.fa.fa-external-link-square') ]),
              'Live site'
            ])
            : null,
          state.slug.get()
            ? h('a.nav-item', {
              href: `https://github.com/${state.slug.get()}`,
              title: state.slug.get(),
              target: '_blank'
            }, [
              h('span.icon', [ h('i.fa.fa-github-square') ]),
              'Browse repository'
            ])
            : null,
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
