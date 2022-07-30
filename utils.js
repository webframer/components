import { isObject } from '@webframer/utils'

export * from './utils/css.js'
export * from './utils/interactions.js'

/**
 * Convert `tooltip` prop to Popup props for rendering
 *
 * @param {Object|String|Number} tooltip - prop
 * @param {Object|Boolean} [defaultProps] - to use for Tooltip
 * @returns {Object} props - ready for use with Popup or Tooltip component
 */
export function tooltipProps (tooltip, defaultProps) {
  return {...defaultProps, ...isObject(tooltip) ? tooltip : {title: tooltip}}
}
