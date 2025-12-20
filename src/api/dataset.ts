import request from '@/utils/request'

export const getList = (data) => {
  return request({
    url: '/dataset/getList',
    method: 'post',
    data: data
  })
}
export const addData = (data) => {
  return request({
    url: '/dataset/add',
    method: 'post',
    data: data
  })
}
export const updateData = (data) => {
  return request({
    url: '/dataset/update',
    method: 'post',
    data: data
  })
}
export const delData = (data) => {
  return request({
    url: '/dataset/update',
    method: 'post',
    data: data
  })
}
export const getOptions = () => {
  return request({
    url: '/dataset/getOptions',
    method: 'post',
  })
}
