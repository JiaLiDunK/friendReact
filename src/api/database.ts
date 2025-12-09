import request from '@/utils/request'


export const addData = (data) => {
  return request({
    url: '/knowledgeBase/insert',
    method: 'post',
    data: data
  })
}
export const getList = (data) => {
  return request({
    url: '/knowledgeBase/getList',
    method: 'post',
    data: data
  })
}
export const updateData = (data) => {
  return request({
    url: '/knowledgeBase/update',
    method: 'post',
    data: data
  })
}
export const getTypeOptions = () => {
  return request({
    url: '/knowledgeBase/getTypeOptions',
    method: 'post'
  })
}
