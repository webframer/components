import cn from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { type } from '../types.js'
import View from './View.js'

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
  size,  // Enum
  color,  // Enum
  loading = true,
  className,
  ...props
}) {
  if (size) size = 'spinner-' + size
  if (color) color = 'spinner-' + color
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
  size: type.SizeModifier,
  color: type.Enum(['primary', 'secondary', 'tertiary', 'light', 'dark', 'white', 'black']),
  className: PropTypes.string,
}

const SpinnerMemo = React.memo(Spinner)
SpinnerMemo.name = Spinner.name
SpinnerMemo.propTypes = Spinner.propTypes
SpinnerMemo.defaultProps = Spinner.defaultProps
export default SpinnerMemo
