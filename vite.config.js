import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a relative base so the site can be deployed to GitHub Pages without needing
// you to edit the config for your repo name. If you prefer an absolute base,
// replace './' with '/your-repo-name/'.
export default defineConfig({
  plugins: [react()],
  base: './',
})
