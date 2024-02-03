<template>
  <Dialog
    v-model:visible="complainModalVisible"
    @hide="$emit('hide')"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
  >
    <template #header>
      <h3>
        {{
          `Please use our discord channel to complain about inappropriate changes`
        }}
      </h3>
    </template>
    <h3>
      <a
        target="_blank"
        href="https://discord.com/channels/1171118046543347782/1196694554791915600"
        >Discord edit-complains channel</a
      >
    </h3>
    <p>
      You can use the following text:
    </p>
    <code>
      Hi, I think I found changes that was inappropriate because ... <br />
      Here is the changes I am talking about {{ complainChangeLink }} <br />
      This is the ...st time I found inappropriate changes from this user.
      <br />
    </code>
    <template #footer> </template>
  </Dialog>
</template>
<script lang="ts">
import Dialog from "primevue/dialog";
import { ref, watch } from "vue";

export default {
  name: "ChangeLogComplain",
  props: {
    show: Boolean,
    complainChangeLink: String
  },
  components: {
    Dialog
  },
  emits: ["hide"],
  setup(props: { show: boolean }) {
    const complainModalVisible = ref(false);
    watch(
      () => [props.show],
      async (newArgs, oldArgs) => {
        complainModalVisible.value = newArgs[0];
      }
    );
    return {
      complainModalVisible
    };
  }
};
</script>
