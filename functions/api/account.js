/**
 * 获取 UptimeRobot 账户详情的 API 代理
 * Cloudflare Pages / 腾讯云 EdgeOne Pages 格式
 *
 * 环境变量配置：
 * 1. UPTIMEROBOT_API_KEY: UptimeRobot API 密钥（必需）
 * 2. ALLOWED_ORIGINS: 允许访问的域名白名单，多个域名用逗号分隔（可选）
 *
 * 返回精简的账户统计数据：
 * - up_monitors: 在线监控数量
 * - down_monitors: 离线监控数量
 * - paused_monitors: 暂停的监控数量
 * - total_monitors_count: 总监控数量
 */

/**
 * 验证请求来源是否在白名单中
 */
function isAllowedOrigin(request, allowedDomains) {
  if (!allowedDomains) return true

  const whitelist = allowedDomains.split(',').map(d => d.trim().toLowerCase())
  const origin = request.headers.get('Origin') || ''
  const referer = request.headers.get('Referer') || ''

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

export async function onRequest(context) {
  const allowedOrigins = context.env.ALLOWED_ORIGINS || ''

  // 验证请求来源
  if (!isAllowedOrigin(context.request, allowedOrigins)) {
    return new Response(
      JSON.stringify({
        stat: 'fail',
        message: '访问被拒绝：域名不在白名单中'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const origin = context.request.headers.get('Origin') || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // 处理 OPTIONS 请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = context.env.UPTIMEROBOT_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          stat: 'fail',
          message: '服务器配置错误：未设置 API Key'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
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
      return new Response(
        JSON.stringify({
          stat: 'ok',
          data: {
            up_monitors: data.account.up_monitors,
            down_monitors: data.account.down_monitors,
            paused_monitors: data.account.paused_monitors,
            total_monitors_count: data.account.up_monitors + data.account.down_monitors + data.account.paused_monitors
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({
        stat: 'fail',
        message: '请求失败: ' + error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
