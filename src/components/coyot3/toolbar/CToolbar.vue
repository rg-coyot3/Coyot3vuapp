<script setup>
import { ref , reactive } from 'vue'
import { onMounted } from 'vue';
import { ToolbarManager } from './CToolbar.js';
import 'w2ui/w2ui-2.0.css';


const params = defineProps({
  title : {
    type : String
  },
  options : {
    type : Object,
    required : true
  }
});
const emit = defineEmits([]);
// give each todo a unique id
let id = 0;

let toolbarManager = new ToolbarManager({
  selector : '#ctoolbar',
  id : 'maintoolbar',
  options : params.options
});

toolbarManager.onRendered = () => {
  
};

let tbcontainerstyle = null;
switch(params.options.position){
  case 'top':
    tbcontainerstyle = `
      position:absolute;
      top: 0;
      left:0;
      height: ${params.options.width};
      width:100%;
      border-bottom: 1px solid black;
    `;
    
    break;
  case 'left':
    tbcontainerstyle = `
      position:absolute;
      top: 0;
      left:0;
      height:100%;
      width: ${params.options.width};
      border-right: 1px solid black;
    `;
    break;
  case 'right':
    tbcontainerstyle = `
      position:absolute;
      top: 0;
      right:0;
      height:100%;
      width: ${params.options.width};
      border-left: 1px solid black;
    `;
    break;
  case 'down':
  default:
    tbcontainerstyle = `
      position:absolute;
      bottom: 0;
      left:0;
      height: ${params.options.width};
      width:100%;
      border-top: 1px solid black;
    `;

}



onMounted( () => {
  console.log("montada ctoolbar-vue")
  
  //toolbarManager.add_application_selector('texto','id');
});

// expose methods and objects:
const manager = function(){return toolbarManager};
defineExpose(
  {
    manager, 
  });

</script>





<template>
<div id="ctoolbar" :style="tbcontainerstyle">hola mundo</div>
</template>

<style>
  

</style>


<script>

</script>