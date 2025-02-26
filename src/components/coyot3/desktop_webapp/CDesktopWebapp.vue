<script setup>
import { ref, onMounted} from 'vue'
import CToolbar from '../toolbar/CToolbar.vue';
import CDesktopWebapp  from './CDesktopWebapp.js';
//vars
  //input
const props = defineProps({
  config : {
    type : Object,
    required : true
  }
})
  //local
  let cdconf = {
    toolbar : {
      title : "CDWA",
      options : {
        position : props.config.d3sktop.toolbar.position,
        width : props.config.d3sktop.toolbar.size,
      }
    }
  }
  

  let viewport = { top : 0 , bottom : 0, left : 0, right : 0};
  switch(cdconf.toolbar.options.position){
    case "top":viewport.top = cdconf.toolbar.options.width; viewport.left = 0;break;
    case "right":viewport.right = cdconf.toolbar.options.width;viewport.top = 0; break;
    case "left":viewport.left = cdconf.toolbar.options.width;viewport.top = 0; break;
    case "bottom":
    default:viewport.bottom = cdconf.toolbar.options.width;viewport.left = 0;
  }
  const ctoolbar = ref();
  let viewportStyle;
  switch(cdconf.toolbar.options.position){
    case 'top':
      viewportStyle=`position: absolute; top: ${viewport.top}px;right : 0; width: 100vw; height : calc( 100vh - ${viewport.top}px);`;
      break;
    case 'right':
      viewportStyle=`position: absolute; right: ${viewport.right}px;top : 0; height: 100vh; width : calc( 100vw - ${viewport.top});`;
      break;
    case 'left':
      viewportStyle=`position: absolute; left: ${viewport.left}px;top : 0; height: 100vh; width : calc( 100vw - ${viewport.top}px);`;
      break;
    case 'bottom':
    default:
      viewportStyle=`position: absolute; bottom: ${viewport.bottom}px;right : 0; width: 100vw; height : calc( 100vh - ${viewport.top}px);`;
  }
  console.log(`VIEWPORT!!! : ${viewportStyle}`)

//constr
onMounted( () => {
  let conf = {...props.config};
  //
  conf.d3sktop.viewport = viewport;
  conf.d3sktop.viewportRoot = 'desktopviewport';
  console.log(`mounted desktop webapp vue`);
  let manager = new CDesktopWebapp(conf);
  manager.setToolbar(ctoolbar.value.manager());
  //modul3xample.value.setviewport(viewport);
  window.CAppControll3r = manager.appcontroller();
  manager.Init();
  manager.Start();
});
//expositions


//meta


</script>

<template>
  <div id="desktopviewport" :style="viewportStyle"></div>
  <CToolbar 
    ref="ctoolbar"
    :options="cdconf.toolbar.options"
  />

  <!--CModul3xtContent
    target="http://localhost:8080/example.html"
  
  /-->

  
</template>


