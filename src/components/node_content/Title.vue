<template>
  <p
    v-show="!editOn"
    v-html="renderedContent"
    @click="setEditOn(true)"
    class="title"
  />
  <textarea
    class="title rawTitle p-inputtextarea p-inputtext p-component p-inputtextarea-resizable"
    style="display: none"
    ref="txtarea"
    rows="1"
    :value="content"
    @input="changeContent($event.target.value)"
    @focusout="setEditOn(false)"
  />
</template>

<script lang="ts">
import { computed, ref } from "vue";
import { useStore } from "@/store";

export default {
  name: "Title",
  emits: ["content-changed"],
  props: {
    content: {
      type: String,
      required: true
    }
  },
  setup(props: any, ctx: any) {
    const renderedContent = computed(() => {
      return props.content;
    });
    const editOn = ref(false);
    const store = useStore();
    const txtarea = ref<HTMLDivElement | null>(null);

    return {
      editOn,
      txtarea,
      setEditOn: (val: boolean) => {
        if (
          !store.state.user ||
          !store.state.user.user ||
          store.state.user.user.isAnonymous
        ) {
          return;
        }
        editOn.value = val;
        if (val && txtarea.value) {
          txtarea.value.style.display = "block";
          txtarea.value.focus();
        }
        if (!val && txtarea.value) {
          txtarea.value.style.display = "none";
        }
      },
      renderedContent,
      changeContent: (value: string) => {
        ctx.emit("content-changed", value);
      }
    };
  }
};
</script>

<style scoped>
.title {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 1.375rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.75rem;
}
.rawTitle {
  margin-top: 10px;
}
</style>
