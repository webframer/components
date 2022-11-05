import { isEqual, last, throttle } from '@webframer/js'
import React from 'react'
import { assignRef, useInstance, useIsomorphicLayoutEffect } from './react.js'
import { renderProp } from './react/render.js'
import { type } from './types.js'
import { applyStyles } from './utils/css.js'
import { View } from './View.jsx'

/**
 * List rendering of large Arrays - only renders items in view.
 * Features:
 *  - Dynamic list container and item sizes (no need to specify width/height)
 *  - List items can expand/collapse in width/height like usual
 *  - Behaves like Infinite Scroll (scrollbar shifts as user scrolls).
 *
 * How it works:
 *  1. On initial render, `initialItems` number is rendered.
 *  2. On scroll event, items within `renderRadius` of the scrollable area are rendered.
 *  3. Items that become invisible but have been rendered are replaced with offset divs.
 *  4. On `items` array change, if the last visible item index is out of range,
 *    `initialItems` number is rendered starting from the end of array.
 *
 * Notes:
 *  - Chrome freezes when inspecting 10,000 empty divs
 */
export function VirtualList (_props) {
  const {
    items, initialItems, renderRadius,
    renderItem = ((item, i, items, self) => <VirtualItem key={i} children={item} />),
    ...props
  } = _props
  const [self, {visibleIndices}] = useInstance({visibleIndices: new Array(initialItems).fill(1).map((v, i) => i)})
  self.props = _props
  self.offsetSide = props.row ? 'offsetWidth' : 'offsetHeight'
  self.minSide = props.row ? 'minWidth' : 'minHeight'
  self.maxSide = props.row ? 'maxWidth' : 'maxHeight'

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.ref) {
    // Child node sizes by their virtual list index
    self.renderedItemSizeByIndex = {} // persisted cache for the entire component existence
    // Rendered child node index within its parent by virtual list index
    self.renderedItemByIndex = {} // resets on every render
    self.ref = function (node) {
      self.node = node
      assignRef.call(this, self.props._ref, ...arguments)
    }
    self.scrollRef = function (node) {
      self.scrollNode = node
      assignRef.call(this, self.props.scrollRef, ...arguments)
    }
    self.startRef = function (node) {
      self.startNode = node
    }
    self.endRef = function (node) {
      self.endNode = node
    }
    self.onScroll = function (e) {
      const {onScroll} = self.props
      if (onScroll) onScroll.apply(this, arguments)
      if (e.defaultPrevented) return
      self.setRenderIndicesThrottled.apply(this, arguments)
    }
    self.setRenderIndices = function (e = {}) {
      if (self.isBusy) return
      const {visibleIndices} = self.state
      const {renderRadius, items} = self.props
      const {renderedItemByIndex} = self
      const start = self.offsetSide === 'offsetHeight' ? 'top' : 'left'
      const end = self.offsetSide === 'offsetHeight' ? 'bottom' : 'right'
      const {[scrollSide[start]]: top, [offsetSize[end]]: size} = self.node
      const bottom = top + size
      let renderedItems = self.renderedItems

      // Some items may not be rendered yet while scrolling
      const renderedIndices = visibleIndices.filter(index => renderedItemByIndex[index] != null)

      // Calculate items to pre-render before and after the visible view
      let offsetItems = 0
      if (renderRadius) {
        let visibleSize = 0, visibleCount = 0
        renderedIndices.forEach((index) => {
          visibleSize += renderedItems[renderedItemByIndex[index]][self.offsetSide]
          visibleCount++
        })
        offsetItems = Math.ceil(
          self.node[self.offsetSide] * Math.abs(renderRadius) / (visibleSize / visibleCount),
        )
      }

      // Get the index of the first and last visible item in view
      let startIndex, endIndex
      let closestToTop = Infinity, closestToBottom = Infinity, t, b
      renderedIndices.forEach((index) => { // items can have `reverse` render ordering
        const {[offsetSide[start]]: _top, [offsetSize[end]]: size} = renderedItems[renderedItemByIndex[index]]
        if ((t = _top + size - top) >= 0 && t < closestToTop) { // find the first item in view
          closestToTop = t
          startIndex = index
        }
        // todo: ensure the item is within view by checking its bottom as well
        if ((b = bottom - _top) >= 0 && b < closestToBottom) { // get the last time in view
          closestToBottom = b
          endIndex = index
        }
      })
      renderedItems = null

      // Update state if visible indices change
      // todo: fix not visible nodes sometimes when scrolling to fast, leading to undefined index
      //  => use estimated guess based on average size of items to compute new indices
      //  => use scroll delta (speed) to adjust renderRadius dynamically
      console.debug({startIndex, endIndex})
      startIndex = Math.max(0, startIndex - offsetItems)
      endIndex = Math.min(items.length - 1, endIndex + offsetItems)
      const newIndices = new Array(endIndex - startIndex + 1).fill(startIndex).map((v, i) => v + i)
      // todo: only change state if new indices ranges is greater the current range
      if (!isEqual(newIndices, visibleIndices)) {
        self.isBusy = true // to be reset after state update
        self.setState({visibleIndices: newIndices})
      }
    }
    self.setRenderIndicesThrottled = throttle(self.setRenderIndices, 16)
    self.updateOffsetDivs = function () {
      const {visibleIndices} = self.state
      if (visibleIndices.length === 0) return
      const {items} = self.props
      const {renderedItemSizeByIndex} = self
      const startIndex = visibleIndices[0]
      const endIndex = last(visibleIndices)
      let startSize = 0, endSize = 0, lastIndex = items.length - 1
      // todo: refactor this because a node may not render fast enough
      //  => iterate up to startIndex with fallback to averageSize
      for (const index in renderedItemSizeByIndex) {
        if (index < startIndex) startSize += renderedItemSizeByIndex[index]
        else if (index > endIndex && index <= lastIndex) endSize += renderedItemSizeByIndex[index]
      }
      startSize += 'px'
      endSize += 'px'
      if (self.startNode)
        applyStyles(self.startNode.style, {[self.minSide]: startSize, [self.maxSide]: startSize})
      if (self.endNode)
        applyStyles(self.endNode.style, {[self.minSide]: endSize, [self.maxSide]: endSize})
    }
    Object.defineProperty(self, 'parent', {
      get () {return self.scrollNode || self.node},
    })
    Object.defineProperty(self, 'renderedItems', {
      get () {return [...self.parent.children].filter(e => e !== self.startNode && e !== self.endNode)},
    })
  }

  // Offset divs -----------------------------------------------------------------------------------
  // Update offset divs' sizes on every render
  useIsomorphicLayoutEffect(() => {
    const {visibleIndices} = self.state
    self.renderedItemByIndex = {}
    self.renderedItems.forEach((node, i) => {
      self.renderedItemSizeByIndex[visibleIndices[i]] = node[self.offsetSide]
      self.renderedItemByIndex[visibleIndices[i]] = i
    })
    self.updateOffsetDivs()
    self.isBusy = false // flag for scroll update
  })
  // Check rendered indices once because `initialItems` can be less than the visible area
  useIsomorphicLayoutEffect(() => {
    // Note: Mutation Observer does not work, because mutation.removedNodes have 0 size
    self.setRenderIndices()
  }, [])

  return (
    <View {...props} _ref={self.ref} scrollRef={self.scrollRef} onScroll={self.onScroll}>
      {visibleIndices[0] > 0 && <div className='virtual-list__offset-start' ref={self.startRef} />}
      {visibleIndices.map((index) => renderItem(items[index], index, items, self))}
      {last(visibleIndices) < items.length - 1 && <div className='virtual-list__offset-end' ref={self.endRef} />}
    </View>
  )
}

