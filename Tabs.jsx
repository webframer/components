import { isFunction, isObject } from '@webframer/js'
import cn from 'classnames'
import React, { useContext, useEffect, useId } from 'react'
import Icon from './Icon.jsx'
import { useInstance } from './react/hooks.js'
import { resolveChildren } from './react/render.js'
import Scroll from './Scroll.jsx'
import Spacer from './Spacer.jsx'
import { type } from './types.js'
import View from './View.jsx'

const TabInstance = React.createContext({})
const TabState = React.createContext({})

/**
 * Tabs --------------------------------------------------------------------------------------------
 * @todo: improve accessibility - set tabIndex={-1} for Tab to enable TAB focus on panel
 *    https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tabpanel_role
 * @example:
 *    // Uncontrolled state (Tab must be before TabPanel)
 *    <Tabs vertical defaultId={1}>
 *      <TabList>
 *        <Tab>Tab 1</Tab>
 *        <Tab>Tab 2</Tab>
 *      </TabList>
 *
 *      <TabPanel>Panel 1</TabPanel>
 *      <TabPanel>Panel 2</TabPanel>
 *    </Tabs>
 *
 *    // Controlled state
 *    <Tabs activeId='b' onChange={(activeId: string) => any}>
 *      <TabList className='custom'>
 *        <Tab id='a'>Tab A</Tab>
 *        <Tab id='b'>Tab B</Tab>
 *      </TabList>
 *
 *      <TabPanel id='b'>{() => 'Panel B'}</TabPanel>
 *      <TabPanel id='a'>{() => 'Panel A'}</TabPanel>
 *    </Tabs>
 *
 *    // Using `items` array
 *    <Tabs items={[
 *         {
 *           tab: {
 *             icon: 'plus',
 *             text: 'Item 1',
 *           },
 *           panel: 'Panel 1 Text',
 *         },
 *         {
 *           tab: 'Item 2',
 *           panel: () => <Text>Panel 2 Function</Text>,
 *         },
 *         {
 *           tab: <><Icon name='globe' />Item 3</>,
 *           panel: <Text>Panel 3 Node</Text>,
 *         },
 *       ]} />
 */
export function Tabs ({
  activeId, defaultId, children, className, onChange, vertical, forceRender, items, ...props
}) {
  const tabsId = useId()
  const [self, state] = useInstance({tabsId})

  // Handle Tab change
  self.onChange = onChange
  if (!self.setTab) self.setTab = (activeId, event) => {
    let lastId = self.tabState.activeId
    self.setState({activeId})
    if (self.onChange) self.onChange(activeId, lastId, event)
  }

  // Controlled state
  if (activeId != null) state.activeId = String(activeId)
  else if (state.activeId == null) { // initiate activeId state.
    // State must be initialized as `null` when no activeId or defaultId given,
    // because user may use key strings as activeIds. In that case, use the first Tab id as active.
    // Since `id` can be index number or key string, normalized all indices to string
    const notDefined = activeId == null && defaultId == null
    state.activeId = notDefined ? null : String(sanitizeId(activeId != null ? activeId : defaultId))
  }

  // HMR for some reason remounts TabPanel with new id, so flush ids on every render to fix it
  self.tabState = {panelIds: [], tabIds: [], vertical, forceRender, ...state}

  return ( // Tailwind has 'tabs' class styled, so avoid that
    <TabInstance.Provider value={self}>
      <TabState.Provider value={self.tabState}>
        <View className={cn(className, 'tabs')} row={vertical} {...props}>
          {items && (<>
            <TabList>{items.map(renderTab)}</TabList>
            {renderPanel(items, self)}
          </>)}
          {isFunction(children) ? children(this) : children}
        </View>
      </TabState.Provider>
    </TabInstance.Provider>
  )
}

Tabs.propTypes = {
  // Selected tab index number or key string (for controlled state)
  activeId: type.OneOf(type.String, type.Number),
  // Default selected tab index number or key string (for uncontrolled state to load initially)
  defaultId: type.OneOf(type.String, type.Number),
  // Tab content (see example)
  children: type.NodeOrFunction,
  // Callback(activeId: string, lastId: string, event) whenever tab changes, where ids could be indices
  onChange: type.Function,
  // Whether to use Right-to-Left direction
  rtl: type.Boolean,
  // Whether to use vertical orientation for Tabs
  vertical: type.Boolean,
  // Whether to always render all Tab Panels - can be set individually (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
  // Alternative way to define Tabs and Panels as a single array
  items: type.ListOf(type.Of({
    // Optional unique identifier for the Tab and Panel
    id: type.String,
    // Tab Label - clickable buttons
    tab: type.OneOf(
      type.String,
      type.Number,
      type.Node,
      type.Of({
        text: type.String.isRequired,
        icon: type.OneOf(
          type.String,
          type.Of({
            // Icon name and other ...props
            name: type.String.isRequired,
            className: type.String,
            style: type.Object,
          }),
        ),
      }),
    ).isRequired,
    // Tab Content
    panel: type.OneOf(
      type.NodeOrFunction,
      type.Of({
        // Child node(s) and other props to pass to TabPanel
        children: type.NodeOrFunction.isRequired,
      }),
    ).isRequired,
  })),
}

