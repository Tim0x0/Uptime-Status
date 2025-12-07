/**
 * 获取 UptimeRobot 账户详情的 API 代理
 * Vercel Serverless Functions 格式
 *
 * 环境变量配置：
 * 1. UPTIMEROBOT_API_KEY: UptimeRobot API 密钥（必需）
 * 2. ALLOWED_ORIGINS: 允许访问的域名白名单，多个域名用逗号分隔（可选）
 */

/**
 * 验证请求来源是否在白名单中
 */
function isAllowedOrigin(req, allowedOrigins) {
  if (!allowedOrigins) return true

  const whitelist = allowedOrigins.split(',').map(d => d.trim().toLowerCase())
  const origin = req.headers.origin || ''
  const referer = req.headers.referer || ''

  let requestDomain = ''
  try {
    if (origin) {
      requestDomain = new URL(origin).hostname.toLowerCase()
    } else if (referer) {
      requestDomain = new URL(referer).hostname.toLowerCase()
    }
  } catch (e) {
    return false
  }

  return whitelist.some(allowed => {
    if (allowed.startsWith('*.')) {
      const baseDomain = allowed.slice(2)
      return requestDomain === baseDomain || requestDomain.endsWith('.' + baseDomain)
    }
    return requestDomain === allowed
  })
}

export default async function handler(req, res) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || ''

  // 验证请求来源
  if (!isAllowedOrigin(req, allowedOrigins)) {
    return res.status(403).json({
      stat: 'fail',
      message: '访问被拒绝：域名不在白名单中'
    })
  }

  // 设置 CORS 头
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins ? origin : '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' })
  }

  try {
    const apiKey = process.env.UPTIMEROBOT_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        stat: 'fail',
        message: '服务器配置错误：未设置 API Key'
      })
    }

    const requestData = {
      api_key: apiKey,
      format: 'json'
    }

    const response = await fetch('https://api.uptimerobot.com/v2/getAccountDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()

    if (data.stat === 'ok' && data.account) {
      return res.status(200).json({
        stat: 'ok',
        data: {
          up_monitors: data.account.up_monitors,
          down_monitors: data.account.down_monitors,
          paused_monitors: data.account.paused_monitors,
          total_monitors_count: data.account.up_monitors + data.account.down_monitors + data.account.paused_monitors
        }
      })
    }

    return res.status(200).json(data)

  } catch (error) {
    return res.status(500).json({ error: '请求失败: ' + error.message })
  }
}
