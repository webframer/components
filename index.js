/* ! Copyright 2022 https://webframe.app | All Rights Reserved */
export * from './Accordion.jsx'
export * from './Badge.jsx'
export * from './Breadcrumb.jsx'
export * from './Button.jsx'
export * from './Buttons.jsx'
export * from './Checkbox.jsx'
export * from './Divider.jsx'
export * from './DropdownMenu.jsx'
export * from './ErrorContent.jsx'
export * from './ErrorTable.jsx'
export * from './Expand.jsx'
export * from './Highlighter.jsx'
export * from './HighlightBASH.jsx'
export * from './HighlightJSON.jsx'
export * from './HighlightJSX.jsx'
export * from './HighlightLESS.jsx'
export * from './Icon.jsx'
export * from './Image.jsx'
export * from './ImageSwatch.jsx'
export * from './Input.jsx'
export * from './InputNative.jsx'
export * from './InputView.jsx'
export * from './JsonView.jsx' // 'react-json-tree' is tree shaked if not used
export * from './Label.jsx'
export * from './Loader.jsx'
export * from './Markdown.jsx'
export * from './Modal.jsx'
export * from './Row.jsx'
export * from './Scroll.jsx'
export * from './Select.jsx'
export * from './SelectNested.jsx'
export * from './SelectOption.jsx'
export * from './SelectOptions.jsx'
export * from './SelectValue.jsx'
export * from './ShadowDOM.jsx'
export * from './Spacer.jsx'
export * from './Spinner.jsx'
export * from './Switch.jsx'
export * from './Tabs.jsx'
export * from './Text.jsx'
export * from './TextArea.jsx'
export * from './Tooltip.jsx'
export * from './Upload.jsx'
export * from './UploadGrid.jsx'
export * from './View.jsx'
export * from './VirtualList.jsx'

// Utilities
export { default as cn } from 'classnames'
export * from './types.js'

/**
 * Notes:
 *  - Next.js production bundle will tree shake unused exports.
 *  - Exporting like this makes all imports use un-memoized Function Components by default,
 *    which should be faster than memoized Components most of the time,
 *    because most components will have nested `children` prop change on every render.
 *  - Users can always import memoized versions directly from each file.
 *  - Another benefit is that IDE will suggest two versions of import:
 *    ```
 *    import { Component } from 'package'
 *    import Component from 'package/Component'
 *    ```
 *
 * Use cases for memoized Components:
 *  1. Components with primitive `children` value, such as string, number, etc.
 *  2. Containers that have no nested `children` prop (usually self-contained views).
 *  3. Deeply nested Components that get `children` from higher up ancestors:
 *    ```
 *    function Component ({children}) {
 *      // Text will not re-render if memoized, and `children` is primitive value
 *      return <View><Text>{children}</Text></View>
 *    }
 *    const Child = React.memo(Component)
 *
 *    function Parent ({children}) {
 *      // When `Parent` re-renders, but not `GranParent`:
 *      //   - `Child` will not re-render, because its `children` is passed from `GranParent`
 *      //   - `Component` will not re-render, even though it's not memoized.
 *      //   - `View` here will re-render, unless memoized.
 *      return <View>{children}</View>
 *    }
 *
 *    function GrandParent () {
 *      return (
 *        <View>
 *          <Parent>
 *            <Child>Content</Child>
 *          </Parent>
 *          <Parent>
 *            <Component>Content</Component>
 *          </Parent>
 *        </View>
 *      )
 *    }
 *    ```
 */
export default {}
