import React from 'react'
import { accessibilitySupport, isRef } from './react.js'

/**
 * Label - Pure Component.
 * Abstraction layer for React Native, etc.
 */
export function Label ({sound, ...props}, ref) {
  props = accessibilitySupport(props, sound)
  if (isRef(ref)) props.ref = ref
  return <label {...props} />
}

export const LabelRef = React.forwardRef(Label)
export default React.memo(Label)
