import { debounce, last, throttle, TIME_DURATION_INSTANT, toListAvg } from '@webframer/js'
import cn from 'classnames'
import React, { useMemo } from 'react'
import { assignRef, useInstance, useIsomorphicLayoutEffect, usePreviousProp } from '../react.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import { applyStyles } from '../utils/css.js'
import { View } from './View.js'

/**
 * List rendering of large Arrays.
 * @see https://webframe.app/docs/ui/components/VirtualList
 *
 * Features:
 *  - Dynamic list container and item sizes (no need to specify width/height)
 *  - List items can expand/collapse in width/height like usual
 *  - Behaves like Infinite Scroll (only renders items in view or close to it).
 *
 * How it works:
 *  1. On initial render, `initialItems` number is rendered.
 *  2. On mount, items within `renderRadius` of the scrollable area are rendered.
 *  3. Items that become invisible but have been rendered are replaced with offset divs.
 *
 * Notes:
 *  - Chrome freezes when inspecting 10,000 empty divs
 */
export function VirtualList (_props) {
  const {
    items, initialItems, grid, renderRadius,
    renderItem = ((item, i, items, self) => <VirtualItem key={i} children={item} />),
    row, scrollProps, ...props
  } = _props
  let [self, {visibleIndices}] = useInstance()
  self.justChangedItems = usePreviousProp(items)[1]
  self.props = _props
  self.offsetSide = row ? 'offsetWidth' : 'offsetHeight'
  self.offsetStart = row ? 'offsetLeft' : 'offsetTop'
  self.minSide = row ? 'minWidth' : 'minHeight'
  self.maxSide = row ? 'maxWidth' : 'maxHeight'
  self.isBusy = true // halt scroll event handler until component has updated
  // Reset rendered child node index within its parent by virtual list index
  self.renderedItemByIndex = {}

  // Sync indices when items change
  if (self.justChangedItems) {
    // Child node sizes by their virtual list index
    self.renderedItemSizeByIndex = {}

    // On initial render or after collapse, visibleIndices is empty
    if (!visibleIndices || visibleIndices.length === 0) {
      visibleIndices = self.state.visibleIndices = new Array(initialItems).fill(1).map((v, i) => i)
    }

    // Normalize visible indices to be within current items array
    if (visibleIndices.length > items.length) {
      visibleIndices = self.state.visibleIndices = items.map((v, i) => i)
    } else {
      let extraIndices = last(visibleIndices) - items.length + 1
      if (extraIndices > 0) {
        visibleIndices = self.state.visibleIndices =
          new Array(visibleIndices.length).fill(items.length - visibleIndices.length).map((v, i) => v + i)
      }
    }
  }

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.ref) {
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
    self.setRenderIndices = function () {
      if (self.isBusy || self.willUnmount || self.state.visibleIndices.length === 0) return
      const {visibleIndices} = self.state
      const {items, grid, renderRadius} = self.props
      const {renderedItemByIndex} = self
      const start = self.offsetSide === 'offsetHeight' ? 'top' : 'left'
      const end = self.offsetSide === 'offsetHeight' ? 'bottom' : 'right'
      const {[scrollSide[start]]: top, [offsetSize[end]]: size} = self.node
      const bottom = top + size
      const avgItemSize = self.averageItemSize / self.avgItemsPerSize
      let renderedItems = self.renderedItems

      // Calculate number of items to pre-render around the visible view
      let prerenderSize
      if (renderRadius === false || renderRadius === 0) {
        prerenderSize = 0
      } else {
        prerenderSize = renderRadius == null ? true : renderRadius
        if (prerenderSize === true) {
          if (self.lastScrollStart == null) { // initial render has no scroll delta
            prerenderSize = self.node[self.offsetSide] // use 100% of current view size
          } else { // use scroll delta (speed) to adjust renderRadius dynamically
            prerenderSize = (top - self.lastScrollStart) * 10
          }
        } else {
          prerenderSize = self.node[self.offsetSide] * renderRadius
        }
        // restrict prerender radius to minimum 320, and maximum is viewPortSize
        prerenderSize = Math.max(320, Math.min(window[innerSize[start]], Math.abs(prerenderSize)))
      }
      let prerenderItems = Math.ceil(prerenderSize / avgItemSize)
      self.lastScrollStart = top

      // Get the index of the first and last visible item in view
      let startIndex, endIndex, renderedSize = 0
      let closestToTop = Infinity, closestToBottom = Infinity, t, b, isInView
      visibleIndices.forEach((index) => { // items can have `reverse` render ordering
        const {[offsetSide[start]]: _top, [offsetSize[end]]: size} = renderedItems[renderedItemByIndex[index]]
        // An item is within view when its bottom is below view top and its top is above view bottom
        t = _top + size - top
        b = bottom - _top
        isInView = t >= 0 && b >= 0
        if (t < closestToTop && isInView) { // find the first item in view
          closestToTop = t
          startIndex = index
        }
        if (b < closestToBottom && isInView) { // get the last time in view
          closestToBottom = b
          endIndex = index
        }
        renderedSize += size
      })
      renderedItems = null

      // Cover full view on resize because `initialItems` may be too small to cover the view
      let emptySize = self.node[self.offsetSide] - renderedSize / self.avgItemsPerSize
      if (emptySize > 0) prerenderItems += Math.ceil(emptySize / avgItemSize)

      /**
       * Predict layout if start or end indices not found. This happens when:
       *    a). User scrolls too fast and the items did not render at the current scroll position
       *    b). User scrolls by dragging the scrollbar directly to an un-rendered area.
       *    => use an estimated guess based on average size of items to compute new indices
       */
      if (startIndex == null) startIndex = Math.floor(top / avgItemSize) // scrolling up
      if (endIndex == null) endIndex = Math.ceil(bottom / avgItemSize) // scrolling down

      // Update state if visible indices range is outside the current range
      startIndex = Math.max(0, startIndex - prerenderItems)
      endIndex = Math.min(items.length - 1, endIndex + prerenderItems)
      if (visibleIndices[0] <= startIndex && endIndex <= last(visibleIndices)) return

      // Grid layout requires indices to be rounded to minimize items jumping during scroll
      if (grid) {
        if (startIndex)
          startIndex = Math.max(0, Math.floor(startIndex - startIndex % self.avgItemsPerSize))
        if (endIndex < items.length - 1)
          endIndex = Math.min(items.length - 1, Math.ceil(endIndex + self.avgItemsPerSize - endIndex % self.avgItemsPerSize))
      }

      // Update visible indices
      let newCount = endIndex - startIndex + 1
      if (newCount > 0) self.setState({
        visibleIndices: Array(newCount).fill(startIndex).map((v, i) => v + i),
      })
    }
    self.setRenderIndicesDebounced = debounce(self.setRenderIndices, TIME_DURATION_INSTANT)
    self.setRenderIndicesThrottled = throttle(self.setRenderIndices, 16, {leading: true, trailing: true})
    self.updateOffsetDivs = function () {
      const {visibleIndices} = self.state
      if (visibleIndices.length === 0) return
      const {items} = self.props
      const {renderedItemSizeByIndex} = self

      // Iterate from start and end of items length index to collect un-rendered item sizes
      if (self.startNode) {
        const startIndex = visibleIndices[0]
        let startSize = 0
        const startIndices = items.slice(0, startIndex).map((v, i) => i)
        for (const index of startIndices) {
          startSize += renderedItemSizeByIndex[index] || self.averageItemSize
        }
        startSize /= self.avgItemsPerSize
        startSize += 'px'
        applyStyles(self.startNode.style, {[self.minSide]: startSize, [self.maxSide]: startSize})
      }
      if (self.endNode) {
        const endIndex = last(visibleIndices) + 1
        let endSize = 0
        const endIndices = items.slice(endIndex).map((v, i) => endIndex + i)
        for (const index of endIndices) {
          endSize += renderedItemSizeByIndex[index] || self.averageItemSize
        }
        endSize /= self.avgItemsPerSize
        endSize += 'px'
        applyStyles(self.endNode.style, {[self.minSide]: endSize, [self.maxSide]: endSize})
      }
    }
    Object.defineProperty(self, 'parent', {
      get () {return self.scrollNode || self.node},
    })
    Object.defineProperty(self, 'renderedItems', {
      get () {return [...self.parent.children].filter(e => e !== self.startNode && e !== self.endNode)},
    })
  }

  // Offset divs -----------------------------------------------------------------------------------
  // Update offset divs' information on every render
  useIsomorphicLayoutEffect(() => {
    const {visibleIndices} = self.state
    let index, visibleSize = 0, visibleCount = 0, countPerSize = 0, lastStart = 0, sizeCounts = []
    // Calculate item sizes (Mutation Observer does not work, because mutation.removedNodes have 0 size)
    self.renderedItems.forEach((node, i) => {
      index = visibleIndices[i] // rendered order matches visible indices because they're mounted
      self.renderedItemByIndex[index] = i
      visibleSize += self.renderedItemSizeByIndex[index] = node[self.offsetSide]
      visibleCount++
      if (lastStart !== node[self.offsetStart]) {
        lastStart = node[self.offsetStart]
        if (countPerSize) sizeCounts.push(countPerSize)
        countPerSize = 0
      }
      countPerSize++
    })
    // Grid list may have multiple items per row/column, this handles grid layout
    self.avgItemsPerSize = toListAvg(sizeCounts) || 1
    self.averageItemSize = visibleSize / visibleCount
    self.updateOffsetDivs()
    self.isBusy = false // flag to enable scroll event handler
    // Set rendered indices initially and on items change (`initialItems` can be less than the visible area)
    if (self.justChangedItems) self.setRenderIndices()
  })

  // Update render indices on resize
  useIsomorphicLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (self.didMount) self.setRenderIndicesDebounced()
      else self.didMount = true // ignore the first call on mount
    })
    resizeObserver.observe(self.node)
    return () => {
      self.willUnmount = true
      resizeObserver.unobserve(self.node)
    }
  }, [])

  // Display as grid ('top' or 'left' alignment is required for correct offset size on initial render)
  if (grid) props.scrollClass = cn(props.scrollClass, 'wrap', row ? 'left' : 'top')
  props.scrollProps = useMemo(() => grid ? {...scrollProps, row: !(row)} : scrollProps, [grid, row, scrollProps])
  const styleOffset = useMemo(() => grid ? {[row ? 'height' : 'width']: '100%'} : null, [grid, row])
  if (row != null) props.row = row

  return (
    <View {...props} _ref={self.ref} scrollRef={self.scrollRef} onScroll={self.onScroll}>
      {visibleIndices[0] > 0 &&
        <div className='virtual-list__offset-start' style={styleOffset} ref={self.startRef} />}
      {visibleIndices.map((index) => renderItem(items[index], index, items, self))}
      {last(visibleIndices) < items.length - 1 &&
        <div className='virtual-list__offset-end' style={styleOffset} ref={self.endRef} />}
    </View>
  )
}

