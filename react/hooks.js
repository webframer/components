import { isEqualJSON } from '@webframer/utils'
import { useEffect, useRef, useState } from 'react'

/**
 * React Hook to simulate Class Component behaviors with `this` instance.
 * @example:
 *    const self = useInstance({count: 0, length: 10})
 *    self.setState({count: 1}) >>> self.state == {count: 1, length: 10}
 *    self.forceUpdate() >>> re-renders the component
 *
 * @param {object} [initialState]
 * @returns {object} instance - that persists for the entire component existence
 */
export function useInstance (initialState = {}) {
  const {current: instance} = useRef({})
  const [state, setState] = useState(initialState)
  instance.state = state
  if (!instance.setState) {
    instance.setState = (newState) => setState(state => ({...state, ...newState}))
    instance.forceUpdate = () => setState(state => ({...state}))
  }
  return instance
}

/**
 * Animate height for React Function Component
 * @example:
 *    function Component (props) {
 *      const style = useAnimatedHeight(props.style)
 *      return <View style={style}>...</View>
 *    }
 *
 * @param {{height: number | string, transition?: string}} style - component's CSS style
 * @param {number} [duration] - animation duration
 * @returns {object} style - to apply to CSS
 */
export function useAnimatedHeight (style, duration = 500) {
  const {height, transition} = style
  const [_style, setStyle] = useState(style)

  // Animate transition when height changes
  useEffect(() => {
    if (_style === style) return

    // No height change,
    if (_style.height === height) {
      // but other styles changed
      if (!isEqualJSON(_style, style)) setStyle(style)
      return
    }

    // Height changed
    const _transition = `height ${duration}ms`
    setStyle({
      ...style,
      transition: transition ? [transition, _transition].join(', ') : _transition,
    })

    // Clean up transition
    const timer = setTimeout(() => setStyle(style), duration)
    return () => clearTimeout(timer)
  }, [height, style, duration])
  return _style
}
