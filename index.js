/* ! Copyright (c) webframe.app by Ecoinomist (https://github.com/ecoinomist) | MIT License */
// https://stackoverflow.com/questions/64242186/node-cant-find-modules-without-js-extension
export * from './Accordion.js'
export * from './Badge.js'
export * from './Breadcrumb.js'
export * from './Button.js'
export * from './Buttons.js'
export * from './Checkbox.js'
export * from './Divider.js'
export * from './DropdownMenu.js'
export * from './ErrorContent.js'
export * from './ErrorTable.js'
export * from './Expand.js'
export * from './Highlighter.js'
export * from './HighlightBASH.js'
export * from './HighlightJSON.js'
export * from './HighlightJSX.js'
export * from './HighlightLESS.js'
export * from './Icon.js'
export * from './Image.js'
export * from './ImageSwatch.js'
export * from './Input.js'
export * from './InputNative.js'
export * from './InputView.js'
export * from './JsonView.js' // 'react-json-tree' is tree shaked if not used
export * from './Label.js'
export * from './Loader.js'
export * from './Markdown.js'
export * from './Modal.js'
export * from './Row.js'
export * from './Scroll.js'
export * from './Select.js'
export * from './SelectNested.js'
export * from './SelectOption.js'
export * from './SelectOptions.js'
export * from './SelectValue.js'
export * from './ShadowDOM.js'
export * from './Spacer.js'
export * from './Spinner.js'
export * from './Switch.js'
export * from './Tabs.js'
export * from './Text.js'
export * from './TextArea.js'
export * from './Tooltip.js'
export * from './Upload.js'
export * from './UploadGrid.js'
export * from './View.js'
export * from './VirtualList.js'

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
