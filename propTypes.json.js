export default {Tooltip:{propTypes:{children:{c:'Tooltip content'},on:{c:'One of, or any combination of `[\'click\', \'focus\', \'hover\']`'},position:{c:'Location of the Tooltip relative to the parent element'},align:{c:'Tooltip alignment relative to the `position`, default is center/middle alignment.\n```\nFor position \'top\'/\'bottom\':\n\'start\' is left\n\'end\' is right\n\nFor position \'left\'/\'right\':\n\'start\' is top\n\'end\' is bottom\n```'},animation:{c:'Animation CSS class to apply'},delay:{c:'Popup delay duration in milliseconds'},embedded:{c:'Whether to render Tooltip as child element of the parent Node, by default it renders as Portal'},offset:{c:'Tooltip pointer offset from the parent element, default is `16`'},openInitially:{c:'Whether to show Tooltip initially'},onOpen:{c:'Handler(event, self: object) => void - before Tooltip opens'},onClose:{c:'Handler(event, self: object) => void - before Tooltip closes'},onMount:{c:'Callback(self: object) => void - when Tooltip container has mounted'},theme:{c:'Name of the theme mode to apply - must be one of the available theme styles.\n\nExample: `inverted`, `light`, `dark`, `glass`, etc.'},tooltipClass:{c:'Class name for the Tooltip container'}},defaultProps:{animation:{v:'\'fade-in\''},delay:{v:'1000'},on:{v:'[\'focus\', \'hover\']'},offset:{v:'16'},position:{v:'\'top\''},theme:{v:'\'dark\''},role:{v:'\'tooltip\''}}},Accordion:{propTypes:{children:{c:'Expandable content (see example)'},duration:{c:'Expand/Collapse animation duration in milliseconds'},multiple:{c:'Whether to allow opening multiple Accordion panels at once'},onChange:{c:'Callback(event: Event, open: boolean, id: string, index?: number) when `open` state changes'},open:{c:'Whether to have all content expanded by default'},forceRender:{c:'Whether to always render ExpandPanel content (useful for SEO indexing)'}}},Badge:{propTypes:{count:{c:'Badge count'},maxDigits:{c:'Maximum number of count digits to display'}},defaultProps:{maxDigits:{v:'2'}}},Breadcrumb:{propTypes:{items:{c:'Breadcrumb item'},children:{c:'Custom breadcrumb items'}}},Button:{propTypes:{children:{c:'Button content'},className:{},style:{},active:{c:'Whether to add `active` css class'},disabled:{c:'Whether the button is disabled'},loading:{c:'Whether to show loading state'},type:{c:'Button type'},tooltip:{},_ref:{}}},Buttons:{propTypes:{items:{c:'List of each Button props'},vertical:{c:'Whether to render Buttons vertically'},children:{c:'Extra inner content to render after buttons'}}},Divider:{propTypes:{className:{},style:{}}},DropdownMenu:{defaultProps:{iconClose:{v:'\'cross-sm\''},iconOpen:{v:'\'more\''}},propTypes:{children:{c:'Dropdown Menu content to render when open'},open:{c:'Whether to open the Dropdown Menu initially'},btnProps:{c:'Three-dots Button props'},iconProps:{c:'Three-dots Button Icon props'},iconOpen:{},iconClose:{},menu:{c:'Function({open: boolean, initialOpen: boolean, props, state}) => JSX - custom Menu renderer'},tooltipProps:{c:'Dropdown Tooltip props'},onMount:{c:'Handler(self: object) when this component has mounted'},className:{},style:{}}},ErrorContent:{propTypes:{items:{}}},ErrorTable:{propTypes:{items:{}}},Expand:{propTypes:{children:{c:'Expand content (see [examples](#examples))'},direction:{c:'Expand/collapse direction'},duration:{c:'Animation duration in milliseconds'},forceRender:{c:'Whether to always render <ExpandPanel> content'},id:{c:'Optional unique identifier, will be passed to `onChange`, default is React.useId() string'},index:{c:'Optional index identifier, will be passed to `onChange` (used by [Accordion](Accordion))'},onChange:{c:'Callback(event: Event, open: boolean, id: string, index?: number) when `open` state changes'},open:{c:'Whether to expand content'},asPanel:{c:'Whether to wrap `children` prop with <ExpandPanel> component (for use without <ExpandTab>)'}},defaultProps:{direction:{v:'\'height\''},duration:{v:'300'},role:{v:'\'tablist\''}}},ExpandTab:{propTypes:{children:{c:'Expansion trigger element (see [examples](#examples))'},onClick:{c:'Callback(event: Event, open: boolean, id: string | number, index?: number) when `open` state changes'}},defaultProps:{role:{v:'\'tab\''},_nodrag:{v:'\'\''}}},ExpandPanel:{propTypes:{children:{c:'Expandable content (see [examples](#examples))'},forceRender:{c:'Whether to always render content (for [SEO indexing](https://www.semrush.com/blog/html-hide-element/))'}},defaultProps:{role:{v:'\'tabpanel\''},_nodrag:{v:'\'\''}}},Highlighter:{defaultProps:{},propTypes:{children:{c:'Source code string'},language:{c:'Code block language'},PreTag:{c:'The element that wraps around the `<code>` block'}}},Icon:{propTypes:{name:{c:'Icon name, can be empty string to be styled with custom CSS'},font:{c:'If `true`, use Font icon, instead of CSS masked image, which is the default'},className:{},style:{}}},Image:{defaultProps:{name:{v:'\'image.svg\'',c:'Placeholder image to prevent error and for better UX'},loading:{v:'\'lazy\''},decoding:{v:'\'async\''}},propTypes:{name:{c:'File name (required if `src` or `alt` not defined)'},dir:{c:'Directory path to the file (without file name) if `src` not given'},src:{c:'Image file source URL or full file path (takes priority over file `name`)'},alt:{c:'Alternative text description of the image (auto generated from file `name`)'},loading:{},decoding:{},className:{},style:{}}},ImageSwatch:{defaultProps:{name:{v:'\'\''}},propTypes:{src:{c:'Full Path, URL, Base64 or Preview String object of Image file'},small:{},large:{},className:{},style:{}}},JsonView:{propTypes:{data:{c:'JSON data to show as JavaScript Object'},open:{c:'Whether to expand all nodes'},theme:{c:'Color scheme'}},defaultProps:{theme:{v:'defaultTheme'}}},Loader:{defaultProps:{loading:{v:'true'}},propTypes:{loading:{c:'Whether to show this Component or not'},children:{c:'Optional loading text or custom UI to render as loading indicator'},size:{c:'Loading icon size (ie. the spinner)'},iconClass:{c:'Class name for the loading icon'},className:{},style:{}}},Markdown:{propTypes:{children:{},components:{c:'key -> value pairs where `key` is element tag name, and `value` is the render function\n\n@see https://github.com/remarkjs/react-markdown#use-custom-components-syntax-highlight'},remarkPlugins:{},rehypePlugins:{},remarkRehypeOptions:{}}},ShadowDOM:{propTypes:{mode:{},delegatesFocus:{},styleSheets:{c:'From [CSSStyleSheet()](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)'},ssr:{},children:{}},defaultProps:{mode:{v:'\'open\''},delegatesFocus:{v:'false'},styleSheets:{v:'[]'}}},Spacer:{propTypes:{size:{},className:{},style:{}}},Spinner:{propTypes:{size:{},color:{},className:{}}},Tabs:{propTypes:{activeId:{c:'Selected tab index number or key string (for controlled state)'},defaultId:{c:'Default selected tab index number or key string (for uncontrolled state to load initially)'},children:{c:'Tab content (see example)'},onChange:{c:'Callback(event, activeId: string, lastId: string) whenever tab changes, where ids could be indices'},rtl:{c:'Whether to use Right-to-Left direction'},vertical:{c:'Whether to use vertical orientation for Tabs'},forceRender:{c:'Whether to always render all Tab Panels - can be set individually (useful for SEO indexing)'},items:{c:'Alternative way to define Tabs and Panels as a single array'},tabListProps:{c:'TabList props to pass'}}},TabList:{defaultProps:{className:{v:'\'no-scrollbar\''},role:{v:'\'tablist\''}}},Tab:{propTypes:{id:{c:'Tab key string to pair with TabPanel, defaults to using Tab index as string'},onClick:{c:'Callback(event, activeId: string)'}},defaultProps:{role:{v:'\'tab\'',c:'@see: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role'},_nodrag:{v:'\'\''}}},TabPanel:{propTypes:{id:{c:'Tab key string to pair with TabPanel, defaults to using Tab index'},children:{c:'Tab content'},forceRender:{c:'Whether to always render the Tab Panel (useful for SEO indexing)'},scroll:{c:'Whether to make Tab Panel scrollable'}},defaultProps:{role:{v:'\'tabpanel\''},_nodrag:{v:'\'\''}}},Text:{propTypes:{children:{c:'The text content'},className:{},style:{},tooltip:{},_ref:{}}},View:{defaultProps:{defaultProp:{v:'true'}},propTypes:{className:{c:'CSS class names string, separated by space'},style:{c:'CSS style object with camelCase attribute keys'},col:{c:'Whether to use vertical (i.e. column) layout. By default, it is `true` if `row` prop is falsy'},row:{c:'Whether to use horizontal layout. By default, it is falsy'},grid:{c:'Whether to use grid layout, instead of the default `col`/`row` flex layout'},fill:{c:'Whether to make the view fill up available height and width'},reverse:{c:'Whether to reverse the render order of inner content items'},rtl:{c:'Whether to use right to left text, layout, and scroll direction'},left:{c:'Align inner content to the start'},right:{c:'Align inner content to the end'},top:{c:'Align inner content to the top'},bottom:{c:'Align inner content to the bottom'},center:{c:'Align inner content to the center horizontally'},middle:{c:'Align inner content to the middle vertically'},sound:{c:'@param {object|HTMLAudioElement} new Audio(URL) sound file to play on click'},children:{c:'Inner content to render'},childBefore:{c:'Custom UI to render before `children` in Scroll mode (outside inner Scroll component)'},childAfter:{c:'Custom UI to render after `children` in Scroll mode (outside inner Scroll component)'},preventOffset:{c:'Whether to prevent components from setting size offset for this component.\nThis can prevent bugs caused by children Scroll components with `scrollOffset` enabled.'},tooltip:{},scroll:{c:'Whether to enable `scroll` mode so that overflow content is scrollable.\nNote: because of browser quirks related to flex layout, this mode adds an extra\ninner scroll `div` element that wraps `children` content.'},scrollAlongDirectionOnly:{c:'Whether to restrict scrolling along the layout direction.\n\nScrollable in all directions by default.'},scrollClass:{c:'CSS class for inner wrapper Scroll component'},scrollStyle:{c:'CSS style for inner wrapper Scroll component'},scrollProps:{c:'Props for the inner Scroll component'},scrollOffset:{c:'Whether to allow `Scroll` element to set offset style to its parent element.\nThe Scroll component may set `max-width` or `max-height` style to the parent\nelement in order for it to calculate the maximum available space correctly.\nSometimes, this behavior leads to false positives, and needs to be disabled.'},scrollOverflowProps:{c:'Props for outer Scroll `div` when content overflows in given direction, set to `false` to disable'},scrollReversed:{c:'When `true`:\n- For column layout - left scrollbar\n- For row layout - reverses scroll direction.\n\nHere is how it works when enabled:\n- for LTR direction it uses right to left scroll direction and place the scrollbar on the left.\n- If `rtl` is true, the scroll direction is left to right and the scrollbar is on the right.\n\nTo achieve left scrollbar without changing horizontal scroll direction,\nrestrict this `Scroll` component to allow only vertical scroll,\nthen create a nested Scroll component that can only scroll horizontally.\n@example:\n<Scroll rtl={rtl} scrollReversed scrollAlongDirectionOnly>\n<Scroll row scrollAlongDirectionOnly>...</Scroll>\n</Scroll>'},scrollRef:{c:'Ref for the inner Scroll component'},_ref:{c:'Ref for the View or outer Scroll container'}}},VirtualList:{defaultProps:{fill:{v:'true'},scroll:{v:'true'},initialItems:{v:'10'},renderRadius:{v:'true'}},propTypes:{items:{c:'List of items to render (can be an array of any value)'},initialItems:{c:'Number of items to render initially, or when `items` prop changes'},grid:{c:'Whether to render as grid (equivalent to `scrollClass=\'row top wrap\'` for `col` container)'},row:{c:'Whether to render in horizontal layout direction'},renderItem:{c:'Function(item, index, items, self) to render each item in the list, default is `renderProp()`'},renderRadius:{c:'Percentage of the visible list container size to pre-render items around.\n- Set to `true` to use automatic calculation based on scroll speed (this is default).\n- Set to `0` to only render items when they scroll into view.\n- Set to `1` (ie. 100%) to render items within an area that is 3x the size of the view.\n```\n┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐\n│            ↑            │\n│    renderRadius: 100%   │\n│            ↓            │\n┌─────────────────────────┐\n│          start          │\n│  visible items in view  │\n│           end           │\n└─────────────────────────┘\n│            ↑            │\n│    renderRadius: 100%   │\n│            ↓            │\n└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘\n```'}}},VirtualListItem:{propTypes:{children:{}}},Checkbox:{defaultProps:{className:{v:'\'gap-smaller\''},checkedValue:{v:'true'},uncheckedValue:{v:'false'}},propTypes:{label:{c:'Text to use for checkbox, uses `id` if not given'},id:{c:'Unique identifier, default is string created from React.useId()'},onChange:{c:'Input onChange callback(event, value: any, name?: string, self: object)'},value:{c:'Internal value for controlled checked or unchecked state'},defaultValue:{c:'Initial value for uncontrolled checked or unchecked state'},checkedValue:{c:'Internal value to assign to checked case'},uncheckedValue:{c:'Internal value to assign to unchecked case'},readonly:{c:'Whether to disable toggling state'}}},Input:{defaultProps:{type:{v:'\'text\''},helpTransition:{v:'true'}},propTypes:{type:{c:'Native input `type` attribute, also a key identifier for delegated input controls.\nSee [input type examples](#input-types).'},id:{c:'Unique input identifier, default is string created from React.useId()'},info:{c:'Help information to show after the Input'},error:{c:'Error message to show after the Input (ex. on validation fail)'},helpTransition:{c:'Whether to enable input info/error animation transition (or expandCollapse transition options)'},compact:{c:'Whether to make input take only the minimum content width necessary'},controls:{c:'Map of Input Control components by their `type` string to use for rendering'},controlProps:{c:'Props to pass to Input Control component'},tooltip:{}}},InputNative:{defaultProps:{type:{v:'\'text\''}},propTypes:{compact:{c:'Whether to use minimal width that fits content, pass number for additional character offset'},controlledValue:{c:'Whether to lock input value when `value` prop is given'},defaultValue:{c:'Initial value for uncontrolled state'},value:{c:'Internal value for controlled state'},onChange:{c:'Handler(event, value: any, name?: string, self) on input value changes'},onFocus:{c:'Handler(event, value: any, name?: string, self) on input focus'},onBlur:{c:'Handler(event, value: any, name?: string, self) on input blur'},onRemove:{c:'Handler(event, value: any, name?: string, self) on input removal.\n\n`onChange` handler will fire after with `null` as value, unless event.preventDefault().\n\nTo let `onChange` update form instance first before removing the field,\n\nuse setTimeout to execute code inside `onRemove` handler.'},label:{c:'Label to show before the input (or after with `reverse` true)'},loading:{c:'Whether input is loading'},format:{c:'Function(value, name?, self) => string - internal value formatter for native input (UI display)'},parse:{c:'Function(value, name?, self, event) => any - value parser for onChange/onBlur/onFocus handlers'},normalize:{c:'Function(value, name?, self, event) => string - internal value normalizer to sanitize user input'},prefix:{c:'Prefix to show before the Input value text'},suffix:{c:'Suffix to show after the Input value text (value must be non-empty)'},stickyPlaceholder:{c:'Whether to persist placeholder as user enters text'},noSpellCheck:{c:'Whether to disable spell check and autocorrection'},childBefore:{c:'Custom UI to render before input node (inside .input wrapper with focus state)'},childAfter:{c:'Custom UI to render after input node (inside .input wrapper with focus state)'},icon:{c:'Custom Icon name or props to render before input node'},iconEnd:{c:'Custom Icon name or props to render after input node (if `onRemove` not defined)'}}},InputView:{defaultProps:{viewType:{v:'\'view\''},controls:{v:'{ \'view\': ViewWithLabel }',c:'Use View, because View does not allow text selection, and has style conflicts'},Input:{v:'Input'},inputClicks:{v:'1'},inputOnlyAttrs:{v:'[\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n// \'controls\', \'error\', \'info\', \'helpTransition\', \'type\',\n\'compact\', \'controlledValue\', \'defaultValue\', \'value\', \'onRemove\', \'format\', \'parse\', \'prefix\', \'suffix\', \'stickyPlaceholder\', \'noSpellCheck\',\n// \'childBefore\', \'childAfter\',\n\'icon\', \'iconEnd\']'}},propTypes:{viewType:{c:'View Component `type` to use (as defined by Input `controls` prop)'},Input:{c:'Universal Input Component to use (must render inner `<input/>` by `type`, including `viewType`)'},inputClicks:{c:'Number of clicks to turn into Input, set as 2 for Double Click, default is single click'},inputOnlyAttrs:{c:'List of props to remove when in View state (ie. for Input state only)'},inputProps:{c:'Props to use for Input state only'},viewProps:{c:'Props to use for View state only'}}},Select:{defaultProps:{focusIndex:{v:'0'},query:{v:'\'\'',c:'Default to empty string to prevent React controlled input error'},virtualOptionsMinimum:{v:'50'}},propTypes:{options:{c:'Selectable values'},optionProps:{c:'Individual option props to pass'},optionsProps:{c:'Options container props to pass'},onChange:{c:'Handler(event, value: any, name?, self) when selected value changes'},onFocus:{c:'Handler(event, value: any, name?: string, self) on select focus'},onBlur:{c:'Handler(event, value: any, name?: string, self) on select blur'},onRemove:{c:'Handler(event, value: any, name?: string, self) on input removal.\n\n`onChange` handler will fire after with `null` as value, unless event.preventDefault().\n\nTo let `onChange` update form instance first before removing the field,\n\nuse setTimeout to execute code inside `onRemove` handler.'},onSearch:{c:'Handler(event, query: string, name?, self) when search input value changes'},onSelect:{c:'Handler(event, value: any, name?, self) when an option gets focus'},onClickValue:{c:'Handler(event, value: any, name?, self) when a multiple selected value is clicked'},onMount:{c:'Handler(self: object) when this component has mounted'},addOption:{c:'Whether to allow users to add new options (in combination with search)\nSet to `true` to allow adding new term.\nSet to `object` of props to pass to new `option` object when selected.\nSet to `function(query: string) => boolean | object` for conditional logic.'},compact:{c:'Whether to use minimal width that fits content, pass number for additional character offset'},controlledValue:{c:'Whether to lock selected value when `value` prop is given'},openInitially:{c:'Whether to open options initially'},excludeSelected:{c:'Whether to filter out selected value from options dropdown'},format:{c:'Function(value, name?, self) => any - Serializer for internal Select state value'},parse:{c:'Function(value, name?, self, event) => any - Deserializer for onChange/onBlur/onFocus value\n\nSelect always stores the `value` or `value[]` internally for its logic, like fuzzy search'},normalize:{c:'Function(query, name?, self, event) => string - search query normalizer to sanitize user input'},forceRender:{c:'Whether to always render options, even when closed'},icon:{c:'Custom Icon name or props to render before input node.\n\nDefault is \'dropdown\' icon at the end, or \'search\' icon at the start if `search = true`\n\nand icons are undefined or null.'},iconEnd:{c:'Custom Icon name or props to render after input node'},multiple:{c:'Whether to allow multiple selections and store values as array'},fixed:{c:'Whether to set options with position fixed on open to remain visible inside Scroll'},query:{c:'Default search query to use'},queryParser:{c:'Function(query) => string - parse function for internal query string used for search'},search:{c:'Whether to enable search by options, pass Handler(query, options) => value for custom search'},searchNonce:{c:'Unique ID to trigger search options re-indexing'},searchOptions:{c:'Fuzzy [search options](https://fusejs.io/api/options.html)'},upward:{c:'Whether options menu should try to open from the top, default is from the bottom'},value:{c:'Selected value(s) - if passed, becomes a controlled component'},renderSelected:{c:'Function(value: any, index: number, array, self) => JSX - to render selected option.\n\nCurrently only works for `multiple` selections.'},noOptionsMsg:{c:'Message string to display when there are no options left for multiple select, or\n\nHandler(self) => string - function to render message dynamically (example: using query)'},virtualOptionsMinimum:{c:'Minimum number of Select options to use Virtual List renderer to optimize for performance'}}},SelectNested:{defaultProps:{optionProps:{v:'{ className: \'no-padding !no-border\',\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n  /**\n   * Override SelectOption `onClick` for keyboard accessibility.\n   * This will prevent Select from firing `onChange` event on click,\n   * because `selectOption()` is not fired.\n   * However, if the user presses Enter, `selectOption()` is fired internally without click,\n   * and will call Select.onChange event.\n   * So handle Select.onChange for accessibility, and leave this function empty\n   * to prevent firing Select.onChange twice.\n   */onClick() {} }'},nestedIcon:{v:'\'caret\'',c:'Chevron-right for LTR direction'},nestedProps:{v:'{ className: \'fill-width\' }'}},propTypes:{nestedIcon:{c:'Icon indicator for nested collections'},options:{c:'Any object or array, or a deeply nested collection of `type.Option`'},formatKey:{c:'Function(key: string, keyPath: string[], self) => string - to format key path for display'},filterValue:{c:'Function(value: any, key: string, keyPath: string[], self) => boolean - true to render value, false to skip'}}},SelectOption:{propTypes:{option:{},onClick:{c:'Handler(event, option) => void - when option is clicked'},onBlur:{c:'Handler(event, option) => void - on option blur event'},onFocus:{c:'Handler(event, option) => void - on option focus event'},focused:{c:'Whether the current option has focus'},selected:{c:'Whether the current option is selected'},search:{c:'Whether Select has search enabled to highlight matched query'},query:{c:'Current Select search query to highlight matches'}}},Switch:{defaultProps:{className:{v:'\'gap-smaller\''},checkedValue:{v:'true'},uncheckedValue:{v:'false'}},propTypes:{controlledValue:{c:'Whether to lock input value when `value` prop is given'},defaultValue:{c:'Initial value for uncontrolled checked or unchecked state'},checkedValue:{c:'Internal value to assign to checked case'},uncheckedValue:{c:'Internal value to assign to unchecked case'},label:{c:'Label to show before the Switch (or after Switch with `reverse` true)'},checkedLabel:{c:'UI to show for checked state inside the Switch toggle, defaults to a checkmark icon'},uncheckedLabel:{c:'UI to show for unchecked state inside the Switch toggle, defaults to empty Spacer'},onChange:{c:'Handler(event, value: any, name?: string, self) on input value changes'},onFocus:{c:'Handler(event, value: any, name?: string, self) on input focus'},onBlur:{c:'Handler(event, value: any, name?: string, self) on input blur'},value:{c:'Internal value for controlled checked or unchecked state'},format:{c:'Function(value, name?, event?, self) => boolean - Input value formatter for input.checked'},parse:{c:'Function(value: boolean, name?, event, self) => any - value parser for onChange/onBlur/onFocus handlers'},id:{c:'Unique identifier, default is string created from React.useId()'}}},TextArea:{propTypes:{compact:{c:'Whether to use minimal width that fits content, pass a number for additional character offset'},defaultValue:{c:'Initial value for uncontrolled state'},value:{c:'Internal value for controlled state'},onChange:{c:'Handler(event, value: any, name?: string, self) on textarea value changes'},onFocus:{c:'Handler(event, value: any, name?: string, self) on textarea focus'},onBlur:{c:'Handler(event, value: any, name?: string, self) on textarea blur'},onRemove:{c:'Handler(event, value: any, name?: string, self) on textarea removal.\n\n`onChange` handler will fire after with `null` as value, unless event.preventDefault().\n\nTo let `onChange` update form instance first before removing the field,\n\nuse setTimeout to execute code inside `onRemove` handler.'},label:{c:'Label to show before the textarea (or after with `reverse` true)'},loading:{c:'Whether textarea is loading'},format:{c:'Function(value, name?, event?, self) => string - value formatter for UI display'},parse:{c:'Function(value, name?, event, self) => any - Parser for internal value for onChange'},resize:{c:'Whether to automatically resize height style to fit content'},noSpellCheck:{c:'Whether to disable spell check and autocorrection'},childBefore:{c:'Custom UI to render before textarea node (inside .textarea wrapper with focus state)'},childAfter:{c:'Custom UI to render after textarea node (inside .textarea wrapper with focus state)'},icon:{c:'Custom Icon name or props to render before textarea node'},iconEnd:{c:'Custom Icon name or props to render after textarea node (if `onRemove` not defined)'}}},Upload:{defaultProps:{type:{v:'\'file\''},hyphen:{v:'true'},loading:{v:'false'},iconSelect:{v:'\'\''},iconRemove:{v:'\'\''},onError:{v:'(e, errors) => alert(errors.map((e) => e.message).join(\'\n\'))'}},propTypes:{accept:{c:'A comma-separated list of one or more file types allowed for upload. Examples of valid values:\n1. Filename extension: `.svg`, `.jpg`...\n2. File type wildcard: `image/*`, `video/*`...\n3. MIME type: `image/jpeg`, `application/pdf`...\n4. Any combination of above: `image/*, .pdf`.\n\nFor more details, refer to [**accept** specs](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept#unique_file_type_specifiers).'},children:{c:'Custom label to show inside Upload dropzone, default is placeholder Icon or Text'},childBefore:{c:'Custom UI to show inside Upload dropzone, before upload__label'},childAfter:{c:'Custom UI to show inside Upload dropzone, after upload__label'},hyphen:{c:'Whether to hyphenate Text when it overflows width'},loading:{c:'Whether to show loading spinner and block input interaction'},maxFiles:{c:'Maximum number of uploaded files (when `multiple` is true)'},maxSize:{c:'Maximum file(s) upload size limit in bytes (accumulative for `multiple` uploads)'},minSize:{c:'Minimum file(s) upload size limit in bytes (accumulative for `multiple` uploads)'},multiple:{c:'Whether to allow upload of more than one file'},iconSelect:{c:'Icon name for selecting file upload, default style is `plus` Icon for empty string'},iconRemove:{c:'Icon name for removing file upload, default style is `cross` Icon for empty string'},square:{c:'Whether to add `squared` CSS class to make the dropzone fill available space as square'},value:{c:'Input files - if passed, becomes a controlled-like component'},defaultValue:{c:'Initial Input files for uncontrolled-like component'},onChange:{c:'Handler(event, acceptedFiles: File[] | null, name?, self) when input value changes'},onError:{c:'Handler(event, {message: String, file?: File}[], name?, self) when input changes and validation fails'},onRemove:{c:'Handler(event, removedFiles: File[], name, self, callback) before input files are to be removed,\n\nTo use custom behavior, set event.preventDefault, then fire `callback()` yourself.\n\nThe default behavior uses window.confirm() before calling `onChange` to remove files.'}}},UploadGrid:{defaultProps:{maxFiles:{v:'1'},gap:{v:'\'1em\''},previewAccept:{v:'\'image/*\''}},propTypes:{initialValues:{c:'Uploaded FileInput(s) value to render initially or to sync with'},onChange:{c:'Handler(event, fileInput(s), name, self) when file(s) change, receives all changed file(s) since initialization'},onChangeLast:{c:'Similar to `onChange` callback, but receives only last changed file(s), will not call `onChange` if given'},onRemove:{c:'Handler(event, fileInput(s), name, self, callback) before input files are to be removed,\n\nTo use custom behavior, set event.preventDefault, then fire `callback()` yourself.\n\nThe default behavior uses window.confirm() before calling `onChange` to remove files.'},multiple:{c:'Whether to get fileInput(s) as list, even if maxFiles = 1, ignored if `maxFiles > 1` or `types` is defined'},maxFiles:{c:'Number of files that can be uploaded, ignored if `types` is defined'},maxColumns:{c:'Maximum number of grid columns, default is the divisor of `maxFiles` closest to its square root'},gap:{c:'Spacing between grid slots, can be any CSS value, required if maxFiles > 1'},kind:{c:'Type of file (added as attribute to new FileInput uploads)'},noPreview:{c:'Whether to disable selected/uploaded file(s) preview (aka images, video, etc.)'},noPreviewClean:{c:'Whether to disable automatic garbage clean to release memory for unused File previews'},preview:{c:'Custom function preview(fileInput, index, self) or node to render for selected/uploaded file slot'},previewAccept:{c:'Comma separated list of File MIME types or extensions, similar to <input accept=""/> to enable File preview'},previewClass:{c:'CSS class to add to preview node'},square:{c:'Whether to add \'squared\' CSS class to make the dropzone fill available space as square'},slotLabel:{c:'Whether to always show File label, like: incremental slot count, identifier type.name, or File.name.\n\nPass `false` to disable File label (note: Upload component may still show list of files)\n\nPass `i` string to always show incremental count or type.name (if `types` given)\n\nBy default, File.name is shown when it has preview.'},types:{c:'Named Identifier definitions for each upload type in the grid, default is incremental count'}}},CodeExample:{propTypes:{children:{c:'Example source code'},desc:{c:'Description text - default is "Example"'},source:{c:'`children` as literal source code string for documentation\n\nAutogenerate this using [webframe-docs](https://www.npmjs.com/package/webframe-docs) CLI.'}}},PropsTable:{propTypes:{component:{c:'React Component element type\n@example:\nimport { Button } from \'@webframer/ui\'\n<PropsTable component={Button} />'},manifest:{c:'Content of the `propTypes.json` manifest file compiled by [webframe-docs](https://www.npmjs.com/package/webframe-docs)'}}}}