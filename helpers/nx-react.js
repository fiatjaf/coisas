const React = require('react')
const h = require('react-hyperscript')
const {observe, unobserve} = require('@nx-js/observer-util')

module.exports.observer = function (WrappedFunctionalComponent) {
  return class extends React.Component {
    constructor (props) {
      super(props)

      this.state = {}
    }

    componentDidMount () {
      this.signal = observe(this.observer.bind(this))
    }

    componentWillUnmount () {
      unobserve(this.signal)
    }

    observer () {
      this.setState({
        rendered: WrappedFunctionalComponent(this.props)
      })
    }

    render () {
      return this.state.rendered ? this.state.rendered : h('div')
    }
  }
}
