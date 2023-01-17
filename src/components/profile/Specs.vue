<template>
  <div class="flex justify-between -mt-36">
    <div>
      <table class="w-32">
        <tr>
          <td>Weight</td>
          <td>{{ profile.weight }}kg</td>
        </tr>
        <tr>
          <td>Height</td>
          <td>{{ profile.height }}cm</td>
        </tr>
        <tr>
          <td>Ape index</td>
          <td>{{ profile.apeindex }}cm</td>
        </tr>
        <tr>
          <td>Age</td>
          <td>{{ profile.age }}</td>
        </tr>
      </table>
    </div>
    <div>
      <div class="">
        <div class="text-right  mb-2">Joined: {{ dayjs(profile.added).format("YYYY-MM-DD") ?? 'Too long ago'}}</div>
        <div class="text-right font-bold mb-2"><i class="px-1 fa fa-location-dot"></i> {{ profile.city }}</div>
        <social-buttons :profile="profile" />
      </div>
    </div>
  </div>
</template>
<script setup>
import SocialButtons from '@components/profile/SocialButtons.vue'
import dayjs from 'dayjs'
const props = defineProps({
  profile: Object,
})
</script>
