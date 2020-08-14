<template>
  <div v-if="content" class="infoBox" v-html="content"/>
</template>

<script>

export default {
  name: "Map",

  props: {
    content: String
  },
}
</script>

<style scoped>
  .infoBox {
    position: absolute;
    width: 33%;
    height: 100%;
    background-color: white;
    overflow: scroll;
    box-shadow: 5px 0 21px 3px rgba(122, 122, 119, 0.50);
  }
</style>
