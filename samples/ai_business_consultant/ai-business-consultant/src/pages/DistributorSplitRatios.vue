<template>
  <div class="w-full h-full px-12">
    <div class="mx-3 my-3 cursor-pointer items-center flex" @click="goOff()">
      <img style="float: left; width: 22px" src="../assets/img/return.png" />
      <span> {{ $t("mainlayout.DistributorSplitRatios") }}</span>
    </div>
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
          :label="$t('DistributorSplitRatio.name')"
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
          prop="desc"
          :label="$t('DistributorSplitRatio.divideinto')"
          align="center"
          min-width="130%"
        >
          <template slot-scope="scope1">
            <el-table
              :data="JSON.parse(scope1.row.ratioJson)"
              style="width: 100%"
              class="mb-5"
              border
              :loading="Loading"
              :empty-text="$t('People.noData')"
            >
              <el-table-column label="金额" align="center" min-width="100%">
                <template slot-scope="scope">
                  <span style="margin-left: 10px">≥{{ scope.row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="分成" align="center" min-width="100%">
                <template slot-scope="scope">
                  <span style="margin-left: 10px"
                    >{{ scope.row.splitRatio }}%</span
                  >
                </template>
              </el-table-column>
            </el-table>
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
        :model="distributorInfo"
        ref="peopleForm"
        label-width="80px"
        label-position="top"
      >
        <el-form-item :label="$t('DistributorSplitRatio.name')" prop="name">
          <el-input
            class="channel-input"
            v-model="distributorInfo.name"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('DistributorSplitRatio.divideinto')"
          prop="describe"
        >
          <div class="mt-3 mb-3">
            <!-- <label>{{$t('ActionTransformer.parameter')}}</label><label style="color:red">*</label> -->
            <q-btn
              round
              @click="addFormData"
              color="primary"
              size="small"
              class="ml-2"
              icon="add"
            />
            <div class="contact-form-part">
              <div v-for="(field, index) in formData" class="mt-3" :key="index">
                <div class="row">
                  <!-- <span class="require-icon"
                    v-show="field.is_required">*</span> -->
                  <span class="ml-2 mr-2">≥</span>
                  <el-input
                    style="width: 150px"
                    v-model="field.amount"
                    autocomplete="off"
                  ></el-input>
                  <span class="ml-2 mr-2">分成</span>
                  <el-input
                    style="width: 150px; text-align: right"
                    class="ml-2 mr-2 right-align-input"
                    v-model="field.splitRatio"
                    autocomplete="off"
                  ></el-input>
                  %
                  <span class="form-del" @click="formDel(index)">{{
                    $t("action.delete")
                  }}</span>
                </div>
              </div>
            </div>
          </div>
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
  getOrgDistributorSplitRatios,
  deleteDistributorSplitRatio,
  updateDistributorSplitRatio,
  createDistributorSplitRatio,
} from "src/graphql/queries/distributorSplitRatios";
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
    const { mutate: getOrgDistributorSplitRatiosMutation } = useMutation(
      getOrgDistributorSplitRatios
    );
    const addFormData = () => {
      formData.value.push({
        id: formData.value.length + 1 + "",
        amount: "",
        splitRatio: "",
        type: "textarea",
      } as never);
    };

    const formDel = (index) => {
      formData.value.splice(index, 1);
    };
    const formData = ref([]);
    const getPeople = async () => {
      try {
        Loading.value = true;
        const {
          data: { getOrgDistributorSplitRatios: people },
        } = await getOrgDistributorSplitRatiosMutation();
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
    const distributorInfo = ref<any>({
      name: "",
      desc: "",
    });

    //添加人员
    const handleCreate = () => {
      createOrEditTitle.value = root.$t("People.add");
      distributorInfo.value = {
        ...distributorInfo.value,
        name: "",
        desc: "",
      };
      dialogPeopleVisible.value = true;
    };

    // 编辑
    const userId = ref<any>("");
    const handleEdit = (index, row) => {
      createOrEditTitle.value = root.$t("People.edit");

      formData.value = JSON.parse(row.ratioJson);

      distributorInfo.value = {
        name: row.name,
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
    const { mutate: createDistributorSplitRatioMutation } = useMutation(
      createDistributorSplitRatio
    );
    const { mutate: updateDistributorSplitRatioMutation } = useMutation(
      updateDistributorSplitRatio
    );
    const handleSubmitMessage = () => {
      if (peopleForm.value) {
        peopleForm.value.validate(async (valid) => {
          if (valid) {
            let ratio = [];
            formData.value.forEach((element) => {
              let item = {
                amount: (element as any).amount,
                splitRatio: (element as any).splitRatio,
              };
              ratio.push(item as never);
            });
            const distributorSplitRatio = {
              name: distributorInfo.value.name,
              ratioJson: JSON.stringify(ratio),
            };
            try {
              if (createOrEditTitle.value == root.$t("People.add")) {
                const createRes = await createDistributorSplitRatioMutation({
                  distributorSplitRatio: distributorSplitRatio,
                } as any);
                console.log(createRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              } else {
                const updateRes = await updateDistributorSplitRatioMutation({
                  distributorSplitRatio: distributorSplitRatio,
                  id: userId.value,
                } as any);
                console.log(updateRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              }
              dialogPeopleVisible.value = false;
              distributorInfo.value = {
                name: "",
              };
              formData.value = [];
              console.log(distributorInfo.value);
            } catch (error) {
              notify.error(error.message);
            }
          }
        });
      }
    };

    // 删除
    const { mutate: deleteDistributorSplitRatioMutation } = useMutation(
      deleteDistributorSplitRatio
    );
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
        await deleteDistributorSplitRatioMutation({ id: row.id } as any);
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
      addFormData,
      formData,
      formDel,
      handleSizeChange,
      handleCurrentChange,
      formatterTime,
      formatterRole,
      currentUser,
      roleOptions,
      dialogPeopleVisible,
      createOrEditTitle,
      distributorInfo,
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
