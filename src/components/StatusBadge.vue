<script setup>
import { computed } from 'vue'

import { STATUS_META, effectiveStatus } from '../utils/format.js'

const props = defineProps({
  invoice: { type: Object, required: true },
})

const meta = computed(() => STATUS_META[effectiveStatus(props.invoice)])
</script>

<template>
  <span class="badge" :class="meta.class">{{ meta.label }}</span>
</template>
