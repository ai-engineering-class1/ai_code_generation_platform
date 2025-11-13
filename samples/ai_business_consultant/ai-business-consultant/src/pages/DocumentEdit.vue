<template>
  <div
    class="px-3 py-3"
    style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    "
  >
    <div class="flex-container">
      <div class="column left-panel">
        <el-tabs class="mx-5" v-model="activeName">
          <el-tab-pane :label="$t('document.inUserElement')" name="1">
            <json-viewer
              :value="itemData.docJson"
              :expand-depth="5"
              boxed
              expanded
              style="
                box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
                height: 70vh;
                overflow-y: auto;
              "
              class="w-100% mt-1 ml-3"
            ></json-viewer>
          </el-tab-pane>
          <el-tab-pane :label="$t('Wxuser.chatHistory')" name="2">
            <div
              class="border-box mt-1 px-3 py-3"
              style="height: 70vh; overflow-y: auto"
            >
              <div
                v-for="item in chatHistory"
                :key="item.created"
                style="display: flex"
                class="mt-3"
              >
                <div class="column w-full">
                  <span
                    :style="{
                      whiteSpace: 'nowrap',
                      width: '250px',
                      color: '#0747A6',
                    }"
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
                    class="px-1 py-1"
                    :style="
                      item.role == 'user'
                        ? ' background: rgb(102, 177, 255) ;'
                        : ';background: #DCDFE6;'
                    "
                    :source="item.content"
                  >
                  </vue-markdown>
                  <span
                    v-if="item.role == 'user'"
                    class="px-1 py-1"
                    :style="
                      item.role == 'user'
                        ? ' background: rgb(102, 177, 255) ;'
                        : 'background: #DCDFE6;'
                    "
                  >
                    {{ item.content }}</span
                  >
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('document.caseElement')" name="3">
            <!-- <q-tree :nodes="treeData"
                    style="  height: 70vh;overflow-y: auto;"
                    selected-color="primary"
                    selectable
                    @update:selected="onNodeClick"
                    v-if="treeData.length>0"
                    node-key="label"
                    default-expand-all></q-tree> -->
            <div style="height: 70vh; overflow-y: auto">
              <div v-for="item in treeData" :key="item.label">
                <span
                  class="cursor-pointer"
                  style="background: rgb(102, 177, 255)"
                  @click="handleElementClick(item)"
                >
                  - {{ item.label }}</span
                >
                <div v-for="child in item.children" :key="child.label">
                  <span class="ml-3"> - {{ child.label }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <!-- <div class="column ml-3 "
           style="width: 30%;">
        <span>{{ $t("Wxuser.chatHistory") }}</span>
        <div class="border-box mt-1 px-3 py-3"
             style="height: 600px;overflow-y: auto;">
          <div v-for="item in chatHistory"
               :key="item.created"
               style="display: flex;"
               class="mt-3">
            <div class="column">
              <span :style="{ whiteSpace: 'nowrap',  width:'250px' ,color:'#0747A6'}"
                    class=" mr-3">{{ item.role=="user"?$t('document.user'):item.role=="system"?$t('document.system'): $t('document.assistant')}} {{ item.created | formatDateTime }} :</span>

              <span> {{ item.content }}</span>
            </div>
          </div>
        </div>
      </div> -->
      <div class="column ml-5 mt-3 right-panel" style="width: 100%">
        <!-- <span>{{ $t('document.Document') }}</span> -->

        <div class="border-box mt-1 px-3 py-3">
          <div style="height: 72vh; overflow-y: auto" id="container"></div>
        </div>
      </div>
    </div>
    <span slot="footer" class="dialog-footer mt-2">
      <el-button type="primary" @click="handleBack">{{
        $t("document.Back")
      }}</el-button>
      <!-- <el-button @click="handleSave">{{ $t('document.Save') }}</el-button> -->
      <!-- <el-button @click="exportWord">
        {{ $t("document.Download") }}
      </el-button>
      <el-button @click="handlePreview">
        {{ $t("document.Preview") }}
      </el-button> -->
      <el-button type="primary" @click="handleRelease">{{
        $t("document.Release")
      }}</el-button>
    </span>
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
import eventBus from "../utils/eventBus";
import {
  getPaperworkById,
  getPaperworkGenerateWebofficeToken,
  refreshWebofficeToken,
  sendPaperworkToWxUser,
} from "src/graphql/queries/document";
import { storeAuthToken } from "src/utils/authToken";
import notify from "src/boot/notify";
import store from "src/store/store";
import VueMarkdown from "vue-markdown";
import { getters, mutations } from "../store/store";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  name: "Login",
  components: { VueMarkdown },
  data() {
    return {
      isPwd: true,
      isNetWrok: true,
      isMobile: getIsMobileBrowser(),
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const currentUser = computed(getters.currentUser);
    const { mutate: getPaperworkGenerateWebofficeTokenMutation } = useMutation(
      getPaperworkGenerateWebofficeToken
    );
    const { mutate: refreshWebofficeTokenMutation } = useMutation(
      refreshWebofficeToken
    );
    const { mutate: sendPaperworkToWxUserMutation } = useMutation(
      sendPaperworkToWxUser
    );
    const { id } = root.$route.params;
    const { mutate: getPaperworkByIdutation } = useMutation(getPaperworkById);
    const chatHistory = ref([]);

    const handleRelease = async () => {
      const app = ins.Application;

      //手动文档保存
      app.ActiveDocument.Save();
      const res = await sendPaperworkToWxUserMutation({ id: Number(id) });
      if (res) {
        notify.success(root.$t("document.ReleaseSuccess"));
      }
    };
    const handleBack = () => {
      void root.$router.push("/document");
    };
    const onNodeClick = (node) => {
      console.log("Node clicked:", node);
      // 在这里处理节点点击事件
    };
    const itemData = {
      id: 0,
      docJson: "",
      chatJson: "",
      dataJson: "",
      reviewDocJson: "",
      openid: "",
      fileUrl: "",
      projectName: "",
      out_trade_no: "",
      chatHistory,
    };
    const refreshToken = async (accessToken, refreshToken) => {
      const res = await refreshWebofficeTokenMutation({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      if (res) {
      }
    };
    const activeName = ref("1");
    const handleElementClick = (node) => {
      console.log("Node clicked:", node);
      activeName.value = "2";
      handleSearch(node.trace);
    };
    const flattenJson = (jsonObj) => {
      let result = {};
      for (const key in jsonObj) {
        if (typeof jsonObj[key] === "object" && jsonObj[key] !== null) {
          const subObject = jsonObj[key];
          for (const subKey in subObject) {
            result[`${subKey}`] = subObject[subKey];
          }
        } else {
          result[key] = jsonObj[key];
        }
      }
      return result;
    };

    let ins = null;
    const getWebofficeToken = async (id) => {
      const res = await getPaperworkGenerateWebofficeTokenMutation({ id: id });

      if (res) {
        const tokenInfo = JSON.parse(
          res.data.getPaperworkGenerateWebofficeToken
        );
        let mount = document.querySelector("#container");
        ins = aliyun.config({
          mount,
          url: tokenInfo.WebofficeURL,
          refreshToken: refreshToken(
            tokenInfo.AccessToken,
            tokenInfo.RefreshToken
          ),
        });
        ins.setToken({ token: tokenInfo.AccessToken });

        ins.on("fileOpen", async function (data) {
          //等待ready加载完成
          await ins.ready();

          //自动识别文档类型
          const app = ins.Application;

          //设置文档缩放比例为50%
          app.ActiveDocument.ActiveWindow.View.Zoom.Percentage = 95;
          console.log(data);
        });

        ins.on("error", (err) => {
          console.log("发生错误：", err);
        });
      }
    };
    const handleSearch = (trace) => {
      let minDiff = Infinity;
      let index = -1;
      for (let i = 0; i < chatHistory.value.length; i++) {
        const diff = trace - chatHistory.value[i].created;
        console.log(diff);
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          index = i;
        }
      }
      //   const index = chatHistory.value.findIndex((item) =>
      //     item.content.includes(searchKey)
      //   )

      if (index !== -1) {
        root.$nextTick(() => {
          const divs = document.querySelectorAll("span");
          console.log("11111111111", divs, index);
          divs[55 + index].scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    };
    const treeData = ref([]);
    const traceData = ref([]);
    const convertToTreeData = (originalData) => {
      let result = [];
      for (let key in originalData) {
        if (key === "trace") {
          //   console.log('trace', originalData['trace'])

          //   convertToTreeData(originalData['trace'], traceData.value)
          traceData.value = originalData["trace"];
          continue;
        }
        if (
          typeof originalData[key] === "object" &&
          !Array.isArray(originalData[key])
        ) {
          let children = [];

          for (let prop in originalData[key]) {
            if (originalData[key].hasOwnProperty(prop)) {
              children.push({
                label: `${prop}: ${originalData[key][prop]}`,
              });
            }
          }

          result.push({
            label: key,
            trace: originalData["trace"]?.[key],
            children: children,
          });
        } else if (typeof originalData[key] === "string") {
          result.push({
            label: key,
            trace: originalData["trace"]?.[key],
            children: [
              {
                label: originalData[key],

                children: [],
              },
            ],
          });
        }
      }
      treeData.value = result;
    };

    const getPaperworkInfo = async () => {
      const { data } = await getPaperworkByIdutation({ id: Number(id) });
      const item = data.getPaperworkById;
      itemData.id = item.id;
      itemData.projectName = item.legalDocumentProject.name;
      itemData.out_trade_no = item.wxPaidOrders.out_trade_no;
      itemData.chatJson = item.chatJson;
      itemData.openid = item.wxUser.openId;
      itemData.fileUrl =
        item.legalDocumentProject.legalDocumentTemplates[0].fileUrl;
      itemData.dataJson =
        item.dataJson == null
          ? ""
          : JSON.parse(
              item.dataJson
                .replace(/[\x00-\x1F\x7F]/g, "")
                .replaceAll(/\n/g, "\\n")
                .replaceAll(/\r/g, "\\r")
            );

      console.log(itemData.dataJson);
      itemData.docJson =
        item.docJson == null
          ? ""
          : JSON.parse(
              item.docJson
                .replace(/[\x00-\x1F\x7F]/g, "")
                .replaceAll(/\n/g, "\\n")
                .replaceAll(/\r/g, "\\r")
            );
      itemData.reviewDocJson =
        item.reviewDocJson == null
          ? ""
          : JSON.parse(
              item.reviewDocJson
                .replace(/[\x00-\x1F\x7F]/g, "")
                .replaceAll(/\n/g, "\\n")
                .replaceAll(/\r/g, "\\r")
            );
      //itemData.reviewDocJson = flattenJson(itemData.reviewDocJson)
      chatHistory.value = [];
      itemData.chatJson = item.chatJson;

      if (itemData.chatJson != null) {
        chatHistory.value = JSON.parse(
          itemData.chatJson
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replaceAll(/\n/g, "\\n")
            .replaceAll(/\r/g, "\\r")
        );
      }
      console.log(itemData.dataJson);
      convertToTreeData(itemData.dataJson);
      getWebofficeToken(Number(id));
    };
    onMounted(() => {
      getPaperworkInfo();
    });
    return {
      itemData,
      chatHistory,
      handleBack,
      handleRelease,
      activeName,
      treeData,
      handleSearch,
      getPaperworkInfo,
      onNodeClick,
      handleElementClick,
    };
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
.border-box {
  width: 100%; /* 设置你的盒子宽度 */
  min-height: 500px; /* 设置你的盒子高度 */
  background-color: white; /* 设置白色背景 */
  border: 2px solid #ffffff; /* 设置白色边框 */
  border-radius: 5px; /* 设置圆角 */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1); /* 可选的盒子阴影 */
}
.flex-container {
  display: flex;
  height: 80vh;
  width: 100%; /* 确保父容器宽度为100% */
}

.left-panel {
  flex: 0 1 30%; /* flex-grow: 0, flex-shrink: 1, flex-basis: 30% */

  /* 可以添加一些额外的样式，如padding、margin等 */
}
table {
  border-collapse: collapse;
}

table,
th,
td {
  border: 1px solid black;
}
.markdown {
  max-width: 350px; /* 设置你想要的最大宽度 */
  margin: 0 auto; /* 居中显示 */
  line-height: 1.6; /* 根据需要调整行高 */
  word-wrap: break-word; /* 允许长单词或URL地址
}
.right-panel {
  flex: 0 1 68%; /* flex-grow: 0, flex-shrink: 1, flex-basis: 68% */

  /* 可以添加一些额外的样式，如padding、margin等 */
}
</style>

