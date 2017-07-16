const React = require('react')
const {EditorView} = require('prosemirror-view')
const {EditorState} = require('prosemirror-state')
const {schema, defaultMarkdownParser, defaultMarkdownSerializer} = require('prosemirror-markdown')
const {exampleSetup} = require('prosemirror-example-setup')
const h = require('react-hyperscript')

module.exports = class extends React.Component {
  componentDidMount () {
    this.view = new EditorView(this.node, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(this.props.value),
        plugins: exampleSetup({schema})
      }),
      dispatchTransaction: (txn) => {
        let nextState = this.view.state.apply(txn)
        this.view.updateState(nextState)
        if (txn.docChanged) {
          let content = defaultMarkdownSerializer.serialize(this.view.state.doc)
          this.props.onChange(content)
        }
      }
    })
  }

  componentWillUnmount () {
    this.view.destroy()
  }

  render () {
    return h('div', {
      ref: el => {
        this.node = el
      }
    })
  }
}
