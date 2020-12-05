<template>
  <DotsAndBorders
    :width="width"
    :height="height"
    :polygons="polygons"
    :points="points"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DotsAndBorders from "@/components/DotsAndBorders.vue";
export default defineComponent({
  name: "Home",

  components: {
    DotsAndBorders
  },

  data: () => ({
    polygons: [
      [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 100 }
      ]
    ],
    points: [
      { x: 70, y: 50 },
      { x: 90, y: 50 },
      { x: 30, y: 20 }
    ],
    width: window.innerWidth,
    height: window.innerHeight
  }),

  computed: {},

  methods: {}
});
</script>
