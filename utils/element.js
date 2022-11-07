import { debounce, toFlatList, toUniqueListFast } from '@webframer/js'

/**
 * Get all `class` names from innerHTML of given Node element (including the Node itself)
 * @param {Element|HTMLElement} node - to get classes for
 * @returns {string[]} classNames - array of unique class names sorted in alphabetical order
 */
export function classNamesFrom (node) {
  return toUniqueListFast(toFlatList([node, ...node.querySelectorAll('*')].map(e => [...e.classList]))).sort()
}

/**
 * Make DOM element take no space
 * @param {Element|HTMLElement} node - to collapse
 */
export function collapseElement (node) {
  node.style.width = '0'
  node.style.height = '0'
  node.style.minWidth = '0'
  node.style.minHeight = '0'
  node.style.marginTop = '0'
  node.style.marginBottom = '0'
  node.style.marginLeft = '0'
  node.style.marginRight = '0'
  node.style.paddingTop = '0'
  node.style.paddingBottom = '0'
  node.style.paddingLeft = '0'
  node.style.paddingRight = '0'
}

/**
 * Get the top most Node Element under cursor position for given Event
 * @param {PointerEvent|{clientX: number, clientY: number}} event
 * @returns {Element|null} node - under the event's cursor position
 */
export function hitNodeFrom ({clientX, clientY}) {
  let element = document.elementFromPoint(clientX, clientY)
  if (element && element.shadowRoot)
    element = element.shadowRoot.elementFromPoint(clientX, clientY)
  return element
}

/**
 * Get index of current Node element within its direct parent element
 * @param {Element} node
 * @returns {number} index
 */
export function indexOfElement (node) {
  return [...node.parentElement.children].indexOf(node)
}

/**
 * Move focus in given `nodes` elements by given `count`, where 1 is next, -1 is previous node
 * (this loops back to the start or end of nodes collection when focus index is out of range).
 * @param {Element[]|Node[]} nodes - HTML Element collection (aka node.children)
 * @param {number} [count] - number of elements from the currently focused element to set focus
 * @returns {number} focusIndex - of the element that got focus
 */
export function moveFocus (nodes, count = 1) {
  let focusIndex = ([...nodes].findIndex(n => document.activeElement === n) + count) % nodes.length
  if (focusIndex < 0) focusIndex += nodes.length
  nodes[focusIndex].focus()
  return focusIndex
}

/**
 * Set focus on the element within given `nodes` with desired `focusIndex`.
 * (this loops back to the start or end of nodes collection when focus index is out of range).
 * @param {Element[]|Node[]} nodes - HTML Element collection (aka node.children)
 * @param {number} [focusIndex] - the desired index of the element to focus
 * @param {number} [length] - number of nodes to restrict focusIndex range, default is nodes.length
 * @returns {number} focusIndex - of the element that got focus, normalized to be within given nodes
 */
export function setFocus (nodes, focusIndex, length = nodes.length) {
  if (!length || length < 0) return -1
  focusIndex %= length
  if (focusIndex < 0) focusIndex += length
  if (!nodes[focusIndex]) return -1
  nodes[focusIndex].focus()
  return focusIndex
}

/**
 * Place a node element at given index inside a parent node element
 * @param {Element} parent
 * @param {number} index - to place at
 * @param {Element} node - to place
 * @returns {Element}
 */
export function placeAtIndex (parent, index, node) {
  return parent.insertBefore(node, parent.children[index])
}

/**
 * Replace node element and remove the old one
 * @param {Element} oldNode - to remove
 * @param {Element} newNode - to replace `oldNode`
 */
export function replaceElement (oldNode, newNode) {
  oldNode.parentElement.insertBefore(newNode, oldNode)
  oldNode.remove()
}

/**
 * Resize Element Width to Match Content Length
 * @example:
 *    resizeWidth(node.value, node.style, compact)
 *
 *    // React hook example:
 *    const style = useMemo(() => {if (compact) return resizeWidth(value, {}, compact)}, [value, compact])
 *
 * Common cases when resize needs to fire:
 *  - onChange value event
 *  - before mounting
 *  - value changes in controlled component
 *
 * @param {string} value - of the element to resize
 * @param {object} style - of the element to resize
 * @param {boolean|number} offset - count of characters to add to final width
 * @returns {object} style - with required attributes set
 */
export function resizeWidth (value, style, offset = 0) {
  // Add additional character to prevent truncation from uneven fonts
  // boolean `offset` evaluates to 1 by default.
  style.width = value.length + Number(offset) + 'ch'
  style.boxSizing = 'content-box'
  if (!style.transition) style.transition = '500ms'
  return style
}

/**
 * Get Computed CSS property to animate for inserting/removing child nodes
 * @param {Element} node - the parent element to get property from
 * @returns {string} side - can be 'width' or 'height'
 */
export function sideToAnimate (node) {
  // set default in case the node does not have flex layout
  let side = 'height'
  let css = getComputedStyle(node)
  let display = css.getPropertyValue('display')
  if (display === 'flex' || display === 'inline-flex') {
    switch (css.getPropertyValue('flex-direction')) {
      case 'row':
      case 'row-reverse':
        side = 'width'
        break
      case 'column-reverse':
      case 'column':
      default:
        side = 'height'
    }
  }
  css = null // garbage clean
  return side
}

/**
 * Debounced version of toTextHeight()
 */
export const toTextHeightDebounce = debounce(toTextHeight, 50, {leading: true})

/**
 * Event handler to autosize Input height to match typed in text height
 * @example:
 *  <Input type='textarea' onKeyUp={toTextHeight} />
 */
export function toTextHeight (e) {
  if (!e.target) return

  // Reset field height
  e.target.style.height = 'inherit'

  // Get the computed styles for the element
  const computed = getComputedStyle(e.target)

  // Calculate the height
  const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
    + e.target.scrollHeight
    + parseInt(computed.getPropertyValue('border-bottom-width'), 10)

  e.target.style.height = `${Math.min(height, Math.round(window.innerHeight / 5))}px`
}