VirtualList.defaultProps = {
  fill: true,
  scroll: true,
  initialItems: 10,
  renderRadius: true,
}

VirtualList.propTypes = {
  // List of items to render (can be an array of any value)
  items: type.ListOf(type.Any).isRequired,
  // Number of items to render initially, or when `items` prop changes
  initialItems: type.UnsignedInteger,
  // Whether to render as grid (equivalent to `scrollClass='row top wrap'` for `col` container)
  grid: type.Boolean,
  // Whether to render in horizontal layout direction
  row: type.Boolean,
  // Function(item, index, items, self) to render each item in the list, default is `renderProp()`
  renderItem: type.Function,
  /**
   * Percentage of the visible list container size to pre-render items around.
   * - Set to `true` to use automatic calculation based on scroll speed (this is default).
   * - Set to `0` to only render items when they scroll into view.
   * - Set to `1` (ie. 100%) to render items within an area that is 3x the size of the view.
   * ```
   *   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
   *   │            ↑            │
   *   │    renderRadius: 100%   │
   *   │            ↓            │
   *   ┌─────────────────────────┐
   *   │          start          │
   *   │  visible items in view  │
   *   │           end           │
   *   └─────────────────────────┘
   *   │            ↑            │
   *   │    renderRadius: 100%   │
   *   │            ↓            │
   *   └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
   * ```
   */
  renderRadius: type.OneOf([type.Boolean, type.Percentage]),
  // ...other `<View>` props to pass
}

const VirtualListMemo = React.memo(VirtualList)
VirtualListMemo.name = VirtualList.name
VirtualListMemo.propTypes = VirtualList.propTypes
VirtualListMemo.defaultProps = VirtualList.defaultProps
export default VirtualListMemo

function VirtualListItem ({children}) {
  return renderProp(children)
}

VirtualListItem.propTypes = {
  children: type.NodeOrFunction.isRequired,
}
export const VirtualItem = React.memo(VirtualListItem)

const innerSize = {
  top: 'innerHeight',
  bottom: 'innerHeight',
  left: 'innerWidth',
  right: 'innerWidth',
}
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
