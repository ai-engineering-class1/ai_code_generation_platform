<template>
  <div class="drag-node">
    <div class="drag-header">
      {{itemData.userData.title}}
    </div>
    <div class="cursor-pointer drag-content"
         @click="showInfo">
      <div class="info">
        {{itemData.userData.prompt}}

      </div>
      <div class="drag-history">

      </div>
    </div>

  </div>

</template>

<script>
import eventBus from '../../../utils/eventBus'
export default {
  name: 'drag-node',

  props: {
    itemData: {
      type: Object,
    },
    canvasNode: {
      type: Object,
    },
  },
  methods: {
    showInfo() {
      eventBus.$emit('clickNode', this.itemData)
    },
  },
  created() {},
}
</script>

<style scoped>
.drag-node {
  width: 200px;
  box-shadow: 0 2px 3px 0 rgba(0, 112, 204, 0.06);
  background-color: #fff;
  border-radius: 0 0 5px 5px;
  /* overflow: hidden; */
}

.drag-header {
  padding: 5px;
  border-radius: 5px 5px 0 0;
  color: #fff;
  font-size: 16px;
  background-color: #1976d2;
  border: 1px solid #aaa;
}

.drag-content {
  color: #222;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-top: none;
  border-radius: 0 0 5px 5px;
}

.drag-history {
  padding: 5px 0;
  font-size: 12px;
  border-top: 1px solid #eee;
  margin-top: 10px;
}
</style>
