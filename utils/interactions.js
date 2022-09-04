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
 * @param {Object<left, top>} rectangle - from event.target.getBoundingClientRect()
 * @return {{x: number, y: number}} offset - coordinates relative to event.target
 */
export function offsetFrom (event, rectangle) {
  // @Note: there is a difference between rectangle.left vs. rectangle.x
  // @see: https://stackoverflow.com/questions/27169534/in-google-chrome-getboundingclientrect-x-is-undefined/29741969
  return {x: event.clientX - rectangle.left, y: event.clientY - rectangle.top}
}

/**
 * Create `on<Event>` handler function that stops event propagation
 * @param {function} [func] - callback to wrap
 * @returns {(function(*): void)|*} callback - that stops event propagation before calling given `func`
 */
export function onEventStopPropagation (func) {
  return function (e) {
    e.stopPropagation()
    if (func) return func.apply(this, arguments)
  }
}
