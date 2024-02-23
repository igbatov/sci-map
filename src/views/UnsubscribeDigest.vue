<template>
  <h1 v-if="!isAuthorized">Please, <a href="#" @click="store.dispatch(`user/${userActions.signIn}`)">Sign in</a> to unsubscribe</h1>
  <div v-else>
    You successfully unsubscribed from scimap.org digest!
  </div>
</template>

<script lang="ts">
import {store, useStore} from "@/store";
import {computed, watch} from "vue";
import {actions as userActions} from "@/store/user";

export default {
  name: "UnsubscribeDigest",
  computed: {
    store() {
      return store
    },
    userActions() {
      return userActions
    }
  },

  setup() {
    const store = useStore();
    const isAuthorized = computed(
        () => store.state.user.user && !store.state.user.user.isAnonymous
    );

    watch(
        () => store.state.user.user && !store.state.user.user.isAnonymous,
        () => {
          if (isAuthorized.value) {
            store.dispatch(`user/${userActions.setSubscribePeriod}`, 'on pause')
          }
        },
        { immediate: true }
    );

    return {
      isAuthorized,
    };
  }
};
</script>
