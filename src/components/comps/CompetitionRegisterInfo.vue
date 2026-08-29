<template>
  <div class="comp">
    <!-- Three questions in the order a climber asks them: when and where is
         it, which category is mine, and am I in it. -->
    <header class="comp__head">
      <h1 class="comp__name">{{ comp.name }}</h1>
      <div class="comp__facts">
        <span class="fact fact--strong">{{ toLocalTime(comp.compdate) }}</span>
        <span v-if="comp.location" class="fact">{{ comp.location }}</span>
        <span class="fact">
          {{ t('comps.tick_time_span') }}
          {{ toLocalTime(comp.timespan_start) }}–{{ toLocalTime(comp.timespan_end) }}
        </span>
      </div>

      <!-- A link, not a slab. Results are worth one line, not the widest
           element on the page above the thing you came to do. -->
      <a :href="getResultsLink" class="comp__results link external" :title="'ID ' + comp.id">
        {{ t('comps.open_results') }} →
      </a>
    </header>

    <!-- Long by nature: organisers paste dates, rules and a URL into it. Two
         lines by default, opened on request, so it never stands between a
         climber and the categories. -->
    <section v-if="comp.register_form_text" class="comp__blurb">
      <div :class="{ 'comp__blurbtext--clamped': !blurbOpen }" class="comp__blurbtext" v-html="comp.register_form_text" />
      <button type="button" class="comp__more" @click="blurbOpen = !blurbOpen">
        {{ blurbOpen ? t('comps.show_less') : t('comps.show_more') }}
      </button>
    </section>

    <section class="comp__cats">
      <h2 class="comp__section">{{ t('comps.categories') }}</h2>
      <p class="comp__note">{{ t('comps.fastest_hands_wins') }}</p>

      <ul v-if="comp.categories.length > 0" class="cats">
        <li v-for="cat in comp.categories" :key="cat.id" class="cat" :class="catClass(cat)">
          <div class="cat__head">
            <span class="cat__name">{{ cat.nimi }}</span>

            <!-- The state is the loudest thing on the card: it is the answer
                 to "am I in this one", which is why the page was opened. -->
            <span v-if="isCategoryFull(cat)" class="chip chip--full">{{ t('comps.full') }}</span>
            <span v-else-if="isRegistered(cat.id) && isPaid(cat.id)" class="chip chip--in">{{ t('comps.paid') }}</span>
            <span v-else-if="isRegistered(cat.id)" class="chip chip--unpaid">{{ t('comps.registered_unpaid') }}</span>
            <span v-else-if="!isRegistrationPossible(comp, nowUTC)" class="chip chip--closed">{{ t('comps.closed') }}</span>
          </div>

          <!-- Facts on one wrapping line rather than a four-row table with a
               metre of space between label and value. -->
          <p class="cat__facts">
            <span v-if="!isNaN(parseFloat(cat.pivot.price))">{{ cat.pivot.price }}€</span>
            <span v-else class="cat__free">{{ t('comps.no_entry_fee') }}</span>

            <span v-if="!isNaN(parseFloat(cat.pivot.memberprice))" class="cat__member">
              {{ t('comps.special_price') }} {{ cat.pivot.memberprice }}€
            </span>

            <span>{{ spotsText(cat) }}</span>
            <span>{{ t('comps.registered_count', { n: registeredCount(cat) }) }}</span>
          </p>

          <p v-if="!isNaN(parseFloat(cat.pivot.memberprice))" class="cat__hint">
            {{ t('comps.special_price_hint') }}
          </p>

          <div class="cat__act">
            <template v-if="isCategoryFull(cat)">
              <span class="cat__closedtext">{{ t('comps.category_full_text') }}</span>
            </template>

            <template v-else-if="isRegistered(cat.id)">
              <p-button class="cat__quit" @click="askUnRegister(cat)">
                {{ t('comps.quit_comp') }}
              </p-button>
            </template>

            <template v-else-if="isRegistrationPossible(comp, nowUTC)">
              <button class="cat__register" :disabled="isRegistering" @click="askRegister(cat)">
                {{ isRegistering ? t('comps.registering') : t('comps.register_button') }}
              </button>
              <span class="cat__deadline">
                {{ t('comps.registration_ends') }} {{ toLocalTime(comp.registration_end) }}
              </span>
            </template>

            <template v-else>
              <span class="cat__closedtext">{{ t('comps.registration_has_closed') }}</span>
            </template>
          </div>
        </li>
      </ul>

      <p v-else class="comp__empty">{{ t('comps.no_categories_with_help') }}</p>
    </section>

    <p class="comp__total">
      {{ t('comps.paid_contenders_in_total') }}: {{ comp.paidregistrations?.length || 0 }}
    </p>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { webendpoint } from '@js/api'
import PButton from '@components/PButton.vue'
import { ref, computed} from 'vue'
import { confirm, toaster } from '@helpers/notifications.js'
import { handleValidationErrors } from '@helpers'
import { isRegistrationPossible, toLocalTime } from '@helpers/component.helpers'

const nowUTC = ref(dayjs().utc())
setInterval(() => nowUTC.value = dayjs().utc(),1000*30)
import dayjs from 'dayjs'
const store = useStore()
// Same host every other call uses, so this cannot drift away from it again.
const getResultsLink = computed(() => `${webendpoint}/comps/${props.comp.id}/results`)

const isRegistering = ref(false)
const blurbOpen = ref(false)

/** Registered in this category, paid or not — the number a climber compares
 *  against the cap. Splitting it into paid and unpaid is the organiser's
 *  concern, not the one deciding whether to enter. */
const registeredCount = (cat) => (cat.participants?.length || 0) + (cat.unpaidparticipants || 0)

