<script setup>
import { ref, onMounted} from 'vue'
import CToolbar from '../toolbar/CToolbar.vue';
import CDesktopWebapp  from './CDesktopWebapp.js';
import VueWinBox from 'vue-winbox';
//vars
  //input

  //local
  let cdconf = {
    toolbar : {
      title : "CDWA",
      options : {
        position : "bottom",
        width : 35,
      }
    }
  }

  let viewport = { top : 0 , bottom : 0, left : 0, right : 0};
  switch(cdconf.toolbar.options.position){
    case "top":viewport.top = cdconf.toolbar.options.width+4;break;
    case "right":viewport.right = cdconf.toolbar.options.width+4;break;
    case "left":viewport.left = cdconf.toolbar.options.width+4;break;
    case "bottom":
    default:viewport.bottom = cdconf.toolbar.options.width+4;
  }
  const ctoolbar = ref();


  function toolbarOptionClicked(id){
    console.log(`cdesktopwebapp : toolbar-opt-clicked : ${id}`)
  }

//constr
let examplemodRef= ref();

function cbfunc(content){
  console.log(`cbfunc : setting body content:`)
  let div = document.createElement('span');
  div.innerHTML = content.trim();
  examplemodRef.value.winboxContainer().mount(div);
}
function onjsonfunc(o){
  console.log(`ON JSON FUNC : ${JSON.stringify(o)}`);
}
function onjsloaded(err){
  if(err){console.error(`error loading js : ${err}`)}
  else{
    console.log(`javascript loaded`);
  }
}

onMounted( () => {
  console.log(`mounted desktop webapp vue`);
  let manager = new CDesktopWebapp({
    viewport : viewport
  });
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

  <CToolbar 
    ref="ctoolbar"
    :options="cdconf.toolbar.options"
  />

  <!--CModul3xtContent
    target="http://localhost:8080/example.html"
  
  /-->

  
</template>


