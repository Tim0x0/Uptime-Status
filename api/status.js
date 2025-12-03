export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
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
    // 从环境变量读取 API Key（后端安全存储）
    const apiKey = process.env.UPTIMEROBOT_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        stat: 'fail',
        message: '服务器配置错误：未设置 API Key'
      })
    }

    // 在后端添加 API Key
    const requestData = {
      ...req.body,
      api_key: apiKey
    }

    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error) {
    return res.status(500).json({ error: '请求失败: ' + error.message })
  }
}