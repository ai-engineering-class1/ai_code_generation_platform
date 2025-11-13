<template>
  <div>
    <div slot="label"
         style="font-size: 16px;position: sticky;"
         class="mr-5 ml-5">
      <el-dropdown class="mt-5 mx-10">
        <span class="
                   el-dropdown-link"
              style="font-size: 16px">
          {{ currCaseType.name
                  }}<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown"
                          style="width: 500px;max-height: 500px;overflow-y: auto; overflow-x: hidden; /* 隐藏水平滚动条 */ ">

          <el-dropdown-item command="1"
                            v-if="currentUser.role==1 || currentUser.role==3"
                            style="margin: 0; padding: 0">
            <div style="width: 100%; text-align: center"
                 @click="handleCreateProject">
              {{ $t("flow.Createproject") }}
            </div>
          </el-dropdown-item>
          <el-input v-model="searchName"
                    clearable
                    size="small"
                    class="mb-1"><i slot="prefix"
               class="el-input__icon el-icon-search"></i></el-input>
          <el-dropdown-item command="0"
                            style="margin: 0; padding: 0"
                            v-for="item in projectDatas.filter(
          (data) =>
            !searchName || data.name.toLowerCase().includes(searchName.toLowerCase())
        )
      "
                            divided
                            :key="item.id">
            <div class="row ml-3"
                 style="width: 100%; text-align: center"
                 @click="handleProjectSelect(item)">
              <div class="
                 text-limiter"> {{ item.name }}</div>
              <div class=" row">
                <el-button type="text"
                           :disabled="currentUser.role!=1 && currentUser.id !=(item.creator==null?'':item.creator.id)"
                           @click.stop="handleEdit(item) "
                           icon="el-icon-edit"></el-button>
                <el-button type="text"
                           :disabled="currentUser.role!=1 && currentUser.role!=3"
                           @click.stop="handleCopy(item) "
                           icon="el-icon-document-copy"></el-button>
                <el-button type="text"
                           :disabled="currentUser.role!=1 && currentUser.id !=(item.creator==null?'':item.creator.id)"
                           @click.stop="handledelete(item) "
                           icon="el-icon-delete"></el-button>
                <!-- <i class="el-icon-edit  mt-3 mr-3"
                   @click.stop="handledelete(item) "
                   v-if="currentUser.role==1 || currentUser.id ==(item.creator==null?'':item.creator.id)"></i>
                <i class="el-icon-document-copy  mt-3 ml-3 mr-3"
                   @click.stop="handleCopy(item)"
                   v-if="currentUser.role==1 || currentUser.id ==(item.creator==null?'':item.creator.id)"></i>
                <i class="el-icon-delete  mt-3 ml-3 "
                   @click.stop="handledelete(item)"
                   v-if="currentUser.role==1 || currentUser.id ==(item.creator==null?'':item.creator.id)"></i> -->

                <el-tooltip class="item"
                            effect="dark"
                            :content="item.desc"
                            placement="right-start">
                  <i class="el-icon-info  mt-3 ml-3 "
                     @click.stop="handleRemark(item)"></i>
                </el-tooltip>
              </div>

            </div>
          </el-dropdown-item>

        </el-dropdown-menu>
      </el-dropdown>

      <el-button type="text"
                 :disabled="currentUser.role!=1 && currentUser.id !=(currCaseType.id)"
                 @click.stop="handleEdit(currCaseType) "
                 icon="el-icon-edit"></el-button>
    </div>

    <el-tabs class="mx-5 my-2"
             v-model="activeName"
             @tab-click="handleClick">

      <!-- <el-tab-pane :label="$t('flow.Configuration')"
                   name="2">
        <Flow></Flow>
      </el-tab-pane> -->
      <el-tab-pane :label="$t('flow.Element')"
                   name="3">
        <Element></Element>
      </el-tab-pane>
      <el-tab-pane :label="$t('flow.Template')"
                   name="4"><Template></Template></el-tab-pane>
      <el-tab-pane :label="$t('flow.Setting')"
                   name="5">
        <Service></Service>
      </el-tab-pane>
      <el-tab-pane :label="$t('chatbot.settings')"
                   name="6">
        <ChatBot></ChatBot>
      </el-tab-pane>
      <el-tab-pane :label="$t('flow.Remark')"
                   name="7">
        <Remark></Remark>
      </el-tab-pane>
      <el-tab-pane :label="$t('flow.Members')"
                   name="8">
        <Members></Members>
      </el-tab-pane>
      <el-tab-pane :label="$t('flow.tester')"
                   name="9">
        <Tester></Tester>
      </el-tab-pane>
    </el-tabs>
    <el-dialog :title="action=='create'? $t('flow.Createproject'):action=='copy'?$t('flow.Copyproject'):$t('flow.Editproject')"
               :close-on-click-modal="false"
               width="30%"
               :visible.sync="dialogFormVisible">
      <el-form>

        <el-form-item :label="$t('flow.CaseName')">
          <el-input v-model="caseInfo.name"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('flow.isCusult')"
                      v-if="action=='create'">
          <q-checkbox v-model="caseInfo.isConsult"
                      :true-value="1"
                      :false-value="0" />
        </el-form-item>

      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{$t('profile.Cancel')}}</el-button>
        <el-button type="primary"
                   @click="handleSubmit">{{$t('profile.Confirm')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  reactive,
} from '@vue/composition-api'
import {
  getLegalDocumentProjects,
  getLegalDocumentProject,
  updateLegalDocumentProject,
  createLegalDocumentProject,
  deleteLegalDocumentProject,
  copyLegalDocumentProject,
} from 'src/graphql/queries/project'
import { useMutation } from '@vue/apollo-composable'
import { mutations, getters } from '../store/store'
import Flow from 'src/pages/drag/drag.vue'
import Element from 'src/pages/Element.vue'
import Template from 'src/pages/Template.vue'
import Service from 'src/pages/Service.vue'
import ChatBot from 'src/pages/ChatBot.vue'
import Remark from 'src/pages/Remark.vue'
import Members from 'src/pages/Members.vue'
import Tester from 'src/pages/Tester.vue'
import notify from 'src/boot/notify'
import { copyToClipboard, Dialog } from 'quasar'
import eventBus from '../utils/eventBus'
export default {
  components: {
    Flow,
    Element,
    Template,
    Service,
    ChatBot,
    Remark,
    Members,
    Tester,
  },
  data() {
    return {
      //activeName: '3',
    }
  },
  setup(props, { root }) {
    const fileTypeValue = ref('诉讼状')
    const caseInfo = reactive({
      name: '',
      desc: '',
      id: 0,
      isConsult: 0,
    })
    const { mutate: getLegalDocumentProjectMutation } = useMutation(
      getLegalDocumentProject
    )
    const currentUser = computed(getters.currentUser)
    const currCaseType = reactive({
      creator: '',
      name: '',
      desc: '',
      id: 0,
      isConsult: 0,
    })
    const dialogFormVisible = ref(false)

    const { mutate: getLegalDocumentProjectsMutation } = useMutation(
      getLegalDocumentProjects
    )
    const { mutate: copyLegalDocumentProjectMutation } = useMutation(
      copyLegalDocumentProject
    )
    const { mutate: updateLegalDocumentProjectMutation } = useMutation(
      updateLegalDocumentProject
    )
    const { mutate: createLegalDocumentProjectMutation } = useMutation(
      createLegalDocumentProject
    )
    const { mutate: deleteLegalDocumentProjectMutation } = useMutation(
      deleteLegalDocumentProject
    )
    const action = ref('create')
    const handleCreateProject = async () => {
      caseInfo.name = ''
      caseInfo.desc = ''
      caseInfo.isConsult = 0
      action.value = 'create'
      dialogFormVisible.value = true
    }
    const getProjectInfo = async (projectId) => {
      const res = await getLegalDocumentProjectMutation({
        id: projectId,
      })
      if (res) {
        const projectInfo = res.data.getLegalDocumentProject
        eventBus.$emit('switchNewProject', projectInfo)
      }
    }
    const handleEdit = async (item) => {
      action.value = 'edit'
      caseInfo.id = item.id
      caseInfo.name = item.name
      caseInfo.desc = item.desc
      caseInfo.isConsult = item.isConsult
      dialogFormVisible.value = true
    }
    const activeName = ref('3')
    const incrementOrAppend = (str) => {
      // 找到最后一个 '-' 的位置
      const lastIndex = str.lastIndexOf('-')

      // 如果没找到 '-'，则直接返回原字符串 + '-1'
      if (lastIndex === -1) {
        return str + '-1'
      }

      // 提取 '-' 之后的子字符串
      const suffix = str.slice(lastIndex + 1)

      // 使用 parseInt 尝试将后缀转换为整数，并检查是否成功
      const num = parseInt(suffix, 10)

      // 如果后缀是数字，则加1并返回新字符串
      if (!isNaN(num)) {
        return str.slice(0, lastIndex + 1) + (num + 1)
      }

      // 如果后缀不是数字，则在原字符串后添加 '-1'
      return str + '-1'
    }
    const handleCopy = async (item) => {
      action.value = 'copy'
      caseInfo.id = item.id

      caseInfo.name = incrementOrAppend(item.name)

      dialogFormVisible.value = true
    }
    const handleProjectSelect = async (item) => {
      currCaseType.id = item.id
      currCaseType.name = item.name
      currCaseType.desc = item.desc
      currCaseType.isConsult = item.isConsult
      currCaseType.creator = item.creator == null ? '' : item.creator.id
      console.log('handleProjectSelect', currCaseType)
      sessionStorage.setItem('legalDocumentProjectId', currCaseType.id)
      //eventBus.$emit('switchProject', currCaseType.id)
      getProjectInfo(item.id)
    }
    const handleRemark = () => {
      activeName.value = '7'
    }
    const handledelete = async (row) => {
      Dialog.create({
        title: root.$t('action.delTip'),
        message: root.$t('action.delTipText'),
        ok: {
          color: 'red',
          label: root.$t('action.delete'),
          noCaps: true,
        },
        cancel: {
          label: root.$t('action.cancel'),
          noCaps: true,
          flat: true,
        },
        style: {
          zIndex: 10002,
        },
      }).onOk(async () => {
        try {
          await deleteLegalDocumentProjectMutation({ id: Number(row.id) })
          if (
            Number(sessionStorage.getItem('legalDocumentProjectId')) == row.id
          ) {
            sessionStorage.setItem('legalDocumentProjectId', null)
          }
          getAllCase()
          notify.success(root.$t('notify.Done'))
        } catch (error) {
          console.log('---------error', error)
          notify.error(error.message)
        }
      })
    }
    const handleSubmit = async () => {
      if (caseInfo.name == '') {
        notify.error('')
        return
      }
      const legalDocumentProject = {
        name: caseInfo.name,
      }
      let res = ''
      if (action.value == 'create') {
        legalDocumentProject.isConsult = caseInfo.isConsult
        res = await createLegalDocumentProjectMutation({
          legalDocumentProject: legalDocumentProject,
        })
      } else if (action.value == 'copy') {
        res = await copyLegalDocumentProjectMutation({
          projectName: caseInfo.name,
          id: caseInfo.id,
        })
      } else {
        res = await updateLegalDocumentProjectMutation({
          id: caseInfo.id,
          legalDocumentProject: legalDocumentProject,
        })
      }

      if (res) {
        notify.success(root.$t('notify.Done'))
        getAllCase()
      }
      dialogFormVisible.value = false
    }
    const projectDatas = ref([
      {
        id: 1,
        name: '诉讼状',
      },
    ])
    const getAllCase = async () => {
      const res = await getLegalDocumentProjectsMutation()
      if (res) {
        projectDatas.value = res.data.getLegalDocumentProjects
        let legalDocumentProjectId = sessionStorage.getItem(
          'legalDocumentProjectId'
        )
        if (projectDatas.value.length == 0) {
          dialogFormVisible.value = true
          currCaseType.id = -1
          currCaseType.name = ''
          currCaseType.creator = ''

          return
        }

        if (
          legalDocumentProjectId === 'null' ||
          legalDocumentProjectId === null ||
          legalDocumentProjectId == 0
        ) {
          currCaseType.id = projectDatas.value[0].id
          currCaseType.name = projectDatas.value[0].name
          currCaseType.isConsult = projectDatas.value[0].isConsult
          currCaseType.creator =
            projectDatas.value[0].creator == null
              ? ''
              : projectDatas.value[0].creator.id
          sessionStorage.setItem(
            'legalDocumentProjectId',
            projectDatas.value[0].id
          )
        } else {
          const currCase = projectDatas.value.find(
            (item) => item.id == Number(legalDocumentProjectId)
          )
          currCaseType.id = currCase.id
          currCaseType.name = currCase.name
          currCaseType.isConsult = currCase.isConsult
          currCaseType.creator =
            currCase.creator == null ? '' : currCase.creator.id
        }
        // eventBus.$emit('switchProject', currCaseType.id)
        getProjectInfo(currCaseType.id)
      }

      return projectDatas.value
    }

    onMounted(() => {
      getAllCase()
      eventBus.$on('updateRemark', () => {
        getAllCase()
      })
    })
    return {
      projectDatas,
      searchName: '',
      fileTypeValue,
      handleRemark,
      action,
      handleEdit,
      handleCopy,
      activeName,
      caseInfo,
      currCaseType,
      dialogFormVisible,
      handleSubmit,
      handleProjectSelect,
      handledelete,
      handleCreateProject,
      currentUser,
    }
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event)
    },
  },
}
</script>
<style>
.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
}
.el-icon-arrow-down {
  font-size: 12px;
}
.text-limiter {
  width: 350px; /* 或者其他限定宽度 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.fixed-tabs {
  position: sticky;
  top: 0;
  z-index: 1000;
}
.el-tabs--card {
  height: calc(100vh - 120px);
  /* overflow-y: auto; */
}
.el-tab-pane {
  height: calc(100vh - 120px);
  overflow-y: auto;
}
</style>