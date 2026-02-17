<template>
  <nav class="p-tab-bar" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="p-tab-bar__item"
      :class="{ 'p-tab-bar__item--active': activeTab === tab.id }"
      role="tab"
      :aria-selected="activeTab === tab.id"
      @click="$emit('select', tab.id)"
    >
      <span class="p-tab-bar__pill">
        <span class="material-icons p-tab-bar__icon">{{ tab.icon }}</span>
      </span>
      <span class="p-tab-bar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
    // Each item: { id: string, icon: string, label: string }
  }
})

defineEmits(['select'])
</script>
