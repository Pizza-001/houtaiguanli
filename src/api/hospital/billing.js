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

// 查询优惠券列表
export function listCoupon(query) {
  return request({
    url: '/hospital/billing/couponList',
    method: 'get',
    params: query
  })
}

// 新增优惠券模板
export function addCoupon(data) {
  return request({
    url: '/hospital/billing/coupon',
    method: 'post',
    data: data
  })
}

// 修改优惠券模板
export function updateCoupon(data) {
  return request({
    url: '/hospital/billing/coupon',
    method: 'put',
    data: data
  })
}

// 删除优惠券模板
export function delCoupon(couponId) {
  return request({
    url: '/hospital/billing/coupon/' + couponId,
    method: 'delete'
  })
}

// 发放优惠券
export function grantCoupon(userId, couponId) {
  return request({
    url: '/hospital/billing/grantCoupon',
    method: 'post',
    data: { userId, couponId }
  })
}

