import PropTypes from 'prop-types'

/**
 * PROPTYPES PROXY =================================================================================
 * For clear semantic meaning without documentation and cross platform unified API.
 * =================================================================================================
 */

export const type = {}

/* Common types */
type.Any = PropTypes.any
// True or False
type.Boolean = PropTypes.bool
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
// File object
type.File = PropTypes.object
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
// Array of values
type.ListOf = PropTypes.arrayOf
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
// Object containing given keys. Example: type.Of({key: type.Any})
type.Of = PropTypes.shape
// One of given types
type.OneOf = (...types) => PropTypes.oneOfType(types)
// Javascript Promise object
type.Promise = PropTypes.shape({
  then: PropTypes.func.isRequired,
  catch: PropTypes.func.isRequired,
})
// Pixel screen unit
type.Px = PropTypes.number
type.PrimitiveOrObject = PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])
// Function or the Object created by React.useRef() or React.createRef()
type.Ref = type.OneOf(type.Function, type.Of({current: type.Any}))
// String primitive value
type.String = PropTypes.string
type.StringOrNumber = PropTypes.oneOfType([PropTypes.string, PropTypes.number])
// UNIX Timestamp in milliseconds
type.Timestamp = PropTypes.number
// Uniform Resource Locator
type.Url = PropTypes.string
type.UrlOrBase64 = type.String
type.UrlOrBase64OrPreview = type.OneOf(type.String, type.Object) // `preview` is new String() object
type.UrlOrNode = type.OneOf(type.String, type.Object, type.Function)
type.UrlOrObject = type.OneOf(type.String, type.Object)

/**
 * Component Types ---------------------------------------------------------------------------------
 */

// localised definition (example: LANGUAGE.ENGLISH object)
type.Definition = type.Of({
  _: type.Any.isRequired, // identifier code that is language agnostic
  name: type.GetterString.isRequired, // definition's `name` string for currently active Language
  en: type.String, // `name` string in English
  // 'ru': other definition's `name` strings by their language code
})

// set of localised definitions (example: LANGUAGE object)
type.DefinitionMap = type.ObjectOf(type.Definition.isRequired)

// File Input object
type.FileInput = type.Of({
  src: type.UrlOrBase64, // file source URL or base64 encoded string
  kind: type.Any, // type of file (ex: public/private...)
  i: type.Any, // identifier or index position of the file in the grid (ex. thumb/small/large...)
  id: type.String, // optional ID
  name: type.String, // file name with extension
  file: type.File, // -> sent by onChange callbacks for upload to backend (example: Dropzone file object)
  remove: type.Boolean, // -> sent by onChange callbacks for deletion to backend
  sizes: type.ListOf(type.Of({ // for ImageInput
    key: type.String, // resKey (ex. 'thumb', 'medium', '')
    val: type.Number, // size in bytes
  })),
})

// FIELD.FOR.TAG for example
type.FieldForList = type.ListOf(type.Of({
  id: type.String.isRequired,
}))
// One of @withForm() value getters
type.FormValueType = type.Enum(['changedValues', 'registeredValues', 'formValues'])

// Combobox option
type.Option = type.OneOf(
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
)
// Combobox options
type.Options = type.ListOf(type.Option.isRequired)

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
type.Tooltip = type.OneOf(
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
)
