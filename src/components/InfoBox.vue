<template>
  <transition name="slide">
    <div v-if="content" class="infoBox" v-html="content"/>
  </transition>
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
    padding: 20px;
    position: absolute;
    width: 33%;
    height: 100%;
    background-color: white;
    overflow: scroll;
    box-shadow: 5px 0 21px 3px rgba(122, 122, 119, 0.50);
  }

  .slide-enter-active, .slide-leave-active {
    transform: translateX(0);
    transition: transform .3s .1s, opacity .3s .1s, width .3s;
  }
</style>
