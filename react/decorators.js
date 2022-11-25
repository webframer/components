import { type } from '../types.js'
import { getUIState, saveUIState, setUIState } from '../utils/storage.js'

/**
 * React Component Timer Decorator to clearTimeout() and clearInterval() automatically on componentWillUnmount()
 * @example:
 *    @withTimer
 *    class Homepage extends Component {
 *      animate = () => {
 *        this.setTimeout(this.props.animate, 500)
 *        this.setInterval(this.props.refresh, 500)
 *      }
 *    }
 *
 * @param {Object} Class - to be decorated
 */
export function withTimer (Class) {
  const componentWillUnmount = Class.prototype.componentWillUnmount

  Class.prototype.setTimeout = function () {
    if (!this.timers) this.timers = []
    // noinspection JSCheckFunctionSignatures
    this.timers.push(setTimeout(...arguments))
  }

  Class.prototype.setInterval = function () {
    if (!this.intervals) this.intervals = []
    // noinspection JSCheckFunctionSignatures
    this.intervals.push(setInterval(...arguments))
  }

  Class.prototype.clearTimer = function () {
    if (this.timers) this.timers.forEach(clearTimeout)
    if (this.intervals) this.intervals.forEach(clearInterval)
  }

  Class.prototype.componentWillUnmount = function () {
    this.clearTimer()
    if (componentWillUnmount) componentWillUnmount.apply(this, arguments)
  }

  return Class
}

/**
 * React Class Decorator to Get/Set/Save UI State in Local Storage using common UI_STATE object.
 * @example:
 *   *withUIStorage
 *    class MyComponent extends PureComponent {...}
 *    // then inside class:
 *    - this.getUI(keyPath, fallback) -> retrieves UI state for `keyPath` within `uiStorageKey`
 *    - this.setUI(keyPath, value) -> persists UI state for `keyPath` within `uiStorageKey`
 *    - this.saveUI(payload) -> update UI state for `uiStorageKey` with partial `payload`
 *    - this.uiState: object -> gets the entire UI_STATE object
 *    - this.ui: object | any -> gets the value of `uiStorageKey` inside UI_STATE object
 */
export function withUIStorage (Class) {
  // Definition
  Class.propTypes = {
    // UI State Storage Key
    uiStorageKey: type.String.isRequired,
    ...Class.propTypes,
  }

  // The entire UI_STATE object
  Object.defineProperty(Class.prototype, 'uiState', {
    get () { // retrieve UI State everytime to sync updates from other React Components
      const {uiStorageKey} = this.props
      if (typeof window !== 'undefined') {
        return getUIState() || {[uiStorageKey]: {}}
      } else {
        return {[uiStorageKey]: {}}
      }
    },
  })

  // Value of the UI_STATE[uiStorageKey]
  Object.defineProperty(Class.prototype, 'ui', {
    get () {return this.uiState[this.props.uiStorageKey]},
  })

  // Retrieve UI State for given `keyPath` (with `fallback` value) in Local Storage
  Class.prototype.getUI = function (keyPath, fallback) {
    return get(this.uiState, `${this.props.uiStorageKey}.${keyPath}`, fallback)
  }

  // Persist UI State for given `UI_STATE[uiStorageKey][keyPath]` with `value` in Local Storage
  Class.prototype.setUI = function (keyPath, value) {
    if (typeof window === 'undefined') throw new Error('setUI should only be called in frontend!')
    return setUIState(`${this.props.uiStorageKey}.${keyPath}`, value)
  }

  // Persist UI State for `UI_STATE[uiStorageKey]` with partial update `payload` in Local Storage
  Class.prototype.saveUI = function (payload) {
    if (typeof window === 'undefined') throw new Error('saveUI should only be called in frontend!')
    return saveUIState(this.props.uiStorageKey, payload)
  }

  return Class
}
