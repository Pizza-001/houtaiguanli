import request from '@/utils/request'

// List vaccines
export function listVaccine(query) {
  return request({
    url: '/hospital/vaccine/list',
    method: 'get',
    params: query
  })
}

// Get vaccine detail
export function getVaccine(vaccineId) {
  return request({
    url: '/hospital/vaccine/' + vaccineId,
    method: 'get'
  })
}

// Add vaccine
export function addVaccine(data) {
  return request({
    url: '/hospital/vaccine',
    method: 'post',
    data: data
  })
}

// Update vaccine
export function updateVaccine(data) {
  return request({
    url: '/hospital/vaccine',
    method: 'put',
    data: data
  })
}

// Delete vaccine
export function delVaccine(vaccineIds) {
  return request({
    url: '/hospital/vaccine/' + vaccineIds,
    method: 'delete'
  })
}
