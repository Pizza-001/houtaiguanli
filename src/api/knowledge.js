import request from '@/utils/request'

// List knowledge articles
export function listKnowledge(query) {
  return request({
    url: '/hospital/knowledge/list',
    method: 'get',
    params: query
  })
}

// Get knowledge detail
export function getKnowledge(knowledgeId) {
  return request({
    url: '/hospital/knowledge/' + knowledgeId,
    method: 'get'
  })
}

// Add knowledge
export function addKnowledge(data) {
  return request({
    url: '/hospital/knowledge',
    method: 'post',
    data: data
  })
}

// Update knowledge
export function updateKnowledge(data) {
  return request({
    url: '/hospital/knowledge',
    method: 'put',
    data: data
  })
}

// Delete knowledge
export function delKnowledge(knowledgeIds) {
  return request({
    url: '/hospital/knowledge/' + knowledgeIds,
    method: 'delete'
  })
}
