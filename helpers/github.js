const fetch = window.fetch
const qs = require('qs')

module.exports = gh

function gh (method, path, data = {}) {
  var waitToken = new Promise((resolve, reject) => {
    reject()
  })

  let headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'github.com/fiatjaf',
    'Content-Type': 'application/json',
    ...data.headers
  }
  delete data.headers

  var body
  if (method === 'get' || method === 'head') {
    path += '?' + qs.stringify(data)
  } else {
    body = JSON.stringify(data)
  }

  return waitToken
    .then(token => {
      headers['Authorization'] = `token ${token}`
    })
    .catch(() => {})
    .then(() =>
      fetch(`https://api.github.com/${path}`, {method, headers, body})
    )
    .then(r => headers.Accept.match(/json/) ? r.json() : r.text())
}

gh.get = gh.bind(gh, 'get')
gh.post = gh.bind(gh, 'post')
gh.put = gh.bind(gh, 'put')
gh.head = gh.bind(gh, 'head')
gh.patch = gh.bind(gh, 'patch')
