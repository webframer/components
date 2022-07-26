/**
 * Animate Height/Width from/to '0', 'auto' or any valid css value, without extra Node markup.
 * @note:
 *  - This method does not mutate node.style (only during animation)
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
 * @returns {Promise<void>} promise - that resolves when animation finishes
 */
export function animateSize (node, startSize, endSize, side = 'height', duration = 300) {
  const stylesToReset = {}
  const mStart = side === 'width' ? 'marginLeft' : 'marginTop'
  const mEnd = side === 'width' ? 'marginRight' : 'marginBottom'
  const pStart = side === 'width' ? 'paddingLeft' : 'paddingTop'
  const pEnd = side === 'width' ? 'paddingRight' : 'paddingBottom'
  let style = node.style

  // Collect all initial styles to reset at the end
  const {overflow, visibility, transitionProperty, transitionDuration} = style
  stylesToReset[side] = style[side]
  stylesToReset[mStart] = style[mStart]
  stylesToReset[mEnd] = style[mEnd]
  stylesToReset[pStart] = style[pStart]
  stylesToReset[pEnd] = style[pEnd]
  stylesToReset.overflow = overflow
  stylesToReset.visibility = visibility
  stylesToReset.transitionProperty = transitionProperty
  stylesToReset.transitionDuration = transitionDuration

  /**
   * Helper function at the start of transition
   * @param {object} attrs - css properties to apply
   * @param {boolean} [instantUpdate]
   */
  function setupStyle (attrs, instantUpdate) {
    for (const key in attrs) {
      style[key] = attrs[key]
    }
    if (instantUpdate) style.transitionDuration = '0s' // no animation for instant update
  }

  // Helper function at the end of transition/layout measurement
  function resetStyle () {
    for (const attr in stylesToReset) {
      style[attr] = stylesToReset[attr] || null
    }
  }

  return new Promise(resolve => {

    // End animation requires layout prediction
    if (typeof endSize !== 'number') {
      setupStyle({[side]: endSize, visibility: 'hidden'}, true)
      endSize = node.getBoundingClientRect()[side]
      resetStyle() // reset back to existing style
    }

    // Start animation requires layout measurement
    if (typeof startSize !== 'number') startSize = node.getBoundingClientRect()[side]

    // Prepare start-transition styles
    setupStyle({[side]: startSize + 'px'})

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

        // Reset style after resolving animation first, to avoid flickering at the end,
        // because Component might not remove node from rendering fast enough,
        // causing collapsed content to expand back to initial size.
        setTimeout(() => {
          resetStyle()
          style = null
        }, 0)
      }, duration)
    })
  })
}
