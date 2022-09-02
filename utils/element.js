/**
 * Make DOM element take no space
 * @param {Element} node - to collapse
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
 * Get index of current Node element within its direct parent element
 * @param {Element} node
 * @returns {number} index
 */
export function indexOfElement (node) {
  return [...node.parentElement.children].indexOf(node)
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
