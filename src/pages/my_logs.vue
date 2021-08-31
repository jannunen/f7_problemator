<template>
  <f7-page name="mylogs">
    <!-- Top Navbar -->
    <f7-navbar :sliding="false" 
      :back-link="$t('global.back')">
      <f7-nav-title>{{ $t('mylogs.page_title') }}</f7-nav-title>
      <f7-nav-right>
        <f7-link icon-ios="f7:menu" icon-aurora="f7:menu" icon-md="material:menu" panel-open="left"></f7-link>
      </f7-nav-right>
    </f7-navbar>
    <!-- Page content-->
    <my-logs :show-selector="true"></my-logs>

    
    


    
  </f7-page>
</template>
<script>
import { useStore } from 'vuex'
import { ref, onMounted, computed} from 'vue'
import { getAscentsByGrade} from '@js/componentHelpers.js'
import MyLogs from '@components/home/MyLogs.vue'

  export default {
    
    setup(props) {
      const filters = ref(null)
      const wall = ref(null)
      const store = useStore()
      const gym = computed(() => store.state.gym)
      const grades = computed(() => store.state.grades)
      const walls = computed(() => store.state.walls)
      const showAscentsOfType = ref('boulder')
      onMounted(() =>{

      })
      return {
            getAscentsByGrade,
            grades,
            showAscentsOfType,
      }
    },
    components : {
      MyLogs,
    }
  }
</script>