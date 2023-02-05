/**
 * Animate Height/Width from/to '0', 'auto' or any valid css value, without extra Node markup.
 * Notes:
 *  - This method does not mutate node.style (only during animation), unless `forwards = true`.
 *    => it's up to the implementation to apply the final css style when the promise resolves.
 *    => In case of Expand/Collapse, it works by only rendering content when `open` or `animating`.
 *  - Node element must have `box-sizing: border-box;` for accurate animations.
 *  - element.offsetWidth/Height or .getBoundingClientRect() do not require requestAnimationFrame()
 *    to update, unless the layout reflow of surrounding elements needs to be updated as well.
 *
 * Logic:
 *  - When expanding, border/margin/padding in the direction of expansion must start from 0, and overflow: hidden
 *  - When collapsing, border/margin/padding in the direction of collapse must end with 0, and overflow: hidden
 *  - When expanding to auto, reset to initial style, other width/height values should have overflow: hidden
 *
 * @param {Element} node - to animate
 * @param {number|string} startSize - to animate from
 * @param {number|string} endSize - to animate to
 * @param {'width'|'height'} [side] - the attribute to animate
 * @param {number} [duration] - milliseconds to animate
 * @param {boolean} [forwards] - whether to keep end animation state, default is false
 * @returns [promise: Promise<void>, resetStyles: function] - that resolves when animation finishes
 */
export function animateSize (node, startSize, endSize, side = 'height', duration = 300, forwards) {
  const stylesToReset = {}
  const isWidth = side === 'width'
  const bStart = isWidth ? 'borderLeftWidth' : 'borderTopWidth'
  const bEnd = isWidth ? 'borderRightWidth' : 'borderBottomWidth'
  const mStart = isWidth ? 'marginLeft' : 'marginTop'
  const mEnd = isWidth ? 'marginRight' : 'marginBottom'
  const pStart = isWidth ? 'paddingLeft' : 'paddingTop'
  const pEnd = isWidth ? 'paddingRight' : 'paddingBottom'
  const sideMin = isWidth ? 'minWidth' : 'minHeight'
  const sideMax = isWidth ? 'maxWidth' : 'maxHeight'

  // Collapsed state styles at the start or end of transition
  const collapsedStyle = {
    [bStart]: '0',
    [bEnd]: '0',
    [mStart]: '0',
    [mEnd]: '0',
    [pStart]: '0',
    [pEnd]: '0',
  }

  // Expanded state styles - get computed border/margin/padding for smooth animation
  let computed = getComputedStyle(node)
  const expandedStyle = {
    [bStart]: computed.getPropertyValue(camelCaseToCssProperty[bStart]),
    [bEnd]: computed.getPropertyValue(camelCaseToCssProperty[bEnd]),
    [mStart]: computed.getPropertyValue(camelCaseToCssProperty[mStart]),
    [mEnd]: computed.getPropertyValue(camelCaseToCssProperty[mEnd]),
    [pStart]: computed.getPropertyValue(camelCaseToCssProperty[pStart]),
    [pEnd]: computed.getPropertyValue(camelCaseToCssProperty[pEnd]),
  }
  computed = null

  let style = node.style
  let hasEnded

  // Collect all initial styles to reset at the end
  const {overflow, visibility, transitionProperty, transitionDuration} = style
  stylesToReset[bStart] = style[bStart]
  stylesToReset[bEnd] = style[bEnd]
  stylesToReset[mStart] = style[mStart]
  stylesToReset[mEnd] = style[mEnd]
  stylesToReset[pStart] = style[pStart]
  stylesToReset[pEnd] = style[pEnd]
  stylesToReset[side] = style[side]
  stylesToReset[sideMin] = style[sideMin]
  stylesToReset[sideMax] = style[sideMax]
  stylesToReset.overflow = overflow
  stylesToReset.visibility = visibility
  stylesToReset.transitionProperty = transitionProperty
  stylesToReset.transitionDuration = transitionDuration

  /**
   * Helper function at the start and end of transitions
   * @param {object} attrs - css properties to apply
   * @param {boolean} [instantUpdate]
   */
  function setStyles (attrs, instantUpdate) {
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

    // End animation requires layout prediction to get pixel value
    if (typeof endSize !== 'number') {
      setStyles({[side]: endSize, visibility: 'hidden'}, true)
      endSize = node.getBoundingClientRect()[side]
      resetStyles() // reset back to existing style
    }

    // Start animation requires layout measurement to get pixel value
    if (typeof startSize !== 'number') setStyles({[side]: startSize}, true)

    // Prepare start-transition styles (convert startSize to fixed pixel value if necessary)
    const {[side]: startPx} = node.getBoundingClientRect()
    if (typeof startSize !== 'number') startSize = startPx

    // Set start-transition with fixed size for animation
    // Elements with display flex and `flex: 1` may not respect `width/height` style,
    // so set minWidth/Height and maxWidth/Height along with width/height to enforce dimensions
    let size = startSize + 'px'
    setStyles({
      [side]: size,
      [sideMin]: size,
      [sideMax]: size,
      overflow: 'hidden',
      // Expanding or Collapsing
      ...String(startSize) === '0'
        ? collapsedStyle
        : expandedStyle,
    })

    // Let initial style apply before setting end transition
    setTimeout(() => { // fix for Firefox (this causes one frame with overflow visible on expansion)
      requestAnimationFrame(() => {

        // Set end of transition styles with fixed sizes
        size = endSize ? (endSize + 'px') : '0'
        setStyles({
          [side]: size,
          [sideMin]: size,
          [sideMax]: size,
          // Collapsing or Expanding
          ...String(endSize) === '0'
            ? collapsedStyle
            : expandedStyle,
          transitionProperty: 'all',
          transitionDuration: `${duration}ms`,
        })

        setTimeout(() => {
          resolve()
          hasEnded = true

          // Reset style after resolving animation first, to avoid flickering at the end,
          // because Component might not remove node from rendering fast enough,
          // causing collapsed content to expand back to initial size.
          if (!forwards) setTimeout(resetStyles, 0)
        }, duration)
      })
    }, 16) // 0 sometimes does not work, set to one frame to make sure collapsed state is applied
  })
  return [promise, resetStyles]
}

// Map of element.style properties to window.getComputedStyle() properties
const camelCaseToCssProperty = {
  borderTopWidth: 'border-top-width',
  borderBottomWidth: 'border-bottom-width',
  borderLeftWidth: 'border-left-width',
  borderRightWidth: 'border-right-width',
  marginTop: 'margin-top',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  marginRight: 'margin-Right',
  paddingTop: 'padding-top',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  paddingRight: 'padding-Right',
}
