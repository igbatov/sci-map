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
  console.log(map);

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
      mouseDown: false,
      map,
    }),

    methods: {
      mouseDownHandler() {
        this.mouseDown = true;
      },
      mouseUpHandler() {
        this.mouseDown = false;
      },
      mouseMoveHandler(event) {
        if (this.mouseDown === false) {
          return;
        }
        const newX = this.x + event.movementX;
        const newY = this.y + event.movementY;
        if (newX > 0 || newY > 0 || newX + this.parentWidth < window.innerWidth || newY + this.parentHeight < window.innerHeight) {
          return;
        }
        this.x = newX;
        this.y = newY;
        // console.log(event, this.x, this.y);
       // this.mouseDown = false;
      },
      onResize() {
        this.parentWidth = window.innerWidth;
        this.parentHeight = window.innerHeight;
      },
      mouseWheelHandler (event) {
        const SCALE_CF = 1.01;
        let newW = this.parentWidth, newH = this.parentHeight;
        if (event.deltaY < 0) {
          newW = newW * SCALE_CF;
          newH = newH * SCALE_CF;
        } else if (event.deltaY > 0) {
          newW = newW / SCALE_CF;
          newH = newH / SCALE_CF;
        }

        if (newW < window.innerWidth || newH < window.innerHeight) {
          return;
        }

        // const newX = this.x + (this.parentWidth - newW)/(this.parentWidth/event.x);
        // const newY = this.y + (this.parentHeight - newH)/(this.parentHeight/event.y);
        let newX = this.x, newY = this.y;
        // if (event.deltaY < 0) {
           newX = this.x - event.x * (SCALE_CF - 1);
           newY = this.y - event.y * (SCALE_CF - 1);
        // }
        // else if (event.deltaY > 0) {
        //   newX = this.x - event.x / SCALE_CF;
        //   newY = this.y - event.y / SCALE_CF;
        // }
        console.log(newX, newY, event.x, event.y);
        this.parentWidth = newW;
        this.parentHeight = newH;
        this.x = newX;
        this.y = newY;
        if (newX > 0) {
          this.x = 0;
        }
        if (newY > 0) {
          this.y = 0;
        }
        if (newX + newW < window.innerWidth) {
          this.x = window.innerWidth - newW;
        }
        if (newY + newH < window.innerHeight) {
          this.y = window.innerHeight - newH;
        }
      }
    },

    mounted() {
      window.addEventListener('resize', this.onResize);
      window.addEventListener('wheel', this.mouseWheelHandler);
      window.addEventListener('mousedown', this.mouseDownHandler);
      window.addEventListener('mouseup', this.mouseUpHandler);
      window.addEventListener('mousemove', this.mouseMoveHandler);

      this.onResize()
    },

    destroyed() {
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('wheel', this.mouseWheelHandler);
      window.removeEventListener('mousedown', this.mouseDownHandler);
      window.removeEventListener('mouseup', this.mouseUpHandler);
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    },
  };
</script>
