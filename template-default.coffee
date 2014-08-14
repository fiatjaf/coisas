(text, meta, data, children) ->
  return """
    <doctype !html>

    <title>#{meta.title}</title>
    <h1>#{meta.title}</h1>
    <div>
      #{text}
    </div>
    <ul>
      #{children.map (child) ->
        "<li><a href='/#{child.path}'>#{child.path.split('/').slice(-1)[0]}</a>"
      }
  """
