<template>
  <div class="w-full items-center h-full px-8">
    <el-button size="small"
               type="primary"
               v-if="isCusult ==0"
               @click="createClick('parent',null)">{{$t('action.create')}}</el-button>
    <el-table :data="tableData"
              ref="table"
              row-key="id"
              :expand-row-keys="expandedRows"
              @expand-change="handleExpandChange"
              default-expand-all
              style="width: 100%  ; ">
      <el-table-column type="expand">
        <template slot-scope="props">
          <!-- <el-button size="small"
                     class="ml-5"
                     type="primary"
                     @click="createClick('child', props.row)">{{$t('element.addChild')}}</el-button> -->
          <el-table :data="props.row.subclassLegalDocumentElements"
                    class="mx-10 my-3"
                    border
                    :cell-style="{fontSize: '14px', backgroundColor: '#F8F8F8'}"
                    :header-cell-style="{fontSize: '14px', backgroundColor: '#F8F8F8'}"
                    style="width: 100%">
            <el-table-column :label="$t('element.name')"
                             prop="name">
            </el-table-column>
            <el-table-column :label="$t('element.desc')"
                             prop="desc">
              <template slot-scope="scope">
                <el-popover placement="top"
                            trigger="hover"
                            style="white-space: pre-line;">
                  <span style="white-space: pre-line;">{{scope.row.desc  }}</span>

                  <span class="truncate"
                        slot="reference"> {{scope.row.desc  }}</span>
                </el-popover>

              </template>
            </el-table-column>
            <el-table-column :label="$t('element.sample')"
                             prop="sample">
              <template slot-scope="scope">
                <el-popover placement="top"
                            trigger="hover"
                            style="white-space: pre-line;">
                  <span style="white-space: pre-line;">{{scope.row.sample  }}</span>

                  <span class="truncate"
                        slot="reference"> {{scope.row.sample  }}</span>
                </el-popover>

              </template>
            </el-table-column>
            <el-table-column :label="$t('element.spec')"
                             prop="spec">
            </el-table-column>
            <el-table-column :label="$t('action.action')"
                             align="center">
              <template slot-scope="scope">

                <q-btn-dropdown unelevated
                                dropdown-icon="more_vert">
                  <q-list>

                    <q-item clickable
                            v-close-popup
                            @click="editClick('child',scope.row)">
                      <q-item-section>
                        <q-item-label>{{$t('action.edit')}}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable
                            v-close-popup
                            @click="handleCopyElement(scope.row)">
                      <q-item-section>
                        <q-item-label>{{$t('element.copyElement')}}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable
                            v-close-popup
                            @click="onDeleteClick(scope.row)">
                      <q-item-section>
                        <q-item-label>{{$t('action.delete')}}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
                <el-tooltip class="item"
                            effect="dark"
                            content="上移"
                            style="color: black;"
                            placement="top-start">
                  <el-button type="text"
                             @click="moveChildUp(props.row.subclassLegalDocumentElements,scope.row,scope.$index)"
                             icon="el-icon-top"></el-button>
                </el-tooltip>
                <el-tooltip class="item"
                            effect="dark"
                            content="下移"
                            placement="top-start">
                  <el-button type="text"
                             @click="moveChildDown(props.row.subclassLegalDocumentElements,scope.row,scope.$index)"
                             style="color: black;"
                             icon="el-icon-bottom"></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column :label="$t('element.name')"
                       prop="name">
      </el-table-column>
      <el-table-column :label="$t('element.desc')"
                       prop="desc">
        <template slot-scope="scope">
          <el-popover placement="top"
                      trigger="hover"
                      style="white-space: pre-line;">
            <span style="white-space: pre-line;">{{scope.row.desc  }}</span>

            <span class="truncate"
                  slot="reference"> {{scope.row.desc  }}</span>
          </el-popover>

        </template>
      </el-table-column>
      <el-table-column :label="$t('element.sample')"
                       prop="sample">
        <template slot-scope="scope">
          <el-popover placement="top-start"
                      trigger="hover"
                      style="white-space: pre-line;">
            <span style="white-space: pre-line;">{{scope.row.sample  }}</span>

            <span class="truncate"
                  slot="reference"> {{scope.row.sample  }}</span>
          </el-popover>

        </template>
      </el-table-column>
      <el-table-column :label="$t('element.spec')"
                       prop="spec">
      </el-table-column>
      <el-table-column :label="$t('action.action')"
                       align="center">
        <template slot-scope="scope">
          <q-btn-dropdown unelevated
                          dropdown-icon="more_vert">
            <q-list>
              <q-item clickable
                      v-close-popup
                      @click="createClick('child', scope.row)">
                <q-item-section>
                  <q-item-label>{{$t('element.addChild')}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable
                      v-close-popup
                      @click="handleCopyElement(scope.row)">
                <q-item-section>
                  <q-item-label>{{$t('element.copyElement')}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable
                      v-close-popup
                      @click="editClick('parent',scope.row)">
                <q-item-section>
                  <q-item-label>{{$t('action.edit')}}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable
                      v-close-popup
                      @click="onDeleteClick(scope.row)">
                <q-item-section>
                  <q-item-label>{{$t('action.delete')}}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <el-tooltip class="item"
                      effect="dark"
                      content="上移"
                      style="color: black;"
                      placement="top-start">
            <el-button type="text"
                       @click="moveUp(scope.row,scope.$index)"
                       icon="el-icon-top"></el-button>
          </el-tooltip>
          <el-tooltip class="item"
                      effect="dark"
                      content="下移"
                      placement="top-start">
            <el-button type="text"
                       @click="moveDown(scope.row,scope.$index)"
                       style="color: black;"
                       icon="el-icon-bottom"></el-button>
          </el-tooltip>

        </template>
      </el-table-column>
    </el-table>
    <el-dialog :title=" $t('element.copyElement')"
               width="40%"
               :close-on-click-modal="false"
               :visible.sync="dialogCopyVisible">
      <el-form class="w-full"
               label-position="left"
               label-width="130px">

        <el-form-item :label="$t('element.selectProject')">
          <el-select v-model="selectProject"
                     @change="handleSelectProject()">
            <el-option v-for="item in projects"
                       :key="item.id"
                       :label="item.name"
                       :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('element.selectElement')">
          <el-cascader :options="copyElements"
                       v-model="selectElement"
                       :props="{ checkStrictly: true }"
                       clearable></el-cascader>
        </el-form-item>
      </el-form>
      <el-alert title="注意"
                type="warning"
                style="white-space: pre-line;"
                description="所选择的目标要素，在复制后将被更新成与当前要素完全一致.
           请在复制操作前仔细检查，确保这是您期望的结果."
                :closable="false"
                show-icon>
      </el-alert>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="dialogCopyVisible = false">{{$t('profile.Cancel')}}</el-button>
        <el-button type="primary"
                   @click="handleCopy">{{$t('element.copy')}}</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="elementTemplate.modle==='create'? $t('action.create'): $t('action.edit')"
               width="60%"
               :close-on-click-modal="false"
               :visible.sync="dialogFormVisible">
      <el-form class="w-full"
               label-position="left">

        <el-form-item :label="$t('element.name')">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
                <li>要素提取</li>
                <li>要素确认</li>
                <li>文书生成</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input v-model="elementTemplate.name"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.desc')">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
                <li>要素提取</li>
                <li>要素确认</li>
                <li>文书生成</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.desc"
                      autocomplete="off"></el-input>
          </div>

        </el-form-item>
        <el-form-item :label="$t('element.sample')">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
                <li>要素提取</li>
                <li>要素确认</li>
                <li>文书生成</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.sample"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.spec')">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>要素确认</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.spec"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <!-- <el-form-item :label="$t('element.question')">
          <div style=" display: flex;
  justify-content: space-between;">
            <span style="width: 56px;"></span>
            <el-input type="textarea"
                      v-model="elementTemplate.question"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.questionmore')">
          <div style=" display: flex;">
            <span style="width: 30px;"></span>
            <div class="mt-3 mb-3 "
                 style="  display: flex;
  flex-direction: column;">
      
              <q-btn round
                     @click="addFormData"
                     color="primary"
                     size="small"
                     style="width: 50px;height: 50px;"
                     class="ml-2 float-left"
                     icon="add" />
              <div class="contact-form-part ">
                <div v-for="(field, index) in formData"
                     class="mt-3"
                     style="display: block"
                     :key="index">
                  <div class="row ">

                    <el-input type="textarea"
                              style="width: 380px;"
                              v-model="field.label"
                              autocomplete="off"></el-input>
                    <span class="form-del"
                          @click="formDel(index)">{{
                    $t("action.delete")
                  }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-form-item> -->
        <el-form-item :label="$t('element.Dependency')"
                      v-if="eableDependency">
          <div style=" display: flex;
">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
                <li>要素提取</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>

            <el-select class=""
                       size="small"
                       clearable
                       v-model="elementTemplate.dependencyFactor"
                       :placeholder="$t('element.DependencyElement')">
              <el-option v-for="item in dependencyElements"
                         :key="item.id"
                         :label="item.name"
                         :value="item.name">
              </el-option>
            </el-select>

            <el-select class="ml-3"
                       size="small"
                       @change="handleSelectRelative()"
                       v-model="elementTemplate.dependencyCondOp"
                       style="width: 100px;"
                       clearable
                       :placeholder="$t('element.Relational')">
              <el-option v-for="item in relatives"
                         :key="item"
                         :label="item"
                         :value="item">
              </el-option>
            </el-select>
            <el-input class="ml-3"
                      v-model="elementTemplate.dependencyValue"
                      size="small"
                      clearable
                      :disabled="elementTemplate.dependencyCondOp ==='存在'||elementTemplate.dependencyCondOp ==='不存在'"
                      style="width: 300px;"
                      :placeholder="$t('element.ValueNeed')"></el-input>

          </div>
        </el-form-item>
        <el-form-item :label="$t('element.PresetConditions')">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>要素提取</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.promptFig"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.promptAsk')"
                      v-if="!eableDependency">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
              </ul>

              <span style=" display: block;margin-top: 15px;">占位符:</span>
              <ul class="
                        ml-3">
                <li>{要素名称}</li>
                <li>{下一要素}</li>
                <li>{下一要素的描述}</li>
                <li>{要素定义}</li>
                <li>{已知信息}</li>
                <li>{知识库结果}</li>
                <li>{资料}</li>
                <li>{今天日期}</li>
                <li>{today_date}</li>

              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.promptAsk"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.promptRef')"
                      v-if="!eableDependency">
          <div style=" display: flex;
  justify-content: space-between;">
            <el-popover placement="right-end"
                        title="应用场景："
                        style="white-space: pre-line;"
                        width="200"
                        trigger="hover">
              <ul class="ml-3">
                <li>案件询问</li>
              </ul>

              <i class="el-icon-info"
                 slot="reference"
                 style="margin-left: 15px; margin-right: 25px;"></i>
            </el-popover>
            <el-input type="textarea"
                      v-model="elementTemplate.promptRef"
                      autocomplete="off"></el-input>
          </div>
        </el-form-item>
        <el-form-item :label="$t('element.isFlag')">
          <q-checkbox v-model="elementTemplate.flag"
                      :true-value="1"
                      :false-value="0" />
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{$t('profile.Cancel')}}</el-button>
        <el-button type="primary"
                   @click="handleCreate">{{$t('profile.Confirm')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script >
import {
  defineComponent,
  ref,
  reactive,
  computed,
  onMounted,
} from '@vue/composition-api'
import { useMutation } from '@vue/apollo-composable'
import { mutations, getters } from '../store/store'
import notify from 'src/boot/notify'
import {
  createLegalDocumentElement,
  getLegalDocumentElements,
  copyLegalDocumentElement,
  updateLegalDocumentElement,
  deleteLegalDocumentElement,
  swapLegalDocumentElementOrder,
} from 'src/graphql/queries/element'
import {
  getLegalDocumentProjects,
  getLegalDocumentProject,
} from 'src/graphql/queries/project'
import { copyToClipboard, Dialog } from 'quasar'
import eventBus from '../utils/eventBus'
import { getIsMobileBrowser } from 'src/utils/isMobileBrowser'

export default defineComponent({
  data() {
    return {
      a: false,
      arr: [],
      isMobile: getIsMobileBrowser(),
    }
  },
  setup(props, { root }) {
    const { mutate: createLegalDocumentElementMutation } = useMutation(
      createLegalDocumentElement
    )
    const { mutate: copyLegalDocumentElementMutation } = useMutation(
      copyLegalDocumentElement
    )
    const { mutate: swapLegalDocumentElementOrderMutation } = useMutation(
      swapLegalDocumentElementOrder
    )
    const { mutate: getLegalDocumentProjectsMutation } = useMutation(
      getLegalDocumentProjects
    )
    const { mutate: getLegalDocumentProjectMutation } = useMutation(
      getLegalDocumentProject
    )
    const { mutate: getLegalDocumentElementsMutation } = useMutation(
      getLegalDocumentElements
    )
    const { mutate: deleteLegalDocumentElementMutation } = useMutation(
      deleteLegalDocumentElement
    )
    const { mutate: updateLegalDocumentElementMutation } = useMutation(
      updateLegalDocumentElement
    )
    const getRowKeys = (row) => {
      return row.id
    }

    const copyElements = ref([])
    const getAllCase = async () => {
      const res = await getLegalDocumentProjectsMutation()
      if (res) {
        projects.value = res.data.getLegalDocumentProjects
      }
    }
    const moveChildUp = async (parent, row, index) => {
      if (index === 0) {
        notify.error(root.$t('element.first'))
        return
      }

      const res = await swapLegalDocumentElementOrderMutation({
        targetId: parent[index - 1].id,
        id: row.id,
      })
      if (res) {
        getElements(true)
      }

      console.log(row, index)
    }
    const moveChildDown = async (parent, row, index) => {
      if (index === parent.length - 1) {
        notify.error(root.$t('element.last'))
        return
      }
      const res = await swapLegalDocumentElementOrderMutation({
        targetId: parent[index + 1].id,
        id: row.id,
      })
      if (res) {
        getElements(true)
      }

      console.log(row, index)
    }
    let expandedRows = ref([])
    let expanded = []
    const handleExpandChange = (row, e) => {
      expanded = e
    }
    const moveUp = async (row, index) => {
      if (index === 0) {
        notify.error(root.$t('element.first'))
        return
      }

      const res = await swapLegalDocumentElementOrderMutation({
        targetId: tableData.value[index - 1].id,
        id: row.id,
      })
      if (res) {
        getElements(true)
      }

      console.log(row, index)
    }
    const moveDown = async (row, index) => {
      if (index === tableData.value.length - 1) {
        notify.error(root.$t('element.last'))
        return
      }
      const res = await swapLegalDocumentElementOrderMutation({
        targetId: tableData.value[index + 1].id,
        id: row.id,
      })
      if (res) {
        getElements(true)
      }

      console.log(row, index)
    }
    const relatives = ref(['是', '不是', '有', '没有', '存在', '不存在'])
    const addFormData = () => {
      formData.value.push({
        id: formData.value.length + 1 + '',
        label: '',
        name: '',
        type: 'textarea',
      })
    }
    const formData = ref([])
    const selectProject = ref('')
    const dialogCopyVisible = ref(false)
    const projects = ref([])

    const formDel = (index) => {
      formData.value.splice(index, 1)
    }
    const dialogFormVisible = ref(false)
    const dialogFormVisibleicon = ref(false)
    const tableData = ref([])
    const elementTemplate = reactive({
      modle: 'create',
      name: '',
      desc: '',
      spec: '',
      sample: '',
      question: '',
      promptFig: '',
      promptAsk: '',
      promptRef: '',
      position: 0,
      dependencyFactor: '',
      dependencyValue: '',
      dependencyCondOp: '',
      parentLegalDocumentElementId: 0,
      flag: 1,
      id: 0,
    })

    const getElements = async (isMove) => {
      const res = await getLegalDocumentElementsMutation({
        legalDocumentProjectId: Number(
          sessionStorage.getItem('legalDocumentProjectId')
        ),
      })
      if (res) {
        tableData.value = res.data.getLegalDocumentElements
        if (isMove) {
          expandedRows.value = []
          expanded.forEach((element) => {
            expandedRows.value.push(element.id)
          })
        }
      }
    }
    const targetId = ref(0)
    const handleCopy = async () => {
      if (selectElement.value.length == 0) {
        notify.error(root.$t('element.selectElement'))
        return
      }
      const res = await copyLegalDocumentElementMutation({
        id: selectElement.value[selectElement.value.length - 1],
        targetId: targetId.value,
      })
      if (res) {
        notify.success(root.$t('notify.Done'))
        dialogCopyVisible.value = false
        getElements(false)
      }
    }
    const handleCopyElement = (item) => {
      targetId.value = item.id
      selectProject.value = ''
      selectElement.value = []
      getAllCase()
      dialogCopyVisible.value = true
    }
    const eableDependency = ref(false)
    const createClick = (isSubElment, item) => {
      if (isSubElment == 'child') {
        eableDependency.value = true
        elementTemplate.parentLegalDocumentElementId = item.id
      } else {
        eableDependency.value = false
        elementTemplate.parentLegalDocumentElementId = 0
      }

      elementTemplate.modle = 'create'
      dialogFormVisible.value = true
      elementTemplate.name = ''
      elementTemplate.desc = ''
      elementTemplate.spec = ''
      elementTemplate.sample = ''
      elementTemplate.dependencyFactor = ''
      elementTemplate.dependencyValue = ''
      elementTemplate.dependencyCondOp = ''
      elementTemplate.question = ''
      elementTemplate.promptFig = ''
      elementTemplate.promptAsk = ''
      elementTemplate.promptRef = ''

      elementTemplate.flag = 1
      isDependency.value = false

      dependencyElements.value = item.subclassLegalDocumentElements
    }
    const handleCreate = async () => {
      if (!elementTemplate.name) {
        notify.error(root.$t('element.nameRequire'))
        return
      }
      if (elementTemplate.dependencyFactor) {
        if (elementTemplate.dependencyCondOp == '') {
          notify.error(root.$t('element.RelationalNeed'))
          return
        }
        if (
          elementTemplate.dependencyCondOp == '存在' ||
          elementTemplate.dependencyCondOp == '不存在'
        ) {
          elementTemplate.dependencyValue = ''
        } else {
          if (elementTemplate.dependencyValue == '') {
            notify.error(root.$t('element.ValueNeed'))
            return
          }
        }
      }
      let morequestion = []
      formData.value.forEach((element) => {
        morequestion.push(element.label)
      })
      const legalDocumentElement = {
        name: elementTemplate.name,
        desc: elementTemplate.desc,
        spec: elementTemplate.spec,
        sample: elementTemplate.sample,
        question: elementTemplate.question,
        promptFig: elementTemplate.promptFig,
        promptAsk: elementTemplate.promptAsk,
        promptRef: elementTemplate.promptRef,
        flag: Number(elementTemplate.flag),
        questionMore: JSON.stringify(morequestion),
        dependencyFactor: elementTemplate.dependencyFactor,
        dependencyCondOp: elementTemplate.dependencyCondOp,
        dependencyValue: elementTemplate.dependencyValue,
      }

      try {
        if (elementTemplate.modle == 'create') {
          if (elementTemplate.parentLegalDocumentElementId != 0) {
            legalDocumentElement.parentLegalDocumentElementId =
              elementTemplate.parentLegalDocumentElementId
          }
          legalDocumentElement.legalDocumentProjectId = Number(
            sessionStorage.getItem('legalDocumentProjectId')
          )
          await createLegalDocumentElementMutation({
            legalDocumentElement: legalDocumentElement,
          })
        } else {
          await updateLegalDocumentElementMutation({
            id: elementTemplate.id,
            legalDocumentElement: legalDocumentElement,
          })
        }

        dialogFormVisible.value = false
        getElements(false)
        notify.success(root.$t('notify.Done'))
      } catch (error) {
        notify.error(error.message)
      }
    }
    const selectElement = ref('')

    const handleSelectRelative = async () => {
      if (
        elementTemplate.dependencyCondOp == '存在' ||
        elementTemplate.dependencyCondOp == '不存在'
      ) {
        elementTemplate.dependencyValue = ''
      }
    }
    const handleSelectProject = async () => {
      copyElements.value = []
      const res = await getLegalDocumentElementsMutation({
        legalDocumentProjectId: Number(selectProject.value),
      })
      if (res) {
        res.data.getLegalDocumentElements.forEach((element) => {
          let parent = {
            value: element.id,
            label: element.name,
            children: [],
          }
          if (
            element.subclassLegalDocumentElements != null &&
            element.subclassLegalDocumentElements.length > 0
          ) {
            element.subclassLegalDocumentElements.forEach((childItem) => {
              let child = { value: childItem.id, label: childItem.name }
              parent.children.push(child)
            })
          }
          copyElements.value.push(parent)
        })
      }
    }
    const dependencyElements = ref([])
    const isDependency = ref(false)
    const editClick = (model, item) => {
      formData.value = []
      dependencyElements.value = []
      elementTemplate.modle = 'edit'
      dialogFormVisible.value = true
      elementTemplate.id = item.id
      elementTemplate.name = item.name
      elementTemplate.desc = item.desc
      elementTemplate.spec = item.spec
      elementTemplate.sample = item.sample
      elementTemplate.question = item.question
      elementTemplate.flag = item.flag
      elementTemplate.promptFig = item.promptFig
      elementTemplate.promptAsk = item.promptAsk
      elementTemplate.promptRef = item.promptRef
      elementTemplate.dependencyFactor = item.dependencyFactor
      elementTemplate.dependencyValue = item.dependencyValue
      elementTemplate.dependencyCondOp = item.dependencyCondOp
      //   if (elementTemplate.dependencyFactor) {
      //     if (relatives.value.includes(item.dependencyValue)) {
      //       elementTemplate.dependencyCondOp = item.dependencyValue
      //       elementTemplate.dependencyValue = ''
      //     } else {
      //       elementTemplate.dependencyCondOp = '等于'
      //       elementTemplate.dependencyValue = item.dependencyValue
      //     }
      //   } else {
      //     elementTemplate.dependencyCondOp = ''
      //   }

      if (model == 'child') {
        eableDependency.value = true
      } else {
        eableDependency.value = false
      }
      tableData.value.forEach((element) => {
        if (element.id == item.parentLegalDocumentElementId) {
          dependencyElements.value = element.subclassLegalDocumentElements
        }
      })
      let morequestion =
        item.questionMore == '' ? [] : JSON.parse(item.questionMore)
      morequestion.forEach((element) => {
        let tem = {
          id: formData.value.length + 1 + '',
          label: element,
        }

        formData.value.push(tem)
      })
    }
    const onUpdate = async () => {
      const filter = {
        name: filterName.value,
        viewers: Number(isPrivate.value),
      }
      try {
        const res = await updateFilterMutation({
          filter: filter,
          id: filterId.value,
        })
        dialogFormVisible.value = false

        notify.success(root.$t('notify.Done'))
      } catch (error) {
        notify.error(error.message)
      }
    }
    const isCusult = ref(0)
    const onDeleteClick = async (row) => {
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
          await deleteLegalDocumentElementMutation({ id: Number(row.id) })
          getElements(false)
          notify.success(root.$t('notify.Done'))
        } catch (error) {
          console.log('---------error', error)
          notify.error(error.message)
        }
      })
    }
    onMounted(() => {
      //   eventBus.$on('switchProject', (caseId) => {
      //     getElements()
      //   })
      //   getElements()
      eventBus.$on('switchNewProject', (info) => {
        isCusult.value = info.isConsult
        getElements(false)
      })
    })
    return {
      search: '',
      getRowKeys,
      selectProject,
      copyElements,
      selectElement,
      expandedRows,
      handleExpandChange,
      handleCopy,
      isCusult,
      moveUp,
      moveDown,
      moveChildDown,
      handleSelectRelative,
      moveChildUp,
      handleSelectProject,
      dialogFormVisibleicon,
      handleCopyElement,
      elementTemplate,
      dialogCopyVisible,
      projects,
      eableDependency,
      handleCreate,
      relatives,
      addFormData,
      formData,
      dependencyElements,
      formDel,
      tableData,
      createClick,
      isDependency,
      editClick,
      thumbStyle: {
        right: '4px',
        borderRadius: '5px',
        backgroundColor: '#027be3',
        width: '5px',
        opacity: 0.75,
      },
      barStyle: {
        right: '2px',
        borderRadius: '9px',
        backgroundColor: '#027be3',
        width: '9px',
        opacity: 0.2,
      },
      onUpdate,
      onDeleteClick,
      dialogFormVisible,
    }
  },
  methods: {},
})
</script>

<style>
.input {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 1.5rem;
  margin-left: 1rem;
}
.form-del {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #666;
  text-align: center;
  box-sizing: border-box;
  outline: 0;
  margin-top: 6px;
  height: 36px;
  transition: 0.1s;
  font-weight: 500;
  padding: 10px 13px;
  font-size: 14px;
  border-radius: 4px;
  margin-left: 20px;
  &:hover {
    border: 1px solid #409eff;
    color: #409eff;
  }
}

.el-tooltip__popper {
  /* 设置最大宽度 */
  white-space: 'pre-wrap;';
  max-width: 500px; /* 示例宽度 */

  /* 你还可以添加其他样式 */
}
.truncate {
  white-space: nowrap; /* 强制单行显示 */
  text-overflow: ellipsis; /* 超出部分省略号表示 */
  overflow: hidden; /* 超出部分隐藏 */
  width: 200px; /* 设置显示的最大宽度，可根据需要调整 */
}
ul li {
  list-style-type: disc;
}
</style>
