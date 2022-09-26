import { isCollection, isFunction } from '@webframer/js'
import React from 'react'
import Text from '../Text.jsx'

/**
 * REACT RENDER HELPERS ============================================================================
 */

/**
 * Resolve `children` prop for React Component (wraps with <Text>{children}</Text> for primitives).
 * @param {any} children - prop of the Component
 * @param {object} instance - React Class or Function Component instance
 * @param {object} [options]
 */
export function resolveChildren (children, instance, {noTextWrap} = {}) {
  if (isFunction(children)) {
    return children(instance)
  } else if (!isCollection(children)) { // React element is also an object[]
    // wrap primitives inside Text for editing and React Native
    return noTextWrap ? children : <Text>{children}</Text>
  }
  return children
}
