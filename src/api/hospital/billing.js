import request from '@/utils/request'

// 查询结算记录列表
export function listBilling(query) {
  return request({
    url: '/hospital/billing/list',
    method: 'get',
    params: query
  })
}

// 查询结算记录详细
export function getBilling(id) {
  return request({
    url: '/hospital/billing/' + id,
    method: 'get'
  })
}

// 新增结算记录
export function addBilling(data) {
  return request({
    url: '/hospital/billing',
    method: 'post',
    data: data
  })
}

// 修改结算记录
export function updateBilling(data) {
  return request({
    url: '/hospital/billing',
    method: 'put',
    data: data
  })
}

// 删除结算记录
export function delBilling(id) {
  return request({
    url: '/hospital/billing/' + id,
    method: 'delete'
  })
}

// 执行核销结算
export function settleBilling(id, paymentMethod) {
  return request({
    url: '/hospital/billing/settle',
    method: 'post',
    data: { id, paymentMethod }
  })
}
