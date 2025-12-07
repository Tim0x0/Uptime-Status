<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- 背景遮罩 -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- 弹窗内容 -->
        <div
          class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-transform duration-150"
          :class="isOpen ? 'scale-100' : 'scale-95'"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Incident History
            </h3>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <Icon icon="carbon:close" class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-4">
            <div class="mb-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">Monitor</div>
              <div class="font-medium text-gray-900 dark:text-white truncate">{{ monitor?.friendly_name }}</div>
            </div>

            <div v-if="monitor?.stats?.downtimeLogs?.length" class="space-y-3">
              <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent Downtime</div>
              <div class="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <div
                  v-for="log in monitor.stats.downtimeLogs"
                  :key="log.id"
                  class="flex items-center justify-between p-3 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {{ formatDateTime(log.datetime) }}
                    </span>
                  </div>
                  <span class="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/20">
                    {{ formatDuration(log.duration) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="py-8 text-center">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 mb-3">
                <Icon icon="carbon:checkmark-filled" class="w-6 h-6 text-green-500" />
              </div>
              <div class="text-gray-900 dark:text-white font-medium">All Systems Operational</div>
              <div class="text-sm text-gray-500 mt-1">No recent incidents recorded for this monitor.</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-right">
            <button
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { format } from 'date-fns'

defineProps({
  isOpen: Boolean,
  monitor: Object
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const formatDateTime = (timestamp) => {
  return format(new Date(timestamp * 1000), 'MMM d, yyyy HH:mm')
}

const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
}
</style>
