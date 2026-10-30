<script setup>
import { storeToRefs } from 'pinia'

import SideNav from './components/SideNav.vue'
import { useAppStore } from './stores/appStore.js'

const store = useAppStore()
const { toast } = storeToRefs(store)
</script>

<template>
  <div class="app-shell">
    <SideNav class="no-print" />

    <main class="app-main">
      <router-view :key="$route.fullPath" />
    </main>

    <div class="toast-wrap no-print" aria-live="polite">
      <Transition name="toast">
        <div
          v-if="toast"
          :key="toast.id"
          class="toast"
          :class="`tone-${toast.tone}`"
          @click="store.clearToast()"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
              clip-rule="evenodd"
            />
          </svg>
          {{ toast.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>
