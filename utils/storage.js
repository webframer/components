import { get, GET, isCollection, performStorage, SET, set, UI_STATE, update } from '@webframer/js'

// UI STORAGE HELPERS ==============================================================================

/**
 * Get Persistent UI State object (at optional `keyPath`) from Local Storage
 *
 * @param {string} [keyPath] - to retrieve value inside UI_STATE object
 * @param {any} [fallback] - value to use when value at `keyPath` is undefined
 * @returns {object|any} UI_STATE object if no `keyPath` provided, else value for `keyPath`
 */
export function getUIState (keyPath, fallback) {
  let result = performStorage(GET, UI_STATE) || {}
  if (keyPath) return get(result, keyPath, fallback)
  return result
}

/**
 * Set Persistent UI State value at `keyPath` in Local Storage
 *
 * @param {string} keyPath - to set `value`
 * @param {any} value - to set at `keyPath`
 * @returns {Promise|any} result of performStorage(SET, ...)
 */
export function setUIState (keyPath, value) {
  const uiState = getUIState()
  set(uiState, keyPath, value)
  return performStorage(SET, UI_STATE, uiState)
}

/**
 * Update Persistent UI State value at `keyPath` with partial `payload` in Local Storage.
 * This sets the `payload` as is for the first time, or when existing state is not a collection.
 *
 * @param {string} keyPath - to set `payload`
 * @param {object|array} payload - collection with partial changes to set at `keyPath`
 * @returns {Promise|any} result of performStorage(SET, ...)
 */
export function saveUIState (keyPath, payload) {
  const uiState = getUIState()
  const ui = get(uiState, keyPath)
  if (isCollection(ui)) update(ui, payload)
  else set(uiState, keyPath, payload)
  return performStorage(SET, UI_STATE, uiState)
}
