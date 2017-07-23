/* global caches, self, fetch */

const always = [
  'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.4.1/css/bulma.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/notie/4.3.1/notie.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/notie/4.3.0/notie.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.27.4/codemirror.min.css',
  'https://cdn.rawgit.com/chenglou/react-treeview/6e9eacf4/react-treeview.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.28.0/mode/css/css.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.28.0/mode/htmlmixed/htmlmixed.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.28.0/mode/javascript/javascript.js'
]

const currentCache = 'v0'

this.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currentCache).then(cache => {
      return cache.addAll(always)
    })
  )
})

this.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(keyList.map(key => {
        if (key !== currentCache) {
          return caches.delete(key)
        }
      }))
    )
  )
})

var currentRepo = ''

self.addEventListener('message', event => {
  currentRepo = event.data.currentRepo
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (event.request.url.slice(0, 4) !== 'http') return

  // the predefined urls we'll always serve them from the cache
  if (always.indexOf(event.request.url) !== -1) {
    event.respondWith(caches.match(event.request))
    return
  }

  // for the image urls we'll try the current github repository
  let networkURL = event.request.url.split('#')[0]
  if (currentRepo &&
        networkURL.match(location.host) &&
        networkURL.match(/(png|jpe?g|gif|svg)$/)) {
    let path = networkURL.split('/').slice(3).join('/')

    event.respondWith(
      fetch(
        `https://raw.githubusercontent.com/${currentRepo}/master/${path}`
      )
    )
    return
  }

  // try to fetch from the network
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // save a clone of our response in the cache
        let cacheCopy = response.clone()
        caches.open(currentCache).then(cache => cache.put(event.request, cacheCopy))
        return response
      })
      // if it fails we'll serve from the cache
      .catch(caches.match(event.request))
  )
})
