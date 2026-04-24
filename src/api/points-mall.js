import request from '@/utils/request'

// 查询积分商城商品列表
export function listPointsProduct(query) {
  return request({
    url: '/hospital/points-mall/list',
    method: 'get',
    params: query
  })
}

// 兑换积分商城商品 (管理后台可能用于手动兑换或核销)
export function exchangePointsProduct(productId) {
  return request({
    url: '/hospital/points-mall/exchange/' + productId,
    method: 'post'
  })
}

// 查询积分兑换记录列表
export function listExchangeRecord(query) {
  return request({
    url: '/hospital/points-mall/exchange/list',
    method: 'get',
    params: query
  })
}
