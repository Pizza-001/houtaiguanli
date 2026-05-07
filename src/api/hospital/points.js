import request from '@/utils/request'

// 获取全员兑换记录(收银后台用)
export function listAllExchange(query) {
    return request({
        url: '/hospital/points-mall/exchange/all',
        method: 'get',
        params: query
    })
}

// 修改兑换记录状态 (核销)
export function updateExchangeStatus(id, status) {
    return request({
        url: '/hospital/points-mall/exchange/status',
        method: 'put',
        data: { id, status }
    })
}
