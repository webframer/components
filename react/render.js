import { isCollection, isFunction } from '@webframer/js'
import React from 'react'
import Text from '../Text.jsx'

/**
 * REACT RENDER HELPERS ============================================================================
 */

/**
 * Resolve `children` prop for React Component (wraps with <Text>{children}</Text> for primitives).
 * @param {any} children - prop of the Component
 * @param {object} [instance] - React Class or Function Component instance
 * @param {object} [options]
 */
export function renderProp (children, instance, {noTextWrap, noPreserveSpace} = {}) {
  if (children == null) return children
  if (isFunction(children)) return children(instance)
  if (!isCollection(children)) { // React element is also an object[]
    // wrap primitives inside Text for editing and React Native,
    // end preserve `space` character when rendering
    return noTextWrap ? children : <Text>{
      noPreserveSpace ? children : String(children).replace(/ /g, '\u00a0')
    }</Text>
  }
  return children
}
