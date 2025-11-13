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
      <el-button @click="openCreateOrgDialog()" type="primary">
        {{ $t("Distributor.Addorganization") }}
      </el-button>
    </div>
    <div>
      <el-table
        :data="
          AllOrgData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        "
        style="width: 100%"
        class="mb-5"
        border
        :empty-text="$t('People.noData')"
      >
        <el-table-column
          prop="name"
          :label="$t('Distributor.OrganizationName')"
          align="center"
          min-width="100%"
        >
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('goods.createdAt')"
          align="center"
          :formatter="formatterTime"
        >
        </el-table-column>
        <el-table-column :label="$t('People.action')" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="updateOrgInfo(scope.row)">{{
              $t("People.edit")
            }}</el-button>
            <el-button type="text" @click="createMenu(scope.row)">{{
              $t("Distributor.Createofficialaccountmenu")
            }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        :total="AllOrgData.length"
        layout="total, sizes, prev, pager, next, jumper"
      >
      </el-pagination>
    </div>

    <el-dialog
      :title="createOrEditTitle + ' ' + $t('Distributor.organization')"
      :visible.sync="OrgDialogVisible"
      center
      width="60%"
      @close="handleClose"
    >
      <div v-if="!isUploadFile" class="dialog-container">
        <div class="left-form">
          <span
            style="
              display: flex;
              justify-content: center;
              font-size: 16px;
              margin-bottom: 30px;
            "
            >{{ $t("Distributor.OrganizationalInformation") }}</span
          >
          <!-- 左侧表单内容 -->
          <el-form :model="OrgInfo" :rules="OrgInfoRules" label-width="250px">
            <el-form-item :label="$t('Distributor.PublicName')" prop="name">
              <el-input v-model="OrgInfo.name"></el-input>
            </el-form-item>
            <el-form-item :label="$t('Distributor.DeveloperID')" prop="wxAppId">
              <el-input v-model="OrgInfo.wxAppId"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.DeveloperPassword')"
              prop="wxAppSecret"
            >
              <el-input v-model="OrgInfo.wxAppSecret"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.WeChatPayMerchantAccount')"
              prop="wxMchId"
            >
              <el-input v-model="OrgInfo.wxMchId"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.APICertificateSerialNumber')"
              prop="wxSerialNo"
            >
              <el-input v-model="OrgInfo.wxSerialNo"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.InternationalRSACertificateSerialNumber')"
              prop="wxPublicKey"
            >
              <el-input v-model="OrgInfo.wxPublicKey"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.ReminderTemplateID')"
              prop="reminderWxTemplateId2"
            >
              <el-input v-model="OrgInfo.reminderWxTemplateId2"></el-input>
            </el-form-item>
            <el-form-item
              :label="$t('Distributor.CompleteTemplateID')"
              prop="completeWxTemplateId8"
            >
              <el-input v-model="OrgInfo.completeWxTemplateId8"></el-input>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-form" v-if="createOrEditTitle == $t('People.add')">
          <span
            style="
              display: flex;
              justify-content: center;
              font-size: 16px;
              margin-bottom: 30px;
            "
            >{{ $t("Distributor.AdministratorInformation") }}</span
          >
          <!-- 右侧表单内容 -->
          <el-form
            :model="adminInfo"
            :rules="adminInfoRules"
            label-width="150px"
            ref="adminFormRef"
          >
            <el-form-item :label="$t('People.userName')" prop="name">
              <el-input v-model="adminInfo.name"></el-input>
            </el-form-item>
            <el-form-item :label="$t('People.email')" prop="email">
              <el-input v-model="adminInfo.email"></el-input>
            </el-form-item>
            <el-form-item :label="$t('People.InitialPassword')" prop="password">
              <el-input v-model="adminInfo.password"></el-input>
            </el-form-item>
            <el-form-item :label="$t('People.Phone')" prop="phone">
              <el-input v-model="adminInfo.phone"></el-input>
            </el-form-item>
            <el-form-item :label="$t('register.des')" prop="desc">
              <el-input v-model="adminInfo.desc"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div v-if="isUploadFile">
        <span
          style="
            display: flex;
            justify-content: center;
            font-size: 16px;
            margin-bottom: 30px;
          "
          >{{ $t("Distributor.OrganizationalInformation") }}</span
        >
        <el-form
          ref="orgFormRef"
          :model="OrgInfo"
          :rules="OrgInfoRules"
          label-width="155px"
        >
          <el-form-item
            :label="$t('Distributor.certificatep12')"
            prop="apiClientCertP12"
          >
            <div style="display: flex; align-items: center">
              <el-input
                style="width: 85%"
                v-model="OrgInfo.apiClientCertP12"
              ></el-input>
              <el-upload
                class="upload-demo"
                action=""
                :on-success="handleSuccessApiClientCertP12"
                :http-request="customRequest"
                :show-file-list="false"
              >
                <el-button
                  style="margin-left: 20px"
                  size="medium"
                  type="primary"
                  >{{ $t("upload.browse") }}</el-button
                >
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item
            :label="$t('Distributor.certificatepem')"
            prop="apiClientCertPem"
          >
            <div style="display: flex; align-items: center">
              <el-input
                style="width: 85%"
                v-model="OrgInfo.apiClientCertPem"
              ></el-input>

              <el-upload
                class="upload-demo"
                action=""
                :http-request="customRequest"
                :on-success="handleSuccessApiClientCertPem"
                :show-file-list="false"
                accept=".pem,application/x-x509-ca-cert"
              >
                <el-button
                  style="margin-left: 20px"
                  size="medium"
                  type="primary"
                  >{{ $t("upload.browse") }}</el-button
                >
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item
            :label="$t('Distributor.Keypem')"
            prop="apiClientKeyPem"
          >
            <div style="display: flex; align-items: center">
              <el-input
                style="width: 85%"
                v-model="OrgInfo.apiClientKeyPem"
              ></el-input>
              <el-upload
                class="upload-demo"
                action=""
                :http-request="customRequest"
                :on-success="handleSuccessApiClientKeyPem"
                :show-file-list="false"
                accept=".pem,application/x-x509-ca-cert"
              >
                <el-button
                  style="margin-left: 20px"
                  size="medium"
                  type="primary"
                  >{{ $t("upload.browse") }}</el-button
                >
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item
            :label="$t('Distributor.DomainNameOfOfficialAccount')"
            prop="wxDomainPath"
          >
            <div style="display: flex; align-items: center">
              <el-input
                style="width: 85%"
                v-model="OrgInfo.wxDomainPath"
              ></el-input>
              <el-upload
                class="upload-demo"
                action=""
                :http-request="customRequestTestFile"
                :on-success="handleSuccessWxDomainPath"
                :show-file-list="false"
              >
                <el-button
                  style="margin-left: 20px"
                  size="medium"
                  type="primary"
                  >{{ $t("upload.browse") }}</el-button
                >
              </el-upload>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <!-- 对话框底部按钮 -->
      <div slot="footer" class="dialog-footer">
        <el-button v-if="!isUploadFile" @click="closeDialog()">{{
          $t("People.cancel")
        }}</el-button>
        <el-button v-if="isUploadFile" type="primary" @click="previousStep()">{{
          $t("Distributor.previousstep")
        }}</el-button>
        <el-button v-if="!isUploadFile" type="primary" @click="nextStep()">{{
          $t("Distributor.nextstep")
        }}</el-button>
        <el-button
          v-if="isUploadFile"
          type="primary"
          @click="ComfirmCreateOrg()"
          >{{ $t("People.confirm") }}</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
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
import validator from "src/utils/validator";
import notify from "src/boot/notify";
import { Dialog, copyToClipboard } from "quasar";
import {
  getAllOrganizations,
  createOrganization,
  updateOrganization,
  createWxOfficialAccountMenus,
} from "src/graphql/queries/org";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
import axios, { AxiosInstance } from "axios";
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
    const { mutate: getAllOrganizationsMutation } =
      useMutation(getAllOrganizations);
    const { mutate: createOrganizationMutation } =
      useMutation(createOrganization);
    const { mutate: updateOrganizationMutation } =
      useMutation(updateOrganization);
    const { mutate: createWxOfficialAccountMenusMutation } = useMutation(
      createWxOfficialAccountMenus
    );

    const adminFormRef = ref(null);
    const orgFormRef = ref(null);
    const AllOrgData = ref([]);
    const filterAllOrgData = ref([]);
    const getAllOrgData = async () => {
      try {
        const {
          data: { getAllOrganizations: OrgData },
        } = await getAllOrganizationsMutation();
        AllOrgData.value = OrgData;
        filterAllOrgData.value = OrgData;
        console.log("dddd", AllOrgData.value);
      } catch (error) {
        console.log("----------getOrg error");
      }
    };
    const adminInfo = ref({
      name: "",
      email: "",
      password: "",
      phone: "",
      avatarUrl: "https://file.sflow.pro/avatar_default.png",
      desc: "",
    });
    const OrgInfo = ref({
      name: "",
      wxAppId: "",
      wxAppSecret: "",
      wxMchId: "",
      wxSerialNo: "",
      wxPublicKey: "",
      apiClientCertP12: "",
      apiClientCertPem: "",
      apiClientKeyPem: "",
      wxDomainPath: "",
      reminderWxTemplateId2: "",
      completeWxTemplateId8: "",
    });
    const adminInfoRules = {
      name: [
        {
          required: true,
          message: root.$t("People.userNameMessage"),
          trigger: "blur",
        },
      ],
      phone: [
        {
          required: true,
          message: root.$t("People.userPhoneMessage"),
          trigger: "blur",
        },
      ],
      email: [
        {
          required: true,
          message: root.$t("People.userEmailMessage"),
          trigger: "blur",
        },
      ],
      password: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseentertheinitialpassword"),
          trigger: "blur",
        },
      ],
    };
    const OrgInfoRules = {
      name: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseenterthepublicname"),
          trigger: "blur",
        },
      ],
      wxAppId: [
        {
          required: true,
          message: root.$t("Distributor.PleaseenterthedeveloperID"),
          trigger: "blur",
        },
      ],
      wxAppSecret: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseenterthedeveloperpassword"),
          trigger: "blur",
        },
      ],
      wxMchId: [
        {
          required: true,
          message: root.$t(
            "Distributor.PeaseenteryourWeChatPaymerchantaccount"
          ),
          trigger: "blur",
        },
      ],
      wxSerialNo: [
        {
          required: true,
          message: root.$t(
            "Distributor.PleaseentertheAPIcertificateserialnumber"
          ),
          trigger: "blur",
        },
      ],
      wxPublicKey: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseentertheinternational"),
          trigger: "blur",
        },
      ],
      apiClientCertP12: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseuploadcertificatep12"),
          trigger: "blur",
        },
      ],
      apiClientCertPem: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseuploadcertificatepem"),
          trigger: "blur",
        },
      ],
      apiClientKeyPem: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseuploadthekeypem"),
          trigger: "blur",
        },
      ],
      reminderWxTemplateId2: [
        {
          required: true,
          message: root.$t("Distributor.PleaseentertheremindertemplateID"),
          trigger: "blur",
        },
      ],
      completeWxTemplateId8: [
        {
          required: true,
          message: root.$t("Distributor.PleaseenterthecompletedtemplateID"),
          trigger: "blur",
        },
      ],
      wxDomainPath: [
        {
          required: true,
          message: root.$t("Distributor.Pleaseuploadthedomain"),
          trigger: "blur",
        },
      ],
    };
    // 时间戳
    const forateTime = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    const formatterTime = (row) => {
      let FormatTime = forateTime(row.createdAt);
      return FormatTime;
    };
    const createOrEditTitle = ref("");
    const OrgDialogVisible = ref(false);
    const openCreateOrgDialog = () => {
      createOrEditTitle.value = root.$t("People.add");
      OrgDialogVisible.value = true;
      adminInfo.value = {
        ...adminInfo.value,
        name: "",
        email: "",
        password: "",
        phone: "",
        avatarUrl: "https://file.sflow.pro/avatar_default.png",
        desc: "",
      };
      OrgInfo.value = {
        ...OrgInfo.value,
        name: "",
        wxAppId: "",
        wxAppSecret: "",
        wxMchId: "",
        wxSerialNo: "",
        wxPublicKey: "",
        apiClientCertP12: "",
        apiClientCertPem: "",
        apiClientKeyPem: "",
        reminderWxTemplateId2: "",
        completeWxTemplateId8: "",
        wxDomainPath: "",
      };
    };
    const orgId = ref(0);
    const updateOrgInfo = (row) => {
      createOrEditTitle.value = root.$t("People.edit");
      orgId.value = row.id;
      OrgInfo.value = {
        name: row.name,
        wxAppId: row.wxAppId,
        wxAppSecret: row.wxAppSecret,
        wxMchId: row.wxMchId,
        wxSerialNo: row.wxSerialNo,
        wxPublicKey: row.wxPublicKey,
        apiClientCertP12: row.apiClientCertP12,
        apiClientCertPem: row.apiClientCertPem,
        apiClientKeyPem: row.apiClientKeyPem,
        reminderWxTemplateId2: row.reminderWxTemplateId2,
        completeWxTemplateId8: row.completeWxTemplateId8,
        wxDomainPath: row.wxDomainPath,
      };
      OrgDialogVisible.value = true;
    };
    const isUploadFile = ref(false);
    const nextStep = () => {
      isUploadFile.value = true;
    };
    const previousStep = () => {
      isUploadFile.value = false;
    };
    const customRequest = async ({ file, onSuccess, onError }) => {
      const token = localStorage.getItem("authToken");

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(
          "https://ort.saasflow.cn/upload/3",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        onSuccess(response.data); // 上传成功
      } catch (error) {
        onError(error); // 上传失败
      }
    };
    const customRequestTestFile = async ({ file, onSuccess, onError }) => {
      const token = localStorage.getItem("authToken");

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(
          "https://ort.saasflow.cn/upload/1",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        onSuccess(response.data); // 上传成功
      } catch (error) {
        onError(error); // 上传失败
      }
    };
    const handleSuccessApiClientCertP12 = (response, file) => {
      // console.log("file.name", file.name);
      OrgInfo.value.apiClientCertP12 = file.name;
    };
    const handleSuccessApiClientCertPem = (response, file) => {
      // console.log("file.name", file.name);
      OrgInfo.value.apiClientCertPem = file.name;
    };
    const handleSuccessApiClientKeyPem = (response, file) => {
      // console.log("file.name", file.name);
      OrgInfo.value.apiClientKeyPem = file.name;
    };
    const handleSuccessWxDomainPath = (response, file) => {
      // console.log("file.name", file.name);
      OrgInfo.value.wxDomainPath = file.name;
    };

    const closeDialog = () => {
      OrgDialogVisible.value = false;
      isUploadFile.value = false;
    };

    const handleClose = () => {
      OrgDialogVisible.value = false;
      isUploadFile.value = false;
    };

    const ComfirmCreateOrg = async () => {
      if (createOrEditTitle.value == root.$t("People.add")) {
        if (adminInfo.value.name == "") {
          return notify.error(
            root.$t("Distributor.Pleaseentertheinitialpassword")
          );
        }
        if (adminInfo.value.email == "") {
          return notify.error(root.$t("People.userEmailMessage"));
        }
        if (adminInfo.value.password == "") {
          return notify.error(root.$t("People.userNameMessage"));
        }
        if (adminInfo.value.phone == "") {
          return notify.error(root.$t("People.userPhoneMessage"));
        }
        try {
          // 校验表单
          await orgFormRef.value.validate();
        } catch (error) {
          return notify.error(
            root.$t("Distributor.Pleasefillintheorganization")
          );
        }
        // console.log("admin", adminInfo.value);
        // console.log("organization", OrgInfo.value);
        const createOrg = await createOrganizationMutation({
          admin: adminInfo.value,
          organization: OrgInfo.value,
        });
        // console.log("ddd", createOrg);
        getAllOrgData();
        notify.success(root.$t("People.succeed"));
        OrgDialogVisible.value = false;
        isUploadFile.value = false;
      } else {
        try {
          await orgFormRef.value.validate();
          // 如果校验成功，可以进入下一步
        } catch (error) {
          return notify.error(
            root.$t("Distributor.Pleasefillintheorganization")
          );
        }
        // console.log("organization", OrgInfo.value);
        // console.log("org id", orgId.value);
        const updateOrg = await updateOrganizationMutation({
          organization: OrgInfo.value,
        });
        // console.log("ddd", updateOrg);
        getAllOrgData();
        notify.success(root.$t("People.succeed"));
        OrgDialogVisible.value = false;
        isUploadFile.value = false;
      }
    };
    const createMenu = async (row) => {
      Dialog.create({
        title: root.$t("People.confirm"),
        message: root.$t("Distributor.Confirmtocreatetheofficialaccountmenu"),
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
        const createMenus = await createWxOfficialAccountMenusMutation({
          orgId: Number(row.id),
        });
        if (createMenus) {
          notify.success(root.$t("notify.Done"));
        }
      });
    };

    const searchValue = ref("");
    const handleInputSearch = () => {
      AllOrgData.value = filterAllOrgData.value.filter((item) => {
        return item.name.includes(searchValue.value);
      });
      console.log(searchValue.value, AllOrgData.value);
    };
    onMounted(() => {
      getAllOrgData();
    });
    return {
      filterAllOrgData,
      handleInputSearch,
      searchValue,
      createMenu,
      handleClose,
      customRequestTestFile,
      orgFormRef,
      adminFormRef,
      orgId,
      customRequest,
      closeDialog,
      ComfirmCreateOrg,
      handleSuccessWxDomainPath,
      handleSuccessApiClientKeyPem,
      handleSuccessApiClientCertPem,
      handleSuccessApiClientCertP12,
      previousStep,
      nextStep,
      isUploadFile,
      updateOrgInfo,
      createOrEditTitle,
      formatterTime,
      adminInfoRules,
      OrgInfoRules,
      OrgInfo,
      adminInfo,
      OrgDialogVisible,
      openCreateOrgDialog,
      AllOrgData,
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

<style scoped>
.dialog-container {
  display: flex;
}

.left-form,
.right-form {
  flex: 1;
  padding: 20px;
}

.left-form {
  /* border-right: 1px solid #eee; */
}

.dialog-footer {
  text-align: center;
}
</style>
