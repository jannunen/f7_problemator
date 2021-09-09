<template >
    <div>
        <f7-block strong>
            <f7-chip outline :color="getColor(style)" @click="(evt) => onClicked(style,evt)" v-for="style in styles" :key="style"  :text="$t(style)"></f7-chip>
            <f7-chip @click="clearStyles" color="red">reset</f7-chip>
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
    emits : ['styles-changed'],
    setup(props,context) {
        const onClicked = (style,chip) => {

            let newStyles = null
            // Toggle style
            if (props.selectedStyles.includes(style)) {
                //remove
                newStyles= props.selectedStyles.filter(item => item != style)
            } else {
                // add
                newStyles= [...props.selectedStyles, style]
            }
            context.emit('styles-changed',newStyles)

        }
        const clearStyles = () => {
            context.emit('styles-changed',[])
        }
        const getColor = (style) => {
            if (props.selectedStyles.includes(style)) {
                return "red"
            }
            return null
        }
        return {
            onClicked,
            clearStyles,
            getColor,
        }

    }
    
}
</script>
<style >
    
</style>