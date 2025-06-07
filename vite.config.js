import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // ADD THIS LINE: Use your repository name
  base: '/sanctum-os-vite/', 
  plugins: [react()],
})
