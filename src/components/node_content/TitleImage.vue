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
      <div style="width:431px; padding-right:10px;">
        Press "copy markdown link" button to add image into this node description
      </div>
    </template>
    <Button rounded @click="triggerUpload">upload</Button>
    <div style="height:10px;"></div>
    <ProgressBar v-if="showProgressBar" mode="indeterminate" style="height: 6px"></ProgressBar>
    <div style="height:10px;"></div>
    <Card v-for="(item, i) of items" :key="i" class="p-mt-1">
      <template #content>
        <img alt="image" :src="item.url" style="width:431px;" />
      </template>
      <template #footer>
        <div style="display:flex; flex-direction: row; justify-content: space-between;">
          <Button rounded @click="setAsDefault(item.url)">set as default</Button>
          <Button rounded @click="copyMDLink(item.url)">copy markdown link</Button>
          <Button v-if="showRemoveButton(item.id)" @click="toTrash(item.id)" severity="danger" text raised rounded aria-label="Delete">
            <template v-slot:icon>
              <span class="material-symbols-outlined">delete</span>
            </template>
          </Button>
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
import ProgressBar from 'primevue/progressbar';
import { fromBlob } from 'image-resize-compress';
const fileFormat = 'webp'
import { useConfirm } from "primevue/useconfirm";

export default defineComponent({
  name: "TitleImage",
  components: {
    Button,
    Card,
    Dialog,
    ProgressBar,
  },
  props: {
    nodeID: {
      type: String,
      required: true
    },
    nodeContent: {
      type: String,
      required: true
    },
  },
  setup(props) {
    const toast = useToast();
    const store = useStore();
    const confirm = useConfirm();
    const addDialogVisible = ref(false);
    const input = ref();
    const defaultURL = "https://cdn.scimap.org/images/default.jpg";
    const items = ref([] as Array<{
      id: string,
      timestamp: number, // it is also a unique key of image
      name: string,
      url: string,
      removed: number,
    }>);
    const showProgressBar = ref(false);
    const defaultImageURL = ref(defaultURL);
    const dbNodeImgPath = computed(() => `/node_image/${props.nodeID}`);
    watchEffect(
        () => {
          const images = store.state.image.images[props.nodeID]
          items.value = []
          items.value.push({
            id: "",
            timestamp: Infinity,
            name: "default",
            url: defaultURL,
            removed: 0,
          })
          defaultImageURL.value = defaultURL
          for (const key in images) {
            if (key == "default") {
              defaultImageURL.value =  images[key].url;
              continue;
            }
            items.value.push({
              id: key,
              timestamp: Number(key),
              name: images[key].name,
              url: process.env.VUE_APP_IS_EMULATOR === "true" ? images[key].url : 'https://cdn.scimap.org'+images[key].path,
              removed: images[key].removed,
            });
          }
          // desc sort by timestamp
          items.value = items.value.filter((item)=>!item.removed).sort((a,b) => b.timestamp - a.timestamp);
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
      copyMDLink: async (url: string) => {
        await navigator.clipboard.writeText(`![](${url} =350x)`);
        toast.add({
          severity: "info",
          summary: "Copied",
          detail: "You can now paste it into node description. Please, do not use this link in other node description as someone can remove it from this node images as not used!",
          life: 1000
        });
      },
      showRemoveButton: (id: string) => {
        if (!id) {
          // if there is no id it is the default stub image
          return false
        }
        // check that image is not used in node description
        if (props.nodeContent.length && props.nodeContent.includes(id)) {
          return false
        }

        return true
      },
      toTrash: async (id: string) => {
        confirm.require({
          message: 'Are you sure you want to delete this image?',
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          rejectClass: 'p-button-secondary p-button-outlined',
          rejectLabel: 'Cancel',
          acceptLabel: 'Delete',
          accept: async () => {
            await firebase
                .database()
                .ref(`${dbNodeImgPath.value}/${id}`)
                .update({removed: new Date().getTime()});
            toast.add({ severity: 'info', summary: 'Image was deleted', detail: '', life: 3000 });
          },
          // reject: () => {}
        });

      },
      toggleAddDialog: () => {
        addDialogVisible.value = !addDialogVisible.value
      },
      addDialogVisible,
      input,
      triggerUpload: () => {
        input.value.click();
      },
      showProgressBar,
      onInputChange: async (event: {
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
        showProgressBar.value = true;

        const imgFile = event.target.files[0] as File;
        let compressedBlob = await fromBlob(imgFile, 90, 0, 0, fileFormat)
        if (compressedBlob.size > 500_000) {
          // try to resize
          compressedBlob = await fromBlob(imgFile, 90, 1200, 'auto', fileFormat)
          if (compressedBlob.size > 500_000) {
            // if still large, then give up
            toast.add({
              severity: "info",
              summary: "Sorry",
              detail: "Cannot compress file, please try to resize/compress it to less than 500Kb",
              life: 3000
            });
            return;
          }
        }

        const name = imgFile.name;
        const fileName = new Date().getTime();
        const filePath = `/user/${store.state.user.user.uid}/image/${fileName}.${fileFormat}`
        const storageRef = firebase
          .storage()
          .ref(filePath)
          .put(compressedBlob);
        storageRef.on(
          "state_changed",
          snapshot => {
            // uploadProgress.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          error => {
            console.log(error.message);
          },
          () => {
            showProgressBar.value = false;
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
