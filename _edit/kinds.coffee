###
  processors are loaded by browserify and passed as exported functions
  templates are just the addresses that will be loaded from the base site
            by curljs
###

kinds =
  article:
    processor: require './processors/kinds/article.coffee'
    template: '/_edit/templates/kinds/article.html'
  list:
    processor: require './processors/kinds/list.coffee'
    template: '/_edit/templates/kinds/list.html'
  chart:
    processor: require './processors/kinds/chart.coffee'
    template: '/_edit/templates/kinds/chart.html'
  table:
    processor: require './processors/kinds/table.coffee'
    template: '/_edit/templates/kinds/table.html'

module.exports = kinds
  
