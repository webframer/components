import { KEY } from '@webframer/js'
import keyboard from '@webframer/js/keyboard.js'
import cn from 'classnames'
import React, { useEffect, useId, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { assignRef } from './react.js'
import { type } from './types.js'
import { hasFocusWithinForKeyboard, selectTextFrom } from './utils/element.js'
import { extractProps, View } from './View.jsx'

// todo: improvement 3 - 'react-markdown' causes React hydration error in Next.js production
//      Can't resolve 'supports-color'?
// Wrap with HOC so that IDE automatically imports default, instead of pure function
function createMarkdown () {
  /**
   * Markdown View - Pure Component.
   * Features:
   *    - Ctrl + A will select only markdown content, not the entire viewport
   */
  function Markdown ({className, children, ...props}) {
    const id = useId()
    const self = useRef({}).current
    if (!self.props) {
      self.ref = function (node) {
        self.node = node
        assignRef.call(this, self.props._ref, node)
      }
      self.selectAll = function (e) {
        if (!hasFocusWithinForKeyboard(e, self.node)) return
        e.preventDefault()
        selectTextFrom(self.node)
      }
    }
    self.props = arguments[0]
    useEffect(() => {
      keyboard.addShortcut(self.selectAll, [KEY.Ctrl, KEY.a], id)
      return () => {keyboard.removeShortcut(id)}
    }, [])
    return ( // wrap with View to allow optional scroll, tooltip, and accessibility support
      <View className={cn(className, 'markdown')} {...extractProps(props)} _ref={self.ref}>
        <ReactMarkdown {...props}>{children}</ReactMarkdown>
      </View>
    )
  }

  Markdown.propTypes = {
    children: type.String.isRequired,
    // key -> value pairs where `key` is element tag name, and `value` is the render function
    // @see https://github.com/remarkjs/react-markdown#use-custom-components-syntax-highlight
    components: type.ObjectOf(type.Function),
    remarkPlugins: type.ListOf(type.Any),
    rehypePlugins: type.ListOf(type.Any),
    remarkRehypeOptions: type.Any,
    // ...more View and ReactMarkdown props to pass
  }

  return [Markdown]
}

export const [Markdown] = createMarkdown()
export default React.memo(Markdown)
