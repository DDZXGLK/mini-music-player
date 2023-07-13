// 可以获取智能提示
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@a': path.resolve(__dirname, './src/assets'),
			'@c': path.resolve(__dirname, './src/components'),
			'@v': path.resolve(__dirname, './src/views'),
			'@u': path.resolve(__dirname, './src/util')
		}
	},
	server: {
		host: '0.0.0.0',
		port: 8080,
		// open: true,
		proxy: {
			'/api': {
				target: 'http://www.codeman.ink:3000',
				changeOrigin: true,
				ws: true,
				rewrite: path => path.replace(/^\/api/, '')
			}
		}
	}
})
