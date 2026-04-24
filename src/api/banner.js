import request from '@/utils/request'

// List banners
export function listBanner(query) {
  return request({
    url: '/hospital/banner/list',
    method: 'get',
    params: query
  })
}

// Get banner detail
export function getBanner(bannerId) {
  return request({
    url: '/hospital/banner/' + bannerId,
    method: 'get'
  })
}

// Add banner
export function addBanner(data) {
  return request({
    url: '/hospital/banner',
    method: 'post',
    data: data
  })
}

// Update banner
export function updateBanner(data) {
  return request({
    url: '/hospital/banner',
    method: 'put',
    data: data
  })
}

// Delete banner
export function delBanner(bannerIds) {
  return request({
    url: '/hospital/banner/' + bannerIds,
    method: 'delete'
  })
}
