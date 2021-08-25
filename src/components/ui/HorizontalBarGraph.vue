<template>
    <div ref="graphcontainer" class="graphcontainer" >
        <div >
            <canvas class="graph" ref="graph" :width="width" :height="height"></canvas>
        </div>
    </div>
</template>

<script>
import { computed,ref,onMounted,watchEffect, onUpdated, onUnmounted } from 'vue'
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }

}
export default {
    props : {
        height : {
            type : Number,
            default : 6,
        },
        radius : {
            type : Number,
            default : 5,
        },
        items : {
            type : Array,
            default : [],
        },
        max : Number,
        colours : {
            type : Array,
            default : [],
        }
    },
    setup(props,context) {
        const graphcontainer = ref(null)
        /*
        const width = ref(0)
        const height = ref(0)
        */
        const graph = ref(null)
        const manager = ref(null)
        const ctx = ref(null)
        const width = computed(() => { return graphcontainer.value?.clientWidth })
        const height = computed(() => { return graphcontainer.value?.clientHeight})
        watchEffect(() => {
            /*
            if (graphcontainer.value != null) {
                width.value = graphcontainer.value.clientWidth
                height.value = graphcontainer.value.clientHeight
            }
            */
        },{flush : 'post'})
        const draw = () => {
            const xmargin = 0.05
            const ymargin = 0.4
            const graphWidth = Math.round(width.value * (1-(xmargin*2)))
            if (ctx != null && !isNaN(graphWidth) && props.items.length > 0) {
                const yOffset = Math.round(ymargin*height.value)
                let xOffset =Math.round(xmargin*width.value)

                const graphHeight = props.height 
                // First draw gray
                ctx.value.fillStyle ="#c0c0c0";
                //ctx.value.fillRect(xOffset,yOffset,graphWidth,graphHeight)
                roundRect(ctx.value, xOffset, yOffset, graphWidth, graphHeight, 5, true, false)

                props.items.forEach((item,idx) => {
                    const itemWidth = Math.round((item / props.max)*graphWidth)
                    if (itemWidth > 0) {
                    let color = props.colours[idx]
                    if (color == null) {
                        color = "#"+Math.floor(Math.random()*16777215).toString(16);
                    }
                    ctx.value.fillStyle =color;
                    //ctx.value.fillRect(xOffset,yOffset,itemWidth,graphHeight)
                    //function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
                    // If ONLY bar, everything should be rounded...
                    if (props.items.length == 1) {
                      roundRect(ctx.value, xOffset, yOffset, itemWidth, graphHeight, 5, true, false)
                    } else if (idx == 0) {
                        // round leftmost..
                      const leftRadius = {tr : 0, tl: 5, br : 0, bl : 5}
                      roundRect(ctx.value, xOffset, yOffset, itemWidth, graphHeight, leftRadius, true, false)
                    } else if ( (idx+1) == props.items.length) {
                        // ROund rightmost
                      const rightRadius = {tr : 5, tl: 0, br : 5, bl : 0}
                      roundRect(ctx.value, xOffset, yOffset, itemWidth, graphHeight, rightRadius, true, false)
                    }

                    xOffset += itemWidth
                    }
                })
            }

        }
        onMounted(() => {
            ctx.value = graph.value.getContext('2d')
            draw()

        })
        const myEventHandler = () => {
                width.value = graphcontainer.value.clientWidth
                height.value = graphcontainer.value.clientHeight

        }
        window.addEventListener("resize", myEventHandler);
        onUnmounted(() => {
            window.removeEventListener("resize", myEventHandler);
        })
        onUpdated(() => {
            draw()
        })
        return {
            width,
            graphcontainer,
            graph,
            height,
        }

    }

}
</script>

<style>
.graphcontainer {
    width : 100%;
}

</style>