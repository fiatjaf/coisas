// buble needs this:
window.xtend = require('xtend')

// export all these libraries so remote coisas.js can use them
// it costs nothing to do so.
window.load = (url, cb) => {
  if (cb) {
    return require('fetch-js')(url, cb)
  }

  return new Promise((resolve, reject) =>
    require('fetch-js')(url, err => {
      if (err) return reject(err)
      resolve()
    })
  )
}
window.React = require('react')
window.ReactDOM = require('react-dom')
window.h = require('react-hyperscript')
window.matter = require('gray-matter')
// ~

require('./preferences')

const React = require('react')
const render = require('react-dom').render

const Main = require('./Main')

render(
  React.createElement(Main),
  document.getElementById('root')
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', {scope: '/'})
    .then(reg => console.log('service worker registered.', reg.scope))
    .catch(e => console.log('failed to register service worker.', e))
}
