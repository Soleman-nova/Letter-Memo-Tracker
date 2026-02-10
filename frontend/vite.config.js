import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
          'vendor-ethiopian': ['mui-ethiopian-datepicker', 'date-fns'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
