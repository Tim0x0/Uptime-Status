<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300" :data-theme="isDark ? 'dark' : 'light'">
    <!-- 主内容区：占据剩余空间 -->
    <div class="flex-1">
      <div class="pro-container h-full flex flex-col">
        <Header
          :title="title"
          :is-refreshing="isRefreshing"
          :is-dark="isDark"
          :search-query="searchQuery"
          @refresh="refreshData"
          @toggle-theme="toggleTheme"
          @update:search="searchQuery = $event"
        />

        <div class="mt-8">
          <Stats :monitors="monitors" />
        </div>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold" style="color: var(--text-main)">监控列表</h2>
          <MonitorControls
            :sort-by="sortBy"
            :filter-status="filterStatus"
            @update:sort="sortBy = $event"
            @update:filter="filterStatus = $event"
          />
        </div>

        <div class="mt-4 flex-1 overflow-y-auto">
          <MonitorList
            :monitors="filteredMonitors"
            :is-loading="isRefreshing"
          />
        </div>
      </div>
    </div>

    <!-- 页脚区：固定在底部 -->
    <div>
      <div class="pro-container py-8">
        <div class="text-center text-xs opacity-60">
          <Footer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { fetchMonitorData, fetchAccountDetails } from './utils/api'
import Header from './components/Header.vue'
import Stats from './components/Stats.vue'
import MonitorControls from './components/MonitorControls.vue'
import MonitorList from './components/MonitorList.vue'
import Footer from './components/Footer.vue'

const title = ref(import.meta.env.VITE_APP_TITLE || 'System Status')
const monitors = ref([])
const accountData = ref(null)
const isRefreshing = ref(false)
const isDark = ref(false)
const searchQuery = ref('')
const sortBy = ref('status')
const filterStatus = ref('all')

// 提供账户数据给子组件
provide('accountData', accountData)

// Theme management
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Data fetching
const refreshData = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  monitors.value = []
  accountData.value = null

  try {
    // 并行请求两个 API，等待全部完成
    const [monitorResult, accountResult] = await Promise.all([
      fetchMonitorData().catch(err => {
        console.error('Failed to fetch monitor data:', err)
        return []
      }),
      fetchAccountDetails().catch(err => {
        console.error('Failed to fetch account details:', err)
        return null
      })
    ])

    // 使用 requestAnimationFrame 避免 UI 阻塞
    requestAnimationFrame(() => {
      monitors.value = monitorResult
      accountData.value = accountResult
      isRefreshing.value = false
    })
  } catch (error) {
    console.error('Failed to fetch data:', error)
    monitors.value = []
    accountData.value = null
    isRefreshing.value = false
  }
}

// Filtered and sorted monitors
const filteredMonitors = computed(() => {
  let result = [...monitors.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      m.friendly_name.toLowerCase().includes(query) ||
      m.url.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (filterStatus.value !== 'all') {
    if (filterStatus.value === 'online') {
      result = result.filter(m => m.status === 2)
    } else if (filterStatus.value === 'offline') {
      result = result.filter(m => m.status === 9)
    }
  }
  
  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'status':
        if (a.status === b.status) return 0
        if (a.status === 9) return 1
        if (b.status === 9) return -1
        return 0
      case 'name':
        return a.friendly_name.localeCompare(b.friendly_name)
      case 'uptime':
        return (b.stats?.uptime || 0) - (a.stats?.uptime || 0)
      case 'response':
        return (a.stats?.avgResponseTime || Infinity) - (b.stats?.avgResponseTime || Infinity)
      default:
        return 0
    }
  })
  
  return result
})

onMounted(() => {
  initTheme()
  refreshData()
})
</script>