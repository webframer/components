import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import less from 'react-syntax-highlighter/dist/esm/languages/prism/less.js'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp } from './Highlighter.js'

// todo: improvement 3 - define own color scheme
SyntaxHighlighter.registerLanguage('less', less)
export const mdLESS = createMarkdownComponentsProp('less', theme)

