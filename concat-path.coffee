R = require 'ramda'

module.exports = R.compose R.join('/'), R.filter(R.identity)
