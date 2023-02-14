import { isFunction, isPrimitive } from '@webframer/js'
import React from 'react'
// IMPORTANT! do not import any UI Component here to avoid circular import

/**
 * REACT RENDER HELPERS ============================================================================
 */

/**
 * Resolve `children` prop for React Component (wraps with <Text>{children}</Text> for primitives).
 * @param {any} children - prop of the Component
 * @param {object} [instance] - React Class or Function Component instance
 * @param {{textWrap?: boolean, preserveSpace?: boolean}} [options]
 */
export function renderProp (children, instance, {textWrap = true, preserveSpace} = {}) {
  if (children == null) return children
  if (isFunction(children)) return children(instance)
  if (isPrimitive(children)) {
    // wrap primitives inside Text for editing and React Native,
    // end preserve `space` character when rendering
    return textWrap ? <span className='text'>{
      preserveSpace ? String(children).replace(/ /g, '\u00a0') : children
    }</span> : children
  }

  // React element is also an object[]
  return children
}
