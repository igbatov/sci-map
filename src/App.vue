<template>
  <svg height="100%" width="100%" id="rootSVG">
    <Map
        :width="parentWidth"
        :height="parentHeight"
        :x="0"
        :y="0"
        :node="map.root"
      />
  </svg>
</template>

<script>
  import Map from "./components/Map";
  const map = require("./assets/map.json");
  map.root.title = "";
  console.log(map)

  export default {
    name: "App",

    components: {
      Map
    },

    data: () => ({
      parentWidth:  0,
      parentHeight: 0,
      map,
    }),

    methods: {
      onResize() {
        this.parentWidth = window.innerWidth;
        this.parentHeight = window.innerHeight;
      },
    },

    mounted() {
      window.addEventListener('resize', this.onResize);
      this.onResize()
    },

    destroyed() {
      window.removeEventListener('resize', this.onResize);
    },
  };
</script>
