// 请求封装
import axios from 'axios'
import { ElNotification } from 'element-plus'
// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // api base_url
  timeout: 3000 // 请求超时时间
})

service.interceptors.request.use(
  config => {
    // 请求拦截逻辑
    return config
  },
  error => {
    ElNotification.error({
      title: '请求错误',
      message: error
    })
  }
)

service.interceptors.response.use(
  res=>{
    if(res.status==200){
      return res.data
    }else{
      ElNotification.error({
        title: '请求错误',
        message: error
      })
    }
  }
)

const http = {
  /** get 请求
   * @param  {string} url
   * @param  {请求参数} params
   * @param  {参数} config
   */
  get: function (url, params = {}, config = {}) {
    return service({
      method: 'get',
      url,
      params,
      ...config
    })
  },

  /** post 请求
   * @param  {接口地址} url
   * @param  {请求参数} data
   * @param  {参数} config
   */
  post: function (url, data = {}, config = {}) {
    return service({
      method: 'post',
      url,
      data,
      ...config
    })
  },

  /** put 请求
   * @param  {接口地址} url
   * @param  {请求参数} data
   * @param  {参数} config
   */
  put: function (url, data = {}, config = {}) {
    return service({
      method: 'put',
      url,
      data,
      ...config
    })
  },

  /** patch 请求
   * @param  {接口地址} url
   * @param  {请求参数} data
   * @param  {参数} config
   */
  patch: function (url, data = {}, config = {}) {
    return service({
      method: 'patch',
      url,
      data,
      ...config
    })
  },

  /** delete 请求
   * @param  {接口地址} url
   * @param  {请求参数} data
   * @param  {参数} config
   */
  delete: function (url, data = {}, config = {}) {
    return service({
      method: 'delete',
      url,
      data,
      ...config
    })
  }
}

export default http
