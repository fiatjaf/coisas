const fetch = window.fetch
const qs = require('qs')

module.exports = gh

function gh (method, path, data = {}) {
  var waitToken = window.coisas.authorizationLoad(method)

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

  if (method === 'put' || method === 'delete' || method === 'post' || method === 'patch') {
    window.tc && window.tc(7)
  }

  return waitToken
    .then(token => {
      headers['Authorization'] = token
    })
    .catch(() => {
      if (method === 'put' || method === 'delete' || method === 'post' || method === 'patch') {
        throw new Error("Can't call the GitHub API without a valid token.")
      }
    })
    .then(() =>
      fetch(`https://api.github.com/${path}`, {method, headers, body})
    )
    .then(r => {
      if (r.status >= 300) throw r
      return headers.Accept.match(/json/) ? r.json() : r.text()
    })
}

gh.get = gh.bind(gh, 'get')
gh.post = gh.bind(gh, 'post')
gh.put = gh.bind(gh, 'put')
gh.head = gh.bind(gh, 'head')
gh.patch = gh.bind(gh, 'patch')
gh.delete = gh.bind(gh, 'delete')
