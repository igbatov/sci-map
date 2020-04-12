<template>
    <Map :items="map.root.children"/>
</template>

<script>
  import Map from "./components/Map";
  const map = require("./assets/map.json");
  console.log(map)

  export default {
    name: "App",

    components: {
      Map
    },

    data: () => ({
      map
    })
  };
</script>
