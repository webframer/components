import cn from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import './spinner.css'
import { type } from './types.js'
import View from './View.jsx'

/**
 * Spinner - Pure Component
 *
 * @param {string} size - spinner size
 * @param {string} color - spinner color
 * @param {string} className - optional, will be prepended with spinner classes
 * @param {boolean} [loading] - whether to animate the spinner
 * @param {*} props - other attributes to pass to spinner
 * @returns {object} - React Component
 */
export function Spinner ({
  size = 'base',  // Enum
  color = 'primary',  // Enum
  loading = true,
  className,
  ...props
}) {
  return <View className={cn(className, 'spinner', size, color, {loading})} {...props} >
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
  </View>
}

Spinner.propTypes = {
  size: type.Enum(['largest', 'larger', 'large', 'base', 'small', 'smaller', 'smallest']),
  color: type.Enum(['primary', 'secondary', 'tertiary', 'light', 'dark', 'white', 'black']),
  className: PropTypes.string,
}

export default React.memo(Spinner)
