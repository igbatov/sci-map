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
      {{ titleVisible ? title : "" }}
    </text>
    <rect fill="none" stroke="green" x="0" y="0" width="100%" height="100%" />
    <Map v-for="itemId in children" :key="itemId" :nodeId="itemId" />
  </svg>
</template>

<script>
import {mapGetters} from "vuex"

export default {
  name: "Map",

  data: () => ({
    titleWidth: 0,
  }),

  props: {
    nodeId: Number
  },

  mounted() {
    this.initTitleWidth()
  },
  updated() {
    this.initTitleWidth()
  },

  methods: {
    initTitleWidth() {
      // some nodes may not be shown at all because they are too small
      if (this.isVisible && this.titleWidth === 0) {
        this.titleWidth = document.getElementById(this.textID).getBBox().width;
      }
    }
  },

  computed: {
    ...mapGetters('level', ['GetCurrentLevel', 'GetVisibiltyDepth']),
    isVisible() {
      const node = this.$store.getters.GetNode(this.nodeId)
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
      return (wh.height*wh.width)/(window.innerHeight*window.innerWidth) > 0.001
    },
    titleVisible() {
      if (this.isVisible && this.titleWidth === 0) {
        return true;
      }
      const wh = this.wh;
      return (wh.width > this.titleWidth + 20);
    },
    textID() {
      return `text_${this.nodeId}`
    },
    level() {
      return this.$store.getters.GetNode(this.nodeId).GetLevel();
    },
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
    }
  }
};
</script>

<style scoped>
.text {
  user-select: none;
}
</style>
