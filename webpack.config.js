module.exports = {
  module: {
    loaders: [
      { test: /\.coffee$/, loader: "coffee" },
      { test: /\.handlebars$/, loader: "handlebars" }
    ]
  },
  resolve: {
    extensions: ["", ".handlebars", ".web.coffee", ".web.js", ".coffee", ".js"]
  }
}
