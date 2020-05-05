<template>
  <svg
    v-if="isVisible"
    :height="wh.height + 'px'"
    :width="wh.width + 'px'"
    :x="xy.x + 'px'"
    :y="xy.y + 'px'"
  >
    <text
      x="50%"
      y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      class="text"
      :id="textID"
    >
      {{ isTitleVisible ? title : "" }}
    </text>
    <rect fill="none" stroke="green" x="0" y="0" width="100%" height="100%" />
    <Map v-for="itemId in children" :key="itemId" :nodeId="itemId" />
  </svg>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import { GetNode } from "../store";

export default {
  name: "Map",

  props: {
    nodeId: Number
  },

  mounted() {
    this.$nextTick(function() {
      this.initTitleWidth();
    });
  },
  updated() {
    this.$nextTick(function() {
      this.initTitleWidth();
    });
  },

  methods: {
    ...mapMutations("title", ["SET_TITLE_WH"]),
    initTitleWidth() {
      if (this.isVisible && !this.GetTitleWH(this.nodeId)) {
        // if container is visible and we have not yet taken its title bbox, do it now
        const bbox = document.getElementById(this.textID).getBBox();
        this.SET_TITLE_WH({
          nodeId: this.nodeId,
          width: bbox.width,
          height: bbox.height
        });
      }
    }
  },

  computed: {
    ...mapGetters("level", ["GetCurrentLevel", "GetVisibiltyDepth"]),
    ...mapGetters("title", ["GetIsVisible", "GetTitleWH"]),
    isVisible() {
      const node = this.$store.getters.GetNode(this.nodeId);
      const xy = node.GetAbsoluteXY();
      const wh = node.GetWH();
      if (
        xy.x > window.innerWidth ||
        xy.y > window.innerHeight ||
        xy.x + wh.width < 0 ||
        xy.y + wh.height < 0
      ) {
        return false;
      }
      return (
        (wh.height * wh.width) / (window.innerHeight * window.innerWidth) >
        0.001
      );
    },
    isTitleVisible() {
      if (!this.isVisible) {
        return false;
      }

      const titleWH = this.GetTitleWH(this.nodeId);
      if (this.isVisible && !titleWH) {
        return true;
      }

      const parent = this.$store.getters[GetNode](this.nodeId).parent;
      if (!parent) {
        return true;
      }

      return this.GetIsVisible(parent.id) && this.GetIsVisible(this.nodeId);
    },
    textID() {
      return `text_${this.nodeId}`;
    },
    level() {
      return this.$store.getters[GetNode](this.nodeId).GetLevel();
    },
    wh() {
      return this.$store.getters[GetNode](this.nodeId).GetWH();
    },
    xy() {
      return this.$store.getters[GetNode](this.nodeId).GetXY();
    },
    title() {
      return this.$store.getters[GetNode](this.nodeId).title;
    },
    children() {
      return this.$store.getters[GetNode](this.nodeId).children;
    }
  }
};
</script>

<style scoped>
.text {
  user-select: none;
}
</style>
