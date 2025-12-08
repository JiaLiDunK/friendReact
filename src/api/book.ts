import request from '@/utils/request'

export const getBookList = (data) => {
  return request({
    url: '/books/getBookList',
    method: 'post',
    data: data
  })
}
export const getChunkList = (data) => {
  return request({
    url: '/books/getChunkList',
    method: 'post',
    data: data
  })
}
export const updateBook = (data) => {
  return request({
    url: '/books/updateBook',
    method: 'post',
    data: data
  })
}

export const updateChunkList = (data) => {
  return request({
    url: '/books/updateChunkList',
    method: 'post',
    data: data
  })
}
export const putBookVectors = (data) => {
  return request({
    url: '/books/putBookVectors',
    method: 'post',
    data: data
  })
}

export const getBookVectorsList = (data) => {
  return request({
    url: '/books/getList',
    method: 'post',
    data: data
  })
}
export const delBooksVectors = (data) => {
  return request({
    url: '/books/delBooksVectors',
    method: 'post',
    data: data
  })
}

export const updateBooksVectors = (data) => {
  return request({
    url: '/books/updateBooksVectors',
    method: 'post',
    data: data
  })
}

export const getKnowledgeBooks = (data) => {
  return request({
    url: '/books/getKnowledgeBooks',
    method: 'post',
    data: data
  })
}
export const del_knowledge_books = (data) => {
  return request({
    url: '/books/delKnowledgeBooks',
    method: 'post',
    data: data
  })
}
export const vectorAllBooks = (data) => {
  return request({
    url: '/books/vectorAllBooks',
    method: 'post',
    data: data
  })
}