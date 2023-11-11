import * as React from 'react'
import { createContext, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { assignRef, useIsomorphicLayoutEffect } from '../react.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import { View } from './View.js'

/**
 * Based on [react-shadow](https://github.com/Wildhoney/ReactShadow) package.
 */
export function ShadowDOM (_props) {
  const {mode, delegatesFocus, styleSheets, ssr, children, ...props} = _props
  const self = useRef({}).current
  const [shadowRoot, setShadowRoot] = useState(null)
  const key = `node_${mode}${delegatesFocus}`
  self.props = {..._props, shadowRoot}
  if (!self.ref) self.ref = function (node) {
    self.node = node
    assignRef.call(this, self.props._ref, ...arguments)
  }

  // Apply style sheet(s)
  useIsomorphicLayoutEffect(() => {
    if (!self.node) return
    try {
      let shadowRoot
      if (ssr) {
        shadowRoot = self.node.shadowRoot
        setShadowRoot(shadowRoot)
        return
      }

      shadowRoot = self.node.attachShadow({mode, delegatesFocus})
      if (styleSheets.length > 0) shadowRoot.adoptedStyleSheets = styleSheets
      setShadowRoot(shadowRoot)
    } catch (error) {
      handleError({error, styleSheets, shadowRoot})
    }
  }, [styleSheets, ssr])

  return (
    <View key={key} {...props} _ref={self.ref}>
      {(shadowRoot || ssr) && (
        <ShadowRootContext.Provider value={shadowRoot}>
          {ssr ? (
            <template shadowroot='open'>
              {renderProp(children, self)}
            </template>
          ) : (
            createPortal(renderProp(children, self), shadowRoot)
          )}
        </ShadowRootContext.Provider>
      )}
    </View>
  )
}

ShadowDOM.propTypes = {
  mode: type.Enum(['open', 'closed']),
  delegatesFocus: type.Boolean,
  // From [CSSStyleSheet()](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)
  styleSheets: type.ListOf(
    type.InstanceOf(globalThis.CSSStyleSheet),
  ),
  ssr: type.Boolean,
  children: type.NodeOrFunction,
}

ShadowDOM.defaultProps = {
  mode: 'open',
  delegatesFocus: false,
  styleSheets: [],
}

const ShadowDOMMemo = React.memo(ShadowDOM)
ShadowDOMMemo.name = ShadowDOM.name
ShadowDOMMemo.propTypes = ShadowDOM.propTypes
ShadowDOMMemo.defaultProps = ShadowDOM.defaultProps
export default ShadowDOMMemo

export const ShadowRootContext = createContext(null)

/**
 * Get element.shadowRoot object
 * @returns {ShadowRoot|null} shadowRoot
 */
export function useShadowRoot () {
  return useContext(ShadowRootContext)
}

function handleError ({error, styleSheets, shadowRoot}) {
  switch (error.name) {
    case 'NotSupportedError':
      styleSheets.length > 0 && (shadowRoot.adoptedStyleSheets = styleSheets)
      break
    default:
      throw error
  }
}
