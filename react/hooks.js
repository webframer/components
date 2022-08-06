import { debounce, isEqualJSON, isFunction, subscribeTo, unsubscribeFrom } from '@webframer/js'
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
    if (!self.ref) self.ref = node => self.node = node
    if (!self.resetStyles) self.resetStyles = () => self._resetStyles && self._resetStyles()

    // Skip logic for backend
    if (typeof window === 'undefined') return [self.ref, false, self.resetStyles]

    // Height change
    const [animating, setAnimating] = useState(false)
    useEffect(() => {
      if (self[side] === size) return
      // Set animating state explicitly in case of force update, and to force rerender at the end
      setAnimating(true)
      const [promise, resetStyles] = animateSize(self.node, self[side], size, side, duration, forwards)
      promise.then(() => setAnimating(false))
      self._resetStyles = resetStyles
      self[side] = size
    }, [self, size, duration, forwards])

    // Mark state as animating as soon as there is size change, for Expand/Collapse render logic
    // because when closing element, the state is closed, but animating hasn't yet updated,
    // which causes bug for animation transitions when collapsing.
    return [self.ref, animating || self[side] !== size, self.resetStyles]
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
  const [self, {open}] = useInstance({open: isOpen})
  if (!self.toggleOpen) self.toggleOpen = () => {
    if (self.animating) return
    self.setState({open: !self.state.open})
  }
  const [ref, animating, resetStyles] = useAnimatedHeight(open ? height : 0, {self, forwards: true})
  useEffect(() => {animating || resetStyles()}, [animating, resetStyles])
  self.animating = animating
  return [open, ref, self.toggleOpen, animating]
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
 * React Hook to simulate Class Component behaviors with `this` instance (self).
 * @example:
 *    const [self, state] = useInstance({count: 0, length: 10})
 *
 *    // Declare instance method
 *    if (!self.method) self.method = () => {...} // more performant than useCallback pattern
 *
 *    // Set State similar to Class Component
 *    self.setState({count: 1})
 *    >>> self.state == {count: 1, length: 10}
 *
 *    // Force Component re-render
 *    self.forceUpdate()
 *
 * @param {object} [initialState]
 * @returns [self: object, state: object] instance - that persists for the entire component existence
 */
export function useInstance (initialState = {}) {
  const {current: self} = useRef({})
  const [state, setState] = useState(initialState)
  self.state = state
  if (!self.setState) {
    self.forceUpdate = () => setState(state => ({...state}))
    self.setState = (newState) => {
      if (isFunction(newState)) return setState(newState)
      if (isEqualJSON(newState, self.state)) return
      setState(state => ({...state, ...newState}))
    }
  }
  return [self, self.state]
}

/**
 * Get previous prop of the Component, similar to class.componentWillReceiveProps
 * @param {any} value - to get from previous Component props
 * @param {object} [self] - Component instance
 * @returns {any|void} previous prop - undefined initially
 */
export function usePreviousProp (value, self = useRef({}).current) {
  self.hasChanged = value !== self.lastValue

  useEffect(() => {
    // Cache value for the next render cycle if prop changed
    if (self.hasChanged) {
      self.prevValue = self.lastValue // the cached value before the last value to restore
      self.lastValue = value
    }
  })

  return self.hasChanged ? self.lastValue : self.prevValue
}

/**
 * Get previous value of the Component during the last render.
 * (can be the same as current if forceUpdate - see usePreviousProp hook for changed props only).
 * @param {any} value - to get from previous render state
 * @returns {any|void} previous value - undefined initially
 */
export function usePreviousValue (value) {
  const instance = useRef()

  useEffect(() => {
    instance.current = value
  })

  return instance.current
}

/**
 * UIContext state provider
 * @example:
 *   // App.js
 *   const [state] = useUIState()
 *   //...
 *   <UIContext.Provider value={state}>
 *     <View>...</View>
 *   </>
 * @param {object} [initialState]
 * @returns [state: {
 *       isMobile: boolean,
 *       isTablet: boolean,
 *       isComputer: boolean,
 *       isDesktop: boolean,
 *       isWidescreen: boolean,
 *       isFHD: boolean,
 *       screenRatio: number,
 *       screenWidth: number,
 *       screenHeight: number,
 *     }] state - for UIContext.Provider
 */
export function useUIState (initialState = getUIState()) {
  const [self, state] = useInstance(initialState)
  if (!self.resize) self.resize = debounce(() => self.setState(getUIState()))
  useEffect(() => {
    subscribeTo('resize', self.resize)
    return () => {unsubscribeFrom('resize', self.resize)}
  }, [])
  return [state, self.setState]
}

