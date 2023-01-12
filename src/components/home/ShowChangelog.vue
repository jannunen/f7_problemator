<template>
   <f7-popup :opened="opened">
      <f7-page>
      <f7-navbar title="Roadmap &amp; Changes">
        <f7-nav-right>
          <f7-link @click="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block >

        <f7-toolbar tabbar bottom>
          <f7-link tab-link="#tab-1" tab-link-active>Roadmap</f7-link>
          <f7-link tab-link="#tab-2">Changelog</f7-link>
        </f7-toolbar>
        <f7-tabs>
          <f7-tab id="tab-1" class="mt-2" tab-active>
            <ul class="list-disc my-2 mx-4 p-2">
              <li class="list-none mt-2 text-green-400">Done</li>
              <li>See what other climber's have climbed.</li>
              <li class="list-none mt-2 text-green-500">Soon</li>
              <li>Jatsin orjat (Slaves of Yahtzee)</li>
              <li>Reporting dirty/dangerous</li>
              <li>Problem commenting</li>
              <li class="list-none mt-2 text-orange-500">Some day</li>
              <li>Spray wall</li>
              <li>Messaging</li>
            </ul>
          </f7-tab>
          <f7-tab id="tab-2" class="mt-2" >
            <release-note title="0.9.5" :notes="['Nailed some bugs from competition times']"></release-note>
            <release-note title="0.9.4" :notes="['Added public ascents listing to problem details page']"></release-note>
            <release-note title="0.9.2" :notes="['Possibility list your hardest ascents (works from ranking\'s \'my rank\')']"></release-note>
            <release-note title="0.8.36 (2022-11-10)" :notes="['Re-added ranking. Let us see if it works']" />
            <release-note title="0.8.33 (2022-10-30)" :notes="['Fixed some issues with small screen','Added change notes']" />
            <release-note title="0.8.32 (2022-10-30)" :notes="['Fixed result view layout','Added better refresh countdown indicator for result list' ]" />
          </f7-tab>
        </f7-tabs>



      </f7-block>
      </f7-page>
    </f7-popup> 
    
</template>
<script setup>
import ReleaseNote from '@components/ui/ReleaseNote.vue'
defineProps({
  opened : Boolean,
})
const emit = defineEmits(['close'])
</script>
