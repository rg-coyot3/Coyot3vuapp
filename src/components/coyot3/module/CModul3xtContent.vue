<script setup>
import { ref , onMounted } from 'vue'
import CModul3 from './CModul3.vue'

const props = defineProps({
  target : {
    type: String,
    required : true
  }
})
const cref = ref();

const containerConfig = {
  id : "5050505",
  title : "this is an external content"
}

onMounted(() => {
  cref.value.wbcontainer.wb.setUrl(props.target);
})

</script>
<template>
  <CModul3 ref="cref"
    :id="containerConfig.id"
    :title="containerConfig.title"
  
  >

  </CModul3>
</template>