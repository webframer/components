import { Active, isFunction, SOUND } from '@webframer/js'
import React from 'react'

/**
 * REACT.JS HELPERS ============================================================
 * =============================================================================
 */

export * from './react/decorators.js'
export * from './react/hooks.js'
export const UIContext = React.createContext({})

/**
 * Add Accessibility Support to React Component
 *
 * @param {Object} props - React render props
 * @param {Object|HTMLAudioElement} [sound] - new Audio(URL) file
 * @returns {Object} props - mutated with necessary accessibility attributes
 */
export function accessibilitySupport (props, sound = Active.SETTINGS.HAS_SOUND && SOUND.TOUCH) {
  /* Remove key press and click event if necessary */
  if (props.tabIndex === -1) {
    delete props.onKeyPress
    delete props.onClick
  } else {
    const {onClick, onKeyPress, tabIndex} = props
    if (sound && onKeyPress) props.onKeyPress = onPressHoc(onKeyPress, sound)
    if (onClick) {
      if (sound) props.onClick = onPressHoc(onClick, sound)
      if (tabIndex == null) props.tabIndex = 0  // add keyboard accessibility for onClick
      if (!onKeyPress) props.onKeyPress = (event) => (event.key === 'Enter' && props.onClick(event))
    } else {
      delete props.onClick
    }
  }
  return props
}

/**
 * Higher Order Function Wrapper for onClick event to play sound
 * @example:
 *    <Button onClick={onPressHoc(onClick, sound)}/>
 *
 * @param {Function} onClick
 * @param {Object|HTMLAudioElement} [sound] - new Audio(URL) file object
 * @returns {Function} onPress - callback
 */
export function onPressHoc (onClick, sound) {
  return function onPress () {
    if (sound) sound.play()
    onClick && onClick(...arguments)
  }
}

/**
 * Check if given Component is a Class
 * @param {Class|Function} Component - React component
 * @returns {Boolean} true - if it is
 */
export function isClass (Component) {
  return !!Component.prototype && isFunction(Component.prototype.render)
}

// Check if value is a React.useRef() object or function
export function isRef (val) {
  return val ? (typeof val === 'function' || val.current !== void 0) : false
}

/**
 * Get the Original React Class from the Component wrapped by decorator/s
 * @param {Class|Function} Component - the wrapped React Component
 * @returns {Class|Boolean} Class - the original class component if found, else, false
 */
export function getOriginalClass (Component) {
  return (isClass(Component) && Component) || (isClass(Component.Class) && Component.Class)
}

/**
 * Sync React Component state with new props
 * @example:
 *    UNSAFE_componentWillReceiveProps (next, _) {
 *      const {id} = this.props
 *      if (syncState({id}, next, this)) return
 *    }
 *
 * @param {Object} current - props
 * @param {Object} next - props
 * @param {Object|Class} instance - of React component
 * @param {Function} [callback] - after state update
 * @param {Function} [preCallback]
 * @return {Boolean} true - if state was synced
 */
export function syncState (current, next, instance, callback, preCallback) {
  const update = {}
  for (const key in current) {
    if (next[key] != null && next[key] !== current[key]) update[key] = next[key]
  }
  if (Object.keys(update).length) {
    if (preCallback) preCallback(update)
    instance.setState(update, callback)
    return true
  }
}
