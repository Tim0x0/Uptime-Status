<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b" style="border-color: var(--border-subtle)">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold">
        T
      </div>
      <h1 class="text-xl font-semibold tracking-tight" style="color: var(--text-main)">
        {{ title }}
      </h1>
    </div>
    
    <div class="flex items-center gap-3 w-full sm:w-auto">
      <!-- Search -->
      <div class="relative group">
        <input
          type="text"
          :value="searchQuery"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Search monitors..."
          class="input-pro pl-9 w-full sm:w-64"
        />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
          <Icon icon="carbon:search" />
        </span>
      </div>
      
      <!-- Dark mode toggle -->
      <button
        @click="$emit('toggle-theme')"
        class="btn-pro w-9 h-9 flex items-center justify-center p-0"
        title="Toggle Theme"
      >
        <Icon :icon="isDark ? 'carbon:sun' : 'carbon:moon'" class="w-4 h-4" />
      </button>
      
      <!-- Refresh -->
      <button
        @click="$emit('refresh')"
        :disabled="isRefreshing"
        class="btn-pro flex items-center gap-2"
      >
        <Icon
          icon="carbon:renew"
          class="w-4 h-4 transition-transform"
          :class="isRefreshing ? 'animate-spin' : ''"
        />
        <span class="hidden sm:inline">{{ isRefreshing ? 'Refreshing' : 'Refresh' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  isRefreshing: {
    type: Boolean,
    default: false
  },
  isDark: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

defineEmits(['refresh', 'toggle-theme', 'update:search'])
</script>

