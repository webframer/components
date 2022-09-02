/**
 * Create onWheel event handler that normalizes browser `onwheel` event to Safari-like GestureEvent.
 * Example of browser wheel events: pinch, zoom, rotate and two finger swipe.
 * @reference: https://danburzo.ro/dom-gestures/
 * @example:
 *    function onWheelChange ({
 *      // Incremental deltas for scale, x, y
 *      ds, dx, dy,
 *      // Absolute values (accumulative transforms since event start)
 *      origin, translation, scale
 *    }) {
 *      // your pan/zoom logic
 *    }
 *
 *    const onWheel = onWheelHandler(onWheelChange)
 *    subscribeTo('wheel', onWheel, {passive: false}, HTMLElement)
 *
 * @param {function({
 *   ds: number|null,
 *   dx: number|null,
 *   dy: number|null,
 *   translation?: {x: number, y: number},
 *   scale?: number,
 * }, WheelEvent)} onChange - event handler that receives gesture object along with the wheel event;
 *    `scale` and `translation` are accumulative since `onStart`
 * @param {function} [onStart] - same as `onChange`
 * @param {function} [onEnd] - same as `onChange`
 * @param {number} [WHEEL_SCALE_SPEEDUP]
 * @param {number} [WHEEL_TRANSLATION_SPEEDUP]
 * @param {boolean} [absolute] - whether to fire gesture event with accumulative transform coordinates
 * @returns {function(WheelEvent)} onWheel - event handler
 */
export function onWheelHandler (
  onChange, onStart, onEnd,
  WHEEL_SCALE_SPEEDUP = 1, WHEEL_TRANSLATION_SPEEDUP = 0.5,
  absolute = false,
) {
  let gesture, timer, dx, dy, ds

  /**
   * Normalize Wheel Event to Safari-like Gesture for cross-browser compatibility
   * @param {WheelEvent} e
   */
  return function onWheel (e) {
    // Comment this out to enable onscroll event because onwheel gets called first.
    // Let the implementation determine whether to stop event propagation and default.
    // if (e.cancelable !== false) e.preventDefault();
    [dx, dy] = normalizeWheel(e)

    // Browsers will only treat the event as scroll if it were at the start,
    // but it's not possible to tell if a wheel event is scrolling over element.
    // The detection logic should be inside Scroll component.
    // isScroll = !!e.deltaY && !e.deltaX && !e.deltaZ

    // Gesture Start
    if (!gesture) {
      gesture = {
        ...absolute && {
          scale: 1,
          translation: {x: 0, y: 0},
        },
      }
      if (onStart) onStart(gesture, e)
    }

    // Pinch Zoom
    if (e.ctrlKey) {
      ds = dy <= 0 ?
        1 - (WHEEL_SCALE_SPEEDUP * dy) / 100 :
        1 / (1 + (WHEEL_SCALE_SPEEDUP * dy) / 100)
      gesture = {
        ...absolute && {
          scale: gesture.scale * ds,
          translation: gesture.translation,
        },
        ds,
        dx: null,
        dy: null,
      }
    }

    // Panning
    else {
      dx = -WHEEL_TRANSLATION_SPEEDUP * dx
      dy = -WHEEL_TRANSLATION_SPEEDUP * dy
      gesture = {
        ...absolute && {
          scale: gesture.scale,
          translation: {
            x: gesture.translation.x + dx,
            y: gesture.translation.y + dy,
          },
        },
        ds: null,
        dx,
        dy,
      }
    }

    // Gesture Update
    onChange(gesture, e)

    // Gesture End
    if (timer) clearTimeout(timer)
    timer = setTimeout(function () {
      if (gesture) {
        if (onEnd) onEnd(gesture, e)
        gesture = null
      }
    }, 200)
  }
}

export function normalizeWheel (e) {
  let dx = e.deltaX
  let dy = e.deltaY

  // The browser may emit deltaX: 0, deltaY: N, shiftKey: true when scrolling horizontally.
  // We want to interpret this as deltaX: N, deltaY: 0 instead:
  // swap `dx` and `dy`:
  if (dx === 0 && e.shiftKey) {
    [dx, dy] = [dy, dx]
  }

  // Furthermore, the browser may emit values in a deltaMode other than pixels;
  // for each, we need a multiplier:
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    dx *= 8
    dy *= 8
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    dx *= 24
    dy *= 24
  }

  // Normalize inconsistent browser settings for wild zoom deltas
  dy = Math.max(-24, Math.min(24, dy))
  return [dx, dy]
}
