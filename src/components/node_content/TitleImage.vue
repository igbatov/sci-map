<template>
  <img v-if="isAuthorized"
    style="position: absolute; left:0; top:0; width: 100%; height: 240px; cursor: pointer;"
    alt="welcome"
    :src="defaultImageURL"
    @click="toggleAddDialog"
  />
  <img v-else
       style="position: absolute; left:0; top:0; width: 100%; height: 240px;"
       alt="welcome"
       :src="defaultImageURL"
  />
  <input
    type="file"
    ref="input"
    style="display: none"
    @change="onInputChange"
    accept="image/*"
  />
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
      <div style="width: 100%; padding-right:10px;">
        Upload new one or choose from the list
      </div>
    </template>
    <Button rounded @click="triggerUpload">upload</Button>

    <Card v-for="(item, i) of items" :key="i" class="mt-3">
      <template #content>
        <img alt="image" :src="item.url" style="width:300px;" />
        <div>
          <Button
            rounded
            @click="setAsDefault(item.url)"
            style="margin-right: 50px;"
            >set as default</Button
          >
          <Button rounded @click="copyURL(item.url)">copy URL</Button>
        </div>
      </template>
    </Card>
  </Dialog>
</template>

<script lang="ts">
import Dialog from "primevue/dialog";
import Card from "primevue/card";
import Button from "primevue/button";
import {computed, defineComponent, ref, watchEffect} from "vue";
import { useStore } from "@/store";
import firebase from "firebase/compat";
import { useToast } from "primevue/usetoast";

export default defineComponent({
  name: "TitleImage",
  components: {
    Button,
    Card,
    Dialog
  },
  props: {
    nodeID: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const toast = useToast();
    const store = useStore();
    const addDialogVisible = ref(false);
    const input = ref();
    const defaultURL = "https://cdn.scimap.org/images/default.jpg";
    const items = ref([] as Array<{
      name: string;
      url: string;
    }>);
    const uploadProgress = ref(0);
    const defaultImageURL = ref(defaultURL);
    const dbNodeImgPath = computed(() => `/node_image/${props.nodeID}`);
    watchEffect(
        () => {
          const images = store.state.image.images[props.nodeID]
          items.value = []
          items.value.push({
            name: "default",
            url: defaultURL
          })
          defaultImageURL.value = defaultURL
          for (const key in images) {
            if (key == "default") {
              defaultImageURL.value =  images[key].url;
              continue;
            }
            items.value.push({
              name: images[key].name,
              url: process.env.VUE_APP_IS_EMULATOR === "true" ? images[key].url : 'https://cdn.scimap.org'+images[key].path
            });
          }
        }
    )
    return {
      items,
      isAuthorized: computed(()=>store.state.user && store.state.user.user && !store.state.user.user.isAnonymous),
      defaultImageURL,
      setAsDefault: async (url: string) => {
        await firebase
          .database()
          .ref(`${dbNodeImgPath.value}`)
          .update({
            default: {
              url,
              name: ""
            }
          });
      },
      copyURL: async (url: string) => {
        await navigator.clipboard.writeText(url);
      },
      toggleAddDialog: () => {
        addDialogVisible.value = !addDialogVisible.value
      },
      addDialogVisible,
      input,
      triggerUpload: () => {
        input.value.click();
      },
      onInputChange: (event: {
        target: {
          files: Array<File>;
        };
      }) => {
        if (
          !store.state.user ||
          !store.state.user.user ||
          store.state.user.user.isAnonymous ||
          props.nodeID.length == 0
        ) {
          return;
        }
        uploadProgress.value = 0;
        const imgFile = event.target.files[0] as File;
        if (imgFile.size > 1_000_000) {
          console.log("cannot upload file > 1Mb");
          toast.add({
            severity: "info",
            summary: "Sorry",
            detail: "Cannot upload file > 1Mb",
            life: 3000
          });
          return;
        }
        const name = imgFile.name;
        const ext =
          name.substring(name.lastIndexOf(".") + 1, name.length) || name;
        const fileName = new Date().getTime();
        const filePath = `/user/${store.state.user.user.uid}/image/${fileName}.${ext}`
        const storageRef = firebase
          .storage()
          .ref(filePath)
          .put(imgFile);
        storageRef.on(
          "state_changed",
          snapshot => {
            uploadProgress.value =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          error => {
            console.log(error.message);
          },
          () => {
            uploadProgress.value = 100;
            storageRef.snapshot.ref.getDownloadURL().then(url => {
              let parsedURL = {} as URL
              try {
                parsedURL = new URL(url);
              } catch (error) {
                console.log(error);
                return
              }
              // removed token=... from url
              const preparedURL = parsedURL.protocol+'//'+parsedURL.hostname+(parsedURL.port == '' ? '' : ':'+parsedURL.port)+parsedURL.pathname+'?alt=media';
              firebase
                .database()
                .ref(`${dbNodeImgPath.value}/${fileName}`)
                .update({
                  name,
                  path: filePath,
                  url: preparedURL,
                });
            });
          }
        );
      }
    };
  }
});
</script>
