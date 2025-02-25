<script setup>
import CModul3 from '../module/CModul3.vue';
import { CModul3xample } from './CModul3xample';
import { ref ,onMounted } from 'vue';
import CConfig from '../../../assets/config/confScrach.json'
///


// ref
let winboxcontainer;
let itemsList = ref([1,2,3]);
let manager = new CModul3xample();
manager.Init();
manager.Start();


let containerInstance = ref();
let containerConfig = {
  show : true,
  id : 'modul3xample',
  title : "mi título",

  canClose : false,
  dimensions : { x : '5%', y : '5%', w : '33%', h : '33%'},
  winboxoptions : null
}





//constr
const setviewport = (v) => containerInstance.value.setViewport(v);
onMounted( () => {
  console.log(`*** ${JSON.stringify(CConfig)}`)
  winboxcontainer = containerInstance.value.wbcontainer;
  winboxcontainer.top = 100; 
  manager.onPulse = (lst) => {itemsList.value = lst; /*console.log(`current L[${lst}]`)*/};

});

//expose

defineExpose({
  winboxcontainer,
  manager,
  setviewport})

</script>
<template>
  <CModul3 ref="containerInstance"
    :id="containerConfig.id"
    :title="containerConfig.title"
    :dimensions="containerConfig.dimensions"

  >
    <div v-for="item in itemsList">- {{ item }}- </div>

  </CModul3>
</template>
<script>
console.log(`this is a script! [${window.CAppControll3r != undefined?window.CAppControll3r.hello():'OOOOOHhhhh...'}]`)
export default {
  setup(){
    return {}
  }
};
</script>