// Get state for UIContext Provider
export function getUIState () {
  if (typeof window !== 'undefined') {
    const {innerWidth, innerHeight} = window
    return {
      isMobile: innerWidth < 768,
      isTablet: innerWidth >= 768 && innerWidth < 1024,
      isComputer: innerWidth >= 1024 && innerWidth < 1200,
      isDesktop: innerWidth >= 1200 && innerWidth < 1366,
      isWidescreen: innerWidth >= 1366 && innerWidth <= 1680,
      isFHD: innerWidth > 1680 && innerWidth <= 1920,
      isQHD: innerWidth > 1920 && innerWidth <= 2560,
      screenRatio: innerWidth / innerHeight,
      screenWidth: innerWidth,
      screenHeight: innerHeight,
    }
  } else {
    return {}
  }
}

/**
 * Instagram/Pinterest Style Route as Modal.
 * Logic: changes route when Modal opens and goes back one route when Modal closes.
 *
 * @example:
 * function App (props) {
 *   const hasChangedRoutes = useRouteChange(props)
 *   const [children, modal] = useModalRoute(props, hasChangedRoutes)
 *   const [ref] = useScrollToElement(hasChangedRoutes[0])
 *    return (
 *     <View className='app'>
 *       <div ref={ref} />
 *       {children}
 *       {modal && renderModal(props)}
 *     </View>
 *   )
 * }
 *
 * // Change routes:
 *   // option 1:
 *     import { Link } from 'react-router'; // using CRA browser router
 *     // or
 *     import Link from '@webframer/kit/router/next/Link.jsx' // using Next.js
 *
 *     <Link to={{ pathname: '/login', state: { isModal: true, classModal: 'bg-transparent' } }}>
 *
 *   // option 2:
 *     import history from 'history' // using CRA browser router
 *     // or
 *     import history from '@webframer/kit/router/history.js' // using Next.js
 *
 *     history.push({ pathname: '/login', state: { isModal: true } })
 */
export function useModalRoute (
  props, [hasChangedRoute, prevChildren, prevLocation] = useRouteChange(props),
) {
  // re-render may cause the previous prop to change, while still in Modal state.
  // The logic should be:
  //  a) detect the first route transition => store previous children + cache isModal state
  //  b) when route changes again, re-calculate isModal state + clear/store previous children
  const {current: self} = useRef({})

  // Initial app load cannot have Modal because there is no previous children
  if (hasChangedRoute === void 0) return [props.children]

  // Return cached state if no route change detected
  if (hasChangedRoute === false) {
    // Only update current route children to the latest
    if (self.isModal) {
      self.modal = props.children
    } else {
      self.content = props.children
    }
    return [self.content, self.modal, self.previousLocation]
  }

  // Update cached state
  self.isModal = props.location.state && props.location.state.isModal

  // Save the previous children and location to display under
  if (self.isModal) {
    self.content = prevChildren
    self.modal = props.children
    self.previousLocation = prevLocation
  }
  // Reset to no Modal state
  else {
    self.content = props.children
    self.modal = null
    self.previousLocation = null
  }

  return [self.content, self.modal, self.previousLocation]
}

/**
 * Check whether the app has just changed routes
 * @param {object} props - of the Component
 * @param {object} [self] - Component instance
 * @returns [hasChangedRoutes?: boolean, previousChildren?, previousLocation?] true -
 *    if route changed, else false, void initially
 */
export function useRouteChange (props, self = useRef({}).current) {
  const prevProps = usePreviousValue(props)
  if (!prevProps) return []

  // Detect if route has just changed
  const {history, location, routes} = prevProps
  const hasChangedRoute = history && location && props.location && (
    /**
     * A next.js app may contain an SPA inside it using 'react-router'.
     * `routes` and  `location.key` are 'react-router' only specific implementation.
     * => A route has only changed if one of these conditions is met:
     *    1. It is not a browser router (!routes) and location.pathname changed
     *    2. It is a browser router and location.key changed (location.pathname may change
     *       even for the same route, so compare with location.key instead)
     */
    (!routes && props.location.pathname !== location.pathname) ||
    (!!routes && props.location.key !== location.key)
  )

  // Cache previous props, because Component may re-render without changing routes
  if (hasChangedRoute) {
    self.prevChildren = prevProps.children
    self.prevLocation = prevProps.location
  }

  return [hasChangedRoute, self.prevChildren, self.prevLocation]
}

/**
 * Scroll to the given ref element on render (example: scroll to top when route changes).
 *
 * @param {boolean} shouldScroll - whether to scroll to the ref element
 * @param {object} options
 * @returns [ref: MutableRefObject<null>] ref - to assign to the element to scroll to
 */
export function useScrollToElement (shouldScroll, options = {behavior: 'auto'}) {
  const ref = useRef(null)
  if (ref.current && shouldScroll) ref.current.scrollIntoView(options)
  return [ref]
}
