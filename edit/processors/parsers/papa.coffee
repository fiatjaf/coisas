#
#   Papa Parse
#   v2.1.3
#   https://github.com/mholt/jquery.parse
#

# continue to next input element
# This copy is very important
# continue to next input element
# Proceeds to next file
# Aborts all queued files immediately
# This copy is very important
isFunction = (func) ->
  typeof func is "function"

# Streamer is a wrapper over Parser to handle chunking the input file
Streamer = (file, settings) ->
  # 5 MB
  # it had better be there...!
  blobLoaded = (event) ->
    text = partialLine + event.target.result
    partialLine = ""
    
    # If we're maxing out the chunk size, we probably cut a line
    # in half. However: doing these operations if the whole file
    # fits in one chunk will leave off the last line, which is bad.
    if text.length >= settings.chunkSize
      lastLineEnd = text.lastIndexOf("\n")
      lastLineEnd = text.lastIndexOf("\r")  if lastLineEnd < 0
      if lastLineEnd > -1
        partialLine = text.substring(lastLineEnd + 1) # skip the line ending character
        text = text.substring(0, lastLineEnd)
    results = parser.parse(text)
    if start >= file.size
      done event
    else if results.errors.abort
      return
    else
      nextChunk()
    return
  done = (event) ->
    settings.onComplete `undefined`, file, settings.inputElem, event  if typeof settings.onComplete is "function"
    return
  blobError = ->
    settings.onFileError reader.error, file, settings.inputElem  if typeof settings.onFileError is "function"
    return
  nextChunk = ->
    if start < file.size
      reader.readAsText file.slice(start, Math.min(start + settings.chunkSize, file.size)), settings.config.encoding
      start += settings.chunkSize
    return
  settings = {}  unless settings
  settings.chunkSize = 1024 * 1024 * 5  unless settings.chunkSize
  if settings.config.step
    userStep = settings.config.step
    settings.config.step = (data) ->
      userStep data, file, settings.inputElem
  start = 0
  partialLine = ""
  parser = new Parser(settings.config)
  reader = new FileReader()
  reader.onload = blobLoaded
  reader.onerror = blobError
  @stream = (completeCallback, fileErrorCallback) ->
    settings.onComplete = completeCallback
    settings.onFileError = fileErrorCallback
    nextChunk()
    return

  return

# Parser is the actual parsing component.
# It is under test and does not depend on jQuery.
# You could rip this entire function out of the plugin
# and use it independently (with attribution).
Parser = (config) ->
  # End of input is also end of the last row
  validConfig = (config) ->
    config = {}  if typeof config isnt "object"
    config.delimiter = _defaultConfig.delimiter  if typeof config.delimiter isnt "string" or config.delimiter.length isnt 1
    config.delimiter = _defaultConfig.delimiter  if config.delimiter is "\"" or config.delimiter is "\n"
    config.header = _defaultConfig.header  if typeof config.header isnt "boolean"
    config.dynamicTyping = _defaultConfig.dynamicTyping  if typeof config.dynamicTyping isnt "boolean"
    config.preview = _defaultConfig.preview  if typeof config.preview isnt "number"
    config.step = _defaultConfig.step  if typeof config.step isnt "function"
    config
  guessDelimiter = (input) ->
    recordSep = String.fromCharCode(30)
    unitSep = String.fromCharCode(31)
    delimiters = [
      ","
      "\t"
      "|"
      ";"
      recordSep
      unitSep
    ]
    bestDelim = undefined
    bestDelta = undefined
    fieldCountPrevRow = undefined
    i = 0

    while i < delimiters.length
      delim = delimiters[i]
      delta = 0
      avgFieldCount = 0
      preview = new Parser(
        delimiter: delim
        header: false
        dynamicTyping: false
        preview: 10
      ).parse(input)
      j = 0

      while j < preview.results.length
        fieldCount = preview.results[j].length
        avgFieldCount += fieldCount
        if typeof fieldCountPrevRow is "undefined"
          fieldCountPrevRow = fieldCount
          continue
        else if fieldCount > 1
          delta += Math.abs(fieldCount - fieldCountPrevRow)
          fieldCountPrevRow = fieldCount
        j++
      avgFieldCount /= preview.results.length
      if (typeof bestDelta is "undefined" or delta < bestDelta) and avgFieldCount > 1.99
        bestDelta = delta
        bestDelim = delim
      i++
    _config.delimiter = bestDelim
    !!bestDelim
  handleQuote = ->
    delimBefore = (_state.i > 0 and isBoundary(_state.i - 1)) or _state.i is 0
    delimAfter = (_state.i < _input.length - 1 and isBoundary(_state.i + 1)) or _state.i is _input.length - 1
    escaped = _state.i < _input.length - 1 and _input[_state.i + 1] is "\""
    if _state.inQuotes and escaped
      _state.fieldVal += "\""
      _state.i++
    else if delimBefore or delimAfter
      _state.inQuotes = not _state.inQuotes
    else
      addError "Quotes", "UnexpectedQuotes", "Unexpected quotes"
    return
  inQuotes = ->
    appendCharToField()
    return
  appendCharToField = ->
    _state.fieldVal += _state.ch
    return
  notInQuotes = ->
    if _state.ch is _config.delimiter
      saveValue()
    else if (_state.ch is "\r" and _state.i < _input.length - 1 and _input[_state.i + 1] is "\n") or (_state.ch is "\n" and _state.i < _input.length - 1 and _input[_state.i + 1] is "\r")
      newRow()
      _state.i++
    else if _state.ch is "\r" or _state.ch is "\n"
      newRow()
    else
      appendCharToField()
    return
  isBoundary = (i) ->
    _input[i] is _config.delimiter or _input[i] is "\n" or _input[i] is "\r"
  saveValue = ->
    if _config.header
      if _state.lineNum is 1 and _invocations is 1
        _state.parsed.fields.push _state.fieldVal
      else
        currentRow = _state.parsed.rows[_state.parsed.rows.length - 1]
        fieldName = _state.parsed.fields[_state.field]
        if fieldName
          _state.fieldVal = tryParseFloat(_state.fieldVal)  if _config.dynamicTyping
          currentRow[fieldName] = _state.fieldVal
        else
          currentRow.__parsed_extra = []  if typeof currentRow.__parsed_extra is "undefined"
          currentRow.__parsed_extra.push _state.fieldVal
    else
      _state.fieldVal = tryParseFloat(_state.fieldVal)  if _config.dynamicTyping
      _state.parsed[_state.parsed.length - 1].push _state.fieldVal
    _state.fieldVal = ""
    _state.field++
    return
  newRow = ->
    endRow()
    if streaming()
      _state.errors = {}
      _state.errors.length = 0
    if _config.header
      if _state.lineNum > 0
        if streaming()
          _state.parsed.rows = [{}]
        else
          _state.parsed.rows.push {}
    else
      if streaming()
        _state.parsed = [[]]
      else _state.parsed.push []  unless _config.header
    _state.lineNum++
    _state.line = ""
    _state.field = 0
    return
  endRow = ->
    return  if _abort
    saveValue()
    emptyLine = trimEmptyLine()
    inspectFieldCount()  if not emptyLine and _config.header
    if streaming() and (not _config.header or (_config.header and _state.parsed.rows.length > 0))
      keepGoing = _config.step(returnable())
      _abort = true  if keepGoing is false
    return
  streaming = ->
    typeof _config.step is "function"
  tryParseFloat = (num) ->
    isNumber = _regex.floats.test(num)
    (if isNumber then parseFloat(num) else num)
  trimEmptyLine = ->
    if _regex.empty.test(_state.line)
      if _config.header
        if _state.lineNum is 1
          _state.parsed.fields = []
          _state.lineNum--
        else
          _state.parsed.rows.splice _state.parsed.rows.length - 1, 1
      else
        _state.parsed.splice _state.parsed.length - 1, 1
      return true
    false
  inspectFieldCount = ->
    return true  unless _config.header
    return true  if _state.parsed.rows.length is 0
    expected = _state.parsed.fields.length
    
    # Actual field count tabulated manually because IE<9 doesn't support Object.keys
    actual = 0
    lastRow = _state.parsed.rows[_state.parsed.rows.length - 1]
    for prop of lastRow
      continue
    if actual < expected
      return addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + expected + " fields but parsed " + actual)
    else return addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + expected + " fields but parsed " + actual)  if actual > expected
    true
  addError = (type, code, msg, errKey) ->
    row = (if _config.header then ((if _state.parsed.rows.length then _state.parsed.rows.length - 1 else `undefined`)) else _state.parsed.length - 1)
    key = errKey or row
    _state.errors[key] = []  if typeof _state.errors[key] is "undefined"
    _state.errors[key].push
      type: type
      code: code
      message: msg
      line: _state.lineNum
      row: row
      index: _state.i + _chunkOffset

    _state.errors.length++
    false
  returnable = ->
    results: _state.parsed
    errors: _state.errors
    meta:
      delimiter: _config.delimiter
  reset = (input) ->
    _invocations++
    _chunkOffset += input.length  if _invocations > 1 and streaming()
    _state = freshState()
    _input = input
    return
  freshState = ->
    
    # If streaming, and thus parsing the input in chunks, this
    # is careful to preserve what we've already got, when necessary.
    parsed = undefined
    if _config.header
      parsed =
        fields: (if streaming() then _state.parsed.fields or [] else [])
        rows: (if streaming() and _invocations > 1 then [{}] else [])
    else
      parsed = [[]]
    i: 0
    lineNum: (if streaming() then _state.lineNum else 1)
    field: 0
    fieldVal: ""
    line: ""
    ch: ""
    inQuotes: false
    parsed: parsed
    errors:
      length: 0
  self = this
  _invocations = 0
  _input = ""
  _chunkOffset = 0
  _abort = false
  _config = {}
  _state = freshState()
  _defaultConfig =
    delimiter: ""
    header: true
    dynamicTyping: true
    preview: 0

  _regex =
    floats: /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i
    empty: /^\s*$/

  config = validConfig(config)
  _config =
    delimiter: config.delimiter
    header: config.header
    dynamicTyping: config.dynamicTyping
    preview: config.preview
    step: config.step

  @parse = (input) ->
    return returnable()  if typeof input isnt "string"
    reset input
    if not _config.delimiter and not guessDelimiter(input)
      addError "Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to comma", "config"
      _config.delimiter = ","
    _state.i = 0
    while _state.i < _input.length
      break  if _abort or (_config.preview > 0 and _state.lineNum > _config.preview)
      _state.ch = _input[_state.i]
      _state.line += _state.ch
      if _state.ch is "\""
        handleQuote()
      else if _state.inQuotes
        inQuotes()
      else
        notInQuotes()
      _state.i++
    if _abort
      addError "Abort", "ParseAbort", "Parsing was aborted by the user's step function", "abort"
    else
      endRow()
      addError "Quotes", "MissingQuotes", "Unescaped or mismatched quotes"  if _state.inQuotes
    returnable()

  @getOptions = ->
    delimiter: _config.delimiter
    header: _config.header
    dynamicTyping: _config.dynamicTyping
    preview: _config.preview
    step: _config.step

  return

