<template>
  <svg height="100%" width="100%" id="rootSVG">
    <Map
        :width="parentWidth"
        :height="parentHeight"
        :x="x"
        :y="y"
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
      x: 0,
      y: 0,
      map,
    }),

    methods: {
      onResize() {
        this.parentWidth = window.innerWidth;
        this.parentHeight = window.innerHeight;
      },
      handleWheel (event) {
        const SCALE_CF = 1.01;
        let newW = this.parentWidth, newH = this.parentHeight;
        if (event.deltaY < 0) {
          newW = newW * SCALE_CF;
          newH = newH * SCALE_CF;
        } else if (event.deltaY > 0) {
          newW = newW / SCALE_CF;
          newH = newH / SCALE_CF;
        }
        if (newW >= window.innerWidth && newH >= window.innerHeight) {
          const a = (window.innerWidth/event.x);
          const b = (window.innerHeight/event.y);
          this.x = this.x + (this.parentWidth - newW)/a;
          this.y = this.y + (this.parentHeight - newH)/b;
          this.parentWidth = newW;
          this.parentHeight = newH;
        }
      }
    },

    mounted() {
      window.addEventListener('resize', this.onResize);
      window.addEventListener('wheel', this.handleWheel);

      this.onResize()
    },

    destroyed() {
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('wheel', this.handleWheel);
    },
  };
</script>
