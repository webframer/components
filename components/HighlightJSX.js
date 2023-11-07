import * as React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx.js'
// import theme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula.js'
import { createMarkdownComponentsProp, highlightCodeTheme } from './Highlighter.js'

SyntaxHighlighter.registerLanguage('jsx', jsx)
export const mdJSX = createMarkdownComponentsProp('jsx', highlightCodeTheme)
