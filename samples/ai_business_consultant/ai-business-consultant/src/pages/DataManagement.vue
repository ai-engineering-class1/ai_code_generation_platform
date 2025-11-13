<template>
  <div class="w-full h-full px-12">
    <div
      style="
        width: 100%;
        margin: 15px 0;
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
        v-if="currentUser.role == 1"
        type="primary"
      >
        {{ $t("DistributorSplitRatio.addSplitRatio") }}
      </el-button>
    </div>
    <div>
      <el-table
        :data="
          tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        "
        style="width: 100%"
        class="mb-5"
        border
        :loading="Loading"
        :empty-text="$t('People.noData')"
      >
        <el-table-column
          :label="$t('data.particularsName')"
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
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('data.particularsContent')"
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
              <span style="margin-left: 10px">{{ scope.row.content }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('People.action')"
          align="center"
          min-width="100%"
          v-if="currentUser.role == 1"
        >
          <template slot-scope="scope">
            <el-button @click="handleEdit(scope.$index, scope.row)" type="text">
              {{ $t("People.edit") }}
            </el-button>
            <el-button
              @click="handleDelete(scope.$index, scope.row)"
              type="text"
            >
              {{ $t("People.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        :total="tableData.length"
        layout="total, sizes, prev, pager, next, jumper"
      >
      </el-pagination>
    </div>

    <!-- 编辑添加弹窗 -->
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="dialogPeopleVisible"
      :title="createOrEditTitle"
      :width="isMobile ? 'calc(100vw - 54px)' : 'calc(55% - 260px)'"
      :append-to-body="true"
      class="channel-dialog"
    >
      <el-form
        :model="dataInfo"
        ref="peopleForm"
        label-width="80px"
        label-position="top"
      >
        <el-form-item :label="$t('data.particularsName')" prop="name">
          <el-input
            class="channel-input"
            v-model="dataInfo.name"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('data.particularsContent')" prop="describe">
          <el-input
            class="channel-input"
            v-model="dataInfo.content"
            :validate-event="false"
            type="textarea"
            :rows="8"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogPeopleVisible = false">{{
          $t("People.cancel")
        }}</el-button>
        <el-button type="primary" @click="handleSubmitMessage">{{
          $t("People.confirm")
        }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
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
import { Dialog } from "quasar";
import {
  getOrgInformations,
  deleteInformation,
  updateInformation,
  createInformation,
} from "src/graphql/queries/data";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  data() {
    return {
      isMobile: getIsMobileBrowser(),
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    // 获取人员信息
    const Loading = ref(false);
    const allPeopleData = ref<any>([]);
    const currentUser = computed(getters.currentUser);
    const tableData = ref<any>([]);
    const { mutate: getOrgInformationsMutation } =
      useMutation(getOrgInformations);

    const getPeople = async () => {
      try {
        Loading.value = true;
        const {
          data: { getOrgInformations: people },
        } = await getOrgInformationsMutation();
        allPeopleData.value = people;
        tableData.value = people;
        Loading.value = false;
        console.log(tableData.value);
      } catch (error) {
        console.log("----------getPeople error");
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
        case 3:
          return root.$t("People.Operator");
        case 4:
          return root.$t("People.Finance");
        case 5:
          return root.$t("People.Distributor");
        case 6:
          return root.$t("People.DistributorAdmin");
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
      {
        value: 3,
        label: root.$t("People.Operator"),
      },
      {
        value: 4,
        label: root.$t("People.Finance"),
      },
      {
        value: 5,
        label: root.$t("People.Distributor"),
      },
      {
        value: 6,
        label: root.$t("People.DistributorAdmin"),
      },
    ];

    // 搜索人员
    const searchValue = ref<any>("");
    const handleInputSearch = () => {
      tableData.value = allPeopleData.value.filter((item: any) => {
        return item.name.includes(searchValue.value);
      });
      console.log(searchValue.value, tableData.value);
    };

    const dialogPeopleVisible = ref(false);
    const createOrEditTitle = ref<any>("");
    const dataInfo = ref<any>({
      name: "",
      content: "",
    });

    //添加人员
    const handleCreate = () => {
      createOrEditTitle.value = root.$t("People.add");
      dataInfo.value = {
        ...dataInfo.value,
        name: "",
        content: "",
      };
      dialogPeopleVisible.value = true;
    };

    // 编辑
    const userId = ref<any>("");
    const handleEdit = (index, row) => {
      createOrEditTitle.value = root.$t("People.edit");

      dataInfo.value = {
        name: row.name,
        content: row.content,
      };
      userId.value = row.id;
      console.log(userId.value);
      dialogPeopleVisible.value = true;
    };

    //提交表单
    const peopleForm = ref<any>(null);
    const peopleRules = {
      name: [
        {
          required: true,
          message: root.$t("Distributor.DistributorMessage"),
          trigger: "blur",
        },
      ],
    };
    const { mutate: createInformationMutation } =
      useMutation(createInformation);
    const { mutate: updateInformationMutation } =
      useMutation(updateInformation);
    const handleSubmitMessage = () => {
      if (peopleForm.value) {
        peopleForm.value.validate(async (valid) => {
          if (valid) {
            const information = {
              name: dataInfo.value.name,
              content: dataInfo.value.content,
            };
            try {
              if (createOrEditTitle.value == root.$t("People.add")) {
                const createRes = await createInformationMutation({
                  information: information,
                } as any);
                console.log(createRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              } else {
                const updateRes = await updateInformationMutation({
                  information: information,
                  id: userId.value,
                } as any);
                console.log(updateRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              }
              dialogPeopleVisible.value = false;
              dataInfo.value = {
                name: "",
                content: "",
              };

              console.log(dataInfo.value);
            } catch (error) {
              notify.error("资料名称已存在!");
            }
          }
        });
      }
    };

    // 删除
    const { mutate: deleteInformationMutation } =
      useMutation(deleteInformation);
    const handleDelete = async (index, row) => {
      Dialog.create({
        title: root.$t("People.confirm") as any,
        message: root.$t("DistributorSplitRatio.confirmDelete") as any,
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
        await deleteInformationMutation({ id: row.id } as any);
        getPeople();
        notify.success(root.$t("People.succeed"));
      });
    };
    const currentPage = ref(1); // 当前页
    const pageSize = ref(10); // 每页显示条数
    const handleSizeChange = (val) => {
      pageSize.value = val;
    };
    const goOff = () => {
      root.$router.go(-1); // 使用V
    };
    // 当前页改变
    const handleCurrentChange = (val) => {
      currentPage.value = val;
    };
    onMounted(() => {
      getPeople();
    });
    return {
      tableData,
      searchValue,
      handleInputSearch,
      currentPage,
      pageSize,
      handleSizeChange,
      handleCurrentChange,
      formatterTime,
      formatterRole,
      currentUser,
      roleOptions,
      dialogPeopleVisible,
      createOrEditTitle,
      dataInfo,
      peopleRules,
      peopleForm,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSubmitMessage,
      Loading,
      goOff,
    };
  },
});
</script>
<style scoped>
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
.form-input {
  background-color: #fff;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  color: #606266;
  display: inline-block;
  font-size: inherit;
  height: 40px;
  line-height: 40px;
  outline: 0;
  padding: 0 15px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  width: 150px;
}
.right-align-input ::v-deep .el-input__inner {
  text-align: right;
}
.right-aligned-input .el-input__inner {
  text-align: right;
}
.el-input__inner {
  text-align: right;
}
</style>
