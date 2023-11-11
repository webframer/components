import * as React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
// import less from 'react-syntax-highlighter/dist/esm/languages/prism/less.js'
// import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp } from './Highlighter.js'
import { atomDark } from './mdThemes.js'

// todo: improvement 3 - define own color scheme
function less (Prism) {
  /* FIXME :
:extend() is not handled specifically : its highlighting is buggy.
Mixin usage must be inside a ruleset to be highlighted.
At-rules (e.g. import) containing interpolations are buggy.
Detached rulesets are highlighted as at-rules.
A comment before a mixin usage prevents the latter to be properly highlighted.
*/
  Prism.languages.less = Prism.languages.extend('css', {
    comment: [
      /\/\*[\s\S]*?\*\//,
      {
        pattern: /(^|[^\\])\/\/.*/,
        lookbehind: true,
      },
    ],
    atrule: {
      pattern:
        /@[\w-](?:\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};\s]|\s+(?!\s))*?(?=\s*\{)/,
      inside: {
        punctuation: /[:()]/,
      },
    },
    // selectors and mixins are considered the same
    selector: {
      pattern:
        /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};@\s]|\s+(?!\s))*?(?=\s*\{)/,
      inside: {
        // mixin parameters
        variable: /@+[\w-]+/,
      },
    },
    property: /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/,
    operator: /[+\-*\/]/,
  })
  Prism.languages.insertBefore('less', 'property', {
    variable: [
      // Variable declaration (the colon must be consumed!)
      {
        pattern: /@[\w-]+\s*:/,
        inside: {
          punctuation: /:/,
        },
      }, // Variable usage
      /@@?[\w-]+/,
    ],
    'mixin-usage': {
      pattern: /([{;]\s*)[.#](?!\d)[\w-].*?(?=[(;])/,
      lookbehind: true,
      alias: 'function',
    },
  })
}

less.displayName = 'less'
less.aliases = []
SyntaxHighlighter.registerLanguage('less', less)
export const mdLESS = createMarkdownComponentsProp('less', atomDark)

