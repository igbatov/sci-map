<template>
  <svg :height="height + 'px'" :width="width + 'px'" :x="x + 'px'" :y="y + 'px'" ref="parent">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{node.title}}</text>
    <rect fill="none" stroke="green" x="0" y="0" width="100%" height="100%"/>
    <Map
      v-for="(item, index) in node.children"
      :key="index"
      :node="item"
      :height="itemWH.h"
      :width="(node.children.length % grid.rowNum === 0) ? itemWH.w : ((index < node.children.length - 1) ? itemWH.w : itemWH.w * (1 + grid.rowNum - node.children.length % grid.rowNum))"
      :x="index%grid.rowNum*itemWH.w"
      :y="Math.floor(index/grid.rowNum)*itemWH.h"
    />
  </svg>
</template>

<script>
  export default {
    name: "Map",

    props: {
      node: Object,
      width: Number,
      height: Number,
      x: Number,
      y: Number,
    },

    data: () => ({
      colNum:  0,
      rawNum: 0,
    }),

    computed: {
      grid() {
        let rowLength = this.node.children.length;
        if (rowLength < 2) {
          return {
            rowNum: 1,
            colNum: 1,
          }
        }
        let colLength = 1;
        let parentWidth = this.width;
        let parentHeight = this.height;

        let itemHeight = parentHeight/colLength;
        let itemWidth = parentWidth/rowLength;
        while (itemHeight/itemWidth > 1) {
          colLength++;
          rowLength = Math.ceil(this.node.children.length / colLength);
          itemHeight = parentHeight / colLength;
          itemWidth = parentWidth / rowLength;
        }

        // make sure number of rows is even number (for better parent title visibility)
        if (colLength%2 !== 0) {
          if (rowLength === 1) {
            if (colLength === 1) {
              console.error("Parent must have at least 2 children!")
            } else {
              colLength--;
              rowLength = Math.ceil(this.node.children.length / colLength);
            }
          } else {
            colLength++;
            rowLength = Math.ceil(this.node.children.length / colLength);
          }
        }

        return {
          rowNum: rowLength,
          colNum: colLength,
        }
      },

      itemWH() {
        return {
          w: this.width/this.grid.rowNum,
          h: this.height/this.grid.colNum,
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
