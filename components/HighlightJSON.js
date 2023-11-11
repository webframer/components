import * as React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
// import json from 'react-syntax-highlighter/dist/esm/languages/prism/json.js' - errors in node
// import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp, highlightCodeTheme } from './Highlighter.js'

// Copied from package dist because of import error when used in Node without transpiler
function json (Prism) {
  // https://www.json.org/json-en.html
  Prism.languages.json = {
    property: {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
      lookbehind: true,
      greedy: true,
    },
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
      lookbehind: true,
      greedy: true,
    },
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
      greedy: true,
    },
    number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    punctuation: /[{}[\],]/,
    operator: /:/,
    boolean: /\b(?:false|true)\b/,
    null: {
      pattern: /\bnull\b/,
      alias: 'keyword',
    },
  }
  Prism.languages.webmanifest = Prism.languages.json
}

json.displayName = 'json'
json.aliases = ['webmanifest']

SyntaxHighlighter.registerLanguage('json', json)
export const mdJSON = createMarkdownComponentsProp('json', highlightCodeTheme)
