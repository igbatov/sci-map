<template>
  <SubscribeIcon @click="toggleSubscribe" :is-on="isOn"/>
</template>
<script lang="ts">
import {computed, defineComponent} from "vue";
import SubscribeIcon from "@/components/node_content/SubscribeIcon.vue";
import { actions as subscriptionsActions } from "@/store/subscriptions";
import {useStore} from "@/store";

export default defineComponent({
  name: "SubscribeButton",
  components: {
    SubscribeIcon,
  },
  props: {
    nodeID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    return {
      isOn: computed(
          () => !!store.state.subscriptions.subscriptions[props.nodeID] && store.state.subscriptions.subscriptions[props.nodeID] == 1
      ),
      toggleSubscribe: () => {
        store.dispatch(`subscriptions/${subscriptionsActions.ToggleSubscription}`, props.nodeID)
      }
    }
  }
})
</script>
