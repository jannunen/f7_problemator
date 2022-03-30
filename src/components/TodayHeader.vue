 <script setup>
    import { useI18n } from 'vue-i18n'
    import { useStore } from 'framework7-vue'
    const { t } = useI18n() 
    const profile = useStore('profile')
    console.log(profile)
 </script>
 <template>
 <div class="my-2 text-center text-lg font-bold">{{ t("home.today") }}</div>
      <div class="flex flex-row justify-center mt-3">
        <div class="flex flex-col mx-4 text-center">
          <div class="text-5xl font-bold leading-8">{{ ticksToday }}<br /></div>
          <small class="mb-2">{{ t("home.ascents") }}</small>
          <div class="text-sm text-center leading-3">{{ triesToday }}</div>
          <small>{{ t("home.tries") }}</small>
        </div>
        <div class="mt-2">
          <button
            @click="sheetSearchProblemsOpened=true"
            class="w-14 h-14 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
          >
            <f7-icon material="add" color="white" size="20px"></f7-icon>
            <small>{{ t("home.add") }}</small>
          </button>
        </div>
      </div>
      </template>