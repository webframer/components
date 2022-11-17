import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula.js'
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
  return <SyntaxHighlighter style={theme} {...props} />
}

/**
 * Create `components` prop for use with `<Markdown>`
 * @see: `HighlightJSX.js` for example
 *
 * @param {string} lang - one of the supported code languages (eg. 'jsx')
 * @returns {object} `components` prop
 */
export function createMarkdownComponentsProp (lang) {
  return {
    code ({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <HighlightCode children={String(children).replace(/\n$/, '')} language={lang} {...props} />
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

