module.exports = {
  info () {
    notie.alert({
      text: Array.prototype.join.call(arguments, ' '),
      type: 'info',
      time: 3
    })
    console.log.apply(console, arguments)
  },

  error (e) {
    if (e.stack) {
      console.error(e.stack)
      notie.alert({
        text: 'Something wrong has occurred, see the console for the complete error.',
        type: 'error',
        time: 3
      })
      return
    }

    notie.alert({
      text: Array.prototype.join.call(arguments, ' '),
      type: 'error',
      time: 5
    })
    console.error.apply(console, arguments)
  },

  success () {
    notie.alert({
      text: Array.prototype.join.call(arguments, ' '),
      type: 'success',
      time: 3
    })
  },

  confirm (text, confirmed, cancelled) {
    notie.confirm({text}, confirmed, cancelled)
  }
}

const notie = {
  alert: function (params) {
    if (window.notie) {
      window.notie.alert(params)
    } else {
      setTimeout(() => notie.alert(params), 1000)
    }
  },
  confirm: function () {
    if (window.notie) {
      window.notie.confirm.apply(window.notie, arguments)
    } else {
      setTimeout(() => notie.confirm.apply(notie, arguments), 1000)
    }
  }
}
