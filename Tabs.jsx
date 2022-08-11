import { isFunction } from '@webframer/js'
import cn from 'classnames'
import React, { useContext, useEffect, useId } from 'react'
import { Button } from './Button.jsx'
import { useInstance } from './react/hooks.js'
import Scroll from './Scroll.jsx'
import { type } from './types.js'
import View from './View.jsx'

const TabInstance = React.createContext({})
const TabState = React.createContext({})

/**
 * Tabs --------------------------------------------------------------------------------------------
 * @example:
 *    // Uncontrolled state
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
 */
export function Tabs ({
  activeId, defaultId, children, className, onChange, vertical, forceRender, ...props
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

  return (
    <TabInstance.Provider value={self}>
      <TabState.Provider value={self.tabState}>
        <View className={cn(className, '_tabs')} row={vertical} {...props}>
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
  children: type.NodeOrFunction.isRequired,
  // Callback(activeId: string, lastId: string, event) whenever tab changes, where ids could be indices
  onChange: type.Function,
  // Whether to use Right-to-Left direction
  rtl: type.Boolean,
  // Whether to use vertical orientation for Tabs
  vertical: type.Boolean,
  // Whether to always render all Tab Panels - can be set individually (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
}

export default React.memo(Tabs)

/**
 * Tab List ----------------------------------------------------------------------------------------
 */
export function TabList ({className, ...props}) {
  const {vertical} = useContext(TabState)
  return <Scroll className={cn(className, '_tabs__list no-scrollbar')} row={!vertical} {...props} />
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

  // Accessibility
  props.id = `tab_${id}_${tabsId}`
  props['aria-controls'] = `panel_${id}_${tabsId}`
  props['aria-selected'] = activeId === id ? 'true' : 'false'

  // Tab props
  if (activeId === id) {
    props.disabled = true
  } else {
    props.onClick = (event) => {
      self.setTab(id, event)
      if (onClick) onClick(event, id)
    }
  }
  return <Button className={cn(className, '_tabs__tab')} {...props} />
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
export function TabPanel ({id, className, forceRender, ...props}) {
  const panelId = useId()
  const {activeId, panelIds, tabsId, forceRender: f} = useContext(TabState) // must use state to re-render
  useEffect(() => () => {panelIds.splice(panelIds.indexOf(panelId), 1)}, [])

  // Register Panel Index in the state when rendering for the first time
  let index = panelIds.indexOf(panelId)
  if (index === -1) index = panelIds.push(panelId) - 1
  if (id == null) id = String(index) // if `id` is undefined, fallback to using index
  if (activeId !== id && !(forceRender = forceRender || f)) return null

  // Accessibility
  props.id = `panel_${id}_${tabsId}`
  props['aria-labelledby'] = `tab_${id}_${tabsId}`
  if (forceRender && activeId !== id) {
    props.hidden = true // must be boolean because this is native attribute
  }

  // Do not use Scroll here so user can have a choice of explicitly passing `scroll` attribute
  return <View className={cn(className, '_tabs__panel')} {...props} />
}

TabPanel.propTypes = {
  // Tab key string to pair with TabPanel, defaults to using Tab index
  id: type.String,
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

// Make sure activeId can not be negative number
function sanitizeId (activeId) {
  return typeof activeId === 'number' ? Math.max(activeId, 0) : activeId
}
