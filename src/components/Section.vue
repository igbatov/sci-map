<template>
  <div class="section">
    <div class="title">{{titlePrep}}</div>
    <div v-for="item in itemsPrep" :key="item.link" class="item">
      [{{item.type}}] <a target="_blank" :href="item.link">{{item.name}}</a>
    </div>
  </div>
</template>

<script>
import {SECTION_CP, SECTION_ME, TYPE_COURSE, TYPE_TEXTBOOK, TYPE_SCIPOP} from "@/store/infoBox";

export default {
  name: "Section",

  props: {
    title: String,
    items: Array,
  },

  computed: {
    titlePrep() {
      if (this.title === SECTION_ME) {
        return "More explanations"
      } else if (this.title === SECTION_CP) {
        return "Community and projects"
      } else {
        return "Other"
      }
    },
    itemsPrep() {
      // order ME items: textbooks, courses, SciPop
      this.items.map(a => ({...a})).sort((a,b) => {
        const order = {
          [TYPE_TEXTBOOK]: 1,
          [TYPE_COURSE]: 2,
          [TYPE_SCIPOP]: 3,
        }
        if (!order[order[b.type]]) {
          return -1;
        }
        if (!order[order[a.type]]) {
          return 1;
        }
        if (order[a.type] < order[b.type]) {
          return -1;
        }
        if (order[a.type] > order[b.type]) {
          return 1;
        }
        return 0;
      });
      return this.items
    }
  }
}
</script>

<style scoped>
.section {
  padding: 20px;
  box-shadow: 1px -9px 21px -1px rgba(0,0,0,0.3);
}
.title {
  font-weight: bold;
}
</style>
