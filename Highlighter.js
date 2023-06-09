import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { type } from './types.js'

/**
 * Syntax Highlighter for `<Markdown>` code block
 * @example:
 *  import { Markdown, mdJSX } from '@webframer/ui'
 *
 *  <Markdown components={mdJSX}} children={`~~~jsx\n${jsxSourceCode}\n~~~`} />
 *
 */
export function Highlighter (props) {
  return <SyntaxHighlighter {...props} />
}

/**
 * Create `components` prop for use with `<Markdown>`
 * @see: `HighlightJSX.js` for example
 *
 * @param {string} language - one of the supported code languages (eg. 'jsx')
 * @param {object} [style] - SyntaxHighlighter theme
 * @returns {object} `components` prop
 */
export function createMarkdownComponentsProp (language, style = highlightCodeTheme) {
  return {
    code ({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <HighlightCode children={String(children).replace(/\n$/, '')} {...{language, style}} {...props} />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }
}

Highlighter.defaultProps = {
  PreTag ({children, style, ...props}) {
    if (style) {
      delete style.padding
      delete style.margin
      delete style.borderRadius
      props.style = style
    }
    return <div className='code-block-wrap' {...props}>{children}</div>
  },
}

Highlighter.propTypes = {
  // Source code string
  children: type.String.isRequired,
  // Code block language
  language: type.String.isRequired,
  // The element that wraps around the `<code>` block
  PreTag: type.OneOf([type.String, type.JSXElementType]).isRequired,
}

const HighlightCode = React.memo(Highlighter)
export default HighlightCode

export const highlightCodeTheme = {
  'code[class*="language-"]': {
    'color': '#EEFFFF',
    // 'background': 'none',
    'textShadow': '0 1px rgba(0, 0, 0, 0.3)',
    'fontFamily': 'Consolas, Monaco, \'Andale Mono\', \'Ubuntu Mono\', monospace',
    'textAlign': 'left',
    'whiteSpace': 'pre',
    'wordSpacing': 'normal',
    'wordBreak': 'normal',
    'wordWrap': 'normal',
    'lineHeight': '1.5',
    'MozTabSize': '4',
    'OTabSize': '4',
    'tabSize': '4',
    'WebkitHyphens': 'none',
    'MozHyphens': 'none',
    'msHyphens': 'none',
    'hyphens': 'none',
  },
  // applies to 'code-block-wrap'
  'pre[class*="language-"]': {
    'color': '#EEFFFF',
    // 'background': 'rgb(33,33,33)',
    'textShadow': '0 1px rgba(0, 0, 0, 0.3)',
    'fontFamily': 'Consolas, Monaco, \'Andale Mono\', \'Ubuntu Mono\', monospace',
    'textAlign': 'left',
    'whiteSpace': 'pre',
    'wordSpacing': 'normal',
    'wordBreak': 'normal',
    'wordWrap': 'normal',
    'lineHeight': '1.5',
    'MozTabSize': '4',
    'OTabSize': '4',
    'tabSize': '4',
    'WebkitHyphens': 'none',
    'MozHyphens': 'none',
    'msHyphens': 'none',
    'hyphens': 'none',
    'padding': '1em',
    'margin': '.5em 0',
    'overflow': 'auto',
    'borderRadius': '0.3em',
  },
  ':not(pre) > code[class*="language-"]': {
    'background': '#282a36',
    'padding': '.1em',
    'borderRadius': '.3em',
    'whiteSpace': 'normal',
  },
  '.namespace': {
    'Opacity': '.7',
  },
  'comment': {
    'color': '#616161',
  },
  'prolog': {
    'color': '#8C8C8C',
  },
  'doctype': {
    'color': '#8C8C8C',
  },
  'cdata': {
    'color': '#8C8C8C',
  },
  'constant': {
    'color': '#EEFFFF',
  },
  'property': { // json keys
    'color': '#EEFFFF',
  },
  'tag': { // property key for object expression
    'color': '#EEFFFF',
  },
  'attr-name': {
    'color': '#89DDFF',
  },
  'atrule': {
    'color': '#89DDFF',
  },
  'variable': {
    'color': '#89DDFF',
  },
  'function': {
    'color': '#C3E88D',
  },
  'class-name': {
    'color': '#C3E88D',
  },
  'string': {
    'color': '#FFEA7D',
  },
  '.language-css .token.string': {
    'color': '#FFEA7D',
  },
  '.style .token.string': {
    'color': '#FFEA7D',
  },
  'attr-value': {
    'color': '#FFEA7D',
  },
  'char': {
    'color': '#FFCB6B',
  },
  'inserted': {
    'color': '#FFCB6B',
  },
  'selector': {
    'color': '#FFCB6B',
  },
  'regex': {
    'color': '#FFCB6B',
  },
  'number': {
    'color': '#F78C6C',
  },
  'boolean': {
    'color': 'rgb(190,150,240)',
  },
  'keyword': {
    'color': 'rgb(190,150,240)',
  },
  'operator': {
    'color': 'rgb(190,150,240)',
  },
  'url': {
    'color': 'rgb(190,150,240)',
  },
  'punctuation': { // < : ; | = ' , / >
    'color': 'rgb(190,150,240)',
  },
  'symbol': {
    'color': '#FF99FF',
  },
  'builtin': {
    'color': '#FF99FF',
  },
  'entity': {
    'color': '#FF99FF',
    'cursor': 'help',
  },
  'important': {
    'color': '#FF99FF',
    'fontWeight': 'bold',
  },
  'deleted': {
    'color': '#FF5370',
  },
  'bold': {
    'fontWeight': 'bold',
  },
  'italic': {
    'fontStyle': 'italic',
  },
}
