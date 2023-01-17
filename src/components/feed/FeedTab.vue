<template>
  <f7-page>
    <f7-toolbar tabbar :position="isBottom ? 'bottom' : 'top'" @toolbar:show="init">
      <f7-link tab-link="#feed-1" tab-link-active>Follow feed</f7-link>
      <f7-link tab-link="#feed-2" >New problems</f7-link>
    </f7-toolbar>

    <f7-tabs>
      <f7-tab id="feed-1" class="p-2 page-content" tab-active>
        <div class="text-center" v-if="feedLoading">
              <f7-preloader class="my-2"></f7-preloader>
              Loading feed...
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
      </f7-tab>
      <f7-tab id="feed-2" class="p-2 page-content" >
        <new-problems ></new-problems>
      </f7-tab>
    </f7-tabs>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'
import { onMounted, ref, computed } from 'vue'
import Loading from '@pages/Loading.vue'
import FeedItem from '@components/feed/FeedItem.vue'
import NewProblems from '@components/feed/NewProblems.vue'
import { useStore } from 'vuex'

const store = useStore()
const isBottom = ref(false)
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
