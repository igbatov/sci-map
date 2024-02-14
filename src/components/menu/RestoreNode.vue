<template>
  <img
      alt="add_icon"
      v-if="event.isRemoved && IsNodeInTrash(event.node.idPath)"
      src="../../assets/images/revert.svg"
      style="width: 30px; cursor: pointer;"
      @click="revertRemove(event)"
  />
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue";
import {ChangeLogNodeParent} from "@/store/change_log";
import {IsNodeInTrash} from "@/api/change_log";
import { Queue } from '@datastructures-js/queue';
import api from "@/api/api";

export default defineComponent({
  name: "RestoreNode",
  emits: ["select-restore-parent-is-on", "select-restore-parent-is-off"],
  props: {
    event: {
      type: Object as PropType<ChangeLogNodeParent>,
      required: true,
    },
    clickedTitleId: {
      type: String,
    },
  },
  setup() {
    const restoreNodeWithChildren = async (nodeID: string, parentNodeID: string) => {
      const queue = new Queue<string>();
      const updateMap = {} as Record<string, any>
      updateMap[`map/${parentNodeID}/children/${api.generateKey()}`] = nodeID
      queue.push(nodeID)
      while (!queue.isEmpty()) {
        const nodeID = queue.pop()
        const mapNode = await api.getTrashNode(nodeID, "map")
        if (!mapNode) {
          console.error("restoreNodeWithChildren: cannot find node in trash", nodeID)
          continue
        }
        const nodeContentNode = await api.getTrashNode(nodeID, "node_content")
        const preconditionNode = await api.getTrashNode(nodeID, "precondition")
        const nodeImage = await api.getTrashNode(nodeID, "node_image")
        updateMap[`map/${mapNode?.id}`] = mapNode
        updateMap[`node_content/${mapNode?.id}`] = nodeContentNode
        updateMap[`precondition/${mapNode?.id}`] = preconditionNode
        updateMap[`node_image/${mapNode?.id}`] = nodeImage
        if (mapNode?.children) {
          for (const idx in mapNode?.children) {
            queue.push(mapNode?.children[idx])
          }
        }
      }
      console.log(updateMap)
      return await api.update(updateMap);
    }
    return {
      IsNodeInTrash,
      revertRemove: async (event: ChangeLogNodeParent) => {
        if (!event.isRemoved) {
          return
        }

        if (!IsNodeInTrash(event.parentNodeBefore.idPath) && IsNodeInTrash(event.node.idPath)) {
          await restoreNodeWithChildren(event.node.id, event.parentNodeBefore.id)
        }
      },
    }
  }
})
</script>
