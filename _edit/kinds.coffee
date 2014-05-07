kinds =
  article:
    processor: require '../_processors/kinds/article.coffee'
    template: require '../_templates/kinds/article.coffee'
  list:
    processor: require '../_processors/kinds/list.coffee'
    template: require '../_templates/kinds/list.coffee'
  chart:
    processor: require '../_processors/kinds/chart.coffee'
    template: require '../_templates/kinds/chart.coffee'
  table:
    processor: require '../_processors/kinds/table.coffee'
    template: require '../_templates/kinds/table.coffee'

module.exports = kinds
  
