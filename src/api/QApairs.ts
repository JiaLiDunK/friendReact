import request from '@/utils/request'
export const getList = (data) => {
  return request({
    url: '/qapairs/getList',
    method: 'post',
    data: data
  })
}
export const delData = (data) => {
  return request({
    url: '/qapairs/delData',
    method: 'post',
    data: data
  })
}
export const update = (data) => {
  return request({
    url: '/qapairs/update',
    method: 'post',
    data: data
  })
}
export const insertData = (data) => {
  return request({
    url: '/qapairs/insertData',
    method: 'post',
    data: data
  })
}
export const downLoadJson = (data) => {
  return request({
    url: '/qapairs/downLoadJson',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}
export const downLoadJsonByScore = (data) => {
  return request({
    url: '/qapairs/downLoadJsonByScore',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}
export const downLoadJsonByContext = (data) => {
  return request({
    url: '/qapairs/downLoadJsonByContext',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}
export const vectorAllQA = (data) => {
  return request({
    url: '/qapairs/vectorAllQA',
    method: 'post',
    data: data,
  })
}
