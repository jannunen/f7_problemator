<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue' 
import FloorMapBlock from '@components/home/FloorMapBlock.vue' 
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import $ from 'dom7'
import { f7, useStore } from 'framework7-vue'
import { watch } from 'vue'
import { ref } from 'vue'
import store from '../js/store.js'
const dark = useStore('dark')
const profile = useStore('profile')
const localDark = ref(true)
const isOpened = ref(false)
const { t } = useI18n()
const props = defineProps({
  f7router : Object,
})
const toggleDark = (newValue) => {
  const nowChecked = newValue.target.checked
  store.dispatch('setDark', nowChecked)
}
const onAddTick = () => {
  isOpened.value = true
}
const onStartNavigate = (problem) => {
  isOpened.value = false
  props.f7router.navigate("/problem/"+problem.id+"/popup",{
    props : { problem }
  })
}

onMounted(() => {
  console.log("store -> getProfile")
  store.dispatch('getProfile')
})

// Handles changing the dark/light theme. Seems a bit kludge, because it is.
watch(dark, (isDarkTheme, oldValue) => {
  const self = this
  const $html = $('html')
  $html.removeClass('theme-dark theme-light')
  if (isDarkTheme) {
    $html.addClass(`theme-dark`)
  } else {
    $html.addClass(`theme-light`)
  }
})
</script>

<template>
  <f7-page name="home">
    <f7-navbar title="Home">
      <f7-nav-right>
        <f7-toggle :checked="localDark" @change="toggleDark" />
      </f7-nav-right>
    </f7-navbar>
    <!-- Page content -->
    <TodayHeader :profile="profile" @addtick="onAddTick" />
    <floor-map-block />

<f7-sheet 
    v-model:opened="isOpened" 
    style="height:auto; "
    close-on-escape	
    close-by-outside-click	
    swipe-to-close
    @sheet:closed="isOpened=false">
      <SearchProblemsSheetVue @close="isOpened=false" @start-navigate="onStartNavigate" />
      
    </f7-sheet>


    

  </f7-page>
</template>
