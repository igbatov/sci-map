<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api.ts";
export default defineComponent({});

api.init();

api.getCurrentUser().then(user => {
  console.log(user);
});

//api.saveMap("hahaha")
</script>
