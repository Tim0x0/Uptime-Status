<template>
  <div class="h-full space-y-3">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="pro-card p-4 flex items-center gap-4">
        <div class="w-3 h-3 rounded-full bg-gray-200 animate-pulse"></div>
        <div class="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
        <div class="ml-auto flex gap-4">
          <div class="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
          <div class="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Monitor rows -->
    <div v-else-if="monitors.length > 0" class="space-y-3">
      <div
        v-for="monitor in monitors"
        :key="monitor.id"
        class="pro-card p-4 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
      >
        <!-- Left: Status + Name + Badges -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div class="flex-shrink-0 w-28">
            <span
              class="status-pill"
              :class="{
                'online': monitor.status === 2,
                'offline': monitor.status === 9,
                'warning': monitor.status === 0 || monitor.status === 1
              }"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              {{ monitor.status === 2 ? 'Operational' : (monitor.status === 9 ? 'Down' : 'Unknown') }}
            </span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <span class="font-medium truncate text-sm sm:text-base" style="color: var(--text-main)">
              {{ monitor.friendly_name }}
            </span>
            <div class="flex items-center gap-2">
              <span 
                class="pro-badge text-[10px] flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <Icon icon="carbon:time" class="w-3 h-3" />
                {{ getStatusDuration(monitor) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Right: Metrics + History Button -->
        <div class="flex items-center gap-4 sm:gap-8 flex-shrink-0 text-sm">
          <!-- Sparkline (Desktop) -->
          <div class="sparkline hidden lg:flex w-48 justify-end gap-[2px] items-end h-10">
            <div
              v-for="(bar, i) in getSparklineData(monitor)"
              :key="i"
              class="w-1.5 rounded-sm hover:opacity-80"
              :class="bar.statusClass"
              :style="{ height: bar.height + 'px' }"
              @mouseenter="showTooltip($event, bar)"
              @mouseleave="hideTooltip"
            ></div>
          </div>

          
          <!-- Uptime/Response (Desktop) -->
          <div class="hidden sm:flex items-center gap-6">
            <div class="text-right w-20">
              <div class="font-medium" :class="getUptimeColorClass(monitor.stats?.uptime)">
                {{ formatUptime(monitor.stats?.uptime) }}
              </div>
              <div class="text-[10px] uppercase tracking-wider opacity-50">Uptime</div>
            </div>
            
            <div class="text-right w-20">
              <div class="font-medium" style="color: var(--text-main)">
                {{ formatResponseTime(monitor.stats?.avgResponseTime) }}
              </div>
              <div class="text-[10px] uppercase tracking-wider opacity-50">Response</div>
            </div>
          </div>

          <!-- History Button -->
          <button 
            @click="openHistory(monitor)"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 w-10 h-10 flex items-center justify-center flex-shrink-0"
            title="View Incident History"
          >
            <Icon icon="carbon:notebook" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="pro-card py-16 text-center text-sm flex flex-col items-center justify-center gap-4">
      <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800">
        <Icon icon="carbon:chart-line" class="w-8 h-8 text-gray-300" />
      </div>
      <span style="color: var(--text-muted)">No monitors found</span>
    </div>

    <!-- Incident Modal -->
    <IncidentModal 
      :is-open="isModalOpen"
      :monitor="selectedMonitor"
      @close="closeModal"
    />

    <!-- Sparkline Tooltip -->
    <div 
      v-if="tooltip.visible" 
      class="tooltip-sparkline"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-date">{{ tooltip.data.date }}</div>
      <div class="flex flex-col gap-1 mt-1">
        <div class="flex items-center gap-2">
          <span class="text-xs" :class="getUptimeTooltipColorClass(tooltip.data.availability)">●</span>
          <span class="text-xs font-semibold" :class="getUptimeTooltipColorClass(tooltip.data.availability)">
            {{ tooltip.data.availability }}
          </span>
          <span class="text-xs" style="color: var(--text-muted)">uptime</span>
        </div>
        <div class="flex items-center gap-2" v-if="tooltip.data.incidents > 0">
          <span class="text-xs text-gray-400">●</span>
          <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {{ tooltip.data.incidents }}
          </span>
          <span class="text-xs" style="color: var(--text-muted)">incidents</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import IncidentModal from './IncidentModal.vue'

const props = defineProps({
  monitors: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})



// Modal state
const isModalOpen = ref(false)
const selectedMonitor = ref(null)

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: {
    date: '',
    availability: '',
    incidents: 0
  }
})

const openHistory = (monitor) => {
  selectedMonitor.value = monitor
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedMonitor.value = null
}

const showTooltip = (event, barData) => {
  tooltip.value.visible = true
  tooltip.value.x = event.clientX + 10
  tooltip.value.y = event.clientY - 50
  tooltip.value.data = barData
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const monitorTypeMap = {
  1: 'HTTPS',
  2: 'Keyword',
  3: 'PING',
  4: 'Port',
  default: 'HTTP'
}

const getMonitorType = (type) => {
  return monitorTypeMap[type] || monitorTypeMap.default
}

const formatUptime = (uptime) => {
  if (!uptime) return '—'
  return `${Number(uptime).toFixed(2)}%`
}

const getUptimeColorClass = (uptime) => {
  if (!uptime) return 'text-gray-400'
  const val = Number(uptime)
  if (val >= 99.9) return 'text-emerald-600 dark:text-emerald-400'
  if (val >= 98) return 'text-emerald-500 dark:text-emerald-500'
  if (val >= 95) return 'text-yellow-600 dark:text-yellow-500'
  return 'text-red-600 dark:text-red-500'
}

const getUptimeTooltipColorClass = (availabilityStr) => {
  if (!availabilityStr || availabilityStr === '—') return 'text-gray-400'
  const val = parseFloat(availabilityStr)
  if (val >= 99) return 'text-emerald-500 dark:text-emerald-400'
  if (val >= 95) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

const formatResponseTime = (time) => {
  if (!time) return '—'
  return `${Math.round(time)}ms`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}

const getStatusDuration = (monitor) => {
  if (!monitor.logs || monitor.logs.length === 0) return 'Unknown'
  // logs[0] is the most recent event (start of current status)
  const lastLog = monitor.logs[0]
  const now = Math.floor(Date.now() / 1000)
  const duration = Math.max(0, now - lastLog.datetime)
  
  const statusText = monitor.status === 2 ? 'Up' : (monitor.status === 9 ? 'Down' : 'Status')
  return `${statusText} for ${formatDuration(duration)}`
}

const getSparklineData = (monitor) => {
  const dailyUptimes = monitor.stats?.dailyUptimes || []
  const logs = monitor.stats?.downtimeLogs || []
  
  if (!dailyUptimes.length) {
    return Array(30).fill(0).map((_, i) => ({
      height: 2,
      active: false,
      statusClass: 'bg-gray-200 dark:bg-gray-700',
      date: 'No Data',
      availability: '—',
      incidents: 0
    }))
  }
  
  const now = new Date()
  
  return dailyUptimes.map((availability, index) => {
    // Calculate date for this bar
    const daysAgo = dailyUptimes.length - 1 - index
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    
    // Format date
    const dateStr = `${date.getMonth() + 1}-${date.getDate()}`
    
    // Check if this date is before monitor creation
    const dateTimestamp = Math.floor(date.getTime() / 1000)
    const monitorCreateTime = monitor.create_datetime || 0
    const isBeforeCreation = dateTimestamp < monitorCreateTime
    
    // Calculate incidents for this day
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    const dayStartTimestamp = Math.floor(dayStart.getTime() / 1000)
    const dayEndTimestamp = Math.floor(dayEnd.getTime() / 1000)
    
    const dayIncidents = logs.filter(log => 
      log.datetime >= dayStartTimestamp && log.datetime <= dayEndTimestamp
    ).length
    
    // Determine color based on availability
    // 参考标准监控色彩方案
    let colorClass = 'bg-gray-200 dark:bg-gray-700'
    
    if (isBeforeCreation || availability === null || availability === undefined) {
      // 监控创建之前: 灰色（无数据）
      colorClass = 'bg-gray-200 dark:bg-gray-700'
    } else if (availability === 100) {
      // 100%: 深绿色（完美）
      colorClass = 'bg-emerald-600 dark:bg-emerald-500'
    } else if (availability >= 99.9) {
      // 99.9-99.99%: 浅绿色（优秀）
      colorClass = 'bg-emerald-500 dark:bg-emerald-400'
    } else if (availability >= 95) {
      // 95-99.9%: 黄色（一般）
      colorClass = 'bg-yellow-500 dark:bg-yellow-500'
    } else {
      // <95% (包括0%): 红色（较差/完全宕机）
      colorClass = 'bg-red-500 dark:bg-red-500'
    }
    
    // Height based on availability (0-100% -> 2px-30px)
    const height = availability > 0 ? (availability / 100) * 28 + 2 : 2
    
    return {
      height: Math.max(2, height),
      active: availability > 0,
      statusClass: colorClass,
      date: dateStr,
      availability: availability > 0 ? `${Number(availability).toFixed(2)}%` : '0%',
      incidents: dayIncidents
    }
  })
}
</script>
