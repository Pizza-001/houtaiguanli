import request from '@/utils/request'

// --- 化验报告相关 ---

// 查询化验报告列表
export function listLabReport(query) {
    return request({
        url: '/hospital/pacs/lab/list',
        method: 'get',
        params: query
    })
}

// 查询化验报告详细
export function getLabReport(id) {
    return request({
        url: '/hospital/pacs/lab/' + id,
        method: 'get'
    })
}

// 新增化验报告
export function addLabReport(data) {
    return request({
        url: '/hospital/pacs/lab',
        method: 'post',
        data: data
    })
}

// 修改化验报告
export function updateLabReport(data) {
    return request({
        url: '/hospital/pacs/lab',
        method: 'put',
        data: data
    })
}

// 删除化验报告
export function delLabReport(id) {
    return request({
        url: '/hospital/pacs/lab/' + id,
        method: 'delete'
    })
}

// --- 影像报告相关 ---

// 查询影像报告列表
export function listImagingReport(query) {
    return request({
        url: '/hospital/pacs/imaging/list',
        method: 'get',
        params: query
    })
}

// 查询影像报告详细
export function getImagingReport(id) {
    return request({
        url: '/hospital/pacs/imaging/' + id,
        method: 'get'
    })
}

// 新增影像报告
export function addImagingReport(data) {
    return request({
        url: '/hospital/pacs/imaging',
        method: 'post',
        data: data
    })
}

// 修改影像报告
export function updateImagingReport(data) {
    return request({
        url: '/hospital/pacs/imaging',
        method: 'put',
        data: data
    })
}

// 删除影像报告
export function delImagingReport(id) {
    return request({
        url: '/hospital/pacs/imaging/' + id,
        method: 'delete'
    })
}

// 发送影像报告给宠主
export function sendImagingReport(id) {
    return request({
        url: '/hospital/pacs/imaging/send/' + id,
        method: 'post'
    })
}
