import { toCamelCaseKeys } from '../css.js'

test(`${toCamelCaseKeys.name}() converts CSS object keys to React.js style camelCase keys`, () => {
  expect(toCamelCaseKeys({color: 'red'})).toEqual({color: 'red'})
  expect(toCamelCaseKeys({'border-color': 'black'})).toEqual({borderColor: 'black'})
  expect(toCamelCaseKeys({'--css-variable': '0px'})).toEqual({'--css-variable': '0px'})
  expect(toCamelCaseKeys({'-webkit-transform': 'rotate(90deg)'})).toEqual({WebkitTransform: 'rotate(90deg)'})
  expect(toCamelCaseKeys({'-moz-transform': 'rotate(90deg)'})).toEqual({MozTransform: 'rotate(90deg)'})
  expect(toCamelCaseKeys({'-ms-transform': 'rotate(90deg)'})).toEqual({MsTransform: 'rotate(90deg)'})
  expect(toCamelCaseKeys({'-o-transform': 'rotate(90deg)'})).toEqual({OTransform: 'rotate(90deg)'})
})
