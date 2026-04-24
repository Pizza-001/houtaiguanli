import request from '@/utils/request'

// 查询药品列表
export function listMedicine(query) {
  return request({
    url: '/hospital/medicine/list',
    method: 'get',
    params: query
  })
}

// 查询药品分类
export function getMedicineCategories() {
  return request({
    url: '/hospital/medicine/categories',
    method: 'get'
  })
}

// 查询药品详细
export function getMedicine(medicineId) {
  return request({
    url: '/hospital/medicine/' + medicineId,
    method: 'get'
  })
}

// 新增药品
export function addMedicine(data) {
  return request({
    url: '/hospital/medicine',
    method: 'post',
    data: data
  })
}

// 修改药品
export function updateMedicine(data) {
  return request({
    url: '/hospital/medicine',
    method: 'put',
    data: data
  })
}

// 删除药品
export function delMedicine(medicineId) {
  return request({
    url: '/hospital/medicine/' + medicineId,
    method: 'delete'
  })
}
