import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 9834,
  },
  plugins: [reactRefresh({
    // enable hot reload
    include: "**/*.tsx"
  })]
})
