const h = require('react-hyperscript')
const CodeMirror = require('react-codemirror')
const Json = require('react-json')
const TreeView = require('react-treeview')
const {pure} = require('react-derivable')

const {ADD, REPLACE, UPLOAD, EDIT, DIRECTORY} = require('../constants').modes
const {loadTree, resetTreeForCurrent, loadFile, newFile, clearCurrent} = require('../state')
const renderWithFrontmatter = require('../helpers/render-with-frontmatter')
const ProseMirror = require('./ProseMirror')
const FileUpload = require('./FileUpload')
const Preview = require('./Preview')
const base64 = require('../helpers/base64')
const state = require('../state')
const log = require('../log')
const gh = require('../helpers/github')

module.exports = pure(function Repo () {
  return h('.columns.is-mobile', [
    h('.column.is-3', [
      h(Menu, {name: 'menu'}),
      h(Save)
    ]),
    h('.column.is-7', [
      state.current.loading.get()
        ? h('div')
        : state.mode.switch(
          ADD, h(Page),
          REPLACE, h(Upload),
          UPLOAD, h(Upload),
          EDIT, h(Page),
          DIRECTORY, h(Directory)
        ).get()
    ]),
    h('.column.is-2', [
      h(Images)
    ])
  ])
})

const Menu = pure(function Menu () {
  let topdir = state.bypath.get()['']

  if (!topdir) return h('div')

  return h('#Menu.menu', [
    h('ul.menu-list', state.tree.get()
      .filter(f => f.path)
      .filter(f => f.path.split('/').length === 1)
      .map(f => h(Folder, {f}))
      .concat(
        h('li', [
          h(ButtonAdd, {dir: topdir, active: topdir.active})
        ])
      )
    )
  ])
})

const Folder = pure(function Folder ({f}) {
  if (f.type === 'blob') {
    return h('li', {
      key: f.path
    }, [
      h('a', {
        className: f.active ? 'is-active' : '',
        href: `#!/${state.slug.get()}/${f.path}`,
        onClick: () => {
          clearCurrent()
          loadFile(f.path)
        }
      }, f.path.split('/').slice(-1)[0])
    ])
  }

  let dir = f
  return (
    h(TreeView, {
      nodeLabel: dir.path.split('/').slice(-1)[0],
      collapsed: dir.collapsed,
      onClick: () => {
        state.bypath.get()[dir.path].collapsed = !dir.collapsed
        state.tree.set(state.tree.get().concat() /* copy the array */)
      }
    }, [
      h('ul.menu-list', state.tree.get()
        .filter(f =>
          f.path.slice(0, dir.path.length + 1) === dir.path + '/' &&
          f.path.split('/').length - 1 === dir.path.split('/').length
        )
        .map(f => h(Folder, {key: f.path, f}))
        .concat(
          h('li', [
            h(ButtonAdd, {dir, active: dir.active})
          ])
        )
      )
    ])
  )
}).withEquality((prevF, nextF) =>
  prevF
  ? prevF.active !== nextF.active
  : true
)

const ButtonAdd = pure(function ButtonAdd ({dir, active}) {
  return h('a', {
    className: active ? 'is-active' : '',
    href: `#!/${state.slug.get()}/?new-file-at=${dir.path}`,
    onClick: () => newFile(dir.path).then(resetTreeForCurrent)
  }, '+ new file')
})

const Delete = pure(function Delete () {
  if (!state.current.deleting.get()) {
    return h('#Delete', [
      h('.level', [
        h('.level-left', [
          h('button.button.is-warning', {
            onClick: () => {
              state.current.deleting.set(true)
            }
          }, 'Delete this?')
        ])
      ])
    ])
  }

  return h('#Delete', [
    h('p', `Delete ${state.current.path.get()}?`),
    h('.level', [
      h('.level-left', [
        h('button.button.is-small', {
          onClick: () => state.current.deleting.set(false)
        }, 'Cancel')
      ]),
      h('.level-right', [
        h('button.button.is-large.is-danger', {
          onClick: () => {
            let path = state.current.path.get()

            let currentTree = state.tree.get()
              .filter(f => f.type === 'blob')
              .sort((a, b) => a.path < b.path ? -1 : 1)
            let currentFile = state.bypath.get()[path]
            let currentIndex = currentTree.indexOf(currentFile)
            let nextIndex = currentIndex === 0 ? 1 : currentIndex - 1
            let nextPath = currentTree[nextIndex].path

            log.info(`Deleting ${path}.`)
            gh.delete(`repos/${state.slug.get()}/contents/${path}`, {
              sha: state.current.gh_contents.get().sha,
              message: `deleted ${path}.`
            })
              .then(() => {
                log.success('Deleted.')
                clearCurrent()
                location.hash = `#!/${state.slug.get()}/${nextPath}`
                return Promise.all([
                  loadFile(nextPath),
                  loadTree()
                ])
              })
              .then(resetTreeForCurrent)
              .catch(log.error)
          }
        }, 'Delete')
      ])
    ])
  ])
})

