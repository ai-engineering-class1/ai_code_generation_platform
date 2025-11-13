<template>
  <div class="px-10 py-5">
    <el-tabs class="mx-5 my-2" v-model="activeName">
      <el-tab-pane :label="$t('document.todo')" name="1">
        <div
          style="
            width: 100%;
            margin: 30px 0;
            display: flex;
            justify-content: space-between;
          "
        >
          <el-input
            v-model="searchUnapprove"
            style="width: 200px"
            clearable
            @input="handleInputSearch"
            :placeholder="$t('document.orderSearch')"
            ><i slot="prefix" class="el-input__icon el-icon-search"></i
          ></el-input>
        </div>
        <el-table
          :data="unApproveData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            prop="id"
            :label="$t('document.user')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
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
                  :size="28"
                  :avatarUrl="scope.row.wxUser.avatarUrl"
                  :name="'xxxxx'"
                  class="shadow-outline-white -ml-1"
                />
                <span style="margin-left: 10px">{{
                  scope.row.wxUser.name
                }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('document.type')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.legalDocumentProject.name }}
            </template>
          </el-table-column>
          <el-table-column
            prop="out_trade_no"
            :label="$t('document.orderNo')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.wxPaidOrders.out_trade_no }}
            </template>
          </el-table-column>
          <el-table-column
            prop="commodity"
            :label="$t('document.goodsName')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{
                scope.row.wxPaidOrders.commodity
                  ? scope.row.wxPaidOrders.commodity.name
                  : ""
              }}
            </template>
          </el-table-column>
          <el-table-column
            prop="confirmedAt"
            :label="$t('document.confirmDate')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ forateTime(scope.row.confirmedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('People.action')"
            align="center"
            min-width="180%"
          >
            <template slot-scope="scope">
              <el-button @click="handleApproval(scope.row)" type="text">
                {{ $t("document.Approval") }}
              </el-button>
              <!-- <el-button @click="handleChatHistory( scope.row)"
                         type="text">
                {{ $t("Wxuser.chatHistory") }}
              </el-button> -->
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize"
          :total="totalunApprove"
          layout="total, sizes, prev, pager, next, jumper"
        >
        </el-pagination>
      </el-tab-pane>
      <el-tab-pane :label="$t('document.Completed')" name="2">
        <div
          style="
            width: 100%;
            margin: 30px 0;
            display: flex;
            justify-content: space-between;
          "
        >
          <el-input
            v-model="searchApprove"
            style="width: 200px"
            clearable
            @input="handleInputSearch1"
            :placeholder="$t('document.orderSearch')"
            ><i slot="prefix" class="el-input__icon el-icon-search"></i
          ></el-input>
        </div>
        <el-table
          :data="approveData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            prop="id"
            :label="$t('document.user')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
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
                  :size="28"
                  :avatarUrl="scope.row.wxUser.avatarUrl"
                  :name="'xxxxx'"
                  class="shadow-outline-white -ml-1"
                />
                <span style="margin-left: 10px">{{
                  scope.row.wxUser.name
                }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('document.type')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.legalDocumentProject.name }}
            </template>
          </el-table-column>
          <el-table-column
            prop="out_trade_no"
            :label="$t('document.orderNo')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.wxPaidOrders.out_trade_no }}
            </template>
          </el-table-column>
          <el-table-column
            prop="commodity"
            :label="$t('document.goodsName')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{
                scope.row.wxPaidOrders.commodity
                  ? scope.row.wxPaidOrders.commodity.name
                  : ""
              }}
            </template>
          </el-table-column>
          <el-table-column
            prop="confirmedAt"
            :label="$t('document.confirmDate')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ forateTime(scope.row.confirmedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="AI版本" align="center" min-width="50%">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.aiFileUrl !== null"
                @click="handleDownLoadAIUrl(scope.row)"
                type="text"
              >
                {{ $t("document.Download") }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('People.action')"
            align="center"
            min-width="180%"
          >
            <template slot-scope="scope">
              <el-button @click="handleApproval(scope.row)" type="text">
                {{ $t("document.Approval") }}
              </el-button>
              <el-button @click="handleApprovedPreview(scope.row)" type="text">
                {{ $t("document.Preview") }}
              </el-button>
              <el-button @click="handleDownLoad(scope.row)" type="text">
                {{ $t("document.Download") }}
              </el-button>

              <el-button
                type="text"
                @click="handleReleaseDoucment(scope.row)"
                >{{ $t("document.Release") }}</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="handleSizeChange1"
          @current-change="handleCurrentChange1"
          :current-page="currentPage1"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize1"
          :total="totalApprove"
          layout="total, sizes, prev, pager, next, jumper"
        >
        </el-pagination>
      </el-tab-pane>

      <el-tab-pane :label="$t('document.fail')" name="3">
        <div
          style="
            width: 100%;
            margin: 30px 0;
            display: flex;
            justify-content: space-between;
          "
        >
          <el-input
            v-model="searchFail"
            style="width: 200px"
            clearable
            @input="handleInputSearch2"
            :placeholder="$t('document.orderSearch')"
            ><i slot="prefix" class="el-input__icon el-icon-search"></i
          ></el-input>
        </div>
        <el-table
          :data="failData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            prop="id"
            :label="$t('document.user')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
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
                  :size="28"
                  :avatarUrl="scope.row.wxUser.avatarUrl"
                  :name="'xxxxx'"
                  class="shadow-outline-white -ml-1"
                />
                <span style="margin-left: 10px">{{
                  scope.row.wxUser.name
                }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="name"
            :label="$t('document.type')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.legalDocumentProject.name }}
            </template>
          </el-table-column>
          <el-table-column
            prop="out_trade_no"
            :label="$t('document.orderNo')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ scope.row.wxPaidOrders.out_trade_no }}
            </template>
          </el-table-column>
          <el-table-column
            prop="commodity"
            :label="$t('document.goodsName')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{
                scope.row.wxPaidOrders.commodity
                  ? scope.row.wxPaidOrders.commodity.name
                  : ""
              }}
            </template>
          </el-table-column>
          <el-table-column
            prop="errorInfo"
            :label="$t('document.errorInfo')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              <el-tooltip
                class="item"
                effect="dark"
                :content="scope.row.errorInfo"
                placement="top"
              >
                <div
                  style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                  "
                >
                  {{ scope.row.errorInfo }}
                </div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column
            prop="confirmedAt"
            :label="$t('document.confirmDate')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              {{ forateTime(scope.row.confirmedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('People.action')"
            align="center"
            min-width="50%"
          >
            <template slot-scope="scope">
              <el-button @click="handleApproval(scope.row)" type="text">
                {{ $t("document.Approval") }}
              </el-button>
              <!-- <el-button @click="handleChatHistory( scope.row)"
                         type="text">
                {{ $t("Wxuser.chatHistory") }}
              </el-button> -->
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="handleSizeChange2"
          @current-change="handleCurrentChange2"
          :current-page="currentPage2"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize2"
          :total="totalError"
          layout="total, sizes, prev, pager, next, jumper"
        >
        </el-pagination>
      </el-tab-pane>
    </el-tabs>
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

          <span> {{ item.content }}</span>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="preivewDialogVisible"
      :close-on-click-modal="false"
      width="60%"
      center
    >
      <div v-html="convertedContent"></div>
    </el-dialog>
    <el-dialog
      :visible.sync="centerDialogVisible"
      :close-on-click-modal="false"
      fullscreen
      :show-close="false"
      width="30%"
      style="z-index: 99999"
      class="custom-dialog"
      center
    >
      <div class="row">
        <div class="column" style="width: 30%">
          <span>{{ $t("document.Element") }}</span>

          <json-viewer
            :value="itemData.dataJson"
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
        <div class="column ml-3" style="width: 30%">
          <span>{{ $t("Wxuser.chatHistory") }}</span>
          <div
            class="border-box mt-1 px-3 py-3"
            style="height: 600px; overflow-y: auto"
          >
            <div
              v-for="item in chatHistory"
              :key="item.created"
              style="display: flex"
              class="mt-3"
            >
              <div class="column">
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

                <span> {{ item.content }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="column ml-5" style="width: 37%">
          <span>{{ $t("document.Document") }}</span>

          <div
            class="border-box mt-1 px-3 py-3"
            style="height: 600px; overflow-y: auto"
          >
            <div
              style="height: 600px; overflow-y: auto; width: 37%"
              id="container"
            ></div>
            <!-- <div v-for="item in elements"
                 :key="item.label"
                 style="display: flex;"
                 class="mt-3">
              <span :style="{ whiteSpace: 'nowrap',  width:'100px'}"
                    class="mt-3 mr-3">{{ item.label }}</span>
              <el-input type="textarea"
                        :rows="3"
                        v-model="item.value"></el-input>
            </div> -->
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="centerDialogVisible = false">{{
          $t("document.Back")
        }}</el-button>
        <el-button @click="handleSave">{{ $t("document.Save") }}</el-button>
        <el-button @click="exportWord">
          {{ $t("document.Download") }}
        </el-button>
        <el-button @click="handlePreview">
          {{ $t("document.Preview") }}
        </el-button>
        <el-button type="primary" @click="handleRelease">{{
          $t("document.Release")
        }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      width="70%"
      :close-on-click-modal="false"
      :visible.sync="previewDialog"
      :modal-append-to-body="false"
      :destroy-on-close="true"
    >
      <div class="column items-center">
        <iframe
          :src="
            'https://view.officeapps.live.com/op/view.aspx?src=' +
            itemData.fileUrl
          "
          width="100%"
          height="700px"
        ></iframe>
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
} from "@vue/composition-api";
import validator from "src/utils/validator";
import { useMutation } from "@vue/apollo-composable";
import {
  notiPaperworkToWxUser,
  getPaperworks,
  updatePaperwork,
  getPaperworkGenerateWebofficeToken,
  refreshWebofficeToken,
  getPaperworksAndCount,
} from "src/graphql/queries/document";
import { storeAuthToken } from "src/utils/authToken";
import notify from "src/boot/notify";
import store from "src/store/store";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import JSZipUtils from "jszip-utils";
import dayjs from "dayjs";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import mammoth from "mammoth";
import { saveAs } from "file-saver";
import * as htmlDocx from "html-docx-js-typescript";
import { exportDocx } from "src/utils/FileDoc";
import { getters, mutations } from "../store/store";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  name: "Login",
  components: {},
  data() {
    return {
      //   currentPage: 1, // 当前页
      //   pageSize: 5, // 每页显示条数
      //   currentPage1: 1, // 当前页
      //   pageSize1: 5, // 每页显示条数
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const tableData = ref([]);
    const { mutate: getPaperworksMutation } = useMutation(getPaperworks);
    const { mutate: updatePaperworkMutation } = useMutation(updatePaperwork);
    const { mutate: getPaperworkGenerateWebofficeTokenMutation } = useMutation(
      getPaperworkGenerateWebofficeToken
    );
    const { mutate: refreshWebofficeTokenMutation } = useMutation(
      refreshWebofficeToken
    );
    const { mutate: notiPaperworkToWxUseMutation } = useMutation(
      notiPaperworkToWxUser
    );
    const { mutate: getPaperworksAndCountMutation } = useMutation(
      getPaperworksAndCount
    );
    const forateTime = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    // 搜索人员
    const searchUnapprove = ref("");
    const searchFail = ref("");
    const searchApprove = ref("");
    const refreshToken = async (accessToken, refreshToken) => {
      const res = await refreshWebofficeTokenMutation({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      if (res) {
      }
    };
    const getWebofficeToken = async (id) => {
      const res = await getPaperworkGenerateWebofficeTokenMutation({ id: id });

      if (res) {
        const tokenInfo = JSON.parse(
          res.data.getPaperworkGenerateWebofficeToken
        );
        let mount = document.querySelector("#container");
        let ins = aliyun.config({
          mount,
          url: tokenInfo.WebofficeURL,
          refreshToken: refreshToken(
            tokenInfo.AccessToken,
            tokenInfo.RefreshToken
          ),
        });

        ins.setToken({ token: tokenInfo.AccessToken });
        ins.on("fileOpen", function (data) {
          console.log(data);
        });

        ins.on("error", (err) => {
          console.log("发生错误：", err);
        });
      }
    };

    const handleDownLoad = async (item) => {
      console.log("sssssss", item);
      fetch(item.fileUrl).then((res) => {
        res.blob().then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download =
            item.legalDocumentProject.name +
            "_" +
            item.wxPaidOrders.out_trade_no +
            ".docx";
          a.click();
          window.URL.revokeObjectURL(blobUrl);
        });
      });
    };

    const centerDialogVisible = ref(false);
    const preivewDialogVisible = ref(false);
    const previewDialog = ref(false);
    const convertedContent = ref("");
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
    };
    const exportWord = () => {
      exportDocx(
        itemData.fileUrl,
        itemData.reviewDocJson == ""
          ? JSON.parse(itemData.docJson.replace(/\\n/g, "<w:br />"))
          : JSON.parse(itemData.reviewDocJson.replace(/\\n/g, "<w:br />")),
        itemData.projectName + "_" + itemData.out_trade_no + ".docx"
      );
      console.log(
        "66666666",
        JSON.parse(itemData.docJson.replace(/\n/g, "<w:br />"))
      );
    };
    const chatHistoryDialogVisible = ref(false);
    const handleSave = async () => {
      const combined = {};
      elements.value.forEach((obj, index) => {
        combined[`${obj.label}`] = obj.value;
      });
      const paperwork = {
        reviewDocJson: JSON.stringify(combined),
      };
      const res = await updatePaperworkMutation({
        paperwork: paperwork,
        id: itemData.id,
      });
      if (res) {
        notify.success(root.$t("notify.Done"));
        //centerDialogVisible.value = false
      }
    };
    const unApprovetableData = ref([]);
    const handleRelease = async () => {
      const combined = {};
      elements.value.forEach((obj, index) => {
        combined[`${obj.label}`] = obj.value;
      });
      const paperwork = {
        reviewDocJson: JSON.stringify(combined),
      };
      const res = await updatePaperworkMutation({
        paperwork: paperwork,
        id: itemData.id,
      });
      if (res) {
        const res = await notiPaperworkToWxUseMutation({
          id: itemData.id,
        });
        if (res) {
          notify.success(root.$t("document.ReleaseSuccess"));
          getAllPaper();
          centerDialogVisible.value = false;
        }
      }
    };
    const handleInputSearch = async () => {
      if (searchUnapprove.value === "") {
        getUnApprove();
      } else {
        currentPage.value = 1;
        const res = await getPaperworksAndCountMutation({
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
          state: "unapproved",
          out_trade_no: searchUnapprove.value,
        });
        if (res) {
          unApproveData.value = res.data.getPaperworksAndCount.data;
          totalunApprove.value = res.data.getPaperworksAndCount.totalCount;
        }
      }
    };
    const handleInputSearch1 = async () => {
      if (searchApprove.value === "") {
        getApprove();
      } else {
        currentPage1.value = 1;
        const res = await getPaperworksAndCountMutation({
          take: pageSize1.value,
          skip: (currentPage1.value - 1) * pageSize1.value,
          state: "approved",
          out_trade_no: searchApprove.value,
        });
        if (res) {
          approveData.value = res.data.getPaperworksAndCount.data;
          totalApprove.value = res.data.getPaperworksAndCount.totalCount;
        }
      }
    };
    const handleInputSearch2 = async () => {
      if (searchFail.value === "") {
        getError();
      } else {
        currentPage2.value = 1;
        const res = await getPaperworksAndCountMutation({
          take: pageSize2.value,
          skip: (currentPage2.value - 1) * pageSize2.value,
          state: "error",
          out_trade_no: searchFail.value,
        });
        if (res) {
          failData.value = res.data.getPaperworksAndCount.data;
          totalError.value = res.data.getPaperworksAndCount.totalCount;
        }
      }
    };
    const handleReleaseDoucment = async (item) => {
      const res = await notiPaperworkToWxUseMutation({
        id: item.id,
      });
      if (res) {
        notify.success(root.$t("document.ReleaseSuccess"));
        getAllPaper();
        centerDialogVisible.value = false;
      }
    };

    // const getAllPaper = async () => {
    //   const res = await getPaperworksMutation()
    //   if (res) {
    //     const data = res.data.getPaperworks
    //     approveData.value = data.filter((item) => item.state === 'approved')
    //     unApproveData.value = data.filter((item) => item.state === 'unapproved')
    //     failData.value = data.filter((item) => item.state === 'error')
    //   }
    //   }
    const totalApprove = ref(0);
    const totalunApprove = ref(0);
    const totalError = ref(0);
    const currentPage = ref(1); // 当前页
    const pageSize = ref(5); // 每页显示条数
    const currentPage1 = ref(1); // 当前页
    const pageSize1 = ref(5); // 每页显示条数
    const currentPage2 = ref(1); // 当前页
    const pageSize2 = ref(5); // 每页显示条数
    const getUnApprove = async () => {
      const res = await getPaperworksAndCountMutation({
        take: pageSize.value,
        skip: (currentPage.value - 1) * pageSize.value,
        state: "unapproved",
      });
      if (res) {
        unApproveData.value = res.data.getPaperworksAndCount.data;
        totalunApprove.value = res.data.getPaperworksAndCount.totalCount;
      }
    };
    const getApprove = async () => {
      const res = await getPaperworksAndCountMutation({
        take: pageSize1.value,
        skip: (currentPage1.value - 1) * pageSize1.value,
        state: "approved",
      });
      if (res) {
        approveData.value = res.data.getPaperworksAndCount.data;
        totalApprove.value = res.data.getPaperworksAndCount.totalCount;
      }
    };

    const getError = async () => {
      const res = await getPaperworksAndCountMutation({
        take: pageSize2.value,
        skip: (currentPage2.value - 1) * pageSize2.value,
        state: "error",
      });
      if (res) {
        failData.value = res.data.getPaperworksAndCount.data;
        totalError.value = res.data.getPaperworksAndCount.totalCount;
      }
    };
    const handleSizeChange = (val) => {
      pageSize.value = val;
      getUnApprove();
    };
    const handleSizeChange1 = (val) => {
      pageSize1.value = val;
      getApprove();
    };
    const handleSizeChange2 = (val) => {
      pageSize2.value = val;
      getError();
    };

    const handleCurrentChange = (val) => {
      currentPage.value = val;
      getUnApprove();
    };

    const handleCurrentChange1 = (val) => {
      currentPage1.value = val;
      getApprove();
    };

    const handleCurrentChange2 = (val) => {
      currentPage2.value = val;
      getError();
    };
    const getAllPaper = async () => {
      console.log("getAllPaper");
      getApprove();
      getUnApprove();
      getError();
    };
    const handlePreview = async () => {
      elements.value.forEach((key) => {
        convertedContent.value = convertedContent.value.replace(
          "{" + key.label + "}",
          key.value
        );
      });
      preivewDialogVisible.value = true;
    };
    const handleApprovedPreview = (item) => {
      itemData.fileUrl = item.fileUrl;
      previewDialog.value = true;
    };
    const approveData = ref([]);
    const unApproveData = ref([]);
    const failData = ref([]);
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
    const handleUnapprove = () => {
      unApproveData.value = unApproveData.value.filter((item) => {
        return item.wxPaidOrders.out_trade_no.includes(searchUnapprove.value);
      });
    };
    const handleFail = () => {
      failData.value = failData.value.filter((item) => {
        return item.wxPaidOrders.out_trade_no.includes(searchFail.value);
      });
    };
    const handleApprove = () => {
      approveData.value = approveData.value.filter((item) => {
        return item.wxPaidOrders.out_trade_no.includes(searchApprove.value);
      });
    };
    const handleApproval = (item) => {
      void root.$router.push("/document/" + item.id);

      //getWebofficeToken(16)
      //   elements.value = []
      //   itemData.id = item.id
      //   itemData.projectName = item.legalDocumentProject.name
      //   itemData.out_trade_no = item.wxPaidOrders.out_trade_no
      //   itemData.chatJson = item.chatJson
      //   itemData.openid = item.wxUser.openId
      //   itemData.fileUrl =
      //     item.legalDocumentProject.legalDocumentTemplates[0].fileUrl
      //   itemData.dataJson =
      //     item.dataJson == null
      //       ? ''
      //       : JSON.parse(
      //           item.dataJson.replaceAll(/\n/g, '\\n').replaceAll(/\r/g, '\\r')
      //         )
      //   itemData.docJson =
      //     item.docJson == null
      //       ? ''
      //       : JSON.parse(
      //           item.docJson.replaceAll(/\n/g, '\\n').replaceAll(/\r/g, '\\r')
      //         )
      //   itemData.reviewDocJson =
      //     item.reviewDocJson == null
      //       ? ''
      //       : JSON.parse(
      //           item.reviewDocJson
      //             .replaceAll(/\n/g, '\\n')
      //             .replaceAll(/\r/g, '\\r')
      //         )
      //   itemData.reviewDocJson = flattenJson(itemData.reviewDocJson)
      //   chatHistory.value = []
      //   itemData.chatJson = item.chatJson

      //   if (itemData.chatJson != null) {
      //     chatHistory.value = JSON.parse(
      //       itemData.chatJson.replaceAll(/\n/g, '\\n').replaceAll(/\r/g, '\\r')
      //     )
      //   }

      //   //centerDialogVisible.value = true
      //   loadAndConvertDocument(itemData.fileUrl)
      //   if (item.reviewDocJson) {
      //     // elements.value = itemData.reviewDocJson
      //     if (itemData.reviewDocJson) {
      //       for (let i in itemData.reviewDocJson) {
      //         let item = {
      //           label: i,
      //           value: itemData.reviewDocJson[i],
      //         }
      //         elements.value.push(item)
      //       }
      //     } else {
      //       elements.value = []
      //     }
      //   } else {
      //     if (itemData.docJson) {
      //       for (let i in itemData.docJson) {
      //         let item = {
      //           label: i,
      //           value: itemData.docJson[i],
      //         }
      //         elements.value.push(item)
      //       }
      //     } else {
      //       elements.value = []
      //     }
      //   }
    };
    const chatHistory = ref([]);
    const handleChatHistory = (item) => {
      chatHistory.value = [];
      itemData.chatJson = item.chatJson;

      if (itemData.chatJson != null) {
        chatHistory.value = JSON.parse(
          itemData.chatJson.replaceAll(/\n/g, "\\n").replaceAll(/\r/g, "\\r")
        );
      }

      chatHistoryDialogVisible.value = true;
    };
    const elements = ref([]);
    const loadAndConvertDocument = (url) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          return mammoth.convertToHtml({ arrayBuffer });
        })
        .then((result) => {
          convertedContent.value = result.value;
        })
        .catch((err) => {
          console.error(err);
        });
    };

    const handleDownLoadAIUrl = (row) => {
      console.log("dddd", row);
      fetch(row.aiFileUrl).then((res) => {
        res.blob().then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download =
            row.legalDocumentProject.name +
            "_" +
            row.wxPaidOrders.out_trade_no +
            ".docx";
          a.click();
          window.URL.revokeObjectURL(blobUrl);
        });
      });
    };

    onMounted(() => {
      const currentUser = computed(getters.currentUser);
      if (currentUser.value.role != 1 && currentUser.value.role != 2) {
        if (currentUser.value.role == 5) {
          void root.$router.push("/user");
        } else if (currentUser.value.role == 6) {
          void root.$router.push("/DistributorOrg");
        } else {
          void root.$router.push("/workflow");
        }
      } else {
        getAllPaper();
      }
    });
    return {
      activeName: "1",
      handleApproval,
      approveData,
      searchUnapprove,
      searchFail,
      failData,
      handleFail,
      searchApprove,
      unApproveData,
      handleUnapprove,
      handleApprove,
      unApprovetableData,
      chatHistoryDialogVisible,
      handleChatHistory,
      handleApprovedPreview,
      previewDialog,
      chatHistory,
      elements,
      handleSave,
      handlePreview,
      handleInputSearch,
      handleInputSearch1,
      handleInputSearch2,
      tableData,
      exportWord,
      handleDownLoad,
      handleRelease,
      handleReleaseDoucment,
      preivewDialogVisible,
      loadAndConvertDocument,
      convertedContent,
      centerDialogVisible,
      itemData,
      forateTime,
      totalApprove,
      totalunApprove,
      totalError,
      pageSize,
      pageSize1,
      pageSize2,
      currentPage,
      currentPage1,
      currentPage2,
      handleSizeChange,
      handleCurrentChange,
      handleSizeChange1,
      handleCurrentChange1,
      handleSizeChange2,
      handleCurrentChange2,
      handleDownLoadAIUrl,
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
    // // 每页显示条数改变
    // handleSizeChange1(val) {
    //   this.pageSize1 = val
    // },
    // // 当前页改变
    // handleCurrentChange1(val) {
    //   this.currentPage1 = val
    // },
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
.border-box {
  width: 100%; /* 设置你的盒子宽度 */
  min-height: 500px; /* 设置你的盒子高度 */
  background-color: white; /* 设置白色背景 */
  border: 2px solid #ffffff; /* 设置白色边框 */
  border-radius: 5px; /* 设置圆角 */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1); /* 可选的盒子阴影 */
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
.custom-dialog /deep/ .el-dialog__header {
  display: none;
}
</style>