export default React.memo(Tabs)

/**
 * Tab List ----------------------------------------------------------------------------------------
 */
export function TabList ({className, ...props}) {
  const {vertical} = useContext(TabState)
  return <Scroll className={cn(className, 'tabs__list no-scrollbar')} row={!vertical} {...props} />
}

TabList.defaultProps = {
  role: 'tablist',
}

/**
 * Tab ---------------------------------------------------------------------------------------------
 */
export function Tab ({id, className, onClick, ...props}) {
  const tabId = useId()
  const self = useContext(TabInstance)
  let {activeId, tabIds, tabsId} = useContext(TabState)
  useEffect(() => () => {tabIds.splice(tabIds.indexOf(tabId), 1)}, [])

  // Register Tab Index in the state when rendering for the first time
  let index = tabIds.indexOf(tabId)
  if (index === -1) index = tabIds.push(tabId) - 1
  if (id == null) id = String(index) // if `id` is undefined, fallback to using index

  // Set defaultId to the first Tab when none set because `id` could be key string
  if (activeId == null) self.tabState.activeId = activeId = id
  const active = activeId === id

  // Accessibility
  props.id = `tab_${id}_${tabsId}`
  props['aria-controls'] = `panel_${id}_${tabsId}`
  props['aria-selected'] = active ? 'true' : 'false'

  // Tab props
  if (active) {
    props.disabled = true
  } else {
    props.onClick = (event) => {
      self.setTab(id, event)
      if (onClick) onClick(event, id)
    }
  }
  return <View className={cn(className, 'tabs__tab', {active})} {...props} />
}

Tab.propTypes = {
  // Tab key string to pair with TabPanel, defaults to using Tab index
  id: type.String,
  // Callback(event, id)
  onClick: type.Function,
}

Tab.defaultProps = {
  // @see: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role
  role: 'tab',
  _nodrag: '',
}

/**
 * Tab Panel ---------------------------------------------------------------------------------------
 */
export function TabPanel ({id, className, forceRender, mustRender, ...props}) {
  const panelId = useId()
  const self = useContext(TabInstance)
  const {activeId, panelIds, tabsId, forceRender: f} = useContext(TabState) // must use state to re-render
  useEffect(() => () => {panelIds.splice(panelIds.indexOf(panelId), 1)}, [])

  // Register Panel Index in the state when rendering for the first time
  let index = panelIds.indexOf(panelId)
  if (index === -1) index = panelIds.push(panelId) - 1
  if (id == null) id = String(index) // if `id` is undefined, fallback to using index
  if (activeId !== id && !(forceRender = forceRender || f) && !mustRender) return null

  // Accessibility
  props.id = `panel_${id}_${tabsId}`
  props['aria-labelledby'] = `tab_${id}_${tabsId}`
  if (forceRender && activeId !== id) {
    props['aria-expanded'] = 'false'
    props.hidden = true // must be boolean because this is native attribute
  } else {
    props['aria-expanded'] = 'true'
    props.hidden = false
  }

  // Resolve children
  props.children = resolveChildren(props.children, self)

  // Do not use Scroll here so user can have a choice of explicitly passing `scroll` attribute
  return <View className={cn(className, 'tabs__panel')} {...props} />
}

TabPanel.propTypes = {
  // Tab key string to pair with TabPanel, defaults to using Tab index
  id: type.String,
  // Tab content
  children: type.NodeOrFunction,
  // Whether to always render the Tab Panel (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
  // Whether to make Tab Panel scrollable
  scroll: type.Boolean,
}

TabPanel.defaultProps = {
  role: 'tabpanel',
  _nodrag: '',
}

/**
 * Tab Helpers -------------------------------------------------------------------------------------
 */

// Render Tab component from `items` prop
function renderTab ({id, tab}, i) {
  let children = tab
  // React rendered node can also be an object
  if (typeof tab === 'object' && tab.text != null) {
    children = tab.text
    const {icon} = tab
    if (icon) children = <>
      <Icon {...isObject(icon) ? icon : {name: icon}} /><Spacer smaller />{children}
    </>
  }
  return <Tab key={id != null ? id : i} id={id}>{children}</Tab>
}

// Render TabPanel component from `items` prop
function renderPanel (items, self) {
  // React first renders all Tabs if they are defined before Panels, with or without TabPanels wrapper.
  // Thus, the activeId should be set. But when defined as function, renderPanel renders first.
  // => use the first index when `activeId == null`
  const {activeId} = self.tabState
  const index = Math.max(items.findIndex(({id}, i) => activeId === (id != null ? id : String(i))), 0)
  const {id = String(index), panel} = items[index] || {}
  const props = {id, ...(isObject(panel) && panel.children) ? panel : {children: panel}}

  // Pass the `id` as index (if undefined) so that it matches active Tab index for Accessibility,
  // because when mounted TabPanel will try to get index based on it's rendering order.
  return <TabPanel {...props} />
}

// Make sure activeId can not be negative number
function sanitizeId (activeId) {
  return typeof activeId === 'number' ? Math.max(activeId, 0) : activeId
}