const spotsText = (cat) => {
  const max = cat.pivot?.maxparticipants
  if (max == null) return t('comps.unlimited_spots')

  // Spots left, not the cap: "4 left" is the fact that decides whether to
  // register now or think about it.
  const left = Math.max(0, max - registeredCount(cat))

  return t('comps.spots_left', { n: left })
}

const catClass = (cat) => ({
  'cat--in': isRegistered(cat.id) && isPaid(cat.id),
  'cat--unpaid': isRegistered(cat.id) && !isPaid(cat.id),
  'cat--shut': isCategoryFull(cat) || !isRegistrationPossible(props.comp, nowUTC.value),
})
const { t } = useI18n()
const props = defineProps({
  comp: Object,
})
const climber = computed(() => store.state.climber)

const isRegistered = (catid) => {
  if (climber.value == null) {
    return false
  }
  return (props.comp.paidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) != null  ) ||
  (props.comp.unpaidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) != null  ) 
}
const isPaid = (catid) => {
  if (climber.value == null) {
    return false
  }
  const row = props.comp.paidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) 
  return row != null && row.pivot.paid != null && dayjs(row.pivot.paid).year() != 0
}
const isCategoryFull = (cat) => cat.maxparticipants - cat.participants.length <= 0
const user = computed(() => store.state.user)
const getPaymentLink = (cat) => {
    return `https://www.problemator.fi/t/problemator/competitions/payment/${cat.compid}?contid=${user.value?.id}`
}
const askUnRegister = (cat) => {
    confirm(t('comps.are_you_sure_you_want_to_unregister'),null,() => {
        // send registration
        const payload = {
            compid : props.comp.id,
            category : cat.id,
            contenderid : climber.value.id
        }
        store.dispatch('unRegisterToComp',payload)
        .then(ret => {
            toaster(ret.message)
        })
    },() => {
        // cancle
    })
}


const askRegister = (cat) => {
    confirm(t('comps.are_you_sure_you_want_to_register'),null,() => {
        // send registration
        const payload = {
            compid : props.comp.id,
            category : cat.id,
        }
        isRegistering.value = true
        store.dispatch('registerToComp',payload)
        .then(ret => {
            toaster(ret.message)
        })
        .catch(err => toaster(handleValidationErrors(err)))
        .finally(() => {
            isRegistering.value = false

        })
    },() => {
        // cancle
    })
}

const getContenderCount = (cat) => {
  if (cat.paidregistrations == null) {
    return 0
  }
  return cat.paidregistrations.length
}
</script>

<style scoped>
/* Tokens, not raw Tailwind colours. The old markup wrote bg-gray-900,
   border-blue-800 and text-green-400 directly, which ignore the theme and
   drift from every other screen. */

.comp {
  /* A measure, so label-and-value pairs stay adjacent instead of stretching
     to the far edges of a tablet with a metre of nothing between them. */
  max-width: 44rem;
  margin: 0 auto;
  padding: 0 0 1.5rem;
}

.comp__head { margin-bottom: 1rem; }

.comp__name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--p-text);
}

.comp__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  margin-top: 0.45rem;
}

.fact {
  font-size: 0.82rem;
  color: var(--p-text-muted);
}

.fact--strong {
  color: var(--p-text);
  font-weight: 600;
}

.comp__results {
  display: inline-block;
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--p-accent);
  text-decoration: none;
}

.comp__blurb { margin-bottom: 1.25rem; }

.comp__blurbtext {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--p-text-secondary);
}

.comp__blurbtext--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comp__blurbtext :deep(a) { color: var(--p-accent); }

.comp__more {
  margin-top: 0.3rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--p-accent);
  font-size: 0.8rem;
}

.comp__section {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.comp__note {
  margin: 0.3rem 0 0.75rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--p-text-dim);
}

.cats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cat {
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

/* The state colours the whole card, not just a word inside it: which
   category you are in should be findable without reading. */
.cat--in { border-color: rgba(74, 222, 128, 0.35); }
.cat--unpaid { border-color: rgba(250, 204, 21, 0.35); }
.cat--shut { opacity: 0.65; }

.cat__head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.cat__name {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--p-text);
}

.chip {
  margin-left: auto;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.chip--in { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.chip--unpaid { background: rgba(250, 204, 21, 0.15); color: #facc15; }
.chip--full,
.chip--closed { background: rgba(255, 255, 255, 0.07); color: var(--p-text-muted); }

/* One wrapping line of facts, separated by rules rather than laid out as a
   table: four labels each pinned opposite its value read as a form. */
.cat__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.55rem;
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  color: var(--p-text-muted);
}

.cat__facts > span + span {
  padding-left: 0.55rem;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.cat__free { color: var(--p-success, #4ade80); }
.cat__member { color: var(--p-text-secondary); }

.cat__hint {
  margin: 0.3rem 0 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--p-text-dark);
}

.cat__act {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-top: 0.7rem;
}

/* Sized to its words. A full-width slab per category made five identical
   bars down the page and no sense of which one to press. */
.cat__register {
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: 10px;
  background: var(--p-accent);
  color: var(--p-text-dark);
  font-size: 0.88rem;
  font-weight: 700;
}

.cat__register:disabled { opacity: 0.55; }

.cat__quit {
  background: none !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  color: #ef4444 !important;
}

.cat__deadline,
.cat__closedtext {
  font-size: 0.76rem;
  color: var(--p-text-dim);
}

.comp__empty {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(250, 204, 21, 0.3);
  background: rgba(250, 204, 21, 0.08);
  font-size: 0.85rem;
  color: var(--p-text);
}

.comp__total {
  margin: 1rem 0 0;
  font-size: 0.78rem;
  color: var(--p-text-dark);
}
</style>
