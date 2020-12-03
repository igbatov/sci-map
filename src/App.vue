<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="`0 0 ${width} ${height}`">
    <polygon
      v-for="(path, i) of polygons"
      :key="i"
      stroke="green"
      fill="transparent"
      stroke-width="1"
      :points="path"
    />
    <circle
      v-for="({ x, y }, i) of points"
      :key="i"
      :cx="x"
      :cy="y"
      r="1"
      stroke="red"
      fill="red"
      stroke-width="1"
    />
  </svg>
</template>

<script>
export default {
  name: "App",

  components: {},

  data: () => ({
    polygons: ["10 10, 100 10, 100 100"],
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
};
</script>

<style scoped></style>
