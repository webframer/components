import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx.js'
import { createMarkdownComponentsProp } from './Highlighter.jsx'

SyntaxHighlighter.registerLanguage('jsx', jsx)
export const mdJSX = createMarkdownComponentsProp('jsx')
