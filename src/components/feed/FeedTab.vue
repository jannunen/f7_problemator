<template>
  <f7-page>
    <!-- Custom tab switcher -->
    <div class="p-toggle-group mx-4 mt-3 mb-2">
      <button
        class="p-toggle-group__btn"
        :class="{ 'p-toggle-group__btn--active': activeTab === 'follow' }"
        @click="activeTab = 'follow'"
      >Follow feed</button>
      <button
        class="p-toggle-group__btn"
        :class="{ 'p-toggle-group__btn--active': activeTab === 'new' }"
        @click="activeTab = 'new'"
      >New problems</button>
    </div>

    <f7-tabs>
      <f7-tab id="feed-1" class="p-2 page-content" :tab-active="activeTab === 'follow'">
        <div v-if="activeTab === 'follow'">
          <div class="text-center py-4" v-if="feedLoading">
            <div class="p-spinner"></div>
            <div class="text-sm mt-2 p-text-muted">Loading feed...</div>
          </div>
          <div v-else>
            <f7-list v-if="feed.length > 0" media class="p-2 my-0" problem-list>
              <feed-item
                v-for="item in feed"
                :key="item.id"
                :item="item"
                @click="() => onStartNavigate(item)"
              >
              </feed-item>
            </f7-list>
          </div>
        </div>
      </f7-tab>
      <f7-tab id="feed-2" class="p-2 page-content" :tab-active="activeTab === 'new'">
        <div v-if="activeTab === 'new'">
          <new-problems></new-problems>
        </div>
      </f7-tab>
    </f7-tabs>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'
import { onMounted, ref, computed } from 'vue'
import FeedItem from '@components/feed/FeedItem.vue'
import NewProblems from '@components/feed/NewProblems.vue'
import { useStore } from 'vuex'

const store = useStore()
const activeTab = ref('follow')
const feed = computed(() => store.state.feed)
const feedLoading = computed(() => store.state.feedLoading)
// Set feed reloading every 10 mins.
setInterval(() => {
  store.dispatch('getFeed')
}, 600000)
const onStartNavigate = (item) => {
  f7.views.main.router.navigate('/problem/' + item.problem.id + '/popup', {
    props: { problem : item.problem },
  })
}
</script>
