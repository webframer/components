/**
 * Set Cursor to given type
 * @see: https://www.w3schools.com/cssref/tryit.asp?filename=trycss_cursor
 * @param {String} name - one of cursor strings
 */

export function cursorSet (name) {
  if (typeof window !== 'undefined') {
    document.body.style.cursor = null // Safari fix
    document.body.style.cursor = name
  }
}

/**
 * Reset Cursor to default state
 */
export function cursorUnset () {
  if (typeof window !== 'undefined') document.body.style.cursor = null
}

/**
 * Get Pointer Event Position Offset from Target Element
 * @param {Event|PointerEvent|MouseEvent} event - pointer event
 * @param {object|{left: number, top: number}} rectangle - from event.target.getBoundingClientRect()
 * @return {{x: number, y: number}} offset - coordinates relative to event.target
 */
export function offsetFrom (event, rectangle) {
  // @Note: there is a difference between rectangle.left vs. rectangle.x
  // @see: https://stackoverflow.com/questions/27169534/in-google-chrome-getboundingclientrect-x-is-undefined/29741969
  return {x: event.clientX - rectangle.left, y: event.clientY - rectangle.top}
}

/**
 * Create Component Event Handler that calls the prop handler first, before calling extra functions.
 * If the prop handler sets `e.preventDefault()`, extra functions will not run.
 *
 * @example:
 *    function MyComponent (props) {
 *      const [self] = useInstance()
 *      if (!self.props) {
 *        self.onClick = onEventHandler('onClick', self, function (e) {
 *          warn('Run After')
 *        })
 *      }
 *      self.props = props
 *      return <Button onClick={self.onClick}>Click</Button>
 *    }
 *
 *    // Later in code
 *    <MyComponent onClick={() => warn('Run First')} />
 *    >>> 'Run First'
 *    >>> 'Run After'
 *
 * @param {string} prop - name of the event handler (ex. 'onClick')
 * @param {object|{props: object}} self - function or class Component instance
 * @param {function|function[]} func - extra functions to call
 * @returns {function(event)} event handler
 */
export function onEventHandler (prop, self, ...func) {
  return function (e) {
    if (self.props[prop]) self.props[prop].apply(this, arguments)
    if (e.defaultPrevented) return
    if (func[0] && func.length === 1) return func[0].apply(this, arguments)
    return func.filter(v => v).map(fn => fn.apply(this, arguments))
  }
}

/**
 * Create `on<Event>` handler function that stops event propagation, and sets
 *  `event.propagationStopped === true`
 * @param {function|function[]} [func] - optional callback(s) to wrap
 * @returns {function(event)} handler - that stops event propagation before calling given `func`
 */
export function onEventStopPropagation (...func) {
  // Override Event prototype with a checker
  if (!eventStopPropagation) {
    eventStopPropagation = Event.prototype.stopPropagation
    Event.prototype.stopPropagation = function () {
      this.propagationStopped = true
      return eventStopPropagation.apply(this, arguments)
    }
  }
  return function (e) {
    e.stopPropagation()
    if (func[0] && func.length === 1) return func[0].apply(this, arguments)
    return func.filter(v => v).map(fn => fn.apply(this, arguments))
  }
}

let eventStopPropagation
