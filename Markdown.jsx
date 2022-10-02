import cn from 'classnames'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { type } from './types.js'
import { extractViewProps, View } from './View.jsx'

// todo: improvement 3 - 'react-markdown' causes React hydration error in Next.js production
//      Can't resolve 'supports-color'?
// Wrap with HOC so that IDE automatically imports default, instead of pure function
function createMarkdown () {
  /**
   * Markdown View - Pure Component.
   */
  function Markdown ({className, children, ...props}) {
    return ( // wrap with View to allow optional scroll, tooltip, and accessibility support
      <View className={cn(className, 'markdown')} {...extractViewProps(props)}>
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
