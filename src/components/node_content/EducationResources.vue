<template>
  <div class="p-grid">
    <div class="p-col-12">
      <div class="p-grid" v-for="rr of resourcesRating" :key="rr.resourceID">
        <div class="p-col-4">
          {{resources[rr.resourceID].title}}
        </div>
        <div class="p-col-4">
          {{rr.rate}}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {computed, PropType, ref} from "vue";
import {Resource} from '@/store/resources';
import {ResourceRating} from "../../store/node_content";

export default {
  name: "EducationResources",
  props: {
    resources: Object as PropType<Record<string, Resource>>,
    resourcesRating: Object as PropType<ResourceRating[]>,
  },
  setup() {
    return {

    }
  }
};
</script>
