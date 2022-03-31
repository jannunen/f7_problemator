<template>
 <popup
        animate
        swipe-to-close
        :opened="myTicksPopupOpen"
        @sheet:opened="addTickSheetOpened = false"
        @sheet:closed="addTickSheetOpened = true"
        style="background-color: #e5e4e5"
        class="popup_ticks border-red-100 rounded-t-2xl"
      >
        
          
          <block>
            <p>{{ $t("problem.tick_list_info") }}</p>
            <tick-list
              :problem="problem"
              :ticks="problem.myTicks"
              :projects="problem.myProjects"
            ></tick-list>
            <div class="mb-4">
              <f7-button @click="myTicksPopupOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          </block>
        
      </popup> 
</template>

<script>
export default {

}
</script>

<style>

</style>