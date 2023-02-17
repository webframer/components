import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash.js'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark.js'
import { createMarkdownComponentsProp } from './Highlighter.jsx'

SyntaxHighlighter.registerLanguage('bash', bash)

// For shell script, bash, or hidden files, such as .env and .gitignore
export const mdBASH = createMarkdownComponentsProp('bash', theme)

