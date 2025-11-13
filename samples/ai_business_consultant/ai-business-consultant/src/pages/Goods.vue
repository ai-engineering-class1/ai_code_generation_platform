<template>
  <div class="w-full h-full px-12">
    <div
      style="
        width: 100%;
        margin: 20px 0;
        display: flex;
        justify-content: space-between;
      "
    >
      <el-input
        v-model="searchValue"
        style="width: 200px"
        :placeholder="$t('People.searchForName')"
        @input="handleInputSearch"
        ><i slot="prefix" class="el-input__icon el-icon-search"></i
      ></el-input>
      <el-button
        @click="handleCreate"
        v-if="currentUser.role == 1 || currentUser.role == 3"
        type="primary"
      >
        {{ $t("goods.add") }}
      </el-button>
    </div>
    <div>
      <el-table
        :data="
          TabelDate.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        "
        style="width: 100%"
        class="mb-5"
        border
        :loading="loading"
        :empty-text="$t('People.noData')"
      >
        <el-table-column
          prop="name"
          :label="$t('goods.name')"
          align="center"
          min-width="100%"
        >
        </el-table-column>
        <el-table-column
          :label="$t('goods.mainImg')"
          align="center"
          min-width="100%"
        >
          <template slot-scope="scope">
            <el-image
              style="width: 60px; height: 60px"
              v-if="scope.row.mainImg"
              :src="scope.row.mainImg"
              :fit="fit"
            ></el-image>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('goods.projectType')"
          align="center"
          min-width="100%"
        >
          <template slot-scope="scope">
            {{
              scope.row.legalDocumentProject != null
                ? scope.row.legalDocumentProject.name
                : "法律咨询"
            }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          :label="$t('goods.status')"
          align="center"
        >
          <template slot-scope="scope">
            {{ getStatus(scope.row.status) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" :label="$t('goods.price')" align="center">
        </el-table-column>
        <!-- <el-table-column prop="marketPrice"
                         :label="$t('goods.marketPrice')"
                         align="center">
        </el-table-column> -->
        <el-table-column
          prop="description"
          :label="$t('goods.description')"
          align="center"
        >
        </el-table-column>

        <el-table-column
          prop="createdAt"
          :label="$t('goods.createdAt')"
          align="center"
          :formatter="formatterTime"
        >
        </el-table-column>
        <el-table-column
          prop="updatedAt"
          :label="$t('goods.updatedAt')"
          align="center"
          :formatter="formatterTime"
        >
        </el-table-column>
        <el-table-column
          :label="$t('People.action')"
          align="center"
          v-if="currentUser.role == 1 || currentUser.role == 3"
        >
          <template slot-scope="scope">
            <el-button
              @click="handleStatue(scope.row)"
              :disabled="
                currentUser.role == 3 && scope.row.creatorId != currentUser.id
              "
              type="text"
            >
              {{
                scope.row.status == "Release"
                  ? $t("goods.offline")
                  : $t("goods.release")
              }}
            </el-button>
            <el-button
              @click="handleEdit(scope.$index, scope.row)"
              :disabled="
                currentUser.role == 3 && scope.row.creatorId != currentUser.id
              "
              type="text"
            >
              {{ $t("People.edit") }}
            </el-button>

            <el-button
              @click="handleDelete(scope.$index, scope.row)"
              :disabled="
                currentUser.role == 3 && scope.row.creatorId != currentUser.id
              "
              type="text"
            >
              {{ $t("People.delete") }}
            </el-button>
            <el-button
              type="text"
              :disabled="
                currentUser.role == 3 && scope.row.creatorId != currentUser.id
              "
              @click="handleCopyGood(scope.row)"
              >{{ $t("flow.Copy") }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        :total="TabelDate.length"
        layout="total, sizes, prev, pager, next, jumper"
      >
      </el-pagination>
    </div>

    <!-- 编辑添加弹窗 -->
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="dialogGoodVisible"
      :title="createOrEditTitle"
      :width="'50%'"
      :append-to-body="true"
      class="channel-dialog"
    >
      <el-form
        :model="goodMessage"
        :rules="goodRules"
        ref="goodForm"
        label-width="150px"
        label-position="left"
      >
        <el-form-item :label="$t('goods.name')" prop="name">
          <el-input
            class="channel-input"
            v-model="goodMessage.name"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('goods.mainImg')">
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :style="{
                width: '100px',
                height: '100px',
                border: '1px  solid grey',
              }"
              :src="goodMessage.mainImg"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeupload"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item :label="$t('goods.carouselImgs')">
          <div class="row items-center">
            <template v-if="goodMessage.carouselImgs.length">
              <template v-for="(item, index) in goodMessage.carouselImgs">
                <div class="imgbox-box mr-3 mb-1">
                  <q-img class="imgbox" :src="item" />
                  <div class="delete-icon">
                    <el-button
                      type="danger"
                      size="mini"
                      icon="el-icon-delete"
                      circle
                      @click="handleRemoveCarouselImg(index)"
                    ></el-button>
                  </div>
                </div>
              </template>
            </template>
            <q-img
              v-else
              class="imgbox mr-3"
              :style="{
                width: '100px',
                height: '100px',
                border: '1px  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadCarouselImgs"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item :label="$t('goods.detailImgs')">
          <div class="row items-center">
            <template v-if="goodMessage.detailImgs.length">
              <template v-for="(item, index) in goodMessage.detailImgs">
                <div class="imgbox-box mr-3 mb-1">
                  <q-img class="imgbox" :src="item" />
                  <div class="delete-icon">
                    <el-button
                      type="danger"
                      size="mini"
                      icon="el-icon-delete"
                      circle
                      @click="handleRemoveDetailImg(index)"
                    ></el-button>
                  </div>
                </div>
              </template>
            </template>
            <q-img
              v-else
              class="imgbox mr-3"
              :style="{
                width: '100px',
                height: '100px',
                border: '1px  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadDetailImgs"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item :label="$t('goods.price')" prop="price">
          <el-input
            class="channel-input"
            v-model="goodMessage.price"
            :validate-event="false"
            @input="(v) => (goodMessage.price = v.replace(/[^\d.]/g, ''))"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('goods.marketPrice')" prop="marketPrice">
          <el-input
            class="channel-input"
            v-model="goodMessage.marketPrice"
            :validate-event="false"
            @input="(v) => (goodMessage.marketPrice = v.replace(/[^\d.]/g, ''))"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('goods.stock')" prop="stock">
          <el-input-number
            v-model="goodMessage.stock"
            :min="1"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('goods.validDays')" prop="validDays ">
          <el-input-number
            v-model="goodMessage.validDays"
            :min="0"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('goods.description')" prop="marketPrice">
          <el-input
            class="channel-input"
            v-model="goodMessage.description"
            type="textarea"
            :rows="2"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('goods.checkLawer')" prop="marketPrice">
          <el-select
            v-model="goodMessage.lawyers"
            clearable
            filterable
            multiple
            :placeholder="$t('People.PleaseSelect')"
            style="width: 100%"
          >
            <el-option
              v-for="item in allLawyer"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <!-- <el-form-item :label="$t('goods.details')"
                      prop="details">
          <el-input class="channel-input"
                    v-model="goodMessage.details"
                    type="textarea"
                    :rows="2"></el-input>
        </el-form-item> -->
        <el-form-item :label="$t('goods.projectType')" prop="role">
          <el-select
            v-model="currlegalDocumentProjectId"
            clearable
            filterable
            :disabled="isEdit"
            :placeholder="$t('People.PleaseSelect')"
            style="width: 100%"
          >
            <el-option
              v-for="item in projectDatas"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('goods.private')" prop="state">
          <q-checkbox
            v-model="goodMessage.state"
            true-value="Private"
            false-value="Public"
          />
        </el-form-item>
        <el-form-item :label="$t('goods.share')" prop="distributorStatus">
          <q-checkbox
            v-model="goodMessage.distributorStatus"
            true-value="Public"
            false-value="Private"
          />
        </el-form-item>
        <el-form-item
          prop="state"
          v-if="isEdit"
          :label="$t('Distributor.H5link')"
        >
          <span>{{ goodMessage.h5Link }}</span>
          <i
            class="el-icon-document-copy ml-3 cursor-pointer"
            @click="handlecopy"
          ></i>
        </el-form-item>
        <el-form-item
          prop="state"
          v-if="isEdit"
          :label="$t('Distributor.LinkQRcode')"
        >
          <div style="display: flex; align-items: center">
            <el-image
              style="width: 100px; height: 100px"
              :src="goodMessage.qrCode"
              :fit="fit"
            ></el-image>

            <el-button
              icon="el-icon-download"
              class="mb-3"
              @click="handleDownload"
            ></el-button>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogGoodVisible = false">{{
          $t("People.cancel")
        }}</el-button>
        <el-button type="primary" @click="handleSubmitMessage">{{
          $t("People.confirm")
        }}</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="$t('goods.copygoods')"
      :close-on-click-modal="false"
      width="30%"
      :visible.sync="dialogCopyVisible"
    >
      <el-form>
        <el-form-item :label="$t('goods.name')">
          <el-input v-model="copyname" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('goods.projectType')" prop="role">
          <el-select
            v-model="copyProjectId"
            clearable
            filterable
            :placeholder="$t('People.PleaseSelect')"
            style="width: 100%"
          >
            <el-option
              v-for="item in projectDatas"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogCopyVisible = false">{{
          $t("profile.Cancel")
        }}</el-button>
        <el-button type="primary" @click="handleSubmitCopy">{{
          $t("profile.Confirm")
        }}</el-button>
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
} from "@vue/composition-api";
import { mutations, getters } from "../store/store";
import { useMutation } from "@vue/apollo-composable";
import dayjs from "dayjs";
import notify from "src/boot/notify";
import { Dialog, Loading, copyToClipboard } from "quasar";
import {
  getCommoditys,
  deleteCommodity,
  updateCommodity,
  createCommodity,
  setOfflineCommodity,
  setReleaseCommodity,
  copyCommodity,
} from "src/graphql/queries/goods";
import {
  updateCommodityLawyers,
  getUserLawyers,
} from "src/graphql/queries/people";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import { getLegalDocumentProjects } from "src/graphql/queries/project";
import axios, { AxiosInstance } from "axios";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
import { Row } from "vant";
export default defineComponent({
  data() {
    return {
      isMobile: getIsMobileBrowser(),
      currentPage: 1, // 当前页
      pageSize: 10, // 每页显示条数
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    // 获取
    const loading = ref(false);
    const allTabelDate = ref([]);
    const TabelDate = ref([]);
    const projectDatas = ref([]);
    const goodsurl = ref("");
    const copyname = ref("");
    const copyId = ref("");
    const copyProjectId = ref("");
    const currentUser = computed(getters.currentUser);
    const { mutate: getCommoditysMutation } = useMutation(getCommoditys);
    const { mutate: copyCommodityMutation } = useMutation(copyCommodity);
    const { mutate: getLegalDocumentProjectsMutation } = useMutation(
      getLegalDocumentProjects
    );
    const { mutate: updateCommodityLawyersMutation } = useMutation(
      updateCommodityLawyers
    );
    const { mutate: getUserLawyersMutation } = useMutation(getUserLawyers);
    const getAllCase = async () => {
      const res = await getLegalDocumentProjectsMutation();
      if (res) {
        projectDatas.value = res.data.getLegalDocumentProjects;
      }
    };
    const incrementOrAppend = (str) => {
      // 找到最后一个 '-' 的位置
      const lastIndex = str.lastIndexOf("-");

      // 如果没找到 '-'，则直接返回原字符串 + '-1'
      if (lastIndex === -1) {
        return str + "-1";
      }

      // 提取 '-' 之后的子字符串
      const suffix = str.slice(lastIndex + 1);

      // 使用 parseInt 尝试将后缀转换为整数，并检查是否成功
      const num = parseInt(suffix, 10);

      // 如果后缀是数字，则加1并返回新字符串
      if (!isNaN(num)) {
        return str.slice(0, lastIndex + 1) + (num + 1);
      }

      // 如果后缀不是数字，则在原字符串后添加 '-1'
      return str + "-1";
    };
    const handleCopyGood = async (item) => {
      copyname.value = incrementOrAppend(item.name);
      copyId.value = item.id;
      copyProjectId.value = item.legalDocumentProject.id;

      dialogCopyVisible.value = true;
    };
    const dialogCopyVisible = ref(false);
    const allLawyer = ref([]);
    const getallLawyer = async () => {
      const res = await getUserLawyersMutation();
      if (res) {
        allLawyer.value = res.data.getUserLawyers;
      }
    };
    const getGoods = async () => {
      try {
        loading.value = true;
        const {
          data: { getCommoditys: goods },
        } = await getCommoditysMutation();
        goods.forEach((element) => {
          element.price = element.price / 100;
          element.marketPrice = element.marketPrice / 100;
        });
        allTabelDate.value = goods;
        TabelDate.value = goods;
        loading.value = false;
        console.log(TabelDate.value);
      } catch (error) {
        console.log("----------getGoods error");
      }
    };
    const handlecopy = () => {
      copyToClipboard(goodMessage.value.h5Link);
      notify.success(root.$t("flow.CopySuccess"));
    };
    const handleDownload = async () => {
      try {
        // 假设这是你的图片URL
        const imageUrl = goodMessage.value.qrCode;

        // 使用axios获取图片数据
        const response = await axios({
          url: imageUrl,
          method: "GET",
          responseType: "blob", // 重要：告诉axios期望的响应类型是一个blob
        });

        // 创建一个指向该blob的URL
        const url = window.URL.createObjectURL(new Blob([response.data]));

        // 创建一个a标签并模拟点击进行下载
        const link = document.createElement("a");
        link.href = url;
        // 这里需要设置下载的文件名，假设我们不知道原始文件名，则随便设置
        link.setAttribute("download", "downloaded_image.jpg");
        document.body.appendChild(link);
        link.click();

        // 清理工作：移除创建的URL和a标签
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (error) {
        console.error("下载图片时发生错误:", error);
      }
    };
    // 时间戳
    const forateTime = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    const getToday = (date, format = "YYYY-MM-DD ") => {
      return date ? dayjs(date).format(format) : date;
    };
    const formatterTime = (row) => {
      let FormatTime = forateTime(row.createdAt);
      return FormatTime;
    };

    // 角色
    const formatterRole = (row) => {
      switch (row.role) {
        case 1:
          return root.$t("People.Administrators");
        case 2:
          return root.$t("People.Lawyer");
      }
    };
    const roleOptions = [
      {
        value: 1,
        label: root.$t("People.Administrators"),
      },
      {
        value: 2,
        label: root.$t("People.Lawyer"),
      },
    ];

    // 搜索人员
    const searchValue = ref("");
    const handleInputSearch = () => {
      TabelDate.value = allTabelDate.value.filter((item) => {
        return item.name.includes(searchValue.value);
      });
      console.log(searchValue.value, TabelDate.value);
    };

    const dialogGoodVisible = ref(false);
    const createOrEditTitle = ref("");
    const isEdit = ref(false);
    const goodMessage = ref({
      name: "",
      price: 0,
      mainImg: "",
      description: "",
      marketPrice: 0,
      details: "",
      carouselImgs: [],
      detailImgs: [],
      stock: 0,
      state: "Public",
      qrCode: "",
      h5Link: "",
      lawyers: [],
      validDays: 0,
      distributorStatus: "Private",
    });
    const currlegalDocumentProjectId = ref("");
    //添加
    const handleCreate = () => {
      isEdit.value = false;
      createOrEditTitle.value = root.$t("goods.add");
      goodMessage.value = {
        ...goodMessage.value,
        name: "",
        price: 0,
        marketPrice: 0,
        description: "",
        details: "",
        mainImg: "",
        legalDocumentProjectId: 0,
        carouselImgs: [],
        detailImgs: [],
        stock: 0,
        validDays: 0,
        lawyers: [],
        state: "Public",
        distributorStatus: "Private",
      };
      dialogGoodVisible.value = true;
    };

    const beforeupload = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        goodMessage.value.mainImg = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };

    const beforeuploadCarouselImgs = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      try {
        const result = await uploadOSS(file.file);
        goodMessage.value.carouselImgs.push(result.fileUrl);
        Loading.hide();
        return result.fileUrl;
      } catch (error) {}
      Loading.hide();
    };

    const beforeuploadDetailImgs = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      try {
        const result = await uploadOSS(file.file);
        goodMessage.value.detailImgs.push(result.fileUrl);
        Loading.hide();
        return result.fileUrl;
      } catch (error) {}
      Loading.hide();
    };

    const handleRemoveCarouselImg = (index) => {
      goodMessage.value.carouselImgs.splice(index, 1);
    };

    const handleRemoveDetailImg = (index) => {
      goodMessage.value.detailImgs.splice(index, 1);
    };

    // 编辑
    const goodsId = ref(0);
    const handleEdit = (index, row) => {
      isEdit.value = true;
      createOrEditTitle.value = root.$t("People.edit");
      currlegalDocumentProjectId.value = row.legalDocumentProjectId;
      let carouselImgs = [];
      let detailImgs = [];
      if (row.carouselImgs) {
        carouselImgs = row.carouselImgs.split(",");
      }
      if (row.detailImgs) {
        detailImgs = row.detailImgs.split(",");
      }

      goodMessage.value = {
        name: row.name,
        price: row.price,
        mainImg: row.mainImg,
        description: row.description,
        marketPrice: row.marketPrice,
        details: row.details,
        stock: row.stock,
        validDays: row.validDays,
        state: row.state,
        h5Link: row.h5Link,
        qrCode: row.qrCode,
        lawyers: row.lawyers.map((item) => item.id),
        carouselImgs: carouselImgs,
        detailImgs: detailImgs,
        distributorStatus: row.distributorStatus,
      };
      goodsId.value = row.id;

      dialogGoodVisible.value = true;
    };

    //提交表单
    const goodForm = ref(null);
    const goodRules = {
      name: [
        {
          required: true,
          message: root.$t("goods.nameRequire"),
          trigger: "blur",
        },
      ],
      price: [
        {
          required: true,
          message: root.$t("goods.priceRequire"),
          trigger: "blur",
        },
      ],
    };
    const { mutate: createCommodityMutation } = useMutation(createCommodity);
    const { mutate: updateCommodityMutation } = useMutation(updateCommodity);
    const { mutate: setReleaseCommodityMutation } =
      useMutation(setReleaseCommodity);
    const { mutate: setOfflineCommodityMutation } =
      useMutation(setOfflineCommodity);
    const handleSubmitMessage = () => {
      if (goodForm.value) {
        if (currlegalDocumentProjectId.value == "") {
          notify.error(root.$t("goods.projectIsRequire"));
          return;
        }
        goodForm.value.validate(async (valid) => {
          if (valid) {
            console.log(goodMessage.value);
            try {
              if (currlegalDocumentProjectId.value != "") {
                goodMessage.value.legalDocumentProjectId = Number(
                  currlegalDocumentProjectId.value
                );
              }

              if (createOrEditTitle.value == root.$t("goods.add")) {
                const commodity = {
                  name: goodMessage.value.name,
                  price: Number(goodMessage.value.price) * 100,
                  mainImg: goodMessage.value.mainImg,
                  description: goodMessage.value.description,
                  marketPrice: Number(goodMessage.value.marketPrice) * 100,
                  details: goodMessage.value.details,

                  stock: Number(goodMessage.value.stock),
                  validDays: Number(goodMessage.value.validDays),
                  state: goodMessage.value.state,
                  distributorStatus: goodMessage.value.distributorStatus,
                  legalDocumentProjectId: Number(
                    currlegalDocumentProjectId.value
                  ),
                  detailImgs: goodMessage.value.detailImgs.join(","),
                  carouselImgs: goodMessage.value.carouselImgs.join(","),
                };
                const createRes = await createCommodityMutation({
                  commodity: commodity,
                  lawyerIds: goodMessage.value.lawyers,
                });
                console.log(createRes);
                getGoods();
                notify.success(root.$t("People.succeed"));
              } else {
                const commodity = {
                  name: goodMessage.value.name,
                  price: Number(goodMessage.value.price) * 100,
                  mainImg: goodMessage.value.mainImg,
                  description: goodMessage.value.description,
                  marketPrice: Number(goodMessage.value.marketPrice) * 100,
                  details: goodMessage.value.details,
                  stock: Number(goodMessage.value.stock),
                  validDays: Number(goodMessage.value.validDays),

                  state: goodMessage.value.state,
                  distributorStatus: goodMessage.value.distributorStatus,
                  legalDocumentProjectId: Number(
                    currlegalDocumentProjectId.value
                  ),
                  detailImgs: goodMessage.value.detailImgs.join(","),
                  carouselImgs: goodMessage.value.carouselImgs.join(","),
                };

                const updateRes = await updateCommodityMutation({
                  commodity: commodity,
                  id: goodsId.value,
                  lawyerIds: goodMessage.value.lawyers,
                });
                console.log(updateRes);
                getGoods();
                notify.success(root.$t("People.succeed"));
              }
              dialogGoodVisible.value = false;
              goodMessage.value = {
                name: "",
                email: "",
                phone: "",
                avatarUrl: "https://file.sflow.pro/avatar_default.png",
                carouselImgs: [],
                detailImgs: [],
                stock: 0,
                validDays: 0,
                lawyerIds: [],
                state: "Public",
                distributorStatus: "Private",
              };
              console.log(goodMessage.value);
            } catch (error) {
              notify.error(error.message);
            }
          }
        });
      }
    };
    const handleInput = (value) => {
      // 使用正则表达式来判断是否为整数或小数
      const regex = /^(\d+)?(\.\d+)?$/;
      if (!regex.test(value)) {
        goodMessage.value.price = 0;
      }
    };
    const getStatus = (status) => {
      switch (status) {
        case "Release":
          return "正式发布";
        case "Testing":
          return "内测";
        case "Offline":
          return "下线";
      }
    };
    // 删除
    const { mutate: deleteCommodityMutation } = useMutation(deleteCommodity);
    const handleDelete = async (index, row) => {
      Dialog.create({
        title: root.$t("People.confirm"),
        message: root.$t("action.delTipText"),
        ok: {
          label: root.$t("People.confirm"),
          noCaps: true,
        },
        cancel: {
          label: root.$t("People.cancel"),
          noCaps: true,
          flat: true,
        },
        style: {
          zIndex: 10002,
        },
      }).onOk(async () => {
        notify.success(root.$t("People.succeed"));
        await deleteCommodityMutation({ id: row.id });
        getGoods();
        notify.success(root.$t("People.succeed"));
      });
    };
    const handleSubmitCopy = async () => {
      const res = await copyCommodityMutation({
        id: Number(copyId.value),
        legalDocumentProjectId: Number(copyProjectId.value),
        name: copyname.value,
      });
      if (res) {
        getGoods();
        dialogCopyVisible.value = false;
        notify.success(root.$t("flow.CopySuccess"));
      }
    };
    const handleStatue = async (row) => {
      Dialog.create({
        title: root.$t("People.confirm"),
        message:
          row.status == "Release"
            ? root.$t("goods.offlineTip")
            : root.$t("goods.releaseTip"),
        ok: {
          label: root.$t("People.confirm"),
          noCaps: true,
        },
        cancel: {
          label: root.$t("People.cancel"),
          noCaps: true,
          flat: true,
        },
        style: {
          zIndex: 10002,
        },
      }).onOk(async () => {
        let res;
        if (row.status == "Release") {
          res = await setOfflineCommodityMutation({ id: row.id });
        } else {
          res = await setReleaseCommodityMutation({ id: row.id });
        }
        if (res) {
          getGoods();
          notify.success(root.$t("notify.Done"));
        }
      });
    };

    onMounted(() => {
      getallLawyer();
      getGoods();
      getAllCase();
    });
    return {
      TabelDate,
      searchValue,
      handleInputSearch,
      handleInput,
      formatterTime,
      beforeupload,
      formatterRole,
      roleOptions,
      isEdit,
      dialogGoodVisible,
      projectDatas,
      createOrEditTitle,
      goodMessage,
      handleCopyGood,
      copyProjectId,
      copyname,
      currentUser,
      getallLawyer,
      allLawyer,
      goodRules,
      goodsurl,
      dialogCopyVisible,
      getStatus,
      goodForm,
      handleCreate,
      handleEdit,
      handleDelete,
      currlegalDocumentProjectId,
      handleSubmitMessage,
      loading,
      beforeuploadCarouselImgs,
      beforeuploadDetailImgs,
      handleRemoveCarouselImg,
      handleRemoveDetailImg,
      handleStatue,
      handlecopy,
      handleDownload,
      copyProjectId,
      handleSubmitCopy,
    };
  },
  methods: {
    // 每页显示条数改变
    handleSizeChange(val) {
      this.pageSize = val;
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val;
    },
  },
});
</script>
<style lang="scss" scoped>
.imgbox-box {
  width: 100px;
  height: 100px;
  position: relative;
  .imgbox {
    width: 100px;
    height: 100px;
    border: 1px solid grey;
  }
  .delete-icon {
    position: absolute;
    top: -5px;
    right: 2px;
    cursor: pointer;
  }
}
</style>
