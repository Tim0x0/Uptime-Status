/**
 * API 代理实现
 * 这是一个边缘函数，运行在边缘节点上
 * 用于代理 UptimeRobot API 请求，避免跨域问题
 * 
 * 支持以下部署平台：
 * - 腾讯云 EdgeOne Pages
 * - Cloudflare Pages
 * 
 * 环境变量配置说明：
 * 1. UPTIMEROBOT_API_KEY: UptimeRobot 的只读 API 密钥（必需）
 * 2. VITE_UPTIMEROBOT_API_URL: API 代理地址（前端使用，设置为 "/api/status"）
 */

export async function onRequest(context) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // 处理 OPTIONS 请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 从环境变量读取 API Key（后端安全存储）
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

    // 从请求中获取数据（不包含 api_key）
    const data = await context.request.json()

    // 在后端添加 API Key，确保前端不暴露
    const requestData = {
      ...data,
      api_key: apiKey
    }

    // 转发请求到 UptimeRobot API
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })

    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    return newResponse

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