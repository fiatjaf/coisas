const React = require('react')
const {EditorView} = require('prosemirror-view')
const {EditorState} = require('prosemirror-state')
const {schema, defaultMarkdownParser, defaultMarkdownSerializer} = require('prosemirror-markdown')
const {exampleSetup} = require('prosemirror-example-setup')
const h = require('react-hyperscript')

module.exports = class ProseMirror extends React.Component {
  componentDidMount () {
    this.state = EditorState.create({
      doc: defaultMarkdownParser.parse(this.props.value),
      plugins: exampleSetup({schema})
    })
    this.view = new EditorView(this.node, {
      state: this.state,
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

  componentWillReceiveProps (nextProps) {
    if (this.props.value !== nextProps.value) {
      this.componentWillUnmount()
      this.componentDidMount()
    }
  }

  componentWillUnmount () {
    if (this.view) this.view.destroy()
  }

  render () {
    return h('div', {
      ref: el => {
        this.node = el
      }
    })
  }
}
