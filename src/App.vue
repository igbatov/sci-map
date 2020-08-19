<template>
    <div class="wrapper">
      <InfoBox :content="content" :sections="sections"/>
      <svg height="100%" width="100%" id="rootSVG">
        <Map :nodeId="GetRoot.id" />
      </svg>
      <BreadCrumbs />
    </div>
</template>

<script>
import Vue from "vue";
import Map from "./components/Map";
import BreadCrumbs from "./components/BreadCrumbs";
import InfoBox from "./components/InfoBox";
import { SET_ROOT_WH, SET_ROOT_XY, InitFlatMap, GetRoot } from "./store";
import { Init, UpdateCurrentLevel } from "./store/level";
import { mapGetters } from "vuex";
import {Zoom, ZoomAndPan} from "@/store/zoomPan";
import {FetchWiki, ParseSections} from "@/store/infoBox";

export default {
  name: "App",

  components: {
    Map,
    BreadCrumbs,
    InfoBox,
  },

  data: () => ({
    mouseDown: false,
    content: "",
    sections: {},
  }),

  computed: {
    ...mapGetters([GetRoot]),
    ...mapGetters("infoBox", ["GetContent", "GetSections"]),
  },

  watch: {
    async $route(to) {
      let nodeId = to.params.id
      if (!nodeId) {
        nodeId = this.GetRoot.GetID()
      }
      await this.$store.dispatch(
        "zoomPan/" + ZoomAndPan,
        {
          nodeId: nodeId,
          targetXY: { x: window.innerWidth * (2 / 3), y: window.innerHeight / 2 },
          targetWH: { width: window.innerWidth*(2/3), height: window.innerHeight }
        }
      );

      if (nodeId === this.GetRoot.GetID()) {
        this.content = ""
      } else {
        await this.$store.dispatch("infoBox/" + FetchWiki, nodeId)
        await this.$store.dispatch("infoBox/" + ParseSections, nodeId)
        this.content = this.GetContent(nodeId)
        for (let j in this.sections) {
          Vue.delete(this.sections, j)
        }
        const sections = this.GetSections(nodeId)
        for (let i in sections) {
          Vue.set(this.sections, i, sections[i])
        }
      }
    }
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
      if (
       // newX > 0 ||
        newY > 0 ||
       // newX + this.GetRoot.GetWH().width < window.innerWidth ||
        newY + this.GetRoot.GetWH().height < window.innerHeight
      ) {
        return;
      }
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
    const root = document.getElementById("rootSVG")
    root.addEventListener("wheel", this.mouseWheelHandler);
    root.addEventListener("mousedown", this.mouseDownHandler);
    root.addEventListener("mouseup", this.mouseUpHandler);
    root.addEventListener("mousemove", this.mouseMoveHandler);
  },

  destroyed() {
    const root = document.getElementById("rootSVG")
    root.removeEventListener("wheel", this.mouseWheelHandler);
    root.removeEventListener("mousedown", this.mouseDownHandler);
    root.removeEventListener("mouseup", this.mouseUpHandler);
    root.removeEventListener("mousemove", this.mouseMoveHandler);
  }
};
</script>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
}
</style>
