import { isFunction, isObject } from '@webframer/js'
import React from 'react'
import Text from '../Text.jsx'

/**
 * REACT RENDER HELPERS ============================================================================
 */

/**
 * Resolve `children` prop for React Component (wraps with <Text>{children}</Text> for primitives).
 * @param {any} children - prop of the Component
 * @param {object} instance - React Class or Function Component instance
 */
export function resolveChildren (children, instance) {
  if (isFunction(children)) {
    return children(instance)
  } else if (!isObject(children)) { // React element is also an object
    return <Text>{children}</Text> // wrap primitives inside Text for editing and React Native
  }
  return children
}
