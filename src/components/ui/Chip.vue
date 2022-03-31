<template>
    <div @click="toggle" :class="[...getExtraStyles,'flex', 'border','justify-center','items-center','rounded-full', 'm-1','px-2','text-center','text-sm']">
        {{ text }}
    </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
export default {
    props : {
        color : {

        },
        text : {
            type : String,
            default : null,
        },
        togglable : {
            type : Boolean,
            default : true,
        }, 
        checked : {
            type : Boolean,
            default : false,
        }
    },
    emits : ['click'],
    setup(props,context) {
        const selected = ref(false)
        const toggle = () => {
            if (props.togglable) {
                selected.value = !selected.value
            }
            context.emit('click')
        }
        const getExtraStyles = computed(() => {
            if (selected.value || props.checked) {
                return ['border','border-red-500']
            }
            return []
        })
        return {
            selected,
            getExtraStyles,
            toggle,
        }
    },

}
</script>

<style>

</style>