<script setup>
import { ref , reactive } from 'vue'
import { onMounted } from 'vue';
import { ToolbarManager } from './CToolbar.js';
import 'w2ui/w2ui-2.0.css';


const props = defineProps({
  title : {
    type : String
  },
  config : {
    type : Object,
    required : true
  }
});
const emit = defineEmits([]);
// give each todo a unique id
let id = 0;
let conf = {...props.config};
conf.d3sktop.toolbar.selector = '#ctoolbar';
conf.d3sktop.toolbar.id = 'maintoolbar';

let toolbarManager = new ToolbarManager(conf);

toolbarManager.onRendered = () => {
  
};
const tbwidth = props.config.d3sktop.toolbar.size;
const tbposition = props.config.d3sktop.toolbar.position;
let tbcontainerstyle = null;
switch(tbposition){
  case 'top':
    tbcontainerstyle = `
      position:absolute;
      top: 0;
      left:0;
      height: ${tbwidth}px;
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
      width: ${tbwidth}px;
      border-right: 1px solid black;
    `;
    break;
  case 'right':
    tbcontainerstyle = `
      position:absolute;
      top: 0;
      right:0;
      height:100%;
      width: ${tbwidth};
      border-left: 1px solid black;
    `;
    break;
  case 'bottom':
  default:
    tbcontainerstyle = `
      position:absolute;
      bottom: 0;
      left:0;
      height: ${tbwidth}px;
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