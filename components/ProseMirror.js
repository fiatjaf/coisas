const React = require('react')
const {EditorView} = require('prosemirror-view')
const {EditorState} = require('prosemirror-state')
const {schema, defaultMarkdownParser, defaultMarkdownSerializer} = require('prosemirror-markdown')
const {exampleSetup} = require('prosemirror-example-setup')
const h = require('react-hyperscript')
const debounce = require('debounce')

module.exports = class ProseMirror extends React.Component {
  componentDidMount () {
    this.start(this.props.defaultValue)
    this.dchanged = debounce(this.changed, 600)
  }

  start (value = '') {
    this.value = value

    this.state = EditorState.create({
      doc: defaultMarkdownParser.parse(value),
      plugins: exampleSetup({schema})
    })
    this.view = new EditorView(this.node, {
      state: this.state,
      dispatchTransaction: (txn) => {
        let nextState = this.view.state.apply(txn)
        this.view.updateState(nextState)
        this.dchanged(txn)
      }
    })
  }

  changed (txn) {
    if (txn.docChanged) {
      let content = defaultMarkdownSerializer.serialize(this.view.state.doc)
      this.value = content
      this.props.onChange(content)
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.value !== nextProps.defaultValue) {
      this.componentWillUnmount()
      if (nextProps.defaultValue) {
        this.start(nextProps.defaultValue)
      } else {
        this.value = nextProps.defaultValue
      }
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
