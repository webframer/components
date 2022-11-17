import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import less from 'react-syntax-highlighter/dist/esm/languages/prism/less.js'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula.js'
import { type } from './types.js'

SyntaxHighlighter.registerLanguage('less', less)

/**
 * Syntax Highlighter for LESS CSS code block
 * @example:
 *  import { Markdown, mdLESS } from '@webframer/ui'
 *
 *  <Markdown components={mdLESS}} children={`~~~less\n${lessSourceCode}\n~~~`} />
 *
 */
export function HighlightLESS (props) {
  return <SyntaxHighlighter language='less' style={theme} {...props} />
}

// `components` prop for use with `<Markdown>` component
export const mdLESS = {
  code ({node, inline, className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <HighlightLess children={String(children).replace(/\n$/, '')} {...props} />
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
}

function PreTag ({children, style, ...props}) {
  if (style) {
    delete style.padding
    delete style.margin
    delete style.borderRadius
    props.style = style
  }
  return <div className='code-block-wrap' {...props}>{children}</div>
}

HighlightLESS.defaultProps = {
  PreTag,
}

HighlightLESS.propTypes = {
  // Source code string
  children: type.String.isRequired,
  // The element that wraps around the `<code>` block
  PreTag: type.JSXElementType,
}

const HighlightLess = React.memo(HighlightLESS)
export default HighlightLess

