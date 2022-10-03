import { Active } from '@webframer/js'
import PropTypes from 'prop-types'

/**
 * PROPTYPES PROXY =================================================================================
 *
 * A type system for clear semantic meaning without documentation and a cross-platform unified API.
 * All types should follow CapCase convention for readability and consistency.
 * Important:
 *  - Do not use numeric keys for object types, because new form values will be generated as array.
 *    @see https://github.com/lodash/lodash/issues/1316
 *
 * =================================================================================================
 */
export const type = {}

/**
 * Type Composers ----------------------------------------------------------------------------------
 */

/**
 * Array of values.
 * @example:
 *  type.ListOf(type.Number)
 *  >>> number[]
 */
type.ListOf = PropTypes.arrayOf

/**
 * Object containing given keys.
 * @example:
 *  type.Of({
 *    key: type.Number
 *  })
 *  >>> {key: number}
 */
type.Of = PropTypes.shape

/**
 * One of given types.
 * @example:
 *  type.OneOf([type.String, type.Number])
 *  >>> string | number
 */
type.OneOf = PropTypes.oneOfType

// This can be used to make type composers automatically attach input controls definition
if (typeof Active.typePredefine === 'function') Active.typePredefine(type)

/**
 * Base Types --------------------------------------------------------------------------------------
 */

// Any value type
type.Any = PropTypes.any
// True or False
type.Boolean = PropTypes.bool
// Data size equivalent to 8 Bits
type.Byte = PropTypes.number
// CSS class names, separated by space
type.ClassName = PropTypes.string

/**
 * Extended Types ------------------------------------------------------------------------------------
 */

// Unitless Pixel number or CSS value as string
type.CSSLength = PropTypes.oneOfType([PropTypes.string, PropTypes.number])
// Object or Array
type.Collection = PropTypes.oneOfType([PropTypes.object, PropTypes.array])
// Rotation Degree
type.Degree = PropTypes.number
// Precision decimal points count
type.Decimal = PropTypes.number
// HTMLElement or native app Node Element
type.Element = PropTypes.shape({
  getBoundingClientRect: PropTypes.func.isRequired,
})
// Enumerable. Example: type.Enum(['a', 'b'])
type.Enum = PropTypes.oneOf
// File object https://developer.mozilla.org/en-US/docs/Web/API/File
type.File = PropTypes.shape({
  // File name with extension
  name: PropTypes.string.isRequired,
  // File size in bytes
  size: PropTypes.number.isRequired,
  // MIME type
  type: PropTypes.string.isRequired,
})
// Number with decimal points
type.Float = PropTypes.number
// A floating point number between 0 - 1
type.Fraction = PropTypes.number
// Javascript getter function
type.GetterString = PropTypes.string
// Unique Identifier
type.Id = PropTypes.string
// Integer (a whole number without decimal points)
type.Int = PropTypes.number
// Array
type.List = PropTypes.array
// File MIME type
type.MIME = PropTypes.string
// A floating number that is to be multiplied with
type.Multiplier = PropTypes.number
// Method
type.Function = PropTypes.func
// Time duration which is 1/1000th of a second
type.Milliseconds = PropTypes.number
// Millimeter length
type.Mm = PropTypes.number
// Anything that can be rendered, such as number, string, DOM element, array, or fragment
type.Node = PropTypes.node
// Anything that can be rendered, such as number, string, function, DOM element, array, or fragment
type.NodeOrFunction = PropTypes.oneOfType([PropTypes.node, PropTypes.func])
// Integer or Float
type.Number = PropTypes.number
type.NumberOrString = PropTypes.oneOfType([PropTypes.string, PropTypes.number])
type.Object = PropTypes.object
// `key` -> `value` Map of objects
type.ObjectOf = type.MapOf = PropTypes.objectOf
// Javascript Promise object
type.Promise = PropTypes.shape({
  then: PropTypes.func.isRequired,
  catch: PropTypes.func.isRequired,
})
// Pixel screen unit
type.Px = PropTypes.number
// A fraction number between 0 and 1
type.Percent = PropTypes.number
type.PrimitiveOrObject = PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])
// Function or the Object created by React.useRef() or React.createRef()
type.Ref = type.OneOf([type.Function, type.Of({current: type.Any})])
// String primitive value
type.String = PropTypes.string
type.StringOrNumber = PropTypes.oneOfType([PropTypes.string, PropTypes.number])
// CSS style object with camelCase attribute keys
type.Style = PropTypes.object
// UNIX Timestamp in milliseconds
type.Timestamp = PropTypes.number
// Uniform Resource Locator
type.Url = PropTypes.string
type.UrlOrBase64 = type.String
type.UrlOrBase64OrPreview = type.OneOf([type.Url, type.Object]) // `preview` is new String() object
type.UrlOrNode = type.OneOf([type.Url, type.Node])
type.UrlOrObject = type.OneOf([type.Url, type.Object])

