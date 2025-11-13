<template>
  <div class="px-10 pt-2">
    <el-input
      v-model="searchValue"
      style="width: 200px"
      class="mb-3"
      clearable
      @input="handleInputSearch"
      :placeholder="$t('log.taskid')"
      ><i slot="prefix" class="el-input__icon el-icon-search"></i
    ></el-input>
    <el-input
      v-model="searchTraceId"
      style="width: 200px"
      class="mb-3 ml-3"
      clearable
      @input="handleInputSearch"
      :placeholder="$t('log.traceID')"
      ><i slot="prefix" class="el-input__icon el-icon-search"></i
    ></el-input>
    <el-select
      v-model="elementSelect"
      clearable
      @change="handleElementSelect"
      class="ml-3"
      :placeholder="$t('log.select')"
    >
      <el-option
        v-for="item in elements"
        :key="item"
        :label="item"
        :value="item"
      >
      </el-option>
    </el-select>
    <el-select
      v-model="projectSelect"
      clearable
      filterable
      @change="handleProjectSelect"
      class="ml-3"
      :placeholder="$t('log.project')"
    >
      <el-option
        v-for="item in projects"
        :key="item.id"
        :label="item.name"
        :value="item.name"
      >
      </el-option>
    </el-select>
    <el-select
      v-model="actionSelect"
      clearable
      @change="handleActionSelect"
      class="ml-3"
      :placeholder="$t('log.action')"
    >
      <el-option
        v-for="item in actions"
        :key="item.value"
        :label="item.name"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <el-checkbox v-model="badFeedback" @change="handleCheckbox" class="ml-3">{{
      $t("log.bad")
    }}</el-checkbox>
    <el-checkbox v-model="badAndUnsolved" @change="handleCheckbox">{{
      $t("log.badnoSolved")
    }}</el-checkbox>
    <el-table
      :data="tableData"
      style="width: 100%"
      class="mb-5"
      border
      :cell-style="{ paddingTop: '5px', paddingBottom: '5px' }"
      :empty-text="$t('People.noData')"
    >
      <el-table-column
        prop="id"
        width="80"
        label="TraceID"
        align="center"
        fixed
      >
      </el-table-column>
      <el-table-column prop="action" :label="$t('log.action')" align="center">
        <template slot-scope="scope">
          <span>
            {{
              /^0/.test(scope.row.taskid)
                ? "咨询服务"
                : getActionLabel(scope.row.action)
            }}</span
          >
        </template>
      </el-table-column>

      <el-table-column prop="taskid" :label="$t('log.taskid')" align="center">
        <template slot-scope="scope">
          <span> {{ scope.row.taskid }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="openid"
        width="90"
        :label="$t('log.openid')"
        align="center"
      >
        <template slot-scope="scope">
          <el-tooltip
            class="item"
            effect="dark"
            :content="scope.row.wxUser ? scope.row.wxUser.name : ''"
            placement="top-start"
          >
            <div
              style="
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: left;
                margin-left: 10px;
              "
            >
              <j-avatar
                :size="24"
                :avatarUrl="scope.row.wxUser ? scope.row.wxUser.avatarUrl : ''"
                :name="'xxxxx'"
                class="shadow-outline-white -ml-1"
              />
              <span style="margin-left: 5px">
                {{ scope.row.openid.slice(-4) }}</span
              >
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="project" :label="$t('log.project')" align="center">
        <template slot-scope="scope">
          <span class="cursor-pointer" @click="gotoProject(scope.row)">{{
            scope.row.project
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="element"
        width="110"
        :label="$t('log.element')"
        align="center"
      >
      </el-table-column>
      <el-table-column
        prop="messages"
        :label="$t('log.messages')"
        width="100"
        align="center"
      >
        <template slot-scope="scope">
          <el-button @click="handleChatHistory(scope.row)" type="text">
            {{ $t("log.show") }}
          </el-button>
          <el-button @click="handleDebug(scope.row)" type="text">
            {{ $t("log.debug") }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        prop="response"
        :label="$t('log.response')"
        align="center"
        width="80"
      >
        <template slot-scope="scope">
          <el-button @click="handleResponse(scope.row)" type="text">
            {{ $t("log.show") }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        prop="evaluate"
        :label="$t('log.evaluate')"
        align="center"
        width="60"
      >
        <template slot-scope="scope">
          <i class="mdui-icon material-icons" v-if="scope.row.evaluate == -1"
            >thumb_down</i
          >
          <i class="mdui-icon material-icons" v-if="scope.row.evaluate == 1"
            >thumb_up</i
          >

          <i
            style="color: green"
            v-if="scope.row.solved == 1"
            class="el-icon-success ml-1"
          ></i>
        </template>
      </el-table-column>
      <el-table-column
        prop="feedback"
        :label="$t('log.feedback')"
        align="center"
        width="60"
      >
        <template slot-scope="scope">
          <el-popover
            placement="top-start"
            v-if="scope.row.feedback != null"
            title=""
            width="200"
            trigger="hover"
            :content="scope.row.feedback"
          >
            <i class="el-icon-chat-line-square" slot="reference"></i>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column
        prop="model"
        width="80"
        :label="$t('log.model')"
        align="center"
      >
      </el-table-column>
      <el-table-column :label="$t('log.parameter')" width="120" align="center">
        <template slot-scope="scope">
          <el-popover trigger="hover" placement="top">
            <p>temperature: {{ scope.row.temperature }}</p>
            <p>top_p: {{ scope.row.top_p }}</p>
            <p>max_tokens: {{ scope.row.max_tokens }}</p>
            <p>prompt_tokens: {{ scope.row.prompt_tokens }}</p>
            <p>completion_tokens: {{ scope.row.completion_tokens }}</p>
            <p>total_tokens: {{ scope.row.total_tokens }}</p>
            <div
              slot="reference"
              :style="{ 'white-space': 'pre-line' }"
              class="name-wrapper"
            >
              {{
                scope.row.temperature +
                " , " +
                scope.row.top_p +
                " , " +
                scope.row.max_tokens +
                " \n " +
                scope.row.prompt_tokens +
                " , " +
                scope.row.completion_tokens +
                " , " +
                scope.row.total_tokens
              }}
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="temperature"
                       :label="$t('log.temperature')"
                       align="center"
                       >

      </el-table-column>
      <el-table-column prop="top_p"
                       :label="$t('log.top_p')"
                       align="center"
                       >

      </el-table-column>
      <el-table-column prop="max_tokens"
                       :label="$t('log.max_tokens')"
                       align="center"
                       >

      </el-table-column> -->
      <!-- <el-table-column :label="$t('log.tokens')"
                       align="center">
        <template slot-scope="scope">
          <el-popover trigger="hover"
                      placement="top">
            <p>prompt_tokens: {{ scope.row.prompt_tokens }}</p>
            <p>completion_tokens: {{ scope.row.completion_tokens }}</p>
            <p>total_tokens: {{ scope.row.total_tokens }}</p>
            <div slot="reference"
                 class="name-wrapper">
              {{ scope.row.prompt_tokens+" , "+scope.row.completion_tokens+' , '+scope.row.total_tokens }}
            </div>
          </el-popover>
        </template>
      </el-table-column> -->
      <!-- <el-table-column prop="prompt_tokens"
                       :label="$t('log.prompt_tokens')"
                       align="center"
                       >

      </el-table-column>
      <el-table-column prop="completion_tokens"
                       :label="$t('log.completion_tokens')"
                       align="center"
                       >

      </el-table-column>
      <el-table-column prop="total_tokens"
                       :label="$t('log.total_tokens')"
                       align="center"
                       >

      </el-table-column>-->
      <el-table-column prop="time_tx" :label="$t('log.time_tx')" align="center">
        <template slot-scope="scope">
          <span> {{ format(scope.row.time_tx) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="time_rx" :label="$t('log.time_rx')" align="center">
        <template slot-scope="scope">
          <span> {{ format(scope.row.time_rx) }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column :label="$t('People.action')"
                       align="center"
                       min-width="180%">
        <template slot-scope="scope">
          <el-button @click="handleDetail( scope.row)"
                     type="text">
            {{ $t("kb.Detail") }}
          </el-button>

        </template>
      </el-table-column> -->
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 20, 50]"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
    >
    </el-pagination>
    <el-dialog
      :visible.sync="chatHistoryDialogVisible"
      :close-on-click-modal="false"
      width="60%"
      center
    >
      <div
        v-for="item in chatHistory"
        :key="item.created"
        style="display: flex"
        class="mt-3"
      >
        <div class="column">
          <span
            :style="{ whiteSpace: 'nowrap', width: '250px', color: '#0747A6' }"
            class="mr-3"
            >{{
              item.role == "user"
                ? $t("document.user")
                : item.role == "system"
                ? $t("document.system")
                : $t("document.assistant")
            }}
            {{ item.created | formatDateTime }} :</span
          >
          <vue-markdown
            v-if="item.role != 'user'"
            class="px-1 py-1 w-full"
            :style="
              item.role == 'user'
                ? 'color:black; background: rgb(102, 177, 255) ;'
                : 'color:black;background: #DCDFE6;'
            "
            :source="item.content"
          >
          </vue-markdown>
          <!-- <span :style="{ whiteSpace: 'pre-line' }"> {{ item.content }}</span> -->
          <span
            v-if="item.role == 'user'"
            class="px-1 py-1 w-full"
            :style="
              item.role == 'user'
                ? 'color:black;whiteSpace: \'pre-line\'; background: rgb(102, 177, 255) ;'
                : 'color:black;whiteSpace: \'pre-line\';background: #DCDFE6;'
            "
          >
            {{ item.content }}</span
          >
        </div>
      </div>
    </el-dialog>

    <el-dialog
      :visible.sync="responseDialogVisible"
      :close-on-click-modal="false"
      width="40%"
      center
    >
      <div>
        {{ responsecontent }}
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="apiResponseDialogVisible"
      :close-on-click-modal="false"
      width="60%"
      center
    >
      <div class="row">
        <div class="column" style="width: 50%">
          <span>{{ $t("log.request") }}</span>

          <json-viewer
            :value="apiJson.request"
            :expand-depth="5"
            boxed
            expanded
            style="
              box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
              height: 600px;
              overflow-y: auto;
            "
            class="w-100% mt-1 ml-3"
          ></json-viewer>
        </div>
        <div class="column" style="width: 50%">
          <span>{{ $t("log.response") }}</span>

          <json-viewer
            :value="apiJson.response"
            :expand-depth="5"
            boxed
            expanded
            style="
              box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
              height: 600px;
              overflow-y: auto;
            "
            class="w-100% mt-1 ml-3"
          ></json-viewer>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="debugDialogVisible"
      :close-on-click-modal="false"
      width="80%"
      center
    >
      <el-form class="w-full" label-position="left" label-width="100px">
        <el-form-item :label="$t('log.traceID')">
          {{ traceInfo.id }}
        </el-form-item>
        <el-form-item :label="$t('log.action')">
          {{
            /^0/.test(traceInfo.taskid)
              ? "咨询服务"
              : getActionLabel(traceInfo.action)
          }}
        </el-form-item>
        <el-form-item :label="$t('log.taskid')">
          {{ traceInfo.taskid }}
        </el-form-item>
        <el-form-item :label="$t('log.openid')">
          {{ traceInfo.openid }}
        </el-form-item>
        <el-form-item :label="$t('log.project')">
          {{ traceInfo.project }}
        </el-form-item>
        <el-form-item :label="$t('log.kb_id')" v-if="traceInfo.kb_id">
          <el-select
            v-model="traceInfo.kb_id"
            class="mt-3"
            placeholder="请选择"
          >
            <el-option
              v-for="item in kbList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          class="mt-2"
          v-if="traceInfo.kb_id"
          :label="$t('log.kb_prompt')"
        >
          <el-input
            type="textarea"
            :rows="3"
            v-model="traceInfo.kb_prompt"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('log.element')">
          {{ traceInfo.element }}
        </el-form-item>
        <el-form-item :label="$t('log.model')">
          <el-select v-model="traceInfo.model" placeholder="请选择">
            <el-option
              v-for="item in chatmodels"
              :key="item"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('log.max_tokens')">
          {{ traceInfo.max_tokens }}
        </el-form-item>
        <el-form-item :label="$t('log.temperature')">
          <q-slider
            v-model="traceInfo.temperature"
            class="mt-3"
            :min="0"
            :max="1"
            :step="0.01"
            label
            label-always
            color="primary"
          />
        </el-form-item>

        <el-form-item :label="$t('log.top_p')">
          <q-slider
            v-model="traceInfo.top_p"
            class="mt-3"
            :min="0"
            :max="1"
            :step="0.1"
            label
            label-always
            color="primary"
          />
        </el-form-item>

        <el-form-item :label="$t('log.llmRequest')">
          <div
            v-for="(item, index) in traceInfo.messages"
            :key="index"
            style="display: flex"
            class="mt-3"
          >
            <span :style="{ whiteSpace: 'nowrap', width: '90px' }" class="row"
              >{{
                item.role == "user"
                  ? $t("document.user")
                  : item.role == "system"
                  ? $t("document.system")
                  : $t("document.assistant")
              }}:</span
            >
            <el-input
              type="textarea"
              v-if="
                item.role == 'system' || index == traceInfo.messages.length - 1
              "
              :rows="3"
              v-model="item.content"
            ></el-input>
            <span v-else>{{ item.content }}</span>
          </div>
        </el-form-item>
        <el-form-item :label="$t('log.llmResponse')">
          <span :style="{ whiteSpace: 'pre-line' }">{{
            traceInfo.response
          }}</span>
        </el-form-item>
        <el-form-item :label="$t('log.debugResponse')">
          <span :style="{ whiteSpace: 'pre-line' }">{{
            traceInfo.debugresponse
          }}</span>
        </el-form-item>
        <el-form-item class="mt-10">
          <div style="width: 100%" class="row items-center">
            <el-button type="primary" @click="handeSubmit">{{
              $t("log.submit")
            }}</el-button>
            <el-button type="primary" @click="debugDialogVisible = false">{{
              $t("document.Back")
            }}</el-button>
            <el-button @click="handleSolved">{{ $t("log.solved") }}</el-button>
          </div>
        </el-form-item>
      </el-form>
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
} from "@vue/composition-api";
import validator from "src/utils/validator";
import { useMutation } from "@vue/apollo-composable";
import {
  getOrgLlmTrace,
  getLlmTrace,
  getLlmTraceElement,
  updateLlmTrace,
  debugChatZhiPuKbByLlmTraceId,
} from "src/graphql/queries/log";
import { storeAuthToken } from "src/utils/authToken";
import notify from "src/boot/notify";
import store from "src/store/store";
import dayjs from "dayjs";
import VueMarkdown from "vue-markdown";
import { getZhiPuAllKb } from "src/graphql/queries/kb";
import { getLegalDocumentProjects } from "src/graphql/queries/project";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import { getters, mutations } from "../store/store";
import { Loading } from "quasar";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  name: "Login",
  components: { VueMarkdown },
  data() {
    return {
      currentPage: 1, // 当前页
      pageSize: 10, // 每页显示条数
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const { mutate: getLlmTraceMutation } = useMutation(getOrgLlmTrace);
    const { mutate: getLlmTraceSearchMutation } = useMutation(getLlmTrace);
    const { mutate: getZhiPuAllKbMutation } = useMutation(getZhiPuAllKb);
    const { mutate: updateLlmTraceMutation } = useMutation(updateLlmTrace);
    const { mutate: getLegalDocumentProjectsMutation } = useMutation(
      getLegalDocumentProjects
    );

    const { mutate: getLlmTraceElementMutation } =
      useMutation(getLlmTraceElement);
    const { mutate: debugChatZhiPuKbByLlmTraceIdMutation } = useMutation(
      debugChatZhiPuKbByLlmTraceId
    );
    const kbList = ref([]);
    const getAllKB = async () => {
      const res = await getZhiPuAllKbMutation();
      if (res) {
        kbList.value = JSON.parse(res.data.getZhiPuAllKb).data.list;
      }
    };
    const apiResponseDialogVisible = ref(false);
    let apiJson = {
      request: "",
      respons: "",
    };
    const tableData = ref([]);
    const currentPage = ref(1); // 当前页
    const pageSize = ref(10); // 每页显示条数
    const total = ref(0);
    const chatHistoryDialogVisible = ref(false);
    const debugDialogVisible = ref(false);

    const getLogTrace = async () => {
      const res = await getLlmTraceMutation({
        take: pageSize.value,
        skip: (currentPage.value - 1) * pageSize.value,
      });
      if (res) {
        tableData.value = res.data.getOrgLlmTrace.data;
        total.value = res.data.getOrgLlmTrace.totalCount;
      }
    };
    const gotoProject = async (row) => {
      sessionStorage.setItem("legalDocumentProjectId", row.projectId);
      void root.$router.push("/workflow");
    };
    // 时间戳
    const format = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    const handleManage = async () => {
      window.open("https://open.bigmodel.cn/appcenter_v1/knowledge");
    };
    const traceInfo = reactive({
      id: 0,
      taskid: "",
      openid: "",
      project: "",
      element: "",
      model: "",
      temperature: 0.9,
      top_p: 0.7,
      max_tokens: 0,
      messages: [],
      response: "",
      debugresponse: "",
      kb_id: "",
      kb_prompt: "",
      action: 0,
    });

    const handleSolved = async () => {
      const llmTrace = {
        solved: 1,
      };
      const res = await updateLlmTraceMutation({
        id: traceInfo.id,
        llmTrace: llmTrace,
      });
      if (res) {
        notify.success(root.$t("notify.Done"));
      }
    };
    const handleState = (state) => {
      switch (state) {
        case "SUCCESS":
          return "支付成功";
        case "USERPAYING":
          return "用户支付中";
        case "REFUND":
          return "转入退款";
        case "NOTPAY":
          return "未支付";
        case "CLOSED":
          return "已关闭";
        case "REFUND":
          return "转入退款";
      }
    };
    const getActionLabel = (action) => {
      switch (action) {
        case 0:
          return "案件询问";
        case 1:
          return "要素提取";

        case 2:
          return "咨询服务";

        case 3:
          return "文书生成";
      }
    };

    const searchValue = ref("");
    const searchTraceId = ref("");
    const badFeedback = ref(false);
    const badAndUnsolved = ref(false);
    const handleSearch = async () => {
      try {
        const res = await getLlmTraceSearchMutation({
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
          outtradeno: searchValue.value,
          id: searchTraceId.value === "" ? null : Number(searchTraceId.value),
          solved: badAndUnsolved.value ? 0 : null,
          evaluate: badAndUnsolved.value ? -1 : badFeedback.value ? -1 : null,
          element: elementSelect.value,
          serviceAction:
            actionSelect.value === "" ? null : Number(actionSelect.value),
          project: projectSelect.value === "" ? null : projectSelect.value,
        });

        if (res) {
          tableData.value = res.data.getLlmTrace.data;
          const a = await getLlmTraceElementMutation({
            outtradeno: searchValue.value,
          });
          if (a) {
            elements.value = a.data.getLlmTraceElement;
          }
          total.value = res.data.getLlmTrace.totalCount;
        }
      } catch (error) {
        console.log("---------------error=", error);
        tableData.value = [];
        total.value = 0;
      }
    };
    const handleInputSearch = async () => {
      if (
        searchValue.value === "" &&
        searchTraceId.value === "" &&
        actionSelect.value === "" &&
        projectSelect.value === ""
      ) {
        elementSelect.value = "";
        elements.value = [];
        getLogTrace();
      } else {
        currentPage.value = 1;
        handleSearch();
      }
    };
    const handleCheckbox = async () => {
      handleSearch();
    };

    const reorganizeMessages = (msgs) => {
      let result = [];

      let systemMessage = null;

      let userMessages = [];

      // 遍历所有消息

      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];

        // 如果是system消息，则保留第一条

        if (msg.role === "system" && !systemMessage) {
          systemMessage = msg;
        }

        // 如果是user或assistant消息，则合并
        else if (msg.role === "user" || msg.role === "assistant") {
          if (i == msgs.length - 1) {
            userMessages.push(msg.content);
          } else {
            userMessages.push(`${msg.role}: ${msg.content}`);
          }
        }
      }

      // 如果没有system消息，则不添加

      if (systemMessage) {
        result.push(systemMessage);
      }

      // 如果有user或assistant消息，则合并并添加
      let combinedLines = userMessages.slice(0, -1).join("\n");

      // 使用三个反引号将合并后的字符串包裹起来

      let wrappedString = "```\n" + combinedLines + "\n```";

      // 如果需要，可以将最后一条消息添加到新字符串的末尾

      let finalString =
        wrappedString + "\n" + userMessages[userMessages.length - 1];

      if (userMessages.length > 0) {
        result.push({
          role: "user",

          content: finalString,
        });
      }
      console.log(finalString);

      return result;
    };
    const handeSubmit = async () => {
      try {
        Loading.show({
          message: root.$t("log.debugIn"),
        });
        let message = "";
        if (traceInfo.taskid == "0") {
          message = JSON.stringify(reorganizeMessages(traceInfo.messages));
        } else {
          message = JSON.stringify(traceInfo.messages);
        }

        const res = await debugChatZhiPuKbByLlmTraceIdMutation({
          top_p: traceInfo.top_p,
          temperature: traceInfo.temperature,
          messages: message,
          id: traceInfo.id,
          kb_id: traceInfo.kb_id,
          kb_prompt: traceInfo.kb_prompt,
          model: traceInfo.model,
        });
        apiJson.request = {
          top_p: traceInfo.top_p,
          temperature: traceInfo.temperature,
          messages: message,
          id: traceInfo.id,
          kb_id: traceInfo.kb_id,
          kb_prompt: traceInfo.kb_prompt,
          model: traceInfo.model,
        };
        apiJson.response = res;
        if (res) {
          traceInfo.debugresponse = JSON.parse(
            res.data.debugChatZhiPuKbByLlmTraceId
          ).choices[0].message.content;
          Loading.hide();
          apiResponseDialogVisible.value = true;
          notify.success(root.$t("log.debugsuccess"));
        }
      } catch (error) {
        notify.error(root.$t("log.debugFail"));
        Loading.hide();
      }
    };
    const chatHistory = ref([]);
    const responseDialogVisible = ref(false);
    const responsecontent = ref("");
    const elementSelect = ref("");
    const projectSelect = ref("");
    const actionSelect = ref("");
    const projects = ref([]);
    const actions = ref([
      {
        name: "咨询服务",
        value: -1,
      },
      {
        name: "案件询问",
        value: 0,
      },
      {
        name: "要素提取",
        value: 1,
      },
      {
        name: "文书生成",
        value: 3,
      },
    ]);
    const getAllCase = async () => {
      const res = await getLegalDocumentProjectsMutation();
      if (res) {
        projects.value = res.data.getLegalDocumentProjects;
      }
    };
    const elements = ref([]);
    const handleElementSelect = async () => {
      currentPage.value = 1;
      handleSearch();
    };
    const handleActionSelect = async () => {
      currentPage.value = 1;
      handleSearch();
    };
    const handleProjectSelect = async () => {
      currentPage.value = 1;
      handleSearch();
    };
    const handleResponse = (item) => {
      responsecontent.value = item.response;
      responseDialogVisible.value = true;
    };
    // 每页显示条数改变
    const handleSizeChange = (val) => {
      console.log("1111111111111", actionSelect.value);
      pageSize.value = val;
      if (
        searchValue.value === "" &&
        searchTraceId.value === "" &&
        actionSelect.value === "" &&
        projectSelect.value === ""
      ) {
        getLogTrace();
      } else {
        handleSearch();
      }
    };
    const chatmodels = [
      "glm-3-turbo",
      "glm-4",
      "glm-4-0520",
      "glm-4-air",
      "glm-4-airx",
      "qwen-long",
      "farui-plus",
      "qwen-turbo",
      "qwen-plus",
      "qwen-max",
      //'abab6.5s-chat',
      "gpt-3.5-turbo",
    ];
    // 当前页改变
    const handleCurrentChange = (val) => {
      console.log("1111111111111", actionSelect.value);
      currentPage.value = val;
      if (
        searchValue.value === "" &&
        searchTraceId.value === "" &&
        actionSelect.value === "" &&
        projectSelect.value === ""
      ) {
        getLogTrace();
      } else {
        handleSearch();
      }
    };

    const handleChatHistory = (item) => {
      chatHistory.value = [];
      if (item.messages != null) {
        const processedString = item.messages.replace(/\\(?!")/g, "");
        chatHistory.value = JSON.parse(
          processedString
            .replaceAll(/\n/g, "\\n")
            .replaceAll(/\t/g, "\\t")
            .replaceAll(/\r/g, "\\r")
        );
      }
      chatHistoryDialogVisible.value = true;
    };

    const handleDebug = (item) => {
      traceInfo.id = item.id;
      traceInfo.taskid = item.taskid;
      traceInfo.openid = item.openid;
      traceInfo.project = item.project;
      traceInfo.action = item.action;
      traceInfo.model = item.model;
      traceInfo.element = item.element;
      traceInfo.temperature = item.temperature;
      traceInfo.top_p = item.top_p;
      traceInfo.max_tokens = item.max_tokens;
      traceInfo.response = item.response;
      traceInfo.debugresponse = "";
      traceInfo.kb_id = item.kb_id;
      traceInfo.kb_prompt = item.kb_prompt;
      const processedString = item.messages.replace(/\\(?!")/g, "");
      traceInfo.messages = JSON.parse(
        processedString
          .replaceAll(/\n/g, "\\n")
          .replaceAll(/\t/g, "\\t")
          .replaceAll(/\r/g, "\\r")
      );

      debugDialogVisible.value = true;
    };

    const handleDetail = async (item) => {
      window.open("https://open.bigmodel.cn/appcenter_v1/knowledge/" + item.id);
    };
    onMounted(() => {
      getLogTrace();
      getAllKB();
      getAllCase();
    });
    return {
      tableData,
      handleCheckbox,
      handleDetail,
      debugDialogVisible,
      currentPage,
      handleSizeChange,
      chatmodels,
      elementSelect,
      elements,
      getAllCase,
      gotoProject,
      kbList,
      handleActionSelect,
      handleProjectSelect,
      projectSelect,
      actionSelect,
      actions,
      projects,
      handleDebug,
      handleElementSelect,
      handleChatHistory,
      handleCurrentChange,
      format,
      handleInputSearch,
      handleResponse,
      responsecontent,
      pageSize,
      responseDialogVisible,
      chatHistory,
      apiJson,
      apiResponseDialogVisible,
      chatHistoryDialogVisible,
      handleManage,
      handleState,
      getActionLabel,
      total,
      traceInfo,
      searchValue,
      searchTraceId,
      badAndUnsolved,
      badFeedback,
      handeSubmit,
      handleSolved,
    };
  },
  methods: {
    // // 每页显示条数改变
    // handleSizeChange(val) {
    //   this.pageSize = val
    // },
    // // 当前页改变
    // handleCurrentChange(val) {
    //   this.currentPage = val
    // },
    generateRandomKey() {
      const min = 10000;
      const max = 99999;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
  },
});
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
::v-deep .el-table__body  {
   border-collapse: separate !important;
  border-spacing: 0 15px !important;
        table-layout: auto !important;
}
</style>

