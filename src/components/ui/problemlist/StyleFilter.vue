<template >
    <div>
        <f7-block strong>
            <f7-chip :color="getColor(style)" @click="(evt) => onClicked(style,evt)" v-for="style in styles" :key="style"  :text="$t(style)"></f7-chip>
        </f7-block>
        
    </div>
</template>
<script>
import { ref,onMounted } from 'vue'

export default {
    props : {
        selectedStyles : {
            type : Array,
            default : []
        },
        styles : {
            type : Array,
            default : [],
        },
    },
    setup(props,context) {
        const activeStyles = ref([])
        const onClicked = (style,chip) => {

            // Toggle style
            if (activeStyles.value.includes(style)) {
                //remove
                activeStyles.value = activeStyles.value.filter(item => item != style)
            } else {
                // add
                activeStyles.value = [...activeStyles.value, style]
            }
            context.emit('styles-changed',activeStyles.value)


        }
        onMounted(() => {
            activeStyles.value = props.selectedStyles
        })
        const getColor = (style) => {
            if (activeStyles.value.includes(style)) {
                return "green"
            }
            return null
        }
        return {
            onClicked,
            activeStyles,
            getColor,
        }

    }
    
}
</script>
<style >
    
</style>