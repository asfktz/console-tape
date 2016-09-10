var tape = require('tape')
var diff = require('diff')
var through = require('through2')

const formatDiff = (row) => {
  if (row.ok === false && row.operator !== 'throws') {
    let diffMethod 
    if (typeof row.actual === 'string')
      diffMethod = 'diffChars'

    else diffMethod = 'diffJson'
    
    let res = diff[diffMethod](row.actual, row.expected)

    const output = res.reduce((output, part) => {
      let style

      if (part.added) {
        style = 'color: green'
      } else if (part.removed) {
        style = 'color: red'
      } else {
        style = 'color: #DDD'
      }

      output.valuesStr += ('%c' + part.value)
      output.stylesArr.push(style)

      return output

    }, { valuesStr : '', stylesArr: [] })

    return [].concat(output.valuesStr, output.stylesArr)
  }
}

const group = (title, fn, collapsed = false, style = '') => {
  title = '%c' + title

  if (collapsed)
    console.groupCollapsed(title, style)
  else
    console.group(title, style)

  fn()

  console.groupEnd()
}

const logTest = (chunks) => {
  const test = chunks.shift()
  const end = chunks.pop()
  const asserts = chunks
  const testOk = !asserts.some((assert) => !assert.ok)
  const icon = bool => bool ? '✔' : '✖'

  group(icon(testOk) + ' ' + test.name, () => {
    asserts.forEach((assert) => {
      if (assert.ok)
        return console.log('%c' + icon(assert.ok) + ' ' +assert.name, 'color:green')

      group(icon(assert.ok) + ' ' +assert.name, () => {
        console.log('%coperator: ' + assert.operator, 'color:#777')
        console.log.apply(null, formatDiff(assert))
      }, false, 'color:red;font-weight:normal')
    })
  }, testOk, 'color:#777')

  return chunks
}

const logStream = through.obj(function (chunk, enc, done) {
  // console.log(chunk)
  this.chunks = (this.chunks || [])
  this.chunks.push(chunk)
  
  if (chunk.type === 'end') {
    let chunk = logTest(this.chunks)
    this.chunks = null
    this.push(chunk, enc)
  }

  done()
})

module.exports = () => {
  tape.createStream({ objectMode: true })
      .pipe(logStream)

  return tape
}