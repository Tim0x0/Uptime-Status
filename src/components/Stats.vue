<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <!-- Total -->
    <div class="pro-card p-4">
      <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--text-muted)">Total Monitors</div>
      <div class="text-2xl font-bold" style="color: var(--text-main)">
        {{ total }}
      </div>
    </div>

    <!-- Online -->
    <div class="pro-card p-4">
      <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--text-muted)">Operational</div>
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold" style="color: #10b981">{{ normal }}</span>
        <span class="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-medium">
          {{ Math.round((normal / total) * 100) || 0 }}%
        </span>
      </div>
    </div>

    <!-- Offline -->
    <div class="pro-card p-4">
      <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--text-muted)">Downtime</div>
      <div class="text-2xl font-bold" :class="abnormal > 0 ? 'text-red-600' : 'text-gray-400'">
        {{ abnormal }}
      </div>
    </div>

    <!-- Response Time -->
    <div class="pro-card p-4">
      <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--text-muted)">Avg Response</div>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold" style="color: var(--text-main)">{{ avgResponse }}</span>
        <span class="text-xs" style="color: var(--text-muted)">ms</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'

const props = defineProps({
  monitors: {
    type: Array,
    default: () => []
  }
})

// 从父组件注入账户数据，提供一个空 ref 作为默认值
const accountData = inject('accountData', ref(null))

// 优先使用 account API 数据，如果没有则回退到 monitors 计算值
const total = computed(() =>
  accountData.value?.total_monitors_count ?? props.monitors.length
)

const normal = computed(() =>
  accountData.value?.up_monitors ?? props.monitors.filter(m => m.status === 2 || m.status === 1).length
)

const abnormal = computed(() =>
  accountData.value?.down_monitors ?? props.monitors.filter(m => m.status === 9 || m.status === 0).length
)

// 平均响应时间只能从 monitors 数据计算
const avgResponse = computed(() => {
  if (!props.monitors?.length) return 0
  const onlineMonitors = props.monitors.filter(m =>
    m.status === 2 && m.stats?.avgResponseTime > 0
  )
  if (!onlineMonitors.length) return 0
  return Math.round(
    onlineMonitors.reduce((acc, m) => acc + m.stats.avgResponseTime, 0) / onlineMonitors.length
  )
})
</script>