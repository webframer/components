import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json.js'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp } from './Highlighter.jsx'

// todo: improvement 3 - define own color scheme
SyntaxHighlighter.registerLanguage('json', json)
export const mdJSON = createMarkdownComponentsProp('json', theme)
