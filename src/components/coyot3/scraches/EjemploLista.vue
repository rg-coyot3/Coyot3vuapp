<script setup>
defineProps({
  title : {
    type : String,
    required : true
  }
});
import { ref , onMounted } from 'vue';

// give each todo a unique id
let id = 0;

const pElementRef = ref(null);

const newTodo = ref('');
const todos = ref([
  { id: id++, text: 'Learn HTML' },
  { id: id++, text: 'Learn JavaScript' },
  { id: id++, text: 'Learn Vue' }
])
function addTodo() {
  todos.value.push({ id: id++, text: newTodo.value })
  newTodo.value = ''
}

function removeTodo(todo) {
  todos.value = todos.value.filter((t) => t !== todo)
}

onMounted( () => {
  console.log(`ha sido montado!`);  
});

// async function fetchData() {
//   todoData.value = null
//   const res = await fetch(
//     `https://jsonplaceholder.typicode.com/todos/${todoId.value}`
//   )
//   todoData.value = await res.json()
// }

// fetchData()
</script>

<template>
  <form ref="pElementRef" @submit.prevent="addTodo">
    <input v-model="newTodo" required placeholder="new todo">
    <button>Add Todo</button>
  </form>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.text }}
      <button @click="removeTodo(todo)">X</button>
    </li>
  </ul>


</template>

