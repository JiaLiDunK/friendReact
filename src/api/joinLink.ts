import request from '@/utils/request'

export const addList = (data) => {
  return request({
    url: '/joinLink/addList',
    method: 'post',
    data: data
  })
}
export const getList = (data) => {
  return request({
    url: '/joinLink/getList',
    method: 'post',
    data: data
  })
}
export const delData = (data) => {
  return request({
    url: '/joinLink/delData',
    method: 'post',
    data: data
  })
}
export const addData = (data) => {
  return request({
    url: '/joinLink/addData',
    method: 'post',
    data: data
  })
}
export const createLoraData = (data) => {
  return request({
    url: '/joinLink/createLoraData',
    method: 'post',
    data: data
  })
}