<template>
  <transition name="slide">
    <div v-if="content" class="infoBox">
      <div class="infoBoxWiki" v-html="content"/>
      <div v-for="(value, key) in sections" :key="key">
        <div class="infoBoxSection">
          <Section :title="key" :items="value"/>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

import Section from "@/components/Section";

export default {
  name: "InfoBox",

  props: {
    content: String,
    sections: Object,
  },

  components: {
    Section,
  }
}
</script>

<style scoped>
  .infoBox {
    /*padding: 20px;*/
    position: absolute;
    width: 33%;
    height: 100%;
    background-color: white;
    overflow: scroll;
    box-shadow: 5px 0 21px 3px rgba(122, 122, 119, 0.50);
    display: flex;
    flex-direction: column;
  }
  .infoBoxWiki {
    padding: 20px;
    overflow: scroll;
    flex: 1 1 auto;
  }
  .infoBoxSection {
    flex: 1 1 auto;
  }

  .slide-enter-active, .slide-leave-active {
    transform: translateX(0);
    transition: transform .3s .1s, opacity .3s .1s, width .3s;
  }
</style>
