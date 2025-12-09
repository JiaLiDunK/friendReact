import request from '@/utils/request'


export const sendMessage = (data) => {
  return request({
    url: '/search/send',
    method: 'post',
    data: data 
  })
}
