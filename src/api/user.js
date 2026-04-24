import request from '@/utils/request'

// List users
export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}

// Get user detail
export function getUser(userId) {
  return request({
    url: '/system/user/' + (userId || ''),
    method: 'get'
  })
}

// Add user
export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

// Update user
export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

// Delete user
export function delUser(userIds) {
  return request({
    url: '/system/user/' + userIds,
    method: 'delete'
  })
}

// Reset password
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password
  }
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data
  })
}
