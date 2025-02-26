<script setup>
import { ref , reactive, onMounted, defineProps }  from 'vue'
import CDesktopWebapp from './components/coyot3/desktop_webapp/CDesktopWebapp.vue'

const props = defineProps({
  config : {
    type : Object,
    required : true
  }
});
let desktopApp = ref();

onMounted( () => {
  console.log(`montada app `)
  
});



</script>

<template>


<CDesktopWebapp
  ref="desktopApp"
  :config="props.config"
></CDesktopWebapp>

</template>
<style scoped>
</style>
