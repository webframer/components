/* ! Copyright (c) webframe.app by Ecoinomist (https://github.com/ecoinomist) | MIT License */
// https://stackoverflow.com/questions/64242186/node-cant-find-modules-without-js-extension
export * from './components/Accordion.js'
export * from './components/Badge.js'
export * from './components/Breadcrumb.js'
export * from './components/Button.js'
export * from './components/Buttons.js'
export * from './components/Checkbox.js'
export * from './components/Divider.js'
export * from './components/DropdownMenu.js'
export * from './components/ErrorContent.js'
export * from './components/ErrorTable.js'
export * from './components/Expand.js'
export * from './components/Highlighter.js'
export * from './components/HighlightBASH.js'
export * from './components/HighlightJSON.js'
export * from './components/HighlightJSX.js'
export * from './components/HighlightLESS.js'
export * from './components/Icon.js'
export * from './components/Image.js'
export * from './components/ImageSwatch.js'
export * from './components/Input.js'
export * from './components/InputNative.js'
export * from './components/InputView.js'
export * from './components/JsonView.js' // 'react-json-tree' is tree shaked if not used
export * from './components/Label.js'
export * from './components/Loader.js'
export * from './components/Markdown.js'
export * from './components/Modal.js'
export * from './components/Row.js'
export * from './components/Scroll.js'
export * from './components/Select.js'
export * from './components/SelectNested.js'
export * from './components/SelectOption.js'
export * from './components/SelectOptions.js'
export * from './components/SelectValue.js'
export * from './components/ShadowDOM.js'
export * from './components/Spacer.js'
export * from './components/Spinner.js'
export * from './components/Switch.js'
export * from './components/Tabs.js'
export * from './components/Text.js'
export * from './components/TextArea.js'
export * from './components/Tooltip.js'
export * from './components/Upload.js'
export * from './components/UploadGrid.js'
export * from './components/View.js'
export * from './components/VirtualList.js'

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
