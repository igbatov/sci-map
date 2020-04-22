<template>
  <svg :height="wh.height + 'px'" :width="wh.width + 'px'" :x="xy.x + 'px'" :y="xy.y + 'px'">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="text">{{title}}</text>
    <rect fill="none" stroke="green" x="0" y="0" width="100%" height="100%"/>
    <Map
      v-for="(itemId) in children"
      :key="itemId"
      :nodeId="itemId"
    />
  </svg>
</template>

<script>
 // import {mapGetters} from "vuex";
 // import {
 //   GetNodes,
 // } from './store';

  export default {
    name: "Map",

    props: {
      nodeId: Number,
    },
    computed: {
      wh() {
        return this.$store.getters.GetNode(this.nodeId).GetWH();
      },
      xy() {
        return this.$store.getters.GetNode(this.nodeId).GetXY();
      },
      title() {
        return this.$store.getters.GetNode(this.nodeId).title;
      },
      children() {
        return this.$store.getters.GetNode(this.nodeId).children;
      },
    },
  };
</script>

<style scoped>
  .text {
    user-select: none;
  }
</style>
