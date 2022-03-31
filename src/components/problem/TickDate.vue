<template>
 <popup
        :opened="popupTickDateOpen"
        @popup:closed="addTickSheetOpened = true"
        @popup:open="onTickDatePopupOpened"
        class="popup_tick_date"
      >
        
          
          
            <f7-block-title>{{ $t("problem.choose_tick_date") }}</f7-block-title>

            <div class="flex flex-row justify-around">
              <f7-button
                @click="setCalendarDate(dayjs().subtract(1, 'day').toDate())"
                class="mx-2"
                round
                fill
                color="red"
                >{{ $t("problem.yesterday") }}
              </f7-button>
              <f7-button
                @click="setCalendarDate(dayjs().toDate())"
                class="mx-2"
                round
                fill
                color="red"
                >{{ $t("problem.today") }}
              </f7-button>
            </div>
            <div id="calendar-inline-container"></div>
            <div class="mx-2">
              <f7-button @click="popupTickDateOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          
        
      </popup> 
</template>

<script>
export default {

}
</script>

<style>

</style>