import { createApp } from 'vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhLocale from 'element-plus/lib/locale/lang/zh-cn'
import '@a/css/font.css'
import '@a/css/reset.css'

import http from './util/request'
import https from './util/http'
import App from './App.vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}
app.config.globalProperties.$http = http
app.config.globalProperties.$https = https
app.use(ElementPlus, {
	locale: zhLocale
})
app.use(router).mount('#app')
