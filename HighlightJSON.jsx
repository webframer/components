import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json.js'
// import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp, highlightCodeTheme } from './Highlighter.jsx'

SyntaxHighlighter.registerLanguage('json', json)
export const mdJSON = createMarkdownComponentsProp('json', highlightCodeTheme)