# jQuery $("[type='file']").parse()
#$.fn.parse = (options) ->
#  parseFile = (f) ->
#    completeFunc = complete
#    errorFunc = undefined
#    if isFunction(options.error)
#      errorFunc = ->
#        options.error reader.error, f.file, f.inputElem
#        return
#    if isFunction(options.complete)
#      completeFunc = (results, file, inputElem, event) ->
#        options.complete results, file, inputElem, event
#        complete()
#        return
#    if isFunction(options.before)
#      returned = options.before(f.file, f.inputElem)
#      if typeof returned is "object"
#        f.instanceConfig = f.instanceConfig or {}
#        f.instanceConfig[k] = v for k, v of returned
#      else if returned is "skip"
#        return complete()
#      else if returned is false
#        error "AbortError", f.file, f.inputElem
#        return
#    if f.instanceConfig.step
#      _config = {}
#      _config[k] = v for k, v of f.instanceConfig
#      streamer = new Streamer(f.file,
#        inputElem: f.inputElem
#        config: _config
#      )
#      streamer.stream completeFunc, errorFunc
#    else
#      reader = new FileReader()
#      reader.onerror = errorFunc
#      reader.onload = (event) ->
#        text = event.target.result
#        results = parse(text, f.instanceConfig)
#        completeFunc results, f.file, f.inputElem, event
#        return
#
#      reader.readAsText f.file, f.instanceConfig.encoding
#    return
#  error = (name, file, elem) ->
#    if isFunction(options.error)
#      options.error
#        name: name
#      , file, elem
#    return
#  complete = ->
#    queue.splice 0, 1
#    parseFile queue[0]  if queue.length > 0
#    return
#  config = options.config or {}
#  queue = []
#  @each (idx) ->
#    supported = this.tagName.toUpperCase() is "INPUT" and this.type is "file" and window.FileReader
#    return true  unless supported
#    instanceConfig = {}
#    instanceConfig[k] = v for k, v of config
#    if not @files or @files.length is 0
#      error "NoFileError", `undefined`, this
#      return true
#    i = 0
#
#    while i < @files.length
#      queue.push
#        file: @files[i]
#        inputElem: this
#        instanceConfig: instanceConfig
#
#      i++
#    parseFile queue[0]  if queue.length > 0
#    return
#
#  return this
#  return

exports = {}
exports.parse = (input, options) ->
  parser = new Parser(options)
  parser.parse input

module.exports = exports