const Upload = pure(function Upload () {
  return h('#Upload', [
    h(Title),
    h('.upload', [
      h('label', [
        state.current.upload.file.get()
          ? h('div', [
            h(Preview, {
              name: state.current.upload.file.get().name,
              blob: state.current.upload.file.get()
            })
          ])
          : h(FileUpload, {
            onFile: f => {
              state.current.upload.file.set(f)
              state.current.givenName.set(f.name)
            },
            onBase64: b64 => state.current.upload.base64.set(b64)
          })
      ])
    ])
  ])
})

const Title = pure(function Title () {
  var buttons = []

  if (state.current.editable.get()) {
    buttons.push(
      h('p.control', [
        h('button.button.is-primary.is-small.is-inverted', {
          className: state.fullscreen.get() ? '' : 'is-outlined'
        }, [
          h('span.icon.is-small', [ h('i.fa.fa-expand') ]),
          h('span', {
            onClick: () => state.fullscreen.set(!state.fullscreen.get())
          }, state.fullscreen.get() ? 'Expanded' : 'Expand')
        ])
      ])
    )
  }

  if (
    state.current.editable.get() &&
    (state.mode.get() === EDIT || state.mode.get() === ADD) &&
    window.coisas.canPreview(
      state.current.path.get(),
      state.current.ext.get(),
      !state.existing.get()
    )
  ) {
    buttons.push(
      h('p.control', [
        h('button.button.is-info.is-small.is-inverted', {
          className: state.current.previewing.get() ? 'is-outlined' : ''
        }, [
          h('span.icon.is-small', [ h('i.fa.fa-pencil-square') ]),
          h('span', {
            onClick: () => state.current.previewing.set(false)
          }, 'Edit')
        ])
      ])
    )
    buttons.push(
      h('p.control', [
        h('button.button.is-success.is-small.is-inverted', {
          className: state.current.previewing.get() ? '' : 'is-outlined'
        }, [
          h('span.icon.is-small', [ h('i.fa.fa-eye') ]),
          h('span', {
            onClick: () => state.current.previewing.set(true)
          }, 'Preview')
        ])
      ])
    )
  }

  var title = state.existing.get()
    ? h('h3.title.is-3', state.current.path.get())
    : h('input.input.is-large', {
      value: state.current.name.get(),
      onChange: e => state.current.givenName.set(e.target.value)
    })

  return h('.level', [
    h('.level-left', [ title ]),
    h('.level-right', [
      h('.level-item', [
        h('.field.has-addons', [ buttons ])
      ])
    ])
  ])
})

const PagePreview = pure(function PagePreview () {
  return h('#PagePreview', {
    ref: el => {
      if (el) {
        window.coisas.generatePreview(el, {
          path: state.current.path.get(),
          name: state.current.name.get(),
          ext: state.current.ext.get(),
          mime: state.current.mime.get(),
          content: state.current.shown.content.get(),
          metadata: state.current.shown.metadata.get(),
          slug: state.slug.get(),
          tree: state.tree.get(),
          edited: state.editedValues.get()
        })
      }
    }
  })
})

const Page = pure(function Page () {
  if (state.current.previewing.get()) {
    components = [ h(PagePreview) ]
  } else {
    var editor
    switch (state.current.mime.get()) {
      case 'text/x-markdown':
        editor = h(EditMarkdown)
        break
      case 'text/html':
      case 'text/plain':
      case 'text/css':
      case 'text/yaml':
      case 'application/json':
      case 'application/javascript':
      case undefined:
        editor = h(EditCode)
        break
    }

    var preview
    try {
      preview = h(Preview, {
        name: state.current.name.get(),
        base64: state.current.gh_contents.get().content
      })
    } catch (e) {}

    var components = editor
      ? [ editor ]
      : [ preview ]

    let uploadMode = state.existing.get() ? REPLACE : UPLOAD
    var buttons = []
    buttons.push(
      h('.level-left', [
        h('button.button.is-dark', {
          onClick: () => {
            state.mode.set(uploadMode)
          }
        },
        state.existing.get()
          ? 'Replace with an uploaded file'
          : 'Upload a file'
        )
      ])
    )

    if (state.existing.get()) {
      buttons.push(
        h('.level-right', [ h(Delete) ])
      )
    }

    components.push(h('.level', buttons))
  }

  return h('#Page', {
    className: state.fullscreen.get() ? 'fullscreen' : ''
  }, [
    h(Title),
    h('div', components)
  ])
})

const EditMarkdown = pure(function EditMarkdown () {
  if (state.current.loading.get()) {
    return h('div')
  }

  return h('#EditMarkdown.content', [
    h(Json, {
      value: state.current.shown.metadata.get(),
      onChange: metadata => {
        state.current.edited.metadata.set(metadata)
      }
    }),
    h(ProseMirror, {
      defaultValue: state.current.shown.content.get(),
      onChange: content => {
        state.current.edited.content.set(content)
      }
    })
  ])
})

const EditCode = pure(function EditCode () {
  if (state.current.shown.content.get() === null) {
    return h('div', 'cannot render this file here.')
  }

  if (state.current.loading.get()) {
    return h('div')
  }

  let value = state.current.shown.content.get()

  return h('#EditCode.content', [
    state.current.frontmatter.get() && h(Json, {
      value: state.current.shown.metadata.get(),
      onChange: metadata => {
        state.current.edited.metadata.set(metadata)
      }
    }),
    h(CodeMirror, {
      value,
      onChange: v => state.current.edited.content.set(v),
      options: {
        viewportMargin: Infinity,
        mode: state.current.mime.get()
      }
    })
  ])
})

const Directory = pure(function Directory () {
  return h('#Directory', [
    h('center', [
      h('br'),
      h('p', 'Use the tree on the left to select a file or create a new one.')
    ])
  ])
})

const Images = pure(function Images () {
  let images = state.images.get()
  let mid = parseInt(images.length / 2)

  const renderImage = f =>
    h('img', {
      key: f.path,
      src: `https://raw.githubusercontent.com/${state.slug.get()}/master/${f.path}`,
      title: f.path,
      onDoubleClick: () => {
        clearCurrent()
        loadFile(f.path)
        location.hash = `#!/${state.slug.get()}/${f.path}`
      }
    })

  return h('#Images', [
    images.length
    ? 'drag an image from here to the editor to insert it.'
    : '',
    h('.columns', [
      h('.column.is-half', images.slice(0, mid).map(renderImage)),
      h('.column.is-half', images.slice(mid).map(renderImage))
    ]),
    state.mediaUpload.file.get()
      ? h(Preview, {
        name: state.mediaUpload.file.get().name,
        blob: state.mediaUpload.file.get()
      }, [
        h('.level', [
          h('.level-left', [
            h('button.button.is-small.is-light', {
              onClick: () => {
                state.mediaUpload.file.set(null)
                state.mediaUpload.base64.set(null)
              }
            }, 'cancel')
          ]),
          h('.level-right', [
            h('button.button.is-small.is-info', {
              onClick: () => {
                let file = state.mediaUpload.file.get()
                log.info(`Uploading ${file.name} to ${window.coisas.defaultMediaUploadPath}/.`)

                gh.saveFile({
                  repoSlug: state.slug.get(),
                  mode: UPLOAD,
                  path: `${window.coisas.defaultMediaUploadPath}/${file.name}`,
                  content: state.mediaUpload.base64.get()
                })
                .then(() => {
                  loadTree()
                  state.mediaUpload.file.set(null)
                  state.mediaUpload.base64.set(null)
                  log.success('Uploaded.')
                })
                .catch(log.error)
              }
            }, 'upload')
          ])
        ])
      ])
      : h(FileUpload, {
        onFile: f => state.mediaUpload.file.set(f),
        onBase64: b64 => state.mediaUpload.base64.set(b64)
      })
  ])
})

const Save = pure(function Save () {
  var disabled = true
  if (state.current.edited.content.get() &&
    state.current.edited.content.get() !== state.current.stored.get().content) {
    disabled = false
  }
  if (Object.keys(state.current.edited.metadata.get() || {}).length) disabled = false
  if (state.current.upload.base64.get()) disabled = false

  return h('#Save', [
    h('button.button.is-large.is-primary', {
      disabled,
      onClick: () => {
        log.info(`Saving ${state.current.path.get()} to GitHub.`)
        gh.saveFile({
          repoSlug: state.slug.get(),
          mode: state.mode.get(),
          path: state.current.path.get(),
          sha: state.current.gh_contents.get()
            ? state.current.gh_contents.get().sha
            : undefined,
          content: state.current.upload.base64.get()
            ? state.current.upload.base64.get()
            : state.current.frontmatter.get()
              ? base64.encode(
                renderWithFrontmatter(
                  state.current.shown.content.get(),
                  state.current.shown.metadata.get(),
                  state.slug.get()
                )
              )
              : base64.encode(state.current.shown.content.get())
        })
          .then(() => {
            if (state.mode.get() === ADD || state.mode.get() === UPLOAD) {
              return Promise.resolve()
                .then(loadTree)
                .then(() => loadFile(state.current.path.get()))
                .then(resetTreeForCurrent)
            }
          })
          .then(() => log.success('Saved.'))
          .catch(log.error)
      }
    }, state.mode.switch(
      ADD, 'Create file',
      REPLACE, 'Replace file',
      UPLOAD, 'Upload',
      EDIT, 'Save changes'
    ).get())
  ])
})
