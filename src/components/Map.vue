<template>
  <svg
    v-if="isVisible"
    :height="wh.height + 'px'"
    :width="wh.width + 'px'"
    :x="xy.x + 'px'"
    :y="xy.y + 'px'"
  >
    <rect
      :stroke-width="borderWidth"
      fill="none"
      :stroke="`hsl(${borderColor}, 40%, ${borderLightness}%)`"
      x="0"
      y="0"
      width="100%"
      height="100%"
    />
    <Map v-for="itemId in children" :key="itemId" :nodeId="itemId" />
    <rect
      v-if="isTitleVisible"
      fill="white"
      stroke="none"
      :x="wh.width / 2 - titleWH.width / 2"
      :y="wh.height / 2 - titleWH.height / 2"
      :width="titleWH.width"
      :height="titleWH.height"
      cursor="pointer"
      @click="labelClick"
    />
    <text
      x="50%"
      y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      class="text"
      font-family="Roboto, Arial, Helvetica, sans-serif"
      :font-size="title.size"
      :font-weight="title.weight"
      :letter-spacing="title.letterSpacing"
      :fill="title.color"
      pointer-events="none"
    >
      {{ isTitleVisible ? elipsis(title.text) : "" }}
    </text>
    <text
      x="-9999999"
      y="-9999999"
      dominant-baseline="middle"
      text-anchor="middle"
      class="text"
      :id="textID"
      font-family="Roboto, Arial, Helvetica, sans-serif"
      :font-size="title.size"
      :font-weight="title.weight"
      :letter-spacing="title.letterSpacing"
      :fill="title.color"
    >
      {{ title.text }}
    </text>
  </svg>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import { GetNode } from "@/store";
import { SCALE_CF, Zoom } from "@/store/zoomPan";

export default {
  name: "Map",

  props: {
    nodeId: Number
  },

  data: () => ({
    levelChanged: false
  }),

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
    labelClick(event) {
      // zoom until top and bottom fit window height or left and right fit 2/3 of window width
      const tillHeightSteps =
        Math.log(window.innerHeight / this.wh.height) / Math.log(SCALE_CF);
      const tillWidthSteps =
        Math.log((window.innerWidth * (2 / 3)) / this.wh.width) /
        Math.log(SCALE_CF);
      console.log(
        "clicked on node",
        event,
        this.nodeId,
        this.wh,
        this.xy,
        window.innerHeight / this.wh.height,
        tillHeightSteps,
        tillWidthSteps
      );

      for (let i = 0; i < Math.min(tillHeightSteps, tillWidthSteps); i++) {
        window.setTimeout(() => {
          this.$store.dispatch("zoomPan/" + Zoom, {
            deltaY: -1,
            x: event.x,
            y: event.y
          });
        }, i * 50);
      }
    },
    initTitleWidth() {
      if (
        this.isVisible &&
        (this.levelChanged || !this.GetTitleWH(this.nodeId))
      ) {
        this.levelChanged = false;
        // if container is visible and we have not yet taken its title bbox, do it now
        const bbox = document.getElementById(this.textID).getBBox();
        this.SET_TITLE_WH({
          nodeId: this.nodeId,
          width: bbox.width,
          height: bbox.height
        });
      }
    },
    toTitleCase(str) {
      return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
    elipsis(str) {
      const titleWH = this.GetTitleWH(this.nodeId);
      if (!titleWH) {
        return str;
      }
      if (titleWH.width > this.wh.width - 10) {
        const lettersToShow =
          Math.floor(this.wh.width / (1.2 * (titleWH.width / str.length))) - 3;
        return str.substr(0, lettersToShow) + "...";
      }

      return str;
    }
  },

  watch: {
    GetCurrentLevel: {
      handler() {
        this.levelChanged = true;
      },
      immediate: true
    }
  },

  computed: {
    ...mapGetters("level", ["GetCurrentLevel"]),
    ...mapGetters("title", ["GetIsVisible", "GetTitleWH"]),
    borderColor() {
      return this.level - this.GetCurrentLevel >= 3 ? 360 : 120;
    },
    borderLightness() {
      const lvl = this.level - this.GetCurrentLevel + 1;
      if (lvl <= 2) {
        return 40;
      }
      if (lvl === 3) {
        return 60;
      }
      if (lvl === 4) {
        return 80;
      }
      if (lvl >= 5) {
        return 90;
      }

      return 100;
    },
    borderWidth() {
      return Math.max(1, 5 / (this.level - this.GetCurrentLevel + 1));
    },
    title() {
      const lvl = this.level - this.GetCurrentLevel + 1;
      if (lvl <= 2) {
        return {
          letterSpacing: 3,
          text: this.toTitleCase(this.titleText),
          size: 28,
          weight: "500",
          color: "black"
        };
      }

      if (lvl === 3) {
        return {
          letterSpacing: 2,
          text: this.titleText.toUpperCase(),
          size: 12,
          weight: "550",
          color: "grey"
        };
      }

      if (lvl === 4) {
        return {
          letterSpacing: 1,
          text: this.titleText.toUpperCase(),
          size: 10,
          weight: "400",
          color: "grey"
        };
      }

      return {
        letterSpacing: 1,
        text: this.toTitleCase(this.titleText),
        size: 10,
        weight: "200",
        color: "grey"
      };
    },
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

      return this.GetIsVisible(this.nodeId);
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
    titleText() {
      return this.$store.getters[GetNode](this.nodeId).title;
    },
    titleWH() {
      const wh = this.GetTitleWH(this.nodeId);
      if (wh) {
        return wh;
      } else {
        return { width: 0, height: 0 };
      }
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
