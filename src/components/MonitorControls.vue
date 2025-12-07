<template>
  <div class="flex items-center gap-3 text-sm">
    <!-- Filter -->
    <div class="relative">
      <select 
        :value="filterStatus"
        @change="$emit('update:filter', $event.target.value)"
        class="input-pro pr-8 cursor-pointer appearance-none"
      >
        <option value="all">All Monitors</option>
        <option value="online">Online Only</option>
        <option value="offline">Offline Only</option>
      </select>
      <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <Icon icon="carbon:chevron-down" />
      </span>
    </div>
    
    <!-- Sort -->
    <div class="relative">
      <select 
        :value="sortBy"
        @change="$emit('update:sort', $event.target.value)"
        class="input-pro pr-8 cursor-pointer appearance-none"
      >
        <option value="status">Sort by Status</option>
        <option value="name">Sort by Name</option>
        <option value="uptime">Sort by Uptime</option>
        <option value="response">Sort by Response</option>
      </select>
      <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <Icon icon="carbon:chevron-down" />
      </span>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  filterStatus: {
    type: String,
    default: 'all'
  },
  sortBy: {
    type: String,
    default: 'status'
  }
})

defineEmits(['update:filter', 'update:sort'])
</script>
