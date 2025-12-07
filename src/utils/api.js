/**
 * API 请求相关工具函数
 * 主要用于处理与 UptimeRobot API 的通信
 */

import axios from 'axios'
import { processMonitorData, generateTimeRanges } from './monitor'

/** API 配置常量 */
const API_URL = import.meta.env.VITE_UPTIMEROBOT_API_URL + '/status'
const ACCOUNT_API_URL = import.meta.env.VITE_UPTIMEROBOT_API_URL + '/account'

/* 面板排序方式 */
const STATUS_SORT = import.meta.env.VITE_UPTIMEROBOT_STATUS_SORT

/**
 * 获取监控数据
 * @async
 * @returns {Promise<Array>} 处理后的监控数据数组
 * @throws {Error} 当 API 请求失败时抛出错误
 * @note API Key 现在由后端边缘函数处理，前端不再传递敏感凭证
 */
export const fetchMonitorData = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await axios.post(
      API_URL,
      {
        // 注意：不再传递 api_key，由后端自动添加
        format: 'json',
        response_times: 1,
        logs: 1,
        custom_uptime_ranges: generateTimeRanges(),
        response_times_start_date: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
        response_times_end_date: Math.floor(Date.now() / 1000)
      },
      {
        signal: controller.signal,
        timeout: 30000
      }
    )

    if (response.data?.stat !== 'ok') {
      throw new Error('API 请求失败: ' + response.data?.message || '未知错误')
    }

    if (STATUS_SORT === 'friendly_name') {
      return response.data.monitors
        .sort((a, b) => a.friendly_name.localeCompare(b.friendly_name))
        .map(processMonitorData)
    } else if (STATUS_SORT === 'create_datetime') {
      return response.data.monitors
        .sort((a, b) => b.create_datetime - a.create_datetime)
        .map(processMonitorData)
    } else {
      return response.data.monitors.map(processMonitorData)
    }

  } catch (error) {
    console.error('获取监控数据失败:', error)
    throw new Error('获取监控数据失败: ' + error.message)
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 获取账户详情
 * @async
 * @returns {Promise<Object>} 账户详情对象
 * @throws {Error} 当 API 请求失败时抛出错误
 *
 * 返回数据包含：
 * - up_monitors: 在线监控数量
 * - down_monitors: 离线监控数量
 * - paused_monitors: 暂停的监控数量
 * - total_monitors_count: 总监控数量
 */
export const fetchAccountDetails = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await axios.post(
      ACCOUNT_API_URL,
      {},
      {
        signal: controller.signal,
        timeout: 30000
      }
    )

    if (response.data?.stat !== 'ok') {
      throw new Error('API 请求失败: ' + response.data?.message || '未知错误')
    }

    return response.data.data

  } catch (error) {
    // 如果是取消错误，静默处理
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('账户详情请求被取消')
      return null
    }

    console.error('获取账户详情失败:', error)
    throw new Error('获取账户详情失败: ' + error.message)
  } finally {
    clearTimeout(timeoutId)
  }
}