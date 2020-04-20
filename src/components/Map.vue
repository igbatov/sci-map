<template>
  <svg :height="node.height + 'px'" :width="node.width + 'px'" :x="node.x + 'px'" :y="node.y + 'px'">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="text">{{node.title}}</text>
    <rect fill="none" stroke="green" x="0" y="0" width="100%" height="100%"/>
    <Map
      v-for="(itemId) in node.children"
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
      width: Number,
      height: Number,
      x: Number,
      y: Number,
    },
    computed: {
      node() {
        console.log('this.node', this.$store.getters.GetNode(this.nodeId))

        return this.$store.getters.GetNode(this.nodeId)
      }
    },
  };
</script>

<style scoped>
  .text {
    user-select: none;
  }
</style>
