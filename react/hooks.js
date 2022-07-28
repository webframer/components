import { debounce } from '@webframer/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEventListener, useIsomorphicLayoutEffect } from 'usehooks-ts/dist/esm/index.js'
import { animateSize } from './animations.js'

export * from 'usehooks-ts/dist/esm/index.js'

export const useAnimatedHeight = hookAnimatedSize('height')
export const useAnimatedWidth = hookAnimatedSize('width')

/**
 * Create a React Hook for useAnimatedHeight/Width.
 * All height change scenarios involve layout measurement both at the start and end of animation,
 * if the height is not a pixel number. Layout prediction is only required for the end transition.
 *  - When collapsing, margin/padding in the direction of collapse must be 0, and overflow: hidden
 *  - When expanding to auto, reset to initial style, other height values should have overflow: hidden
 *
 * @param {'width'|'height'} side - one of ['width', 'height']
 * @returns {function} react hook
 */
function hookAnimatedSize (side = 'height') {
  /**
   * Animate Height/Width Transitions without modifying the DOM markup.
   * @example:
   *    function Component ({open}) {
   *      const [ref, animating] = useAnimatedHeight(open ? 'auto' : 0)
   *      return <div ref={ref}>...</div>
   *    }
   * @param {number|string} size - css value for height/width
   * @param {{self?: object, duration?: number, forwards?: boolean}} - component instance to animate
   * @returns [ref: (node: HTMLElement) => void, animating: boolean, resetStyles: function]
   */
  function useAnimatedSize (size, {self, duration = 300, forwards} = {}) {
    const instance = useRef({[side]: size})
    if (!self) {
      self = instance.current
    } else if (!self.node) {
      Object.assign(self, instance.current) // assign size initially
    }

    // useRef(null).current == null on initial useEffect with React.forwardRef => use function
    const ref = useCallback(node => self.node = node, [self])
    const resetStyles = useCallback(() => self.resetStyles && self.resetStyles(), [self])
    const [animating, setAnimating] = useState(false)

    // Skip logic for backend
    if (typeof window === 'undefined') return [ref, animating, resetStyles]

    // Height change
    useEffect(() => {
      if (self[side] === size) return
      // Set animating state explicitly in case of force update, and to force rerender at the end
      setAnimating(true)
      const [promise, resetStyles] = animateSize(self.node, self[side], size, side, duration, forwards)
      promise.then(() => setAnimating(false))
      self.resetStyles = resetStyles
      self[side] = size
    }, [self, size, duration, forwards])

    // Mark state as animating as soon as there is size change, for Expand/Collapse render logic
    // because when closing element, the state is closed, but animating hasn't yet updated,
    // which causes bug for animation transitions when collapsing.
    return [ref, animating || self[side] !== size, resetStyles]
  }

  return useAnimatedSize
}

/**
 * Expand/Collapse Element with Animated Height.
 *
 * @example:
 *    function Component ({list, ...props}) {
 *      const [open, ref, toggleOpen, animating] = useExpandCollapse(props.open)
 *      const hasItems = list && list.length > 0
 *      return <>
 *        <button onClick={toggleOpen}>{open ? 'Collapse' : 'Expand'}</button>
 *        <div ref={ref}>
 *          {(open || animating) && hasItems && list.map((item, i) => (...))}
 *        </div>
 *      </>
 *    }
 *
 * @param {boolean} [isOpen] - whether expanded initially
 * @param {number | string} [height] - CSS style for open state, default is 'auto'
 * @returns [open: boolean, ref: (node: HTMLElement) => void, toggleOpen: function, animating: boolean]
 */
export function useExpandCollapse (isOpen, height = 'auto') {
  const self = useInstance({open: isOpen})
  const toggleOpen = useCallback(() => {
    if (self.animating) return
    self.setState({open: !self.state.open})
  }, [])
  const {open} = self.state
  const [ref, animating, resetStyles] = useAnimatedHeight(open ? height : 0, {self, forwards: true})
  useEffect(() => {animating || resetStyles()}, [animating, resetStyles])
  self.animating = animating
  return [open, ref, toggleOpen, animating]
}

/**
 * Get Current Element Height (with window resize event update).
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
 * Get Previous Value of the Component
 * @param {any} value - to get from previous render state
 * @returns {any|undefined} previous value - undefined initially
 */
export function usePreviousValue (value) {
  const instance = useRef()

  useEffect(() => {
    instance.current = value
  })

  return instance.current
}
