module.exports = function renderWithFrontmatter (content, metadata, repoSlug) {
  let rawgithuburl = RegExp(
      '\\]\\(https:\\/\\/raw.githubusercontent.com\\/' + repoSlug + '\\/master', 'g')

  var full = ''
  if (metadata && Object.keys(metadata).length) {
    let meta = Object.keys(metadata).map(k =>
      `${k}: ${JSON.stringify(metadata[k])}`
    ).join('\n')

    full += '---\n' + meta + '\n---\n'
  }

  full += content.replace(rawgithuburl, '](')
  return full
}
