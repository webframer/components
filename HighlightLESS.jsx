import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import less from 'react-syntax-highlighter/dist/esm/languages/prism/less.js'
import { createMarkdownComponentsProp } from './Highlighter.jsx'

SyntaxHighlighter.registerLanguage('less', less)
export const mdLESS = createMarkdownComponentsProp('less')