/**
 * Component Types ---------------------------------------------------------------------------------
 */

// Input Control config object
type.Control = type.Of({
  // One of supported `<Input/>` types (eg. 'text', 'email', 'slider', etc.), default is 'text'
  type: type.String,
  // Human-readable label for the input type
  text: type.NodeOrFunction,
  // Brief explanation of the input type (supports Markdown)
  desc: type.NodeOrFunction,
  // CSS color value (eg. 'rgba(0,0,0,1)', 'linear-gradient(to bottom, white, black)', etc.)
  color: type.String,
  // Function(value) => boolean - function to check if value belongs to this control type
  ofType: type.Function,
  // ...other props to pass to `<Input/>` component
})

// Localised definition (example: LANGUAGE.ENGLISH object)
type.Definition = type.Of({
  _: type.Any.isRequired, // identifier code that is language agnostic
  name: type.GetterString.isRequired, // definition's `name` string for currently active Language
  en: type.String, // `name` string in English
  // 'ru': other definition's `name` strings by their language code
})

// Set of localised definitions (example: LANGUAGE object)
type.DefinitionMap = type.ObjectOf(type.Definition.isRequired)

// File Input object
type.FileInput = type.Of({
  // File source URL or base64 encoded string
  src: type.UrlOrBase64,
  // Type of file (ex: public/private...)
  kind: type.Any,
  // Identifier or index position of the file in the grid (ex. thumb/small/large/0/1...)
  i: type.Any,
  // Optional ID
  id: type.String,
  // File name with extension
  name: type.String,
  // Selected File object to send to backend for upload (example: Upload input file object)
  file: type.File,
  // Flag to delete the file from backend
  remove: type.Boolean,
  // Optional dimension in Pixels
  width: type.Px,
  // Optional dimension in Pixels
  height: type.Px,
  // Optional size in Bytes
  size: type.Byte,
  // Available file sizes (i.e. ImageInput)
  sizes: type.ListOf(type.Of({
    // resKey (ex. 'thumb', 'medium', '')
    key: type.String,
    // Size in bytes
    val: type.Byte,
  })),
})

// FIELD.FOR.TAG for example
type.FieldForList = type.ListOf(type.Of({
  id: type.String.isRequired,
}))
// One of @withForm() value getters
type.FormValueType = type.Enum(['changedValues', 'registeredValues', 'formValues'])

// Select option
type.Option = type.OneOf([
  type.String,
  type.Number,
  type.Of({
    // Internal option value
    value: type.Any.isRequired,
    // Searchable text (used as displayed label if `children` not defined)
    text: type.String.isRequired,
    // Option's displayed UI
    children: type.Any,
  }),
])
// Select options
type.Options = type.ListOf(type.Option.isRequired)

// Component.propTypes object
type.PropTypes = type.ObjectOf(type.Function)

// Tag entry
type.Tag = type.Of({
  id: type.Id.isRequired,
  name: type.String.isRequired, // may be retrieved dynamically with translation
})
// List of Tag ID strings
type.TagIds = type.ListOf(type.Id.isRequired)
type.TagById = type.ObjectOf(type.Tag.isRequired)
type.TagOptions = type.Options

// Tooltip props
type.Tooltip = type.OneOf([
  type.String,
  type.Number,
  type.Node,
  type.Function,
  type.Of({
    children: type.Any.isRequired,
    position: type.String,
    on: type.String,
    open: type.Boolean,
    delay: type.Milliseconds,
    animation: type.String,
    theme: type.String,
  }),
])
