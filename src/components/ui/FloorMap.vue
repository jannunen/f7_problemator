<template>
    
    <div @mouseup="selectPolygon" @mousemove="checkForHits" style="position : relative; display : flex; flex-direction : column; align-items : center" v-if="map != null">
        <img @load="onImageLoaded" ref="imagemapcontainer" style="opacity : 0.9; width : 100%;" :src="map.imageurl" :usemap="'#image-map-'+map.id"/>
        <canvas ref="graph" style="; position : absolute;z-index : 1000; " :width="width" :height="height"> </canvas>
        <canvas ref="active" style=" position : absolute;z-index : 1000; " :width="width" :height="height"> </canvas>
    </div>
    
</template>

<script>
import { watchEffect,onUpdated,onUnmounted, onMounted, ref ,reactive} from 'vue'
import { useI18n } from 'vue-i18n'

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

  setup(props,context) {
       const { t, d, locale } = useI18n()
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
        const selectPolygon = (event) => {
           // First, check if a hit.
           const rect = event.target.getBoundingClientRect();
          const mx= event.clientX-rect.left;
          const my= event.clientY-rect.top;
          // Check if this is a hit in a wall coord...
            const hits = wallAreas.filter((wall) => {
                return inside(mx,my,translateCoords(wall.coords))
            })
            if (hits.length > 0) {
                // Send events about selected element.
                hits.forEach((wall)=> {
                console.log("Clicked on "+wall.alt)
                context.emit("area-selected",wall)

                })
            }

        }
      const checkForHits = (event) => {
           const rect = event.target.getBoundingClientRect();
          const mx= event.clientX-rect.left;
          const my= event.clientY-rect.top;
          // Check if this is a hit in a wall coord...
            const hits = wallAreas.filter((wall) => {
                return inside(mx,my,translateCoords(wall.coords))
            })
            if (hits.length > 0) {
                // We have hits!
                // Now highlight these with a stroke.
                // Clear active canvas first
                ctxActive.value.clearRect(0,0,width.value,height.value)
                hits.forEach((wall)=> {
                    polygon(ctxActive.value,translateCoords(wall.coords),true,{lineWidth : 1})
                    active.value.style.cursor = 'pointer'
                    ctxActive.value.font = '20px Arial';
                    ctxActive.value.fillText(wall.alt, mx, my-20);
                })
            } else  {
                active.value.style.cursor = "default"
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
            ctx.globalAlpha = 0.9
            ctx.lineWidth = opt.lineWidth || 2
            ctx.strokeStyle = "red"
            ctx.stroke();
        } else {
            ctx.fillStyle = '#EAD502';
            ctx.globalAlpha = 0.7
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
      const onImageLoaded = (evt) => {
        width.value = imagemapcontainer.value.clientWidth
        height.value = imagemapcontainer.value.clientHeight
      }
        const draw = () => {
            if (width.value == 0 || height.value == 0) {
                return
            }
            wallAreas.map((wall) => {
                const translatedCoords = translateCoords(wall.coords)
                polygon(ctx.value,translatedCoords)
            })
        }
      const parseRawPixels = (map) => {
            // Regex the hell out of the imagemap html
            const mapRows = map.match( /alt="(.*?)".*?title="(.*?)".*?coords="(.*?)"/g)
            for (const idx  in mapRows) {
                const mapRow = mapRows[idx]
                const altMatch = mapRow.match( /alt="(.*?)"/)
                const titleMatch = mapRow.match( /title="(.*?)"/)
                const coordsMatch = mapRow.match( /coords="(.*?)"/)
                const dataIDMatch = mapRow.match( /data-id="(.*?)"/)
                const alt = (altMatch != null) ? altMatch[1] : null
                const title = (titleMatch != null) ? titleMatch[1] : null
                const coords = (coordsMatch != null) ? coordsMatch[1] : null
                const dataID = (dataIDMatch != null) ? dataIDMatch[1] : null
                wallAreas = [...wallAreas,{alt, title, id : dataID, coords : chunkArray(coords.split(",").map((item)=>parseInt(item)),2)}]
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
        /*
        watchEffect(() => {
                width.value = imagemapcontainer.value.clientWidth
                height.value = imagemapcontainer.value.clientHeight
        },{flush : 'post'})
        */
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
          draw()
      })
      return {
          width,
          height,
          imagemapcontainer,
          graph,
          checkForHits,
          selectPolygon,
          onImageLoaded,
          active,
          x,
          y,
      }

  }
}
</script>

<style>

</style>