RemoteStorage.defineModule 'coisas', (privateClient) ->
  privateClient.declareType 'metadata',
    type: 'object'
    properties:
      kind: {type: 'string'}
      title: {type: 'string'}
      created: {type: 'integer'}
      edited: {type: 'integer'}
      sortBy: {type: 'string'}
      reverse: {type: 'integer'}
    required: ['kind', 'created']

  return
    exports:
      listChildrenNames: (path, cb) ->
        privateClient.getAll(path).then (nodes) ->
          children = []
          if nodes.meta
            sortBy = children.meta.sortBy or 'created'
            reverse = children.meta.reverse or 1
          for item, nodedata of nodes
            if item.slice(-1)[0] == '/'
              children.push
                title: if item.meta then item.meta.title or path else path
                path: item
          children.sort (a, b) -> (-reverse) * (b[sortBy] - a[sortBy])
          cb children

      putNode: (path, meta, text, data, cb) ->
        if typeof data == 'function'
          cb = data
          data = null

        mime =
          'yaml': 'application/yaml; charset=UTF-8'
          'json': 'application/json; charset=UTF-8'
          'csv': 'application/csv; charset=UTF-8'
          'md': 'text/markdown; charset=UTF-8'
          'txt': 'text/plain; charset=UTF-8'
          'html': 'text/html; charset=UTF-8'

        t = privateClient.storeFile mime[text.type], path + 'text', text.content
        m = privateClient.storeObject 'metadata', path + 'meta', meta
        d = switch data
          when undefined, null, false then {then: ->}
          else
            privateClient.storeFile mime[data.type], path + 'data', data.content
        t.then -> m.then -> d.then -> cb true

      getNode: (path, cb) ->
        m = privateClient.getObject(path + 'meta')
        t = privateClient.getFile(path + 'text')
        d = privateClient.getFile(path + 'data')

        mime =
          'application/yaml; charset=UTF-8': 'yaml'
          'application/json; charset=UTF-8': 'json'
          'application/csv; charset=UTF-8': 'csv'
          'text/markdown; charset=UTF-8': 'md'
          'text/plain; charset=UTF-8': 'txt'
          'text/html; charset=UTF-8': 'html'

        @listChildrenNames path, (children) ->
          m.then (meta) ->
            t.then (text) ->
              d.then (data) ->
                cb(meta, {type: mime[text.mimeType], content: text.data}, {type: mime[data.mimeType], content: data.data})
