import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Read the sibling API's local settings only in the Node server process.
// Never expose the shared API key through VITE_* variables or browser code.
function backendSettings() {
  try {
    return Object.fromEntries(
      readFileSync(fileURLToPath(new URL('../Maso/.env', import.meta.url)), 'utf8')
        .split(/\r?\n/)
        .filter(line => line.trim() && !line.trimStart().startsWith('#') && line.includes('='))
        .map(line => {
          const index = line.indexOf('=')
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
        }),
    )
  } catch {
    return {}
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...backendSettings(), ...loadEnv(mode, process.cwd(), 'MASO_'), ...process.env }
  const proxy = {
    '/api': {
      target: env.MASO_API_TARGET || 'http://127.0.0.1:8000',
      changeOrigin: true,
      configure(proxyServer) {
        proxyServer.on('proxyReq', proxyReq => {
          proxyReq.removeHeader('x-api-key')
          if (env.MASO_API_KEY) proxyReq.setHeader('x-api-key', env.MASO_API_KEY)
        })
      },
    },
  }
  return {
    plugins: [react()],
    server: { host: '127.0.0.1', proxy },
    preview: { host: '127.0.0.1', proxy },
  }
})
