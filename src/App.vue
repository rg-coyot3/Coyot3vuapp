<script setup>
import { ref , reactive, onMounted }  from 'vue'
import CDesktopWebapp from './components/coyot3/desktop_webapp/CDesktopWebapp.vue'

const title="hola mundo";

let desktopApp = ref();

onMounted( () => {
  console.log(`montada app `)
  
});



</script>

<template>


<CDesktopWebapp
  ref="desktopApp"
></CDesktopWebapp>

</template>
<style scoped>
</style>
