import request from '@/utils/request'


export const addData = (data) => {
  return request({
    url: '/question/insert',
    method: 'post',
    data: data
  })
}