import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import Rete from './components/Rete.vue'

const routes = [
  { path: '/schemas/:schemaId', component: Rete, name: 'schema' },
  { path: '/schemas/:schemaId/partitioned', component: Rete, name: 'partitioned-schema' },
  { path: '/schemas/:schemaId/filtered', component: Rete, name: 'filtered-schema' },
  { path: '/:pathMatch(.*)*', component: Rete, name: 'not-found'}
]

const router = createRouter({
  // history: createMemoryHistory(),
  history: createWebHistory(),
  routes,
})

export {router}
