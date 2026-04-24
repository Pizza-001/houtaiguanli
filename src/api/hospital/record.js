import request from '@/utils/request'

// 查询宠物医疗记录列表
export function listRecord(query) {
  return request({
    url: '/hospital/record/list',
    method: 'get',
    params: query
  })
}

// 查询宠物医疗记录详细
export function getRecord(recordId) {
  return request({
    url: '/hospital/record/' + recordId,
    method: 'get'
  })
}

// 新增宠物医疗记录
export function addRecord(data) {
  return request({
    url: '/hospital/record',
    method: 'post',
    data: data
  })
}

// 修改宠物医疗记录
export function updateRecord(data) {
  return request({
    url: '/hospital/record',
    method: 'put',
    data: data
  })
}

// 删除宠物医疗记录
export function delRecord(recordId) {
  return request({
    url: '/hospital/record/' + recordId,
    method: 'delete'
  })
}
