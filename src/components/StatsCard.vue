<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  caption: { type: String, default: '' },
  tone: { type: String, default: 'default' }, // default | good | warn | bad
})
</script>

<template>
  <div class="stat" :class="`stat-${tone}`">
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value">{{ value }}</span>
    <span v-if="caption" class="stat-caption">{{ caption }}</span>
  </div>
</template>

<style scoped>
.stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 4px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: var(--shadow-sm);
}

.stat-good { border-left-color: var(--paid); }
.stat-warn { border-left-color: var(--warn); }
.stat-bad { border-left-color: var(--overdue); }

.stat-label {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.stat-good .stat-value { color: var(--paid); }
.stat-warn .stat-value { color: var(--warn); }
.stat-bad .stat-value { color: var(--overdue); }

.stat-caption {
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
