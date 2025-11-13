<template>
  <el-container>

    <el-aside width="200px"
              class="ml-5">
      <div draggable
           class="node-container mt-10 mb-8"
           @dragstart="(e)=>{dragstart(e,user1)}"
           ref="user1">
        <dragNode :itemData="user1" />
      </div>
      <div draggable
           class="node-container mb-10"
           @dragstart="(e)=>{dragstart(e,user2)}"
           ref="user2">
        <dragNode :itemData="user2" />
      </div>
      <div draggable
           class="node-container mb-10"
           @dragstart="(e)=>{dragstart(e,user3)}"
           ref="user3">
        <dragNode :itemData="user3" />
      </div>
    </el-aside>
    <q-separator class="ml-5"
                 style="height: 1000px;"
                 vertical />
    <el-main style="background-color: #F2F6FC;">
      <div @dragover="dragover"
           @drop="addNode">
        <butterfly-vue className="drag"
                       :canvasData="mockData"
                       @onLoaded="finishLoaded"
                       key="drag" />
      </div>

    </el-main>
    <el-drawer class="h-full"
               :modal='false'
               :visible.sync="drawer">
      <div class="pl-5 ">
        <el-form label-width="80px">
          <el-form-item :label="$t('flow.title')">
            <el-input v-model="nodeData.title"></el-input>
          </el-form-item>
          <el-form-item :label="$t('flow.prompt')">
            <el-input type="textarea"
                      rows="5"
                      v-model="nodeData.prompt"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary"
                       @click="handleSave">{{$t('flow.Save')}}</el-button>

            <el-button @click="handleDel">{{$t('flow.Delete')}}</el-button>
          </el-form-item>
        </el-form>

      </div>

    </el-drawer>
  </el-container>
</template>

<script>
// import {ButterflyVue} from 'butterfly-vue';

import dragNode from './node/drag-node.vue'
import startNode from './node/start-node.vue'
import { ButterflyVue } from '../../index.js'
import { defineComponent, ref, onMounted } from '@vue/composition-api'
import eventBus from '../../utils/eventBus'
export default {
  name: 'Drag',
  components: {
    ButterflyVue,
    dragNode,
    startNode,
  },
  data() {
    return {
      drawer: false,
      nodeData: {
        id: '0',
        title: '节点1',
        prompt: '',
        modify: 1,
        reader: 5,
      },
      user1: {
        ref: 'user1',
        userData: {
          title: '节点1',
          prompt:
            '你是一个保险专员，当前用户正在与你面对面交流，需要生成一段开场白，体现你的专业性，目前开放了信息修改业务。字数不超过50字',
          modify: 1,
          reader: 5,
        },
      },
      user2: {
        ref: 'user2',
        userData: {
          title: '节点2',
          prompt: '收集用户回复内容并赋值到',
          modify: 1,
          reader: 5,
        },
      },
      user3: {
        ref: 'user3',
        userData: {
          title: '节点3',
          prompt: '设置prompt 或者提问',
          modify: 1,
          reader: 5,
        },
      },
      mockData: {
        nodes: [
          {
            id: '1',
            left: 50,
            top: 300,
            render: startNode,
            endpoints: [
              {
                id: 'left',
                orientation: [-1, 0],
                pos: [0, 0.5],
              },
              {
                id: 'right',
                orientation: [1, 0],
                pos: [0, 0.5],
              },
            ],
            userData: {
              title: '申请人',
              prompt: '',
              modify: 12,
              reader: 5,
            },
          },
        ],
        groups: [],
        edges: [],
      },
      canvansRef: {},
      butterflyVue: {},
    }
  },
  setup(props, { root }) {
    // const drawer = ref(false)
    // let nodeData = ref({
    //   title: '申请人',
    //   input: '',
    //   modify: 12,
    //   reader: 5,
    // })
    // onMounted(() => {
    //   eventBus.$on('clickNode', (userdata) => {
    //     drawer.value = true
    //     console.log('-------------clickNode', userdata)
    //     nodeData.title = userdata.title
    //     nodeData.input = userdata.input
    //     nodeData.modify = userdata.modify
    //   })
    // })
    // return {
    //   drawer,
    //   nodeData,
    // }
  },
  created() {
    eventBus.$on('clickNode', (nodeData) => {
      this.drawer = true
      this.nodeData.id = nodeData.id
      this.nodeData.title = nodeData.userData.title
      this.nodeData.prompt = nodeData.userData.prompt
      this.nodeData.reader = nodeData.userData.reader
    })
  },
  methods: {
    clickNode(data) {},
    handleSave() {
      let currNode = this.mockData.nodes.find(
        (obj) => obj.id === this.nodeData.id
      )
      currNode.userData.modify = this.nodeData.modify
      currNode.userData.reader = this.nodeData.reader
      currNode.userData.prompt = this.nodeData.prompt
      currNode.userData.title = this.nodeData.title
      this.drawer = false
    },
    handleDel() {
      let index = this.mockData.nodes.findIndex(
        (item) => item.id === this.nodeData.id
      )
      if (index !== -1) {
        this.mockData.nodes.splice(index, 1)
      }
      this.mockData.edges.forEach((elment) => {
        if (
          elment.sourceNode == this.nodeData.id ||
          elment.targetNode == this.nodeData.id
        ) {
          //   let index = this.mockData.edges.findIndex(
          //     (item) => item.id === elment
          //   )
          //   if (index !== -1) {
          //     this.mockData.edges.splice(index, 1)
          //   }
        }
      })
      this.drawer = false
    },
    guid() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
      }
      return S4() + S4() + '-' + S4()
    },
    dragstart(e, user) {
      e.dataTransfer.setData('user', JSON.stringify(user))
      e.dataTransfer.setDragImage(this.$refs[user.ref], 0, 0)
    },
    dragover(e) {
      e.preventDefault()
    },
    addNode(e) {
      const endpointLeft = {
        id: 'left',
        orientation: [-1, 0],
        pos: [0, 0.5],
      }
      const endpointRight = {
        id: 'right',
        orientation: [1, 0],
        pos: [0, 0.5],
      }
      let { clientX, clientY } = e
      let coordinates = this.canvansRef.terminal2canvas([clientX, clientY])
      let user = JSON.parse(e.dataTransfer.getData('user'))
      this.mockData.nodes.push({
        id: this.guid(),
        left: coordinates[0],
        top: coordinates[1],
        render: dragNode,
        userData: user.userData,
        endpoints: [endpointLeft, endpointRight],
      })
    },
    finishLoaded(VueCom) {
      this.butterflyVue = VueCom
      this.canvansRef = VueCom.canvas
      window.butterflyVue = VueCom
      this.canvansRef.setMinimap(true, {
        height: 100,
        nodeColor: 'rgb(234,217,162)',
        activeNodeColor: 'rgb(234,162,176)',
      })
      console.log('finish')
    },
  },
}
</script>

<style scope>
.drag {
  height: 700px;
  min-width: 500px;
  width: 100%;
  display: block;
  position: relative;
}
.el-main {
  padding: 0;
}
.node-container {
  width: 100%;
}
.drag {
  height: 700px;
  min-width: 500px;
  width: 100%;
  display: block;
  position: relative;
}
.drawText {
  font-size: 12px;
}
</style>
