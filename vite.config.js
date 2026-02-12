import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// When running in GitHub Actions the env var GITHUB_REPOSITORY is available
// in the form "owner/repo". We extract the repo name and use it as base.
// Locally (dev) we fallback to a relative base './' so the app still loads.
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : './'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/index.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
