import request from '@/utils/request'

export const readBooks = (data) => {
  return request({
    url: '/readAndOut/readBooks',
    method: 'post',
    data: data
  })
}