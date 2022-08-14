/**
 * Animate Height/Width from/to '0', 'auto' or any valid css value, without extra Node markup.
 * @note:
 *  - This method does not mutate node.style (only during animation), unless `forwards = true`.
 *    => it's up to the implementation to apply the final css style when the promise resolves.
 *    => In case of Expand/Collapse, it works by only rendering content when `open` or `animating`.
 *  - Node element must have `box-sizing: border-box;` for accurate animations.
 *  - element.offsetWidth/Height or .getBoundingClientRect() do not require requestAnimationFrame()
 *    to update, unless the layout reflow of surrounding elements needs to be updated as well.
 *
 * @param {object|HTMLElement} node - to animate
 * @param {number|string} startSize - to animate from
 * @param {number|string} endSize - to animate to
 * @param {'width'|'height'} [side] - the attribute to animate
 * @param {number} [duration] - milliseconds to animate
 * @param {boolean} [forwards] - whether to keep end animation state, default is false
 * @returns [promise: Promise<void>, resetStyles: function] - that resolves when animation finishes
 */
export function animateSize (node, startSize, endSize, side = 'height', duration = 300, forwards) {
  const stylesToReset = {}
  const mStart = side === 'width' ? 'marginLeft' : 'marginTop'
  const mEnd = side === 'width' ? 'marginRight' : 'marginBottom'
  const pStart = side === 'width' ? 'paddingLeft' : 'paddingTop'
  const pEnd = side === 'width' ? 'paddingRight' : 'paddingBottom'
  let style = node.style
  let hasEnded

  // Collect all initial styles to reset at the end
  const {width, height, overflow, flex, visibility, transitionProperty, transitionDuration} = style
  stylesToReset[mStart] = style[mStart]
  stylesToReset[mEnd] = style[mEnd]
  stylesToReset[pStart] = style[pStart]
  stylesToReset[pEnd] = style[pEnd]
  stylesToReset.overflow = overflow
  stylesToReset.visibility = visibility
  stylesToReset.transitionProperty = transitionProperty
  stylesToReset.transitionDuration = transitionDuration

  // Ensure that 'fill' CSS class does not overrule fixed dimensions by setting both width/height
  stylesToReset.height = height
  stylesToReset.width = width
  stylesToReset.flex = flex

  /**
   * Helper function at the start of transition
   * @param {object} attrs - css properties to apply
   * @param {boolean} [instantUpdate]
   */
  function setupStyles (attrs, instantUpdate) {
    for (const key in attrs) {
      style[key] = attrs[key]
    }
    if (instantUpdate) style.transitionDuration = '0s' // no animation for instant update
  }

  // Helper function at the end of transition/layout measurement
  function resetStyles () {
    if (style == null) return
    for (const attr in stylesToReset) {
      style[attr] = stylesToReset[attr] || null
    }
    if (hasEnded) style = null
  }

  const promise = new Promise(resolve => {

    // End animation requires layout prediction
    if (typeof endSize !== 'number') {
      setupStyles({[side]: endSize, visibility: 'hidden'}, true)
      endSize = node.getBoundingClientRect()[side]
      resetStyles() // reset back to existing style
    }

    // Start animation requires layout measurement
    if (typeof startSize !== 'number') setupStyles({[side]: startSize}, true)

    // Prepare start-transition styles
    const {width: w, height: h, [side]: startPx} = node.getBoundingClientRect()
    if (typeof startSize !== 'number') startSize = startPx // convert startSize to fixed pixel value

    // Set start-transition with fixed width and height because 'flex: unset' can cause layout shift
    setupStyles({width: w + 'px', height: h + 'px', [side]: startSize + 'px', flex: 'unset'})

    // Let initial style apply before setting end transition
    requestAnimationFrame(() => {

      // Collapsing to 0
      if (String(endSize) === '0') {
        style[mStart] = '0'
        style[mEnd] = '0'
        style[pStart] = '0'
        style[pEnd] = '0'
      }
      style[side] = endSize ? (endSize + 'px') : '0'
      style.overflow = 'hidden'
      style.transitionProperty = 'all'
      style.transitionDuration = `${duration}ms`

      setTimeout(() => {
        resolve()
        hasEnded = true

        // Reset style after resolving animation first, to avoid flickering at the end,
        // because Component might not remove node from rendering fast enough,
        // causing collapsed content to expand back to initial size.
        if (!forwards) setTimeout(resetStyles, 0)
      }, duration)
    })
  })
  return [promise, resetStyles]
}
