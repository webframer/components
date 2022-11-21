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
 * Create `on<Event>` handler function that stops event propagation, and sets
 *  `event.propagationStopped === true`
 * @param {function|function[]} [func] - callback(s) to wrap
 * @returns {(function(*): void)|*} callback - that stops event propagation before calling given `func`
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
