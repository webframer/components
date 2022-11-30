import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx.js'
// import theme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula.js'
import { createMarkdownComponentsProp, theme } from './Highlighter.jsx'

// todo: improvement 3 - define own color scheme
SyntaxHighlighter.registerLanguage('jsx', jsx)
export const mdJSX = createMarkdownComponentsProp('jsx', theme)
