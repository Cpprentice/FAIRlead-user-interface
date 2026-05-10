import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import Rete from './components/Rete.vue'
import ReteMapping from './components/ReteMapping.vue'
import ReteAnnotation from './components/ReteAnnotation.vue'
import ReteLinkML from './components/ReteLinkML.vue'

const routes = [
  { path: '/schemas/:schemaId', component: Rete, name: 'schema' },
  { path: '/schemas/:schemaId/partitioned', component: Rete, name: 'partitioned-schema' },
  { path: '/schemas/:schemaId/filtered', component: Rete, name: 'filtered-schema' },
  { path: '/schemas/:schemaId/linkml', component: ReteLinkML, name: 'linkml-schema' },
  { path: '/schemas/:schemaId/linkml/filtered', component: ReteLinkML, name: 'filtered-linkml-schema' },
  { path: '/schemas/:schemaId/annotation', component: ReteAnnotation, name: 'schema-annotation' },
  { path: '/mappings/:mappingId', component: ReteMapping, name: 'mapping' },
  { path: '/:pathMatch(.*)*', component: Rete, name: 'not-found'}
]

const router = createRouter({
  // history: createMemoryHistory(),
  history: createWebHistory(),
  routes,
})

export {router}
