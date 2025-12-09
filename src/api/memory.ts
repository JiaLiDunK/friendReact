import request from '@/utils/request'

// 获取记忆列表
export const getMemoryList = (data) => {
  return request({
    url: '/memory/getMemoryList',
    method: 'post',
    data: data
  })
}
// 根据id列表删除
export const delByIds = (data) =>{
  return request({
    url:'/memory/del',
    method:'post',
    data:data
  })
}
// 根据id列表恢复
export const recover = (data) =>{
  return request({
    url:'/memory/recover',
    method:'post',
    data:data
  })
}

