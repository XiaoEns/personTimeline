import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // react-git-log 库内部路径别名
      modules: path.resolve(__dirname, 'src/vendor/react-git-log/modules'),
      components: path.resolve(__dirname, 'src/vendor/react-git-log/components'),
      context: path.resolve(__dirname, 'src/vendor/react-git-log/context'),
      hooks: path.resolve(__dirname, 'src/vendor/react-git-log/hooks'),
      constants: path.resolve(__dirname, 'src/vendor/react-git-log/constants'),
      data: path.resolve(__dirname, 'src/vendor/react-git-log/data'),
      types: path.resolve(__dirname, 'src/vendor/react-git-log/types'),
      assets: path.resolve(__dirname, 'src/vendor/react-git-log/assets'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
