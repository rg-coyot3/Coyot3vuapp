<script setup>
import {ref } from 'vue';
const props = defineProps({
  config : {
    type: Object,
    required : true
  }
})
let wh = `${props.config.d3sktop.toolbar.size - 15}px`;

const strayBgColor = ref();
strayBgColor.value = 'orange';

const setBgColor = function(c){strayBgColor.value = c;}

let boolean_function = ref();
boolean_function.value = function(b){
  return props.appController.is_connected();
}

setInterval( () => {
  if(boolean_function.value() == true)setBgColor('lightgreen');
  else(setBgColor('darkred'));
},1000)
defineExpose({
  setBgColor,
  boolean_function
})


</script>

<template>
  <div class="csysicon">
    <div>C</div>
  </div>
</template>
<style scoped>
.csysicon{
  position: relative;
  background-color: v-bind(strayBgColor);
  color:white;
  width: v-bind(wh);
  min-width: v-bind(wh);
  height: v-bind(wh);
  min-height: v-bind(wh);
  border: 1px solid black;
  text-align: center;
  border-radius: 3px;
}
.csysicon>div{
  position: absolute;
  top:50%;
  left: 50%;
  transform: translate(-50%,-50%);
}
</style>

<script>



</script>
