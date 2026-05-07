import request from '@/utils/request'

// 办理出院结算
export function dischargeInpatient(inpatientId) {
  return request({
    url: `/hospital/inpatient/discharge/${inpatientId}`,
    method: 'post'
  })
}

// 办理入院
export function admitInpatient(data) {
  return request({
    url: '/hospital/inpatient/admit',
    method: 'post',
    data: data
  })
}
