<template>
  <footer class="max-w-5xl mx-auto w-full py-8 px-6 border-t" style="border-color: var(--border-subtle)">
    <!-- Back to Top -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <button 
        v-show="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 p-2 rounded-md shadow-md btn-pro z-50"
      >
        <Icon icon="carbon:arrow-up" class="w-5 h-5" />
      </button>
    </Transition>

    <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style="color: var(--text-muted)">
      <div class="flex items-center gap-4">
        <span class="font-semibold" style="color: var(--text-main)">Uptime-Status</span>
        <span class="w-px h-3 bg-gray-300 dark:bg-gray-700"></span>
        <span>v{{ pkg.version }}</span>
      </div>
      
      <div class="flex items-center gap-6">
        <a 
          :href="pkg.repository.url"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <Icon icon="ri:github-line" /> GitHub
        </a>
        <a 
          :href="pkg.url"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <Icon icon="carbon:home" /> Home
        </a>
      </div>
      
      <div class="text-xs opacity-80">
        Powered by <a href="https://uptimerobot.com" target="_blank" class="hover:underline">UptimeRobot</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import pkg from '../../package.json'

const showBackToTop = ref(false)
const SCROLL_THRESHOLD = 300

const handleScroll = () => {
  showBackToTop.value = window.scrollY > SCROLL_THRESHOLD
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>