<template>
  <div>
    <div class="mt-3 ml-3" style="height: 620px">
      <el-input
        v-model="search"
        style="width: 200px"
        :placeholder="$t('action.search')"
        ><i slot="prefix" class="el-input__icon el-icon-search"></i
      ></el-input>

      <el-button
        type="primary"
        style="margin-left: 20px"
        @click="addTemplate()"
        >{{ $t("template.Add") }}</el-button
      >
      <div
        v-for="item in templateList.filter(
          (data) =>
            !search ||
            data.fileName.toLowerCase().includes(search.toLowerCase())
        )"
        :key="item.id"
      >
        <div
          style="
            float: left;
            text-align: center;
            width: 150px;
            height: 170px;
            position: relative;
          "
          class="mr-8 word_class mt-8"
        >
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              padding-top: 10px;
            "
          >
            <img
              src="../assets/img/word.svg"
              width="130"
              height="130"
              style="cursor: pointer"
              @click="handleClickReview(item)"
              v-if="isDocxFile(item.fileUrl)"
            />
            <img
              src="../assets/img/pdf.svg"
              width="130"
              height="130"
              style="cursor: pointer"
              @click="handleClickReview(item)"
              v-else
            />
          </div>

          <div style="width: 100%; text-align: center">
            <div
              style="
                height: 20px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                text-align: center;
              "
            >
              <span>{{ item.fileName.split(".")[0] }}</span>
            </div>
          </div>
          <div
            style="position: absolute; top: 2px; right: 5px; cursor: pointer"
            class="more_icon"
          >
            <el-dropdown trigger="click">
              <i class="el-icon-more" style="font-size: 18px"></i>
              <el-dropdown-menu slot="dropdown" style="width: 100px">
                <el-dropdown-item command="2" style="margin: 0; padding: 0">
                  <div
                    @click="handledelete(item)"
                    style="width: 100%; text-align: center"
                  >
                    {{ $t("action.delete") }}
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      :title="$t('template.Add')"
      :close-on-click-modal="false"
      :visible.sync="uploadDialog"
      width="30%"
      :append-to-body="true"
    >
      <div style="font-size: 14px; margin-bottom: 8px">
        {{ $t("upload.acceptType") }}
      </div>
      <el-upload
        class="upload-demo"
        drag
        action=""
        accept=".pdf,.doc,.docx,"
        multiple
        :file-list="fileList"
        :http-request="uploadAttachment"
        width="100%"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          {{ $t("upload.drag") }} <em> {{ $t("upload.browse") }} </em>
        </div>
      </el-upload>
      <!-- <div>{{ fileInfo.name }}</div>
      <el-progress :percentage="50"></el-progress> -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="uploadDialog = false">
          {{ $t("action.cancel") }}
        </el-button>
        <el-button type="primary" @click="handleCreate">{{
          $t("action.create")
        }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      width="70%"
      :close-on-click-modal="false"
      :title="reviewItem.name"
      :visible.sync="reviewDialog"
      :modal-append-to-body="false"
      :destroy-on-close="true"
    >
      <div class="column items-center" v-if="reviewItem.url">
        <iframe
          :src="
            'https://view.officeapps.live.com/op/view.aspx?src=' +
            reviewItem.url
          "
          width="100%"
          height="700px"
          v-if="reviewItem.name.includes('doc')"
        ></iframe>
        <iframe
          class="pdf-iframe pdf-iframe-preview"
          :src="`${reviewItem.url}`"
          width="100%"
          height="700px"
          v-else
        ></iframe>
      </div>
      <div v-else>
        <div v-html="reviewItem.htmlText"></div>
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
import { login } from "src/graphql/queries/login";
import { storeAuthToken } from "src/utils/authToken";
import notify from "src/boot/notify";
import {
  createLegalDocument,
  getLegalDocuments,
  updateLegalDocument,
  deleteLegalDocument,
} from "src/graphql/queries/template";
import { copyToClipboard, Dialog, Loading } from "quasar";
import store from "src/store/store";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import { getters, mutations } from "../store/store";
import eventBus from "../utils/eventBus";

import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  name: "Login",
  data() {
    return {};
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const { mutate: createLegalDocumentMutation } =
      useMutation(createLegalDocument);
    const fileList = ref([]);
    const { mutate: getLegalDocumentsMutation } =
      useMutation(getLegalDocuments);
    const { mutate: deleteLegalDocumentMutation } =
      useMutation(deleteLegalDocument);
    const { mutate: updateLegalDocumentMutation } =
      useMutation(updateLegalDocument);
    const templateList = ref([]);
    const uploadDialog = ref(false);
    const upload_case = ref(null);
    const uploadFile = async (file) => {
      let result = null;
      result = await uploadOSS(file.file);
      const attachment = {
        url: result.fileUrl,
        name: file.file.name,
        FileName: result.Name,
      };
      return attachment;
    };

    const fileInfo = reactive({
      name: "",
      url: "",
      size: 0,
    });
    const handleCreate = async () => {
      if (upload_case.value) upload_case.value.clearFiles();
      const legalDocument = {
        fileName: fileInfo.name,
        fileUrl: fileInfo.url,
        size: fileInfo.size,
      };
      legalDocument.legalDocumentProjectId = Number(
        sessionStorage.getItem("legalDocumentProjectId")
      );

      const res = await createLegalDocumentMutation({
        legalDocument: legalDocument,
      });
      if (res) {
        uploadDialog.value = false;
        getDocuments();
        notify.success(root.$t("notify.Done"));
      }
    };
    const handledelete = async (row) => {
      Dialog.create({
        title: root.$t("action.delTip"),
        message: root.$t("action.delTipText"),
        ok: {
          color: "red",
          label: root.$t("action.delete"),
          noCaps: true,
        },
        cancel: {
          label: root.$t("action.cancel"),
          noCaps: true,
          flat: true,
        },
        style: {
          zIndex: 10002,
        },
      }).onOk(async () => {
        try {
          await deleteLegalDocumentMutation({ id: Number(row.id) });

          getDocuments();
          notify.success(root.$t("notify.Done"));
        } catch (error) {
          console.log("---------error", error);
          notify.error(error.message);
        }
      });
    };
    const reviewItem = ref({
      name: "",
      url: "",
    });

    const reviewDialog = ref(false);
    const getDocuments = async () => {
      const res = await getLegalDocumentsMutation({
        legalDocumentProjectId: Number(
          sessionStorage.getItem("legalDocumentProjectId")
        ),
      });
      templateList.value = res.data.getLegalDocuments;
    };
    const handleClickReview = (item) => {
      reviewItem.value = {
        url: item.fileUrl,
        name: item.fileName,
      };
      reviewDialog.value = true;
    };
    const uploadAttachment = async (file) => {
      let result = null;
      Loading.show({
        message: root.$t("upload.loading"),
      });
      try {
        console.log("111111111111uploadAttachment", file.file);
        result = await uploadOSS(file.file);
        fileInfo.name = file.file.name;
        fileInfo.url = result.fileUrl;
        Loading.hide();
      } catch (error) {
        notify.error(error.message);
      }
    };
    const addTemplate = () => {
      fileList.value = [];
      uploadDialog.value = true;
    };
    const isDocxFile = (filename) => {
      return filename.endsWith(".docx") || filename.endsWith(".doc");
    };

    onMounted(() => {
      //   getDocuments()
      //   eventBus.$on('switchProject', (caseId) => {
      //     getDocuments()
      //   })
      eventBus.$on("switchNewProject", (info) => {
        templateList.value = info.legalDocumentTemplates;
      });
    });
    return {
      isDocxFile,
      search: "",
      uploadAttachment,
      reviewDialog,
      templateList,
      uploadDialog,
      handledelete,
      fileInfo,
      upload_case,
      handleClickReview,
      reviewItem,
      addTemplate,
      handleCreate,
      fileList,
    };
  },
  methods: {},
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
.new_word {
  width: 150px;
  height: 160px;
  background-color: rgb(230 230 231);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.new_word:hover {
  background-color: rgb(194 194 197);
}
.word_class:hover {
  background-color: rgb(230 230 231);
}
.word_class .more_icon {
  display: none;
}
.word_class:hover .more_icon {
  display: block;
}
.select_doc {
  float: left;
  width: 200px;
  height: 50px;
  border: 1px solid rgb(230 230 231);
  margin-left: 10px;
  margin-top: 5px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}
.select_doc:hover {
  background-color: rgb(230 230 231);
}
.disable_class {
  pointer-events: none;
}
</style>
<style >
.upload-notice .el-upload-dragger {
  width: 400px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-notice .el-upload-dragger .el-upload__text {
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-local .el-upload-dragger {
  width: 150px;
  height: 40px;
  border: none;
  background: none;
}
.my-autocomplete .el-autocomplete-suggestion li {
  padding: 0;
}
.disable_class .el-upload-dragger {
  background: #f5f7fa;
  cursor: no-drop;
}
</style>


