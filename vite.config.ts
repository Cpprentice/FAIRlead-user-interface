import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // To use the env here we need to manually inject it:
  //  https://v7.vite.dev/config/#using-environment-variables-in-config
  // base: import.meta.env.VITE_BASE_PATH || "/"
  base: './'
})
