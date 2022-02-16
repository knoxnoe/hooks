import { getRouter, getSource, loadApiFiles } from '@midwayjs/hooks/internal'
import { run } from '@midwayjs/glob'
import { join, relative } from 'upath'
import fse from 'fs-extra'
import art from 'art-template'
import { difference } from 'lodash'
import prettier from 'prettier'
import { createDebug } from '@midwayjs/hooks-core'

const debug = createDebug('hooks-hcc')

export async function buildEntry() {
  const source = getSource({ useSourceFile: false })
  debug('source', source)
  const router = getRouter(source)

  const files = run(['**/*.js'], {
    cwd: source,
    ignore: [
      '**/*.{test,spec}.{ts,tsx,js,jsx,mjs}',
      '**/__test__/**',
      '**/_client/**/*',
      '**/**.d.ts',
      '**/logs/**',
      '**/run/**',
      '**/node_modules/**',
      '**/hcc.js',
      '**/configuration.js',
    ],
  })

  const apis = files.filter(
    (file) =>
      router.isSourceFile(file, source) &&
      router.isApiFile({ file, mod: require(file) })
  )

  const preloadFiles = difference(files, apis)

  const tpl = `
    // This file is auto-generated by @midwayjs/hcc, any modification will be overwritten.

    const { setHydrateOptions } = require('@midwayjs/hooks/internal');

    setHydrateOptions({
      modules: [
        {{each apis}}
          {
            file: '{{$value}}',
            mod: require('./{{$value}}'),
          },
        {{/each}}
      ]
    })

    {{each files}}require('./{{$value}}');\n{{/each}}

    module.exports = require('./configuration')
  `

  const content = art.render(tpl, {
    files: preloadFiles.map((file) => relative(source, file)),
    apis: apis.map((file) => relative(source, file)),
  })

  const code = prettier.format(content, {
    parser: 'typescript',
    singleQuote: true,
  })

  const entry = join(source, 'hcc.js')
  await fse.writeFile(entry, code, 'utf8')

  debug('code %s', code)

  return entry
}
