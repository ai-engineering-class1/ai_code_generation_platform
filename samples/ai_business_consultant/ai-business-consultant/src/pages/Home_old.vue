<template>
  <div class="px-10 py-5">
    <el-tabs class="mx-5 my-2" v-model="activeName">
      <el-tab-pane label="轮播图" name="1">
        <div>
          <el-button
            class="float-right"
            style="margin-bottom: 0.625rem"
            type="primary"
            @click="addRotating()"
          >
            添加轮播图
          </el-button>
        </div>
        <el-table
          :data="swiperData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            :label="$t('goods.carouselImgs')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              <el-image
                style="width: 80%; height: 7.5rem"
                v-if="scope.row.imageUrl"
                :src="scope.row.imageUrl"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column
            prop="detailUrl"
            label="详情链接"
            align="center"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column :label="$t('People.action')" align="center">
            <template slot-scope="scope">
              <el-button
                @click="EditCarouselImgs(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.edit") }}
              </el-button>
              <el-button
                @click="DeleteCarouselImgs(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="主要服务" name="2">
        <div>
          <el-button
            class="float-right"
            style="margin-bottom: 0.625rem"
            type="primary"
            @click="addMainImage()"
          >
            添加图片
          </el-button>
        </div>
        <el-table
          :data="pictureData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            :label="$t('goods.mainImg')"
            align="center"
            min-width="100%"
          >
            <template slot-scope="scope">
              <el-image
                style="width: 80%; height: 7.5rem"
                v-if="scope.row.imageUrl"
                :src="scope.row.imageUrl"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column
            prop="detailUrl"
            label="详情链接"
            align="center"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column :label="$t('People.action')" align="center">
            <template slot-scope="scope">
              <el-button
                @click="EditMainImages(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.edit") }}
              </el-button>
              <el-button
                @click="DeleteMainImages(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="示范文本" name="3">
        <div>
          <el-button
            class="float-right"
            style="margin-bottom: 0.625rem"
            type="primary"
            @click="addModelText()"
          >
            添加文本
          </el-button>
        </div>
        <el-table
          :data="textData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column label="文件名" align="center" min-width="100%">
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
                <img
                  src="../assets/img/word.svg"
                  width="50"
                  height="50"
                  style="cursor: pointer"
                  v-if="hasDocx(scope.row.name)"
                />
                <img
                  src="../assets/img/pdf.svg"
                  width="50"
                  height="50"
                  style="cursor: pointer"
                  v-else
                />
                <span style="margin-left: 10px">{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="downloadUrl"
            label="文件链接"
            align="center"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column :label="$t('People.action')" align="center">
            <template slot-scope="scope">
              <el-button
                @click="PreviewModelText(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("document.Preview") }}
              </el-button>
              <el-button
                @click="DeleteModelText(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="使用范例" name="4">
        <div>
          <el-button
            class="float-right"
            style="margin-bottom: 0.625rem"
            type="primary"
            @click="addUsageExamples()"
          >
            添加范例
          </el-button>
        </div>
        <el-table
          :data="templateData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            prop="name"
            label="名称"
            align="center"
            min-width="60%"
          >
          </el-table-column>
          <el-table-column label="范例图" align="center" min-width="100%">
            <template slot-scope="scope">
              <el-image
                style="width: 80%; height: 7.5rem"
                v-if="scope.row.imageUrl"
                :src="scope.row.imageUrl"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column
            prop="detailUrl"
            label="详情链接"
            align="center"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column :label="$t('People.action')" align="center">
            <template slot-scope="scope">
              <el-button
                @click="EditUsageExample(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.edit") }}
              </el-button>
              <el-button
                @click="DeleteUsageExample(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="律师列表" name="5">
        <div>
          <el-button
            class="float-right"
            style="margin-bottom: 0.625rem"
            type="primary"
            @click="addLawyers()"
          >
            添加律师
          </el-button>
        </div>
        <el-table
          :data="lawyerData"
          style="width: 100%"
          class="mb-5"
          border
          :empty-text="$t('People.noData')"
        >
          <el-table-column
            label="律师"
            prop="name"
            align="center"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column prop="avatarUrl" label="律师照片" align="center">
            <template slot-scope="scope">
              <j-avatar
                :size="100"
                :avatarUrl="scope.row.avatarUrl"
                :name="'xxxxx'"
                class="shadow-outline-white -ml-1"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="desc"
            :label="$t('Distributor.describe')"
            align="center"
          >
          </el-table-column>
          <el-table-column :label="$t('Distributor.wxQrCode')" align="center">
            <template slot-scope="scope">
              <el-image
                style="width: 8.25rem; height: 8.25rem"
                v-if="scope.row.lawyerQRCode != null"
                :src="scope.row.lawyerQRCode"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column label="企业微信二维码" align="center">
            <template slot-scope="scope">
              <el-image
                style="width: 8.25rem; height: 8.25rem"
                v-if="scope.row.enterpriseWeChatQRCode != null"
                :src="scope.row.enterpriseWeChatQRCode"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column :label="$t('People.action')" align="center">
            <template slot-scope="scope">
              <el-button
                @click="EditLawyers(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.edit") }}
              </el-button>
              <el-button
                @click="DeleteLawyers(scope.$index, scope.row)"
                type="text"
              >
                {{ $t("People.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- addRotatingDialog -->
    <el-dialog
      :title="CreateOrEdit + '轮播图'"
      :visible.sync="addRotatingDialog"
      width="50%"
      center
      :append-to-body="true"
      :close-on-click-modal="false"
      class="channel-dialog"
    >
      <el-form
        :model="RotatingMessage"
        ref="RotatingForm"
        label-width="9.375rem"
        label-position="left"
      >
        <el-form-item label="跳转链接">
          <el-input
            class="channel-input"
            v-model="RotatingMessage.jumpUrl"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('goods.carouselImgs')"
          style="margin-top: 3.125rem"
        >
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="RotatingMessage.imgFileUrl"
              :style="{
                width: '21.875rem',
                height: '9.375rem',
                border: '.0625rem  solid grey',
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
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addRotatingDialog = false">取 消</el-button>
        <el-button type="primary" @click="comfirmAddRotating()"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <!-- addMainImageDialog -->
    <el-dialog
      :title="CreateOrEdit + '主图'"
      :visible.sync="addMainDialog"
      width="50%"
      center
      :append-to-body="true"
      :close-on-click-modal="false"
      class="channel-dialog"
    >
      <el-form
        :model="MainImageMessage"
        ref="RotatingForm"
        label-width="9.375rem"
        label-position="left"
      >
        <el-form-item label="跳转链接">
          <el-input
            class="channel-input"
            v-model="MainImageMessage.ImagejumpUrl"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('goods.carouselImgs')"
          style="margin-top: 3.125rem"
        >
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="MainImageMessage.ImageFileUrl"
              :style="{
                width: '21.875rem',
                height: '9.375rem',
                border: '.0625rem  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadMainImages"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addMainDialog = false">取 消</el-button>
        <el-button type="primary" @click="comfirmAddMainImage()"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <!-- addtextModel -->
    <el-dialog
      :title="CreateOrEdit + '文本'"
      :visible.sync="addModelTextDialog"
      width="30%"
      center
      :append-to-body="true"
      :close-on-click-modal="false"
      class="channel-dialog"
    >
      <div style="display: flex; justify-content: center; align-items: center">
        <el-upload
          class="upload-demo"
          drag
          action=""
          show-file-list
          :http-request="beforeuploadModelText"
          accept=".pdf,.doc,.docx,"
          :limit="1"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            {{ $t("upload.drag") }}<em>{{ $t("upload.browse") }}</em>
          </div>
          <div class="el-upload__tip" slot="tip">
            只能上传word/pdf文件，且不超过500kb
          </div>
        </el-upload>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addModelTextDialog = false">取 消</el-button>
        <el-button type="primary" @click="comfirmAddModelText()"
          >确 定</el-button
        >
      </span>
    </el-dialog>
    <!--预览的弹窗  -->
    <el-dialog
      width="70%"
      :close-on-click-modal="false"
      :visible.sync="previewDialog"
      :modal-append-to-body="false"
      :destroy-on-close="true"
    >
      <div class="column items-center" style="height: 700px">
        <iframe
          :src="
            'https://view.officeapps.live.com/op/view.aspx?src=' +
            previewFileUrl
          "
          width="100%"
          height="100%"
        ></iframe>
      </div>
    </el-dialog>

    <!-- addUseTemplate -->
    <el-dialog
      :title="CreateOrEdit + '范例'"
      :visible.sync="addUsageExamplesDialog"
      width="50%"
      center
      :append-to-body="true"
      :close-on-click-modal="false"
      class="channel-dialog"
    >
      <el-form
        :model="UsageExamplesMessage"
        ref="UsageExamplesForm"
        label-width="9.375rem"
        label-position="left"
      >
        <el-form-item label="名称">
          <el-input
            class="channel-input"
            v-model="UsageExamplesMessage.name"
          ></el-input>
        </el-form-item>
        <el-form-item label="范例图" style="margin-top: 3.125rem">
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="UsageExamplesMessage.imageUrl"
              :style="{
                width: '21.875rem',
                height: '9.375rem',
                border: '.0625rem  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadUsageExamples"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="跳转链接" style="margin-top: 3.125rem">
          <el-input
            class="channel-input"
            v-model="UsageExamplesMessage.detailUrl"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addUsageExamplesDialog = false">取 消</el-button>
        <el-button type="primary" @click="comfirmAddUsageExamples()"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <!-- addLayers -->
    <el-dialog
      :title="CreateOrEdit + '律师'"
      :visible.sync="addLawyersDialog"
      width="50%"
      center
      :append-to-body="true"
      :close-on-click-modal="false"
      class="channel-dialog"
    >
      <el-form
        :model="LawyersMessage"
        ref="lawyerForm"
        label-width="9.375rem"
        label-position="left"
      >
        <el-form-item label="律师名">
          <el-input
            class="channel-input"
            v-model="LawyersMessage.name"
          ></el-input>
        </el-form-item>
        <el-form-item label="律师照片" style="margin-top: 3.125rem">
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="LawyersMessage.avatarUrl"
              :style="{
                width: '6.25rem',
                height: '6.25rem',
                border: '.0625rem  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadLawyerAvatarUrl"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="律师简介">
          <el-input
            class="channel-input"
            v-model="LawyersMessage.desc"
          ></el-input>
        </el-form-item>
        <!-- 个人二维码 -->
        <el-form-item label="个人二维码" style="margin-top: 3.125rem">
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="LawyersMessage.lawyerQRCode"
              :style="{
                width: '6.25rem',
                height: '6.25rem',
                border: '.0625rem  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadLawyerQRCode"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <!-- 企业微信二维码 -->
        <el-form-item label="企业微信二维码" style="margin-top: 3.125rem">
          <div class="row items-center">
            <q-img
              class="imgbox mr-3"
              :src="LawyersMessage.enterpriseWeChatQRCode"
              :style="{
                width: '6.25rem',
                height: '6.25rem',
                border: '.0625rem  solid grey',
              }"
            />
            <el-upload
              class="upload-demo"
              action=""
              ref="uploadRef"
              :http-request="beforeuploadentErpriseWeChatQRCode"
              :show-file-list="false"
              accept="image/jpg,image/jpeg,image/png"
            >
              <el-button type="primary">{{
                $t("profile.selectimage")
              }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addLawyersDialog = false">取 消</el-button>
        <el-button type="primary" @click="comfirmAddLawyers()">确 定</el-button>
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
} from "@vue/composition-api";
import { useMutation } from "@vue/apollo-composable";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
import { Dialog, Loading, copyToClipboard } from "quasar";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import notify from "src/boot/notify";
import {
  getOrgLawyers,
  createOrgLawyer,
  updateOrgLawyer,
  deleteOrgLawyer,
  getOrgCarouselImages,
  createOrgCarouselImage,
  updateOrgCarouselImage,
  deleteOrgCarouselImage,
  getOrgMainImages,
  createOrgMainImage,
  updateOrgMainImage,
  deleteOrgMainImage,
  getOrgModelTexts,
  createOrgModelText,
  updateOrgModelText,
  deleteOrgModelText,
  getOrgUsageExamples,
  createOrgUsageExample,
  updateOrgUsageExample,
  deleteOrgUsageExample,
} from "src/graphql/queries/homeSetting";
export default defineComponent({
  data() {
    return {};
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const { mutate: getOrgLawyersMutation } = useMutation(getOrgLawyers);
    const { mutate: createOrgLawyerMutation } = useMutation(createOrgLawyer);
    const { mutate: updateOrgLawyerMutation } = useMutation(updateOrgLawyer);
    const { mutate: deleteOrgLawyerMutation } = useMutation(deleteOrgLawyer);
    const { mutate: getOrgCarouselImagesMutation } =
      useMutation(getOrgCarouselImages);
    const { mutate: createOrgCarouselImageMutation } = useMutation(
      createOrgCarouselImage
    );
    const { mutate: updateOrgCarouselImageMutation } = useMutation(
      updateOrgCarouselImage
    );
    const { mutate: deleteOrgCarouselImageMutation } = useMutation(
      deleteOrgCarouselImage
    );
    const { mutate: getOrgMainImagesMutation } = useMutation(getOrgMainImages);
    const { mutate: createOrgMainImageMutation } =
      useMutation(createOrgMainImage);
    const { mutate: updateOrgMainImageMutation } =
      useMutation(updateOrgMainImage);
    const { mutate: deleteOrgMainImageMutation } =
      useMutation(deleteOrgMainImage);
    const { mutate: getOrgModelTextsMutation } = useMutation(getOrgModelTexts);
    const { mutate: createOrgModelTextMutation } =
      useMutation(createOrgModelText);
    const { mutate: updateOrgModelTextMutation } =
      useMutation(updateOrgModelText);
    const { mutate: deleteOrgModelTextMutation } =
      useMutation(deleteOrgModelText);
    const { mutate: getOrgUsageExamplesMutation } =
      useMutation(getOrgUsageExamples);
    const { mutate: createOrgUsageExampleMutation } = useMutation(
      createOrgUsageExample
    );
    const { mutate: updateOrgUsageExampleMutation } = useMutation(
      updateOrgUsageExample
    );
    const { mutate: deleteOrgUsageExampleMutation } = useMutation(
      deleteOrgUsageExample
    );
    const getOrgCarouselData = async () => {
      try {
        const {
          data: { getOrgCarouselImages: datas },
        } = await getOrgCarouselImagesMutation();
        swiperData.value = datas;
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    const swiperData = ref([]);
    const pictureData = ref([]);
    const textData = ref([]);
    const templateData = ref([]);
    const lawyerData = ref([]);
    const addRotatingDialog = ref(false);
    const RotatingMessage = ref({
      imgFileUrl: "",
      jumpUrl: "",
    });
    const addRotating = () => {
      CreateOrEdit.value = "添加";
      RotatingMessage.value.imgFileUrl = "";
      RotatingMessage.value.jumpUrl = "";
      addRotatingDialog.value = true;
    };
    const beforeuploadCarouselImgs = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        RotatingMessage.value.imgFileUrl = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const CreateOrEdit = ref("");
    const comfirmAddRotating = async () => {
      if (RotatingMessage.value.imgFileUrl == "") {
        notify.error("必须上传一张轮播图");
        return;
      }
      if (RotatingMessage.value.jumpUrl == "") {
        notify.error("轮播图跳转的详情链接是必填项");
        return;
      }
      if (CreateOrEdit.value == "添加") {
        // console.log("dddd", RotatingMessage.value);
        const carouselImages = {
          imageUrl: RotatingMessage.value.imgFileUrl,
          detailUrl: RotatingMessage.value.jumpUrl,
        };
        const createCarouse = await createOrgCarouselImageMutation({
          orgCarouselImage: carouselImages,
        });
        // console.log(createCarouse);
      } else if (CreateOrEdit.value == "编辑") {
        const updateImages = {
          imageUrl: RotatingMessage.value.imgFileUrl,
          detailUrl: RotatingMessage.value.jumpUrl,
        };
        const updateCarouse = await updateOrgCarouselImageMutation({
          orgCarouselImage: updateImages,
          id: Number(editCarouseId.value),
        });
      }
      notify.success(root.$t("People.succeed"));
      addRotatingDialog.value = false;
      getOrgCarouselData();
    };
    const editCarouseId = ref();
    const EditCarouselImgs = async (index, row) => {
      addRotatingDialog.value = true;
      CreateOrEdit.value = "编辑";
      editCarouseId.value = row.id;
      RotatingMessage.value.imgFileUrl = row.imageUrl;
      RotatingMessage.value.jumpUrl = row.detailUrl;
    };

    const DeleteCarouselImgs = async (index, row) => {
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
        await deleteOrgCarouselImageMutation({ id: row.id });
        getOrgCarouselData();
        notify.success(root.$t("People.succeed"));
      });
    };

    // addMainImage
    const getOrgMainImagesData = async () => {
      try {
        const {
          data: { getOrgMainImages: datas },
        } = await getOrgMainImagesMutation();
        pictureData.value = datas;
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    const MainImageMessage = ref({
      ImageFileUrl: "",
      ImagejumpUrl: "",
    });
    const addMainDialog = ref(false);
    const beforeuploadMainImages = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        MainImageMessage.value.ImageFileUrl = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const addMainImage = () => {
      addMainDialog.value = true;
      CreateOrEdit.value = "添加";
      MainImageMessage.value.ImageFileUrl = "";
      MainImageMessage.value.ImagejumpUrl = "";
    };
    const comfirmAddMainImage = async () => {
      if (MainImageMessage.value.ImageFileUrl == "") {
        notify.error("必须上传一张主图");
        return;
      }
      if (MainImageMessage.value.ImagejumpUrl == "") {
        notify.error("主图跳转的详情链接是必填项");
        return;
      }
      // console.log("maindata", MainImageMessage.value);
      if (CreateOrEdit.value == "添加") {
        const MainImage = {
          imageUrl: MainImageMessage.value.ImageFileUrl,
          detailUrl: MainImageMessage.value.ImagejumpUrl,
        };
        const createMainImage = await createOrgMainImageMutation({
          orgMainImage: MainImage,
        });
        // console.log(createMainImage);
      } else if (CreateOrEdit.value == "编辑") {
        const updateMainImage = {
          imageUrl: MainImageMessage.value.ImageFileUrl,
          detailUrl: MainImageMessage.value.ImagejumpUrl,
        };
        const updateCarouse = await updateOrgMainImageMutation({
          orgMainImage: updateMainImage,
          id: Number(editMainImageID.value),
        });
      }
      notify.success(root.$t("People.succeed"));
      addMainDialog.value = false;
      getOrgMainImagesData();
    };
    const editMainImageID = ref();
    const EditMainImages = (index, row) => {
      addMainDialog.value = true;
      CreateOrEdit.value = "编辑";
      editMainImageID.value = row.id;
      MainImageMessage.value.ImageFileUrl = row.imageUrl;
      MainImageMessage.value.ImagejumpUrl = row.detailUrl;
    };

    const DeleteMainImages = async (index, row) => {
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
        await deleteOrgMainImageMutation({ id: row.id });
        getOrgMainImagesData();
        notify.success(root.$t("People.succeed"));
      });
    };

    // addModelText
    const getModelTextData = async () => {
      try {
        const {
          data: { getOrgModelTexts: datas },
        } = await getOrgModelTextsMutation();
        textData.value = datas;
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    const addModelTextDialog = ref(false);
    const addModelText = () => {
      CreateOrEdit.value = "添加";
      addModelTextDialog.value = true;
    };
    const ModelTextMessage = ref({
      name: "",
      downloadLink: "",
    });
    const beforeuploadModelText = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        ModelTextMessage.value.downloadLink = result.fileUrl;
        ModelTextMessage.value.name = result.Name;
      } catch (error) {}
      Loading.hide();
      return result.Name;
    };
    const comfirmAddModelText = async () => {
      if (ModelTextMessage.value.downloadLink == "") {
        notify.error("必须上传一个示范文本的文件");
        return;
      }
      // console.log("ddd", ModelTextMessage.value);
      const ModelText = {
        name: ModelTextMessage.value.name,
        downloadUrl: ModelTextMessage.value.downloadLink,
      };
      const createModelText = await createOrgModelTextMutation({
        orgModelText: ModelText,
      });
      // console.log(createModelText);
      notify.success(root.$t("People.succeed"));
      addModelTextDialog.value = false;
      getModelTextData();
    };
    const previewDialog = ref(false);
    const previewFileUrl = ref();
    const PreviewModelText = (index, row) => {
      previewDialog.value = true;
      previewFileUrl.value = row.downloadUrl;
    };
    const DeleteModelText = (index, row) => {
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
        await deleteOrgModelTextMutation({ id: row.id });
        getModelTextData();
        notify.success(root.$t("People.succeed"));
      });
    };

    // addUsageExamples
    const getUsageExamplesData = async () => {
      try {
        const {
          data: { getOrgUsageExamples: datas },
        } = await getOrgUsageExamplesMutation();
        templateData.value = datas;
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    const UsageExamplesMessage = ref({
      name: "",
      imageUrl: "",
      detailUrl: "",
    });
    const addUsageExamplesDialog = ref(false);
    const beforeuploadUsageExamples = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        UsageExamplesMessage.value.imageUrl = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const addUsageExamples = () => {
      CreateOrEdit.value = "添加";
      addUsageExamplesDialog.value = true;
      UsageExamplesMessage.value.imageUrl = "";
      UsageExamplesMessage.value.detailUrl = "";
      UsageExamplesMessage.value.name = "";
    };
    const comfirmAddUsageExamples = async () => {
      if (UsageExamplesMessage.value.name == "") {
        notify.error("名字是必填项");
        return;
      }
      if (UsageExamplesMessage.value.imageUrl == "") {
        notify.error("必须上传一张范例图片");
        return;
      }
      if (UsageExamplesMessage.value.detailUrl == "") {
        notify.error("范例图片跳转的详情链接是必填项");
        return;
      }
      // console.log("maindata", UsageExamplesMessage.value);
      if (CreateOrEdit.value == "添加") {
        const UsageExamples = {
          name: UsageExamplesMessage.value.name,
          imageUrl: UsageExamplesMessage.value.imageUrl,
          detailUrl: UsageExamplesMessage.value.detailUrl,
        };
        const createUsageExamples = await createOrgUsageExampleMutation({
          orgUsageExample: UsageExamples,
        });
        // console.log(createUsageExamples);
      } else if (CreateOrEdit.value == "编辑") {
        const updateUsageExample = {
          name: UsageExamplesMessage.value.name,
          imageUrl: UsageExamplesMessage.value.imageUrl,
          detailUrl: UsageExamplesMessage.value.detailUrl,
        };
        const updateCarouse = await updateOrgUsageExampleMutation({
          orgUsageExample: updateUsageExample,
          id: Number(editUsageExampleID.value),
        });
      }
      notify.success(root.$t("People.succeed"));
      addUsageExamplesDialog.value = false;
      getUsageExamplesData();
    };
    const editUsageExampleID = ref();
    const EditUsageExample = (index, row) => {
      addUsageExamplesDialog.value = true;
      CreateOrEdit.value = "编辑";
      editUsageExampleID.value = row.id;
      UsageExamplesMessage.value.name = row.name;
      UsageExamplesMessage.value.imageUrl = row.imageUrl;
      UsageExamplesMessage.value.detailUrl = row.detailUrl;
    };

    const DeleteUsageExample = (index, row) => {
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
        await deleteOrgUsageExampleMutation({ id: row.id });
        getUsageExamplesData();
        notify.success(root.$t("People.succeed"));
      });
    };

    // addLayers
    const getOrgLawyersData = async () => {
      try {
        const {
          data: { getOrgLawyers: datas },
        } = await getOrgLawyersMutation();
        lawyerData.value = datas;
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    const LawyersMessage = ref({
      name: "",
      avatarUrl: "",
      desc: "",
      lawyerQRCode: "",
      enterpriseWeChatQRCode: "",
    });
    const addLawyersDialog = ref(false);
    const addLawyers = () => {
      addLawyersDialog.value = true;
      CreateOrEdit.value = "添加";
      LawyersMessage.value.name = "";
      LawyersMessage.value.avatarUrl = "";
      LawyersMessage.value.desc = "";
      LawyersMessage.value.lawyerQRCode = "";
      LawyersMessage.value.enterpriseWeChatQRCode = "";
    };
    const beforeuploadLawyerAvatarUrl = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        LawyersMessage.value.avatarUrl = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const beforeuploadLawyerQRCode = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        LawyersMessage.value.lawyerQRCode = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const beforeuploadentErpriseWeChatQRCode = async (file) => {
      Loading.show({
        message: root.$t("goods.uploading"),
      });
      let result = {};
      try {
        result = await uploadOSS(file.file);
        LawyersMessage.value.enterpriseWeChatQRCode = result.fileUrl;
      } catch (error) {}
      Loading.hide();
      return result.fileUrl;
    };
    const editLawyerID = ref();
    const EditLawyers = (index, row) => {
      addLawyersDialog.value = true;
      CreateOrEdit.value = "编辑";
      editLawyerID.value = row.id;
      LawyersMessage.value.name = row.name;
      LawyersMessage.value.avatarUrl = row.avatarUrl;
      LawyersMessage.value.desc = row.desc;
      LawyersMessage.value.lawyerQRCode = row.lawyerQRCode;
      LawyersMessage.value.enterpriseWeChatQRCode = row.enterpriseWeChatQRCode;
    };
    const DeleteLawyers = (index, row) => {
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
        await deleteOrgLawyerMutation({ id: row.id });
        getOrgLawyersData();
        notify.success(root.$t("People.succeed"));
      });
    };
    const comfirmAddLawyers = async () => {
      if (LawyersMessage.value.name == "") {
        notify.error("律师名字是必填项");
        return;
      }
      if (LawyersMessage.value.avatarUrl == "") {
        notify.error("必须上传一张律师照片");
        return;
      }
      if (LawyersMessage.value.desc == "") {
        notify.error("律师简介是必填项");
        return;
      }
      if (LawyersMessage.value.lawyerQRCode == "") {
        notify.error("必须上传律师的微信二维码");
        return;
      }
      if (LawyersMessage.value.enterpriseWeChatQRCode == "") {
        notify.error("必须上传律师的企业微信二维码");
        return;
      }
      // console.log("maindata", LawyersMessage.value);
      if (CreateOrEdit.value == "添加") {
        const Lawyers = {
          name: LawyersMessage.value.name,
          avatarUrl: LawyersMessage.value.avatarUrl,
          desc: LawyersMessage.value.desc,
          lawyerQRCode: LawyersMessage.value.lawyerQRCode,
          enterpriseWeChatQRCode: LawyersMessage.value.enterpriseWeChatQRCode,
        };
        const createLawyers = await createOrgLawyerMutation({
          orgLawyer: Lawyers,
        });
        // console.log(createLawyers);
      } else if (CreateOrEdit.value == "编辑") {
        const updateLawyers = {
          name: LawyersMessage.value.name,
          avatarUrl: LawyersMessage.value.avatarUrl,
          desc: LawyersMessage.value.desc,
          lawyerQRCode: LawyersMessage.value.lawyerQRCode,
          enterpriseWeChatQRCode: LawyersMessage.value.enterpriseWeChatQRCode,
        };
        const updateLawyer = await updateOrgLawyerMutation({
          orgLawyer: updateLawyers,
          id: Number(editLawyerID.value),
        });
      }
      notify.success(root.$t("People.succeed"));
      addLawyersDialog.value = false;
      getOrgLawyersData();
    };
    const hasDocx = (filename) => {
      return filename.endsWith(".docx") || filename.endsWith(".doc");
    };

    onMounted(() => {
      getOrgCarouselData();
      getOrgMainImagesData();
      getModelTextData();
      getUsageExamplesData();
      getOrgLawyersData();
    });
    return {
      hasDocx,
      editLawyerID,
      beforeuploadentErpriseWeChatQRCode,
      beforeuploadLawyerQRCode,
      beforeuploadLawyerAvatarUrl,
      comfirmAddLawyers,
      addLawyers,
      DeleteLawyers,
      EditLawyers,
      addLawyersDialog,
      LawyersMessage,
      getOrgLawyersData,
      DeleteUsageExample,
      editUsageExampleID,
      EditUsageExample,
      addUsageExamples,
      UsageExamplesMessage,
      comfirmAddUsageExamples,
      beforeuploadUsageExamples,
      addUsageExamplesDialog,
      getUsageExamplesData,
      previewFileUrl,
      previewDialog,
      DeleteModelText,
      PreviewModelText,
      getModelTextData,
      beforeuploadModelText,
      comfirmAddModelText,
      addModelText,
      beforeuploadMainImages,
      DeleteMainImages,
      editMainImageID,
      EditMainImages,
      getOrgMainImagesData,
      DeleteCarouselImgs,
      editCarouseId,
      EditCarouselImgs,
      CreateOrEdit,
      addModelTextDialog,
      ModelTextMessage,
      addMainImage,
      MainImageMessage,
      comfirmAddMainImage,
      addMainDialog,
      getOrgCarouselData,
      comfirmAddRotating,
      beforeuploadCarouselImgs,
      RotatingMessage,
      addRotatingDialog,
      addRotating,
      lawyerData,
      templateData,
      textData,
      pictureData,
      swiperData,
      activeName: "1",
    };
  },
});
</script>

<style  scoped>
.imgbox {
  width: 6.25rem;
  height: 6.25rem;
  border: 0.0625rem solid grey;
}
</style>
