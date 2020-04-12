<template>
  <div class="map" ref="parent">
    <div
      class="item"
      :style="{'width': itemWH.w +'%', height: itemWH.h + '%'}"
      v-for="(item, index) in items"
      :key="index"
    >
      <div class="title">{{item.title}}</div>
      <Map :items="item.children"/>
    </div>
  </div>
<!--  <svg height="100%" width="100%">-->
<!--    <rect fill="green" height="100%" width="10%" :x="index*100/map.root.children.length+'%'" v-for="(item, index) in map.root.children" :key="index">{{item.title}}</rect>-->
<!--  </svg>-->
</template>

<script>
  export default {
    name: "Map",

    props: {
      items: [],
    },

    data: () => ({
      windowWidth:  window.innerWidth,
      windowHeight: window.innerHeight,
    }),

    created() {
      window.addEventListener('resize', this.onResize);
    },

    destroyed() {
      window.removeEventListener('resize', this.onResize);
    },

    methods: {
      onResize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
      },
    },

    computed: {
      itemWH() {
        let width = this.windowWidth;
        let height = this.windowHeight;
        let rowLength = this.items.length;
        let colLength = 1;
        if (width > height) {
          let itemWidth = width/rowLength;
          let itemHeight = height/colLength;
          while (itemHeight/itemWidth > 1) {
            rowLength = rowLength / 2;
            colLength++;
            itemWidth = width/rowLength;
            itemHeight = height/colLength;
          }
        }

        const rowNum = Math.ceil(rowLength*2)
        const colNum = (colLength-1)
        console.log('rowNum', rowNum, 'colNum', colNum);

        return {
          w: 100/rowNum,
          h: 100/colNum,
        };
      },
    },
  };
</script>

<style scoped>
  .map {
    display: flex;
    flex-wrap: wrap;
    justify-content: stretch;
    width:100%;
    height:100%;
  }

  .item {
    flex-grow: 1;
    border: solid bisque 1px;
    box-sizing: border-box;
    text-align: center;
  }

  .title {
    position: relative;
    top: 50%;
    transform: translateY(-50%);
  }

</style>