VirtualList.defaultProps = {
  fill: true,
  scroll: true,
  initialItems: 10,
  renderRadius: 1,
}

VirtualList.propTypes = {
  // List of items to render (can be an array of any value)
  items: type.ListOf(type.Any).isRequired,
  // Number of items to render initially or when list `items` array changes
  initialItems: type.Integer,
  // Function(item, index, items, self) to render each item in the list, default is `renderProp()`
  renderItem: type.Function,
  /**
   * Percentage of the visible list container size to pre-render items around.
   * Set 0 to only render items when they scroll into view.
   * Set 1 (ie. 100%) to render items within an area that is 3x the size of the view.
   *  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
   *  │               ↑               │
   *  │       renderRadius: 100%      │
   *  │               ↓               │
   *  ┌───────────────────────────────┐
   *  │             start             │
   *  │      view (visible area)      │
   *  │              end              │
   *  └───────────────────────────────┘
   *  │               ↑               │
   *  │       renderRadius: 100%      │
   *  │               ↓               │
   *  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
   */
  renderRadius: type.Percentage,
  // ...other `<View>` props to pass
}

export default React.memo(VirtualList)

function VirtualListItem ({children}) {
  return renderProp(children)
}

const VirtualItem = React.memo(VirtualListItem)

const offsetSide = {
  top: 'offsetTop',
  left: 'offsetLeft',
}
const offsetSize = {
  top: 'offsetHeight',
  bottom: 'offsetHeight',
  left: 'offsetWidth',
  right: 'offsetWidth',
}
const scrollSide = {
  top: 'scrollTop',
  left: 'scrollLeft',
}
