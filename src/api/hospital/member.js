import request from '@/utils/request'

// 查询会员列表
export function listMember(query) {
  return request({
    url: '/hospital/member/list',
    method: 'get',
    params: query
  })
}

// 获取会员详细信息
export function getMember(userId) {
  return request({
    url: '/hospital/member/info',
    method: 'get'
  })
}
