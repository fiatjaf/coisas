const load = require('fetch-js')

/* preferences */
const defaultPreferences = {
  loadPreferences: ctx => new Promise((resolve, reject) => {
    let repoSlug = `${ctx.params.owner}/${ctx.params.repo}`

    load(`https://rawgit.com/${repoSlug}/master/coisas.js`, resolve)
  }),
  authorizationURL: 'https://steadfast-banana.glitch.me/auth',
  authorizationInit: () => new Promise((resolve, reject) => {
    let popup = window.open(window.coisas.authorizationURL)
    window.addEventListener('message', e => {
      let parts = e.data.split(':')
      let type = parts[0]
      if (type === 'authorizing') {
        popup.postMessage('send me the token!', window.coisas.authorizationURL)
        return
      }

      let status = parts[2]
      let content = JSON.parse(parts.slice(3).join(':'))

      if (status === 'success') {
        localStorage.setItem('gh_oauth_token', content.token)
        resolve()
      } else {
        console.error(content)
        reject()
      }
      popup.close()
    })
  }),
  authorizationLoad: () => new Promise((resolve, reject) => {
    let storedToken = localStorage.getItem('gh_oauth_token')
    if (storedToken) return resolve('token ' + storedToken)
    else reject()
  }),
  authorizationRemove: () => new Promise((resolve) => {
    localStorage.removeItem('gh_oauth_token')
    resolve()
  }),
  defaultNewFile: (dirPath) => new Promise((resolve, reject) => {
    load(
      'https://cdn.rawgit.com/fiatjaf/haikunator-porreta/fb5db13f/dist/haikunator-porreta.min.js'
    , err => {
      if (err) return reject(err)

      let haiku = window.haikunate()
      resolve({
        name: `${haiku}.md`,
        content: '~ write something here.',
        metadata: {
          title: haiku.split('-').map(w => w.replace(/\w/, ch => ch.toUpperCase())).join(' '),
          date: (new Date()).toISOString().split('T')[0]
        }
      })
    })
  }),

  filterTreeFiles: file => true
}

// module loading side-effects are great.
if (window.coisas) {
  // someone have injected his preferences directly.
  // this must mean coisas is being hosted somewhere
  window.coisas = {...defaultPreferences, ...window.coisas}
} else {
  // no settings found, we will fetch the settings
  // loader from the chosen repository.
  window.coisas = defaultPreferences
}
