import { GET, isCollection, isEqualJSON, performStorage, SET, UI_STATE } from '@webframer/js'
import { cloneDeep, get, set, update } from '@webframer/js/object.js'

// UI STORAGE HELPERS ==============================================================================

// Cache of UI State object in Local Storage
let uiStateCache

/**
 * Get Persistent UI State object (at optional `keyPath`) from Local Storage
 *
 * @param {string} [keyPath] - to retrieve value inside UI_STATE object
 * @param {any} [fallback] - value to use when value at `keyPath` is undefined
 * @returns {object|any} UI_STATE object if no `keyPath` provided, else value for `keyPath`
 */
export function getUIState (keyPath, fallback) {
  if (!uiStateCache) uiStateCache = performStorage(GET, UI_STATE) || {}
  if (keyPath) return get(uiStateCache, keyPath, fallback)
  return uiStateCache
}

/**
 * Set Persistent UI State value at `keyPath` in Local Storage
 *
 * @param {string} keyPath - to set `value`
 * @param {any} value - to set at `keyPath`
 * @returns {Promise<boolean>|any|void} result of performStorage(SET, ...), or true if updated, else void
 */
export function setUIState (keyPath, value) {
  // Since LocalStorage uses json, check as JSON to allow updating object key orders
  if (isEqualJSON(getUIState(keyPath), value)) return
  const uiState = getUIState()
  set(uiState, keyPath, value)
  uiStateCache = null
  return performStorage(SET, UI_STATE, uiState) || true
}

/**
 * Update Persistent UI State value at `keyPath` with partial `payload` in Local Storage.
 * This sets the `payload` as is for the first time, or when existing state is not a collection.
 *
 * @param {string} keyPath - to set `payload`
 * @param {object|array} payload - collection with partial changes to set at `keyPath`
 * @returns {Promise<boolean>|any|void} result of performStorage(SET, ...), or true if updated, else void
 */
export function saveUIState (keyPath, payload) {
  const ui = getUIState(keyPath)
  // Pre-check if it should skip update to avoid expensive Local Storage call
  if (isCollection(ui) && isEqualJSON(ui, payload = update(cloneDeep(ui), payload))) return
  const uiState = getUIState()
  set(uiState, keyPath, payload)
  uiStateCache = null
  return performStorage(SET, UI_STATE, uiState) || true
}
