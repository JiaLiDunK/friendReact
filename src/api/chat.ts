import request from '@/utils/request'

export const girlfriendChat = (data) => {
  return request({
    url: '/chat/girlfriend',
    method: 'post',
    params: data
  })
}