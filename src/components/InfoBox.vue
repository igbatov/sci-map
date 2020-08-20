<template>
  <transition name="slide">
    <div>
      <div v-if="content && show" class="infoBox">
        <div class="infoBoxWiki" v-html="content" />
        <div v-for="(value, key) in sections" :key="key">
          <div class="infoBoxSection">
            <Section :title="key" :items="value" />
          </div>
        </div>
      </div>
      <div :class="{'closeButton': true, 'closeButtonClosed': !show}" @click="show = !show"></div>
    </div>
  </transition>
</template>

<script>
import Section from "@/components/Section";

export default {
  name: "InfoBox",

  data: () => ({
    show: true,
  }),

  props: {
    content: String,
    sections: Object
  },

  components: {
    Section
  }
};
</script>

<style scoped>
.infoBox {
  /*padding: 20px;*/
  position: absolute;
  width: 33%;
  height: 100%;
  background-color: white;
  overflow: scroll;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
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
.closeButton {
  cursor: pointer;
  position: absolute;
  top: 3%;
  left: 33%;
  width: 23px;
  height: 48px;
  border-left: 1px solid #D4D4D4;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
  background: rgba(255,255,255,0.9) url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAUCAQAAAAXDMSnAAAAi0lEQVR4AX3JQcqBURQG4O/+9WNG30D3vOfSDTuQsgcZyBakZANSzMVMBme3zsBI5/VMn4ZKLP5ki1E4tYejWpilxVUtzOEUD68odYmXR5BJNp/4zllXD2phllYvamHmirsayUkfJ5ruHzueTldC08kcT5YOY9xYujqQM03XKXuaLmEtNF1e1Nz89gbL+0do6OEwRwAAAABJRU5ErkJggg==) 7px center/7px 10px no-repeat;
}
.closeButtonClosed {
  left: 0;
  transform: scaleX(-1);
  border-left: 1px solid #D4D4D4;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  transform: translateX(0);
  transition: transform 0.3s 0.1s, opacity 0.3s 0.1s, width 0.3s;
}
</style>
