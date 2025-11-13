<template>
  <div class="q-pa-md w-full">

    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;"
         class="pb-8">

      <el-form class="w-full"
               label-position="left"
               label-width="85px">

        <el-form-item :label="$t('chatbot.model')">
          <el-select v-model="chatBotInfo.model"
                     placeholder="请选择">
            <el-option v-for="item in chatmodels"
                       :key="item"
                       :label="item"
                       :value="item">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('chatbot.kbId')">
          <el-select v-model="chatBotInfo.kbId"
                     class="mt-3"
                     clearable
                     placeholder="请选择">
            <el-option v-for="item in tableData"
                       :key="item.id"
                       :label="item.name"
                       :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('chatbot.temperature')">

          <q-slider v-model="chatBotInfo.temperature"
                    class="mt-3"
                    :min="0"
                    :max="1"
                    style="width: 60%;"
                    :step="0.01"
                    label
                    label-always
                    color="primary" />
        </el-form-item>

        <el-form-item :label="$t('chatbot.top_p')">

          <q-slider v-model="chatBotInfo.top_p"
                    class="mt-3"
                    :min="0.01"
                    :max="0.99"
                    style="width: 60%;"
                    :step="0.1"
                    label
                    label-always
                    color="primary" />
        </el-form-item>
        <el-form-item :label="$t('chatbot.max_tokens')">

          <q-slider v-model="chatBotInfo.max_tokens"
                    class="mt-3"
                    :min="0"
                    :max="4096"
                    style="width: 60%;"
                    :step="10"
                    label
                    label-always
                    color="primary" />
        </el-form-item>
        <el-form-item :label="$t('chatbot.charDesc')">
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.charDescLaw') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"></i>
                </el-popover>
                <el-button icon='el-icon-s-tools'
                           type="text"
                           @click="config('1')"
                           style="margin-left: 15px; margin-right: 25px;"></el-button>
              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      style="color: #fff;"
                      v-model="chatBotInfo.charDescLaw"></el-input>
          </div>

          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.charDescQos') }}
              </span>
              <el-button icon='el-icon-s-tools'
                         type="text"
                         @click="config('2')"></el-button>
            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.charDescQos"></el-input>
          </div>

          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.charDescCki') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <span style="white-space: pre-line;">
                    <ul class="ml-3">
                      <li>{要素名称}</li>
                      <li>{要素定义}</li>
                      <li>{已知信息}</li>
                      <li>{今天日期}</li>
                      <li>{today_date}</li>
                    </ul>

                  </span>
                  <i class="el-icon-info"
                     slot="reference"></i>
                </el-popover>
                <el-button icon='el-icon-s-tools'
                           type="text"
                           @click="config('3')"
                           style="margin-left: 15px; margin-right: 25px;"></el-button>
              </div>
            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.charDescCki"></el-input>
          </div>
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptAsk') }}
              </span>

              <div style="display: flex; align-items: center; justify-content: center;">

                <el-button icon='el-icon-s-tools'
                           type="text"
                           @click="config('4')"></el-button>
                <!-- <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">

                  <ul class="ml-3">
                    <li>{要素名称}</li>
                    <li>{下一要素}</li>
                    <li>{要素定义}</li>
                    <li>{已知信息}</li>
                    <li>{知识库结果}</li>
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover> -->

              </div>
            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.charDescAsk"></el-input>
          </div>
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.prompt_doc') }}
              </span>

              <div style="display: flex; align-items: center; justify-content: center;">

                <el-button icon='el-icon-s-tools'
                           type="text"
                           @click="config('5')"></el-button>
                <!-- <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{today_date}</li>
                    <li>{case_element}</li>
                    <li>{case_inquiry}</li>
                    <li>{case_sample}</li>
                    <li>{format_instructions}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover> -->

              </div>
            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.chardesc_doc"></el-input>
          </div>

        </el-form-item>
        <el-form-item class="mt-5 "
                      :label="
                      $t('chatbot.prompt')">
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptKbx') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li> <!-- 显示为字符串 '{{' -->
                      &lbrace;&lbrace;
                      knowledge
                      <!-- 显示为字符串 '}}' -->
                      &rbrace;&rbrace;
                    </li>
                    <li> <!-- 显示为字符串 '{{' -->
                      &lbrace;&lbrace;
                      question
                      <!-- 显示为字符串 '}}' -->
                      &rbrace;&rbrace;
                    </li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover>

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptKbx"></el-input>
          </div>

          <!-- <el-form-item :label="$t('chatbot.promptKbx')">
            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptKbx"></el-input>
          </el-form-item> -->
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptQos') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <!-- <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover> -->

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptQos"></el-input>
          </div>
          <!-- <el-form-item class="mt-1"
                        :label="$t('chatbot.promptQos')">
            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptQos"></el-input>
          </el-form-item> -->
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptCki') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{要素名称}</li>
                    <li>{要素定义}</li>
                    <li>{已知信息}</li>
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                    <li>{资料}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover>

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptCki"></el-input>
          </div>
          <!-- <el-form-item class="mt-1"
                        :label="$t('chatbot.promptCki')">
            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptCki"></el-input>
          </el-form-item> -->
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptAsk') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{要素名称}</li>
                    <li>{下一要素}</li>
                    <li>{下一要素的描述}</li>
                    <li>{要素定义}</li>
                    <li>{已知信息}</li>
                    <li>{知识库结果}</li>
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                    <li>{资料}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover>

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptAsk"></el-input>
          </div>
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.promptAskLast') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;white-space: pre-line;">

                <el-popover placement="right-end"
                            title=""
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <span style=" display: block;">可选提示词 </span>
                  <span style=" display: block;">适用于最后一个一级要素</span>
                  <span style=" display: block;margin-top: 15px;">占位符:</span>
                  <ul class="
                        ml-3">
                    <li>{要素名称}</li>
                    <li>{下一要素}</li>
                    <li>{下一要素的描述}</li>
                    <li>{要素定义}</li>
                    <li>{已知信息}</li>
                    <li>{知识库结果}</li>
                    <li>{今天日期}</li>
                    <li>{today_date}</li>
                    <li>{资料}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover>

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.promptAskLast"></el-input>
          </div>
          <div style="display: flex;">
            <div style="width: 95px;"
                 class="column">
              <span>
                {{ $t('chatbot.prompt_doc') }}
              </span>
              <div style="display: flex; align-items: center; justify-content: center;">

                <el-popover placement="right-end"
                            title="占位符："
                            style="white-space: pre-line;"
                            width="200"
                            trigger="hover">
                  <ul class="ml-3">
                    <li>{today_date}</li>
                    <li>{case_element}</li>
                    <li>{case_inquiry}</li>
                    <li>{case_sample}</li>
                    <li>{format_instructions}</li>
                  </ul>

                  <i class="el-icon-info"
                     slot="reference"
                     style="margin-left: 15px; margin-right: 25px;"></i>
                </el-popover>

              </div>

            </div>

            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.prompt_doc"></el-input>
          </div>
          <!-- <el-form-item class="mt-3"
                        :label="$t('chatbot.prompt_doc')">
            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.prompt_doc"></el-input>
          </el-form-item> -->
        </el-form-item>
        <el-form-item class="mt-3"
                      :label="$t('chatbot.Placeholder')">
          <el-form-item :label="$t('chatbot.nextCkiLabel')">
            <el-input type="textarea"
                      :rows="2"
                      v-model="chatBotInfo.nextCkiLabel"></el-input>
          </el-form-item>
          <el-form-item :label="$t('chatbot.nextCkiLabeldes')"
                        class="mt-2">
            <el-input type="textarea"
                      :rows="2"
                      v-model="chatBotInfo.nextCkiDesc"></el-input>
          </el-form-item>
        </el-form-item>
        <el-form-item class="mt-3"
                      :label="$t('chatbot.text_length')">
          <el-form-item :label="$t('chatbot.promptAsk')">
            <el-input type="number"
                      oninput="if(this.value < 0) this.value = 0"
                      v-model="chatBotInfo.turnsAsk"></el-input>
          </el-form-item>
          <el-form-item :label="$t('chatbot.turnsRpt')">
            <el-input type="number"
                      oninput="if(this.value < 0) this.value = 0"
                      v-model="chatBotInfo.turnsRpt"></el-input>
          </el-form-item>
        </el-form-item>

        <el-form-item class="mt-3"
                      :label="$t('chatbot.reference_doc')">
          <el-form-item :label="$t('chatbot.prompt_doc')">
            <el-input type="textarea"
                      :rows="3"
                      v-model="chatBotInfo.reference_doc"></el-input>
          </el-form-item>
        </el-form-item>
        <el-form-item class="mt-5">
          <el-button type="primary"
                     @click="handleSave">{{ $t('service.save') }}</el-button>

        </el-form-item>
      </el-form>
    </div>
    <el-dialog width="40%"
               :close-on-click-modal="false"
               :title="configDialogTitle"
               :visible.sync="configDialog"
               :modal-append-to-body="false"
               :destroy-on-close="true">
      <el-form class="w-full"
               label-position="left"
               label-width="100px">

        <el-form-item :label="$t('chatbot.model')">
          <el-select v-model="configJson.model"
                     placeholder="请选择">
            <el-option v-for="item in chatmodels"
                       :key="item"
                       :label="item"
                       :value="item">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('chatbot.temperature')">

          <q-slider v-model="configJson.temperature"
                    class="mt-3"
                    :min="0"
                    :max="1"
                    style="width: 100%;"
                    :step="0.01"
                    label
                    label-always
                    color="primary" />
        </el-form-item>

        <el-form-item :label="$t('chatbot.top_p')">

          <q-slider v-model="configJson.top_p"
                    class="mt-3"
                    :min="0.01"
                    :max="0.99"
                    style="width: 100%;"
                    :step="0.1"
                    label
                    label-always
                    color="primary" />
        </el-form-item>
        <el-form-item :label="$t('chatbot.max_tokens')">

          <q-slider v-model="configJson.max_tokens"
                    class="mt-3"
                    :min="0"
                    :max="4096"
                    style="width: 100%;"
                    :step="10"
                    label
                    label-always
                    color="primary" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="configDialog = false">{{ $t('chatbot.Cancel') }}</el-button>
        <el-button @click="handleConfigDelete"
                   type="primary">{{ $t('chatbot.Delete') }}</el-button>
        <el-button @click="handleConfigSave"
                   type="primary">
          {{ $t("chatbot.Confirm") }}
        </el-button>

      </span>
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
import validator from 'src/utils/validator'
import { useMutation } from '@vue/apollo-composable'
import { getZhiPuAllKb } from 'src/graphql/queries/kb'
import { getSfbots, updateSfbot } from 'src/graphql/queries/chatbot'
import { storeAuthToken } from 'src/utils/authToken'
import notify from 'src/boot/notify'
import store from 'src/store/store'
import { uploadOSS, OSSConfig } from 'src/boot/oss'
import { getters, mutations } from '../store/store'
import {
  getLegalDocumentProject,
  updateLegalDocumentProject,
} from 'src/graphql/queries/project'
import eventBus from '../utils/eventBus'
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from 'src/utils/isMobileBrowser'
export default defineComponent({
  name: 'Login',
  data() {
    return {
      isPwd: true,
      isNetWrok: true,
      isMobile: getIsMobileBrowser(),
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    const currentUser = computed(getters.currentUser)
    const { mutate: getZhiPuAllKbMutation } = useMutation(getZhiPuAllKb)
    const { mutate: getLegalDocumentProjectMutation } = useMutation(
      getLegalDocumentProject
    )
    const { mutate: updateLegalDocumentProjectMutation } = useMutation(
      updateLegalDocumentProject
    )
    const configDialogTitle = ref('')
    const tableData = ref([])
    const getAllKB = async () => {
      const res = await getZhiPuAllKbMutation()
      if (res) {
        tableData.value = JSON.parse(res.data.getZhiPuAllKb).data.list
      }
    }
    const configJson = ref({
      model: 'gpt-3.5-turbo',
      temperature: 0.9,
      top_p: 0.7,
      max_tokens: 128,
    })
    const configDialog = ref(false)
    const currConfigType = ref(0)
    const config = (type) => {
      currConfigType.value = type
      configDialog.value = true
      console.log(type, chatBotInfo.llmCfgKbx)
      switch (type) {
        case '1':
          configDialogTitle.value = '咨询服务 模型/参数'
          configJson.value = chatBotInfo.llmCfgKbx
            ? JSON.parse(chatBotInfo.llmCfgKbx)
            : {}

          return
        case '2':
          configJson.value = chatBotInfo.llmCfgQos
            ? JSON.parse(chatBotInfo.llmCfgQos)
            : {}
          configDialogTitle.value = '问题识别 模型/参数'
          return
        case '3':
          configJson.value = chatBotInfo.llmCfgCki
            ? JSON.parse(chatBotInfo.llmCfgCki)
            : {}
          configDialogTitle.value = '要素提取 模型/参数'
          return
        case '4':
          configJson.value = chatBotInfo.llmCfgAsk
            ? JSON.parse(chatBotInfo.llmCfgAsk)
            : {}

          configDialogTitle.value = '案件询问 模型/参数'
          return
        case '5':
          configJson.value = chatBotInfo.llmCfgDoc
            ? JSON.parse(chatBotInfo.llmCfgDoc)
            : {}

          configDialogTitle.value = '文书生成 模型/参数'
          return
      }
    }
    const handleConfigDelete = async () => {
      switch (currConfigType.value) {
        case '1':
          chatBotInfo.llmCfgKbx = null
          break
        case '2':
          chatBotInfo.llmCfgQos = null
          break
        case '3':
          chatBotInfo.llmCfgCki = null
          break
        case '4':
          chatBotInfo.llmCfgAsk = null
          break
        case '5':
          chatBotInfo.llmCfgDoc = null
          break
      }
      handleSave()
      configDialog.value = false
    }
    const handleConfigSave = async () => {
      switch (currConfigType.value) {
        case '1':
          chatBotInfo.llmCfgKbx = JSON.stringify(configJson.value)
          break
        case '2':
          chatBotInfo.llmCfgQos = JSON.stringify(configJson.value)
          break
        case '3':
          chatBotInfo.llmCfgCki = JSON.stringify(configJson.value)
          break
        case '4':
          chatBotInfo.llmCfgAsk = JSON.stringify(configJson.value)
          break
        case '5':
          chatBotInfo.llmCfgDoc = JSON.stringify(configJson.value)
          break
      }
      handleSave()
      configDialog.value = false
    }
    const { mutate: getSfbotsMutation } = useMutation(getSfbots)
    const { mutate: updateSfbotMutation } = useMutation(updateSfbot)
    const chatmodels = [
      'glm-3-turbo',
      'glm-4',
      'glm-4-0520',
      'glm-4-air',
      'glm-4-airx',
      'qwen-long',
      'farui-plus',
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      //'abab6.5s-chat',
      'gpt-3.5-turbo',
    ]
    const chatBotInfo = reactive({
      id: 0,
      servicerName: '',
      servicerGreeting: '',
      servicerAvatarUrl: '',
      model: 'glm-3-turbo',
      temperature: 0.9,
      prompt: '',
      charDesc: '',
      top_p: 0.7,
      max_tokens: 500,
      kbId: 0,
      charDescLaw: '',
      charDescQos: '',
      charDescCki: '',
      charDescAsk: '',
      chardesc_doc: '',
      llmCfgKbx: '',
      llmCfgQos: '',
      llmCfgCki: '',
      llmCfgAsk: '',
      llmCfgDoc: '',
      promptKbx: '',
      promptQos: '',
      promptCki: '',
      promptAsk: '',
      promptAskLast: '',
      prompt_doc: '',
      reference_doc: '',
      nextCkiLabel: '',
      nextCkiDesc: '',
      turnsAsk: 0,
      turnsRpt: 0,
    })
    const getProjectInfo = async () => {
      const res = await getLegalDocumentProjectMutation({
        id: Number(sessionStorage.getItem('legalDocumentProjectId')),
      })
      if (res) {
        chatBotInfo.model = res.data.getLegalDocumentProject.model
        chatBotInfo.temperature = res.data.getLegalDocumentProject.temperature
        chatBotInfo.top_p = res.data.getLegalDocumentProject.top_p
        chatBotInfo.max_tokens = res.data.getLegalDocumentProject.max_tokens
        chatBotInfo.charDescLaw = res.data.getLegalDocumentProject.charDescLaw
        chatBotInfo.charDescQos = res.data.getLegalDocumentProject.charDescQos
        chatBotInfo.charDescAsk = res.data.getLegalDocumentProject.charDescAsk
        chatBotInfo.chardesc_doc = res.data.getLegalDocumentProject.chardesc_doc
        chatBotInfo.charDescCki = res.data.getLegalDocumentProject.charDescCki
        chatBotInfo.promptKbx = res.data.getLegalDocumentProject.promptKbx
        chatBotInfo.promptQos = res.data.getLegalDocumentProject.promptQos
        chatBotInfo.promptCki = res.data.getLegalDocumentProject.promptCki
        chatBotInfo.kbId = res.data.getLegalDocumentProject.kbId
        chatBotInfo.promptAsk = res.data.getLegalDocumentProject.promptAsk
        chatBotInfo.promptAskLast =
          res.data.getLegalDocumentProject.promptAskLast
        chatBotInfo.nextCkiLabel = res.data.getLegalDocumentProject.nextCkiLabel
        chatBotInfo.nextCkiDesc = res.data.getLegalDocumentProject.nextCkiDesc
        chatBotInfo.prompt_doc = res.data.getLegalDocumentProject.prompt_doc
        chatBotInfo.reference_doc =
          res.data.getLegalDocumentProject.reference_doc
        chatBotInfo.turnsAsk = res.data.getLegalDocumentProject.turnsAsk
        chatBotInfo.turnsRpt = res.data.getLegalDocumentProject.turnsRpt
        chatBotInfo.id = res.data.getLegalDocumentProject.id
      }
    }

    const beforeupload = async (file) => {
      const result = await uploadOSS(file.file)

      chatBotInfo.servicerAvatarUrl = result.fileUrl
      return result.fileUrl
    }

    const handleSave = async () => {
      const legalDocumentProject = {
        model: chatBotInfo.model,
        temperature: chatBotInfo.temperature,
        top_p: chatBotInfo.top_p,
        max_tokens: chatBotInfo.max_tokens,
        charDescLaw: chatBotInfo.charDescLaw,
        nextCkiLabel: chatBotInfo.nextCkiLabel,
        nextCkiDesc: chatBotInfo.nextCkiDesc,
        charDescQos: chatBotInfo.charDescQos,
        charDescCki: chatBotInfo.charDescCki,
        chardesc_doc: chatBotInfo.chardesc_doc,
        charDescAsk: chatBotInfo.charDescAsk,
        kbId: chatBotInfo.kbId,
        promptKbx: chatBotInfo.promptKbx,
        promptQos: chatBotInfo.promptQos,
        promptCki: chatBotInfo.promptCki,
        promptAsk: chatBotInfo.promptAsk,
        promptAskLast: chatBotInfo.promptAskLast,
        prompt_doc: chatBotInfo.prompt_doc,
        llmCfgKbx: chatBotInfo.llmCfgKbx,
        llmCfgQos: chatBotInfo.llmCfgQos,
        llmCfgCki: chatBotInfo.llmCfgCki,
        llmCfgAsk: chatBotInfo.llmCfgAsk,
        llmCfgDoc: chatBotInfo.llmCfgDoc,
        reference_doc: chatBotInfo.reference_doc,
        turnsAsk: Number(chatBotInfo.turnsAsk),
        turnsRpt: Number(chatBotInfo.turnsRpt),
      }

      const res = await updateLegalDocumentProjectMutation({
        id: chatBotInfo.id,
        legalDocumentProject: legalDocumentProject,
      })
      if (res) {
        notify.success(root.$t('notify.Done'))
      }
    }

    onMounted(() => {
      //   getProjectInfo()
      //   eventBus.$on('switchProject', (caseId) => {
      //     getProjectInfo()
      //   })
      getAllKB()
      eventBus.$on('switchNewProject', (info) => {
        if (info) {
          chatBotInfo.model = info.model
          chatBotInfo.temperature = info.temperature
          chatBotInfo.top_p = info.top_p
          chatBotInfo.max_tokens = info.max_tokens
          chatBotInfo.charDescLaw = info.charDescLaw
          chatBotInfo.nextCkiLabel = info.nextCkiLabel
          chatBotInfo.nextCkiDesc = info.nextCkiDesc
          chatBotInfo.charDescQos = info.charDescQos
          chatBotInfo.charDescAsk = info.charDescAsk
          chatBotInfo.chardesc_doc = info.chardesc_doc
          chatBotInfo.llmCfgKbx = info.llmCfgKbx
          chatBotInfo.llmCfgQos = info.llmCfgQos
          chatBotInfo.llmCfgCki = info.llmCfgCki
          chatBotInfo.llmCfgAsk = info.llmCfgAsk
          chatBotInfo.llmCfgDoc = info.llmCfgDoc
          chatBotInfo.charDescCki = info.charDescCki
          chatBotInfo.promptKbx = info.promptKbx
          chatBotInfo.promptQos = info.promptQos
          chatBotInfo.promptCki = info.promptCki
          chatBotInfo.kbId = info.kbId
          chatBotInfo.promptAsk = info.promptAsk
          chatBotInfo.promptAskLast = info.promptAskLast
          chatBotInfo.prompt_doc = info.prompt_doc
          chatBotInfo.reference_doc = info.reference_doc
          chatBotInfo.turnsAsk = info.turnsAsk
          chatBotInfo.turnsRpt = info.turnsRpt
          chatBotInfo.id = info.id
        }
      })
    })
    return {
      handleSave,
      tableData,
      chatmodels,
      configDialog,
      config,
      configJson,
      beforeupload,
      chatBotInfo,
      configDialogTitle,
      handleConfigDelete,
      handleConfigSave,
    }
  },
})
</script>
<style scoped>
@media (min-width: 1024px) {
  .container {
    margin: auto;
    width: 50%;
  }
  .imgbox {
    border-radius: 100px;
    margin-bottom: 10px;
  }
}
@media screen and (max-width: 760px) {
  .imgbox {
    border-radius: 100px;
    margin-left: 50px;
  }
  .selectbtn {
    margin-left: 90px;
  }
}

.savebtn {
  margin-left: 1rem;
}
.radio-input {
  display: none;
}
.radio-target {
  @apply w-8 h-8 rounded-lg relative cursor-pointer inline-block;
}
.radio-target:hover {
  box-shadow: 0px 0px 0px 2px #a5adba;
}
.radio-target:hover::before {
  display: inline-block;
}

.radio-target::before {
  content: attr(data-text);
  position: absolute;
  display: none;
  padding: 5px;
  top: 120%;
  left: 50%;
  transform: translate(-50%);
  background: #000;
  color: #fff;
  white-space: nowrap;
  text-align: center;
  border-radius: 4px;
  line-height: 1;
}
.radio-input:checked + .radio-target::after {
  display: block;
}
::v-deep .el-form-item {
  margin-bottom: 0;
}
ul li {
  list-style-type: disc;
}
</style>

