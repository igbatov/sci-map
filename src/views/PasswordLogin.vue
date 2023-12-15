<template>
  This section is just for test/emulator cases for now
  <input id="email" />
  <input id="password" />
  <button @click="login">login</button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api/api";
import { mutations } from "@/store/user";
import firebase from "firebase/compat";
import { useStore } from "@/store";

export default defineComponent({
  name: "PasswordLogin",

  setup() {
    const store = useStore();

    return {
      login: async () => {
        const emailEl = document.getElementById("email") as HTMLInputElement;
        const passwordEl = document.getElementById(
          "password"
        ) as HTMLInputElement;
        await firebase
          .auth()
          .signInWithEmailAndPassword(emailEl.value, passwordEl.value);
      }
    };
  }
});
</script>
