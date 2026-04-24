import request from '@/utils/request'

// Query reservation list
export function listReservation(query) {
  return request({
    url: '/hospital/reservation/list',
    method: 'get',
    params: query
  })
}

// Get reservation detail
export function getReservation(reservationId) {
  return request({
    url: '/hospital/reservation/' + reservationId,
    method: 'get'
  })
}

// Add reservation (typically done by frontend/mini-program, but maybe admin can add)
export function addReservation(data) {
  return request({
    url: '/hospital/reservation',
    method: 'post',
    data: data
  })
}

// Update reservation
export function updateReservation(data) {
  return request({
    url: '/hospital/reservation',
    method: 'put',
    data: data
  })
}

// Delete reservation
export function delReservation(reservationId) {
  return request({
    url: '/hospital/reservation/' + reservationId,
    method: 'delete'
  })
}

// Assign doctor map (optional, wait, do we have doctor list? Yes, /hospital/doctor/list)
