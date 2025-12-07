# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 UptimeRobot API 的站点状态监控面板，使用 Vue 3 + Vite + Tailwind CSS 构建。支持实时监控、可视化数据统计、主题切换等功能。

## 开发命令

```bash
# 安装依赖
npm install
# 或
pnpm install

# 开发环境运行（注意：需将 VITE_UPTIMEROBOT_API_URL 设置为 UptimeRobot API 地址）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行本地服务器（用于测试边缘函数）
npm run server
```

## 核心架构

### 1. API 代理架构（关键设计）

项目使用边缘函数（Edge Functions）在后端代理 UptimeRobot API 请求，以保护 API 密钥安全：

- **前端**：通过 `VITE_UPTIMEROBOT_API_URL` 配置的端点发送请求，不包含 API 密钥
- **边缘函数**：在后端自动添加 API 密钥并转发请求到 UptimeRobot
- **支持平台**：
  - Vercel：使用 `api/*.js`（Vercel Serverless Functions）
  - Cloudflare Pages / 腾讯云 EdgeOne：使用 `functions/api/*.js`（Cloudflare Workers 格式）

**可用的 API 端点**：
- `/api/status` - 获取监控器列表和状态（对应 `getMonitors` API）
- `/api/account` - 获取账户详情（对应 `getAccountDetails` API）

### 2. 数据流转

```
用户界面 (App.vue)
  ↓
API 工具 (src/utils/api.js) → fetchMonitorData()
  ↓
边缘函数 (api/status.js 或 functions/api/status.js)
  ↓ 添加 API Key
UptimeRobot API
  ↓
数据处理 (src/utils/monitor.js) → processMonitorData()
  ↓
组件渲染 (MonitorList, Stats, etc.)
```

### 3. 核心数据处理逻辑

位于 `src/utils/monitor.js`，包含：

- **时间范围生成**：`generateTimeRanges()` - 生成30天的自定义时间范围
- **响应时间计算**：`calculateAvgResponseTime()` - 计算最近24小时的平均响应时间
- **停机日志处理**：`processDowntimeLogs()` - 过滤和排序最近30天的停机记录
- **正常运行时间**：`processUptimeData()` - 处理每日可用率数据
- **每小时响应时间**：`processDailyResponseTimes()` - 按小时分组计算响应时间

### 4. 组件结构

- `App.vue`：主容器，管理主题、数据刷新、搜索和筛选
- `Header.vue`：顶部栏，包含标题、刷新按钮、主题切换、搜索框
- `Stats.vue`：全局统计卡片，显示总体监控状态
- `MonitorControls.vue`：监控列表的排序和筛选控制
- `MonitorList.vue`：监控列表容器
- `MonitorCard.vue` / `MonitorTable.vue`：单个监控项的卡片/表格视图
- `IncidentModal.vue`：故障详情弹窗
- `Footer.vue`：页脚信息

### 5. 状态管理

使用 Vue 3 Composition API，主要状态集中在 `App.vue`：

- `monitors`：监控数据数组
- `isDark`：主题状态（持久化到 localStorage）
- `searchQuery`：搜索关键词
- `sortBy`：排序方式（status/name/uptime/response）
- `filterStatus`：筛选状态（all/online/offline）

### 6. 环境变量配置

`.env` 文件中的关键配置：

```bash
# 后端使用，不会暴露到前端
UPTIMEROBOT_API_KEY = "你的API密钥"

# 前端使用的 API 代理地址
VITE_UPTIMEROBOT_API_URL = "/api/status"

# 站点名称
VITE_APP_TITLE = "站点名称"

# 监控面板排序方式（friendly_name 或 create_datetime）
VITE_UPTIMEROBOT_STATUS_SORT = "friendly_name"
```

## 重要约定

### API 密钥安全

- **禁止**在前端代码或环境变量中直接使用 API 密钥
- API 密钥必须通过边缘函数在后端添加
- 前端只使用 `VITE_UPTIMEROBOT_API_URL` 指向代理端点

### 部署平台适配

修改边缘函数时需要同时更新：
- `api/*.js`（Vercel，包括 status.js 和 account.js）
- `functions/api/*.js`（Cloudflare / EdgeOne，包括 status.js 和 account.js）

### 主题系统

主题通过 CSS 变量实现，定义在 `src/style.css`：
- `data-theme="light"` 或 `data-theme="dark"` 控制主题
- 使用 `var(--text-main)`、`var(--bg-card)` 等变量引用颜色

### 监控状态码

UptimeRobot 状态码：
- `2`：在线（正常）
- `9`：离线（故障）
- 其他：暂停、未检测等

## 技术栈

- **前端框架**：Vue 3（Composition API）
- **构建工具**：Vite 6
- **样式方案**：Tailwind CSS 3 + 自定义 CSS 变量
- **HTTP 客户端**：Axios
- **图表库**：Chart.js + vue-chartjs
- **日期处理**：date-fns
- **图标**：@iconify/vue

## 关键文件说明

- `src/utils/api.js`：API 请求封装，包含 `fetchMonitorData()` 和 `fetchAccountDetails()` 函数
- `src/utils/monitor.js`：监控数据处理和统计计算
- `src/utils/chartConfig.js`：Chart.js 图表配置
- `api/account.js` 和 `api/status.js`：Vercel 边缘函数
- `functions/api/account.js` 和 `functions/api/status.js`：Cloudflare/EdgeOne 边缘函数
- `vite.config.js`：Vite 配置，包含路径别名 `@` 指向 `./src`
- `examples/`：API 使用示例和测试脚本
