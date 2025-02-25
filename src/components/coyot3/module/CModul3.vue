<script setup>
//imports
import { ref, VueElement } from 'vue'
import { onMounted } from 'vue';
import { VueWinBox } from 'vue-winbox'

//properties
// ext  
const props = defineProps({
  id : {
    type : String,
    required : true
  },
  title : {
    type : String
  },
  dimensions : {
    type : Object
  },  
  viewport : {
    type : Object
  },
  winboxoptions : {
    type : Object
  }
});

// local
const wbRef = ref();

let options = {
  title: 'Current',
  class: 'modern',
  x : 5,
  y : 5,
  width : '33%',
  height : '33%',
  top : 0,
  
  bottom : 0,
  rigtht : 0,
  left : 0,

  class : ["no-close","no-full"]
}
let wbcontainer = { wb : null};
options = Object.assign(options, props.winboxoptions);
options = Object.assign(options, props.viewport);
options = Object.assign(options, props.dimensions);
options.title = props.title;


// methods
let __viewport = { top : 0, bottom : 0, left : 0, right : 0}
function setViewport(vobject){
  
  __viewport = Object.assign(__viewport,vobject);
  wbcontainer.wb.top = __viewport.top;
  wbcontainer.wb.bottom = __viewport.bottom;
  wbcontainer.wb.left = __viewport.left;
  wbcontainer.wb.right = __viewport.right;
  wbcontainer.wb.resize().move();
  
}


//? constructor

const construction = function(){
  wbcontainer.wb = wbRef.value.winbox;
  
  
}
onMounted( () => {
  construction();
});
//exposure
function winboxContainer(){return wbcontainer.wb;}
defineExpose({
  wbcontainer,
  setViewport,
  winboxContainer
})
</script>


<template>
  <!--@onmove="onMove"-->
  <VueWinBox
    ref="wbRef"
    :options="options"
    
  >
  <slot></slot>
  </VueWinBox>
</template>



<!--

  winprops : {
    show : true | false,
    x : '%',
    y : '%',
    w : '%',
    h : '%',
    close : false,
  
  }

winbox options : 
  id 
  index : z-indez
  title : 
  html : mount innerHTML
  url : mount external url
  width
  height
  minwidth
  minheight
  maxwidth
  maxheight
  autosize
  overflow : false
  max : boolean automatic maximization
  min : boolean automatic minimization
  hidden : boolean automatic hide of the window
  model : boolean shows as modal
  background : string : css
  border : number : width in css units
  icon : string : url source
  class : string : one or more class-names

  oncreate : 
  onmove : 
  onresize : 
  onfullscreen : 
  onminimize : 
  onmaximize : 
  onrestore : 
  onhide :
  onshow : 
  onclose : 
  onfocus : 
  onblur : looses focus
 
-->