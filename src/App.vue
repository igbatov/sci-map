<template>
  <div class="wrapper">
    <svg height="100%" width="100%" id="rootSVG">
      <Map :nodeId="GetRoot.id" />
    </svg>
    <BreadCrumbs />
  </div>
</template>

<script>
import Map from "./components/Map";
import BreadCrumbs from "./components/BreadCrumbs";
import { SET_ROOT_WH, SET_ROOT_XY, InitFlatMap, GetRoot } from "./store";
import { Init, UpdateCurrentLevel } from "./store/level";
import { mapGetters } from "vuex";
import { Zoom } from "@/store/zoomPan";

export default {
  name: "App",

  components: {
    Map,
    BreadCrumbs
  },

  data: () => ({
    mouseDown: false
  }),

  computed: {
    ...mapGetters([GetRoot])
  },

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
      const newX = this.GetRoot.GetXY().x + event.movementX;
      const newY = this.GetRoot.GetXY().y + event.movementY;
      // Stop pan if area out of borders
      // if (
      //   newX > 0 ||
      //   newY > 0 ||
      //   newX + this.GetRoot.GetWH().width < window.innerWidth ||
      //   newY + this.GetRoot.GetWH().height < window.innerHeight
      // ) {
      //   return;
      // }
      this.$store.commit(SET_ROOT_XY, { x: newX, y: newY });
      this.$store.dispatch("level/" + UpdateCurrentLevel);
    },
    mouseWheelHandler(event) {
      this.$store.dispatch("zoomPan/" + Zoom, event);
    }
  },

  beforeMount() {
    this.$store.dispatch(InitFlatMap);
    this.$store.commit(SET_ROOT_WH, {
      width: window.innerWidth,
      height: window.innerHeight
    });
    this.$store.commit(SET_ROOT_XY, { x: 0, y: 0 });
    this.$store.dispatch("level/" + Init);
  },

  mounted() {
    window.addEventListener("wheel", this.mouseWheelHandler);
    window.addEventListener("mousedown", this.mouseDownHandler);
    window.addEventListener("mouseup", this.mouseUpHandler);
    window.addEventListener("mousemove", this.mouseMoveHandler);
  },

  destroyed() {
    window.removeEventListener("wheel", this.mouseWheelHandler);
    window.removeEventListener("mousedown", this.mouseDownHandler);
    window.removeEventListener("mouseup", this.mouseUpHandler);
    window.removeEventListener("mousemove", this.mouseMoveHandler);
  }
};
</script>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
}
</style>
