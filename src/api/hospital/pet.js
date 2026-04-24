import request from '@/utils/request'

export function listPet(query) {
  return request({
    url: '/hospital/pet/list',
    method: 'get',
    params: query
  })
}

export function getPet(petId) {
  return request({
    url: '/hospital/pet/' + petId,
    method: 'get'
  })
}

export function addPet(data) {
  return request({
    url: '/hospital/pet',
    method: 'post',
    data: data
  })
}

export function updatePet(data) {
  return request({
    url: '/hospital/pet',
    method: 'put',
    data: data
  })
}

export function delPet(petId) {
  return request({
    url: '/hospital/pet/' + petId,
    method: 'delete'
  })
}
