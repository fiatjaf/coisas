R = require 'ramda'

module.exports = R.compose R.join('/'), R.reverse, R.tail, R.reverse, R.split('/')
