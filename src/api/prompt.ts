import request from '@/utils/request'


export const addData = (data) => {
  return request({
    url: '/prompt/insertPrompt',
    method: 'post',
    data: data
  })
}
export const getList = (data) => {
  return request({
    url: '/prompt/getPromptList',
    method: 'post',
    data: data
  })
}
export const updateData = (data) => {
  return request({
    url: '/prompt/updatePrompt',
    method: 'post',
    data: data
  })
}