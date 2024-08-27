import { createEditor as createLegacyEditor } from './default'
import { createEditor as createDefaultEditor } from './fairlead'
import { createEditor as createPerfEditor } from './perf'
import { createEditor as createCustomEditor } from './customization'
import { createEditor as create3DEditor } from './3d'

const factory = {
  'default': createDefaultEditor,
  // 'default': createLegacyEditor,
  'legacy': createLegacyEditor,
  'perf': createPerfEditor,
  'customization': createCustomEditor,
  '3d': create3DEditor
}
// eslint-disable-next-line no-restricted-globals, no-undef
const query = typeof location !== 'undefined' && new URLSearchParams(location.search)
const name = ((query && query.get('template')) || 'default') as keyof typeof factory

const createEditor = factory[name]

if (!createEditor) {
  throw new Error(`template with name ${name} not found`)
}

export {
  createEditor
}
