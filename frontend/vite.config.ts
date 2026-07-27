import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isMobileBuild = env.VITE_MOBILE === 'true'
  const backendTarget = env.VITE_API_URL || 'http://localhost:8888'

  return {
    plugins: [react()],
    server: isMobileBuild ? {} : {
      // Dev proxy only — mobile builds use absolute VITE_API_URL
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Larger chunk warning threshold for mobile (more assets inlined)
      chunkSizeWarningLimit: 1500,
    },
  }
})
