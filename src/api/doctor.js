import request from '@/utils/request'

// List doctors
export function listDoctor(query) {
  return request({
    url: '/hospital/doctor/list',
    method: 'get',
    params: query
  })
}

// Get doctor detail
export function getDoctor(doctorId) {
  return request({
    url: '/hospital/doctor/' + doctorId,
    method: 'get'
  })
}

// Add doctor
export function addDoctor(data) {
  return request({
    url: '/hospital/doctor',
    method: 'post',
    data: data
  })
}

// Update doctor
export function updateDoctor(data) {
  return request({
    url: '/hospital/doctor',
    method: 'put',
    data: data
  })
}

// Delete doctor
export function delDoctor(doctorIds) {
  return request({
    url: '/hospital/doctor/' + doctorIds,
    method: 'delete'
  })
}
