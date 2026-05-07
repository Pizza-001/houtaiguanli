import request from '@/utils/request'

// 获取住院白板监控看板数据
export function getBoardData() {
  return request({
    url: '/hospital/inpatient-board/data',
    method: 'get'
  })
}

// 查询手术排班列表
export function listSurgery(query) {
  return request({
    url: '/hospital/surgery/list',
    method: 'get',
    params: query
  })
}

// 查询手术详细
export function getSurgery(surgeryId) {
  return request({
    url: '/hospital/surgery/' + surgeryId,
    method: 'get'
  })
}

// 新增手术排班
export function addSurgery(data) {
  return request({
    url: '/hospital/surgery',
    method: 'post',
    data: data
  })
}

// 修改手术排班
export function updateSurgery(data) {
  return request({
    url: '/hospital/surgery',
    method: 'put',
    data: data
  })
}

// 删除手术排班
export function delSurgery(surgeryId) {
  return request({
    url: '/hospital/surgery/' + surgeryId,
    method: 'delete'
  })
}
