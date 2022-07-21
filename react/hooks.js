import { debounce } from '@webframer/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEventListener, useIsomorphicLayoutEffect } from 'usehooks-ts/dist/esm/index.js'

export * from 'usehooks-ts/dist/esm/index.js'

/**
 * Animate Height Transitions without modifying the DOM markup with extra wrapper elements.
 * @example:
 *    function Component ({open}) {
 *      const [ref, animating] = useAnimatedHeight(open ? 'auto' : 0)
 *      return <div ref={ref}>...</div>
 *    }
 *
 * @param {number | string} height - CSS style to apply
 * @param {number} [duration] - milliseconds to animate transitions
 * @param {number} [delay] - milliseconds to delay after animation end to update state
 * @returns [ref: (node: HTMLElement) => void, animating: boolean]
 */
export function useAnimatedHeight (height, duration = 500, delay = 200) {
  const {current: self} = useRef({height})
  const [animating, setAnimating] = useState(false)
  const [actualHeight, setRef] = useElementHeight() // the current element's size
  const ref = useCallback((node) => {
    setRef(node)
    self.node = node
    self.visibility = node.style.visibility || null
  }, [])

  if (height || !self.actualHeight) {
    // Initial collapsed state
    if (!height && !self.actualHeight) {
      // Hide collapsed element as soon as possible
      if (self.node) self.node.style.visibility = 'hidden'
      // Set height to 0 after initial element height calculation
      if (actualHeight) self.node.style.height = 0
    }
    // Store calculated height in pixels for animation later
    self.actualHeight = actualHeight
  }

  // Animate transition when height changes
  useEffect(() => {
    // No height change,
    if (self.height === height) return

    const transition = `height ${duration}ms`
    const {style} = self.node
    const _transition = style.transition || null
    const _overflow = style.overflow || null
    style.transition = _transition ? [_transition, transition].join(', ') : transition
    style.overflow = 'hidden'
    setAnimating(true)
    switch (height) {
      // Collapse to 0 height
      case 0: {
        // First set height to original element size to guarantee animation
        style.height = self.actualHeight + 'px'

        // Then to 0 height
        setTimeout(() => {
          style.height = 0
        }, 0)

        // Then clear/reset transition
        const timer = setTimeout(() => {
          style.visibility = 'hidden'
          style.overflow = _overflow
          style.transition = _transition
          self.height = height
          setAnimating(false)
        }, duration + delay) // extra duration for Safari to finish animation
        return () => {
          clearTimeout(timer)
        }
      }

      // Expansion from 0 height to 'auto' or custom height value
      case 'auto':
      default: {
        // First set height to original element size
        style.visibility = self.visibility
        style.height = self.actualHeight + 'px'

        // Then reset to 'auto' or custom height value at the end of animation
        const timer = setTimeout(() => {
          style.overflow = _overflow
          style.transition = _transition
          style.height = height
          self.height = height
          setAnimating(false)
        }, duration + delay)
        return () => {
          clearTimeout(timer)
        }
      }
    }
  }, [self.node, height, duration, delay])
  return [ref, animating]
}

/**
 * Get Current Element Height
 * @example:
 *    function Component () {
 *      const [height, setRef] = useElementHeight()
 *      return <div ref={setRef}>...</div>
 *    }
 *
 * @param {number} [delay] - milliseconds to debounce updates
 * @returns [height: number, setRef: (node: HTMLElement) => void]
 */
export function useElementHeight (delay = 16) {
  const [element, setRef] = useState(null)
  const [height, setHeight] = useState(0)

  // Prevent too many rendering using debounce
  const handleSize = useCallback(debounce(() => {
    if (element) setHeight(element.offsetHeight || 0)
  }, delay), [element, delay])

  useEventListener('resize', handleSize)

  useIsomorphicLayoutEffect(handleSize, [element])

  return [height, setRef]
}

/**
 * Expand/Collapse Element with Animated Height.
 *
 * @example:
 *    function Component (props) {
 *      const [open, ref, toggleOpen] = useExpandCollapse(props.open)
 *      return <>
 *        <button onClick={toggleOpen}>{open ? 'Collapse' : 'Expand'}</button>
 *        <div ref={ref}>...</div>
 *      </>
 *    }
 *
 * @param {boolean} [isOpen] - whether expanded initially
 * @param {number | string} [height] - CSS style for open state, default is 'auto'
 * @returns [open: boolean, ref: (node: HTMLElement) => void, toggleOpen: function]
 */
export function useExpandCollapse (isOpen, height = 'auto') {
  const {current: self} = useRef({})
  const [open, setOpen] = useState(isOpen)
  const [ref, animating] = useAnimatedHeight(open ? height : 0)
  const toggleOpen = useCallback(() => self.animating || setOpen(v => !v), [])
  self.animating = animating
  return [open, ref, toggleOpen]
}

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
