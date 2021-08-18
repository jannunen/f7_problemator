<template>
    <f7-block>
        {{ width }}x{{ height }}
    <div @mousemove="checkForHits" style="border : 1px solid gray; position : relative; display : flex; flex-direction : column; align-items : center" v-if="map != null">
        <img ref="imagemapcontainer" style="opacity : 0.8; width : 100%;" :src="map.imageurl" :usemap="'#image-map-'+map.id"/>
        <canvas ref="active" style="border : 1px solid blue; position : absolute;z-index : 1000; " :width="width" :height="height"> </canvas>
        <canvas ref="graph" style="border : 1px solid red; position : absolute;z-index : 1000; " :width="width" :height="height"> </canvas>
    </div>
    </f7-block>
</template>

<script>
import { watchEffect,onUpdated,onUnmounted, onMounted, ref ,reactive} from 'vue'
const chunkArray = (inputArray,perChunk) => {
    return inputArray.reduce((all,one,i) => {
    const ch = Math.floor(i/perChunk); 
    all[ch] = [].concat((all[ch]||[]),one); 
    return all
    }, [])
}

export default {

    props : {
        map : Object,
    },
    methods : {
    },

  setup(props) {
      const x = ref(0)
      const y = ref(0)
      const inside = (x,y, vs) => {
            // ray-casting algorithm based on
            // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
            
            
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0], yi = vs[i][1];
                var xj = vs[j][0], yj = vs[j][1];
                
                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            
            return inside;
        };
      const checkForHits = (event) => {
           const rect = event.target.getBoundingClientRect();
          const mx= event.clientX-rect.left;
          const my= event.clientY-rect.top;
          // Check if this is a hit in a wall coord...
            const hits = wallAreas.filter((coords) => {
                return inside(mx,my,translateCoords(coords))
            })
            console.log(mx,my)
            console.log(hits.length)
            if (hits.length > 0) {
                // We have hits!
                // Now highlight these with a stroke.
                // Clear active canvas first
                ctxActive.value.clearRect(0,0,width.value,height.value)
                hits.forEach((coords)=> {
                    polygon(ctxActive.value,translateCoords(coords),true,{lineWidth : 1})
                    graph.value.style.cursor = 'pointer'
                })
            } else  {
                graph.value.style.cursor = "default"
            }

      }

    const polygon = (ctx, coords,stroke=false,opt={}) => {
        ctx.beginPath();

        for (let idx in coords) {
            const coord = coords[idx]
            if (idx == 0) {
                ctx.moveTo(coord[0],coord[1]);
            } else {
                ctx.lineTo(coord[0],coord[1]);
            }
        }
        ctx.closePath();
        if (stroke) {
            console.log("stroking")
            ctx.globalAlpha = 0.9
            ctx.lineWidth = opt.lineWidth || 2
            ctx.strokeStyle = "red"
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ECF219';
            ctx.globalAlpha = 0.8
            ctx.fill();
        }
    }
      const areas = ref(null)
        const width = ref(0)
        const height = ref(0)
        const graph = ref(null)
        const active = ref(null)
        const imagemapcontainer = ref(null)
        const ctx = ref(null)
        const ctxActive = ref(null)
      let wallAreas = reactive([])
      // Translates coordinates by getting the image size, then the 
      // container size and applying the ratio for x and y
      const translateCoords = (coords) => {
          const ratiox = width.value / props.map.width 
          const ratioy = height.value/ props.map.height
          return coords.map( (item) => {
              return [Math.round(ratiox*item[0]),Math.round(ratioy*item[1])]
          })

      }
        const draw = () => {
            if (width.value == 0 || height.value == 0) {
                return
            }
            wallAreas.map((coords) => {
                const translatedCoords = translateCoords(coords)
                polygon(ctx.value,translatedCoords)
            })
        }
      const parseRawPixels = (map) => {
            // Regex the hell out of the imagemap html
            const mapRows = map.match( /alt="(.*?)".*?title="(.*?)".*?coords="(.*?)"/g)
            for (const idx  in mapRows) {
                const mapRow = mapRows[idx]
                const mapAttributesMatch = mapRow.match( /alt="(.*?)".*?title="(.*?)".*?coords="(.*?)"/)
                const alt = mapAttributesMatch[1]
                const title = mapAttributesMatch[2]
                const coords = mapAttributesMatch[3]
                wallAreas = [...wallAreas,chunkArray(coords.split(",").map((item)=>parseInt(item)),2)]
            }
        }
        const myEventHandler = () => {
                width.value = imagemapcontainer.value.clientWidth
                height.value = imagemapcontainer.value.clientHeight

        }
    window.addEventListener("resize", myEventHandler);
        onUnmounted(() => {
            window.removeEventListener("resize", myEventHandler);
        })
        watchEffect(() => {
                width.value = imagemapcontainer.value.clientWidth
                height.value = imagemapcontainer.value.clientHeight
        },{flush : 'post'})
      onMounted(() => {
          // Argh. Create stuffs so that the imagemap works also when scaled.
          ctx.value = graph.value.getContext('2d')
          ctxActive.value = active.value.getContext('2d')
          parseRawPixels(props.map.imagemap)  
          setTimeout(() => {
              draw()
          },100)
      })
      onUpdated(() => {
          console.log("update")
          draw()
      })
      return {
          width,
          height,
          imagemapcontainer,
          graph,
          checkForHits,
          active,
          x,
          y,
      }

  }
}
</script>

<style>

</style>