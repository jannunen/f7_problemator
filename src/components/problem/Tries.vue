<template>
 <popup animate :opened="popupTriesOpen" 
      @popup:open="addTickSheetOpened= false"
        @popup:closed="addTickSheetOpened = true"

      swipe-to-close class="popup_tries">
        
          
          
            <div>{{ $t("problem.how_many_tries") }}</div>

            <ul>
              <li
                @click="selectTries(n)"
                v-for="n in 8"
                radio
                radio-icon="end"
                :key="n"
                :title="n"
                name="tries"
                :checked="n == 1"
              ></li>

              <li class="mx-2">{{ $t("problem.or_enter_custom_amount") }}</li>
              <li class="item-content item-input">
                <div class="item-inner">
                  <div class="item-input-wrap">
                    <input
                      type="number"
                      v-model="preTries"
                      :placeholder="$t('problem.custom_amt_tries')"
                    />
                    <span class="input-clear-button"></span>
                  </div>
                </div>
                <button @click="selectTries(preTries)">{{
                  $t("problem.save_tries")
                }}</button>
              </li>
            </ul>
            <div class="mx-2">
              <button @click="popupTriesOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</button>
            </div>
          
        
      </popup> 
</template>

<script>
export default {

}
</script>

<style>

</style>