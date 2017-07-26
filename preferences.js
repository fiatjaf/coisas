const load = require('fetch-js')

/* preferences */
const defaultPreferences = {
  // most functions must return Promises.

  // this function defines how the customization file will be loaded
  // from the repository that is being edited. It doesn't make sense
  // to change it unless you're hosting your own version of coisas.
  loadPreferences: ctx => new Promise((resolve, reject) => {
    let repoSlug = `${ctx.params.owner}/${ctx.params.repo}`

    load(`https://rawgit.com/${repoSlug}/master/coisas.js`, resolve)
  }),

  // if you wanna use the default authorizationInit function, but with
  // a different endpoint -- you should perhaps fork the default endpoint
  // at Glitch and run your own, with your own API keys --, you can just
  // modify this URL.
  authorizationURL: 'https://steadfast-banana.glitch.me/auth',

  // this is the function that will be called when the user clicks at the
  // 'authorize with GitHub" button in the navbar. It should somehow fetch
  // a token and store it in the browser, or in memory, so it can be fetched
  // later with authorizationLoad and deleted with authorizationRemove.
  // the token doesn't have to be an OAuth token, it may be a GitHub Personal
  // User Token, or a basic token made from username and password.
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

  // this function is called every time a call is going to be made to
  // the GitHub API. It must return a Promise to the full content of the
  // 'Authorization' header that will be sent to GitHub.
  // You can almost safely return a rejected promise for GET calls, but
  // since GitHub may rate-limit you and for all PUT requests a valid header
  // is required it is better if you can return a valid header always.
  authorizationLoad: (method) => new Promise((resolve, reject) => {
    let storedToken = localStorage.getItem('gh_oauth_token')
    if (storedToken) return resolve('token ' + storedToken)
    else reject()
  }),

  // called when the user clicks on 'logout'. should remove the token if it
  // is stored in the browser or in memory.
  authorizationRemove: () => new Promise((resolve) => {
    localStorage.removeItem('gh_oauth_token')
    resolve()
  }),

  // called every time the user clicks at "+ new file". should return
  // an object with name, content and metadata, these values will be the
  // default values for the file that is being crated (or you can just
  // return everything empty and the new potential file will have no default
  // values, it doesn't mean much).
  defaultNewFile: (dirPath) => Promise.resolve({
    name: `new-article-${parseInt(Math.random() * 100)}.md`,
    content: '~ write something here.',
    metadata: {
      title: 'New Article',
      date: (new Date()).toISOString().split('T')[0]
    }
  }),

  // which files will appear at the left tree. use it to exclude files you
  // don't want to edit in the CMS, like code, or binary files.
  // the tree is an array of file definitions which will call .filter()
  // on this function.
  // see https://developer.github.com/v3/git/trees/#get-a-tree-recursively
  // to know what the 'tree' is exactly.
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
