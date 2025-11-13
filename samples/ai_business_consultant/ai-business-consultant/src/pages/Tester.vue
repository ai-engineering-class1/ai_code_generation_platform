<template>
  <div class="q-pa-md container">
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
        ><i slot="prefix" class="el-input__icon el-icon-search"></i
      ></el-input>
      <el-button @click="addMember" type="primary">
        {{ $t("Members.addMember") }}
      </el-button>
    </div>
    <div>
      <el-table
        :data="
          tableData.filter(
            (data) =>
              !searchValue ||
              data.name.toLowerCase().includes(searchValue.toLowerCase())
          )
        "
        style="width: 100%"
        class="mb-5"
        :show-header="false"
        :loading="Loading"
        :empty-text="$t('People.noData')"
      >
        <el-table-column
          :label="$t('People.User')"
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
                :avatarUrl="scope.row.avatarUrl"
                :name="'xxxxx'"
                class="shadow-outline-white -ml-1"
              />
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('People.action')"
          align="center"
          min-width="180%"
        >
          <template slot-scope="scope">
            <el-button
              @click="handleDelete(scope.$index, scope.row)"
              type="text"
            >
              {{ $t("Members.remove") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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
        :model="peopleConfigMessage"
        :rules="peopleRules"
        ref="peopleForm"
        label-width="80px"
        label-position="top"
      >
        <el-form-item :label="$t('People.userName')" prop="name">
          <el-input
            class="channel-input"
            v-model="peopleConfigMessage.name"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.Phone')" prop="phone">
          <el-input
            class="channel-input"
            v-model="peopleConfigMessage.phone"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.email')" prop="email">
          <el-input
            class="channel-input"
            v-model="peopleConfigMessage.email"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('People.InitialPassword')"
          prop="password"
          v-if="createOrEditTitle == $t('People.add')"
          :rules="[
            {
              required: true,
              message: $t('People.userInitialPassword'),
              trigger: 'blur',
            },
          ]"
        >
          <el-input
            class="channel-input"
            v-model="peopleConfigMessage.password"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.Authority')" prop="role">
          <el-select
            v-model="peopleConfigMessage.role"
            :placeholder="$t('People.PleaseSelect')"
            style="width: 100%"
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
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
    <el-dialog
      :title="$t('Members.addMember')"
      :close-on-click-modal="false"
      width="60%"
      :visible.sync="dialogAddFormVisible"
    >
      <div
        style="
          width: 100%;
          margin: 15px 0;
          display: flex;
          justify-content: space-between;
        "
      >
        <el-input
          v-model="searchPeopleValue"
          style="width: 200px"
          clearable
          :placeholder="$t('People.searchForName')"
          @input="handleInputSearch"
          ><i slot="prefix" class="el-input__icon el-icon-search"></i
        ></el-input>
      </div>
      <div>
        <el-table
          :data="wxUserData"
          style="width: 100%"
          class="mb-5"
          border
          ref="multipleTable"
          @selection-change="handleSelectionChange"
          :loading="Loading"
          :empty-text="$t('People.noData')"
        >
          <el-table-column type="selection" width="55"> </el-table-column>
          <el-table-column
            :label="$t('People.User')"
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
                  :avatarUrl="scope.row.avatarUrl"
                  :name="'xxxxx'"
                  class="shadow-outline-white -ml-1"
                />
                <span style="margin-left: 10px">{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="lastPayDate"
            :label="$t('People.Whethertopay')"
            align="center"
            :formatter="isPay"
            min-width="100%"
          >
          </el-table-column>
          <el-table-column
            prop="createdAt"
            :label="$t('People.Authorizationtime')"
            align="center"
            min-width="165%"
          >
            <template slot-scope="scope">
              {{
                scope.row.createdAt == null
                  ? ""
                  : formatterTime(scope.row.createdAt)
              }}
            </template>
          </el-table-column>
          <el-table-column
            prop="lastOperateDate"
            :label="$t('People.Recentconversationtime')"
            align="center"
            min-width="165%"
          >
            <template slot-scope="scope">
              {{
                scope.row.lastOperateDate == null
                  ? ""
                  : formatterTime(scope.row.lastOperateDate)
              }}
            </template>
          </el-table-column>
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
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogAddFormVisible = false">{{
          $t("profile.Cancel")
        }}</el-button>
        <el-button type="primary" @click="handleAdd">{{
          $t("profile.Confirm")
        }}</el-button>
      </div>
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
import eventBus from "../utils/eventBus";
import { getWxUsersAndCount } from "src/graphql/queries/people";
import {
  getUsers,
  deleteUser,
  updateUserInfoByAdmin,
  createUser,
} from "src/graphql/queries/people";
import {
  getLegalDocumentProject,
  updateLegalDocumentProjectTesters,
  getUserOperators,
} from "src/graphql/queries/project";
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
    const wxUserData = ref<any>([]);
    const tableData = ref<any>([]);
    const { mutate: getWxUsersMutation } = useMutation(getWxUsersAndCount);
    const { mutate: getLegalDocumentProjectMutation } = useMutation(
      getLegalDocumentProject
    );
    const { mutate: updateLegalDocumentProjectTestersMutation } = useMutation(
      updateLegalDocumentProjectTesters
    );
    const isPay = (row) => {
      if (row.lastPayDate) {
        return root.$t("People.yes");
      } else {
        return root.$t("People.no");
      }
    };
    const total = ref(0);
    const searchPeopleValue = ref<any>("");
    const getWxUser = async () => {
      try {
        Loading.value = true;
        const res = await getWxUsersMutation({
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
          name: searchPeopleValue.value,
        } as any);
        if (res) {
          wxUserData.value = res.data.getWxUsersAndCount.data;
          total.value = res.data.getWxUsersAndCount.totalCount;
          Loading.value = false;
          console.log(wxUserData.value);
        }
      } catch (error) {
        console.log("----------getPeople error");
      }
    };
    const { mutate: getUserOperatorsMutation } = useMutation(getUserOperators);
    const { mutate: getUsersMutation } = useMutation(getUsers);
    const getPeople = async () => {
      try {
        Loading.value = true;
        const {
          data: { getUsers: people },
        } = await getUsersMutation();
        allPeopleData.value = people;
        tableData.value = people;
        Loading.value = false;
        console.log(tableData.value);
      } catch (error) {
        console.log("----------getPeople error");
      }
    };
    const dialogAddFormVisible = ref(false);
    const getProjectInfo = async () => {
      const res = await getLegalDocumentProjectMutation({
        id: Number(sessionStorage.getItem("legalDocumentProjectId")),
      } as any);
      if (res) {
        tableData.value = res.data.getLegalDocumentProject.testers;
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
      let FormatTime = forateTime(row);
      return FormatTime;
    };
    const multipleSelection = ref([]);
    const handleSelectionChange = (val) => {
      multipleSelection.value = val;
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

    const dialogPeopleVisible = ref(false);
    const createOrEditTitle = ref<any>("");
    const peopleConfigMessage = ref<any>({
      name: "",
      email: "",
      phone: "",
      avatarUrl: "https://file.sflow.pro/avatar_default.png",
      role: 1,
    });

    //添加人员
    const handleCreate = () => {
      createOrEditTitle.value = root.$t("People.add");
      peopleConfigMessage.value = {
        ...peopleConfigMessage.value,
        name: "",
        email: "",
        phone: "",
        password: "",
        role: 1,
      };
      dialogPeopleVisible.value = true;
    };
    const alloperators = ref([]);

    const getoperators = async () => {
      const res = await getUserOperatorsMutation();
      if (res) {
        alloperators.value = res.data.getUserOperators;
      }
    };
    const addMember = async () => {
      getWxUser();
      dialogAddFormVisible.value = true;
    };
    const handleAdd = async () => {
      let ids = [];
      multipleSelection.value.forEach((item) => {
        ids.push((item as any).id as never);
      });

      tableData.value.forEach((item) => {
        ids.push((item as any).id as never);
      });
      const res = await updateLegalDocumentProjectTestersMutation({
        id: Number(sessionStorage.getItem("legalDocumentProjectId")),
        testerIds: ids,
      } as any);
      if (res) {
        dialogAddFormVisible.value = false;
        getProjectInfo();
        notify.success(root.$t("People.succeed"));
      }
    };
    // 编辑
    const userId = ref<any>("");
    const handleEdit = (index, row) => {
      createOrEditTitle.value = root.$t("People.edit");
      peopleConfigMessage.value = {
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        role: row.role,
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
    };
    const { mutate: createUserMutation } = useMutation(createUser);
    const { mutate: updateUserInfoByAdminMutation } = useMutation(
      updateUserInfoByAdmin
    );
    const handleSubmitMessage = () => {
      if (peopleForm.value) {
        peopleForm.value.validate(async (valid) => {
          if (valid) {
            if (!validator.isEmail(peopleConfigMessage.value.email)) {
              notify.error(root.$t("People.EmailWrong"));
              return;
            }
            if (!validator.isMobile(peopleConfigMessage.value.phone)) {
              notify.error(root.$t("People.PhoneWrong"));
              return;
            }
            try {
              if (createOrEditTitle.value == root.$t("People.add")) {
                const createRes = await createUserMutation({
                  user: peopleConfigMessage.value,
                } as any);
                console.log(createRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              } else {
                const updateRes = await updateUserInfoByAdminMutation({
                  user: peopleConfigMessage.value,
                  userId: userId.value,
                } as any);
                console.log(updateRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              }
              dialogPeopleVisible.value = false;
              peopleConfigMessage.value = {
                name: "",
                email: "",
                phone: "",
                avatarUrl: "https://file.sflow.pro/avatar_default.png",
              };
              console.log(peopleConfigMessage.value);
            } catch (error) {
              notify.error(error.message);
            }
          }
        });
      }
    };

    // 删除
    const { mutate: deleteUserMutation } = useMutation(deleteUser);
    const handleDelete = async (index, row) => {
      Dialog.create({
        title: root.$t("People.confirm") as any,
        message: root.$t("People.confirmMessage") as any,
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
        let ids = [];
        tableData.value = tableData.value.filter((item) => item.id !== row.id);

        tableData.value.forEach((item) => {
          ids.push((item as any).id as never);
        });
        const res = await updateLegalDocumentProjectTestersMutation({
          id: Number(sessionStorage.getItem("legalDocumentProjectId")),
          testerIds: ids,
        } as any);
        if (res) {
          dialogAddFormVisible.value = false;
          getProjectInfo();
          notify.success(root.$t("People.succeed"));
        }
      });
    };
    const currentUser = computed(getters.currentUser);
    const handleInputSearch = () => {
      getWxUser();
    };
    const currentPage = ref(1); // 当前页
    const pageSize = ref(10); // 每页显示条数
    const handleSizeChange = (val) => {
      pageSize.value = val;
      getWxUser();
    };
    // 当前页改变
    const handleCurrentChange = (val) => {
      currentPage.value = val;
      getWxUser();
    };

    onMounted(() => {
      //   eventBus.$on('switchProject', () => {
      //     getProjectInfo()
      //   })
      //getProjectInfo()
      eventBus.$on("switchNewProject", (info) => {
        tableData.value = info.testers;
      });
    });
    return {
      tableData,
      total,
      searchPeopleValue,
      wxUserData,
      searchValue: "",
      currentUser,
      search: "",
      handleAdd,
      isPay,
      dialogAddFormVisible,
      handleInputSearch,
      alloperators,
      addMember,
      getoperators,
      currentPage,
      handleSelectionChange,
      multipleSelection,
      pageSize,
      handleSizeChange,
      handleCurrentChange,
      formatterTime,
      formatterRole,
      roleOptions,
      dialogPeopleVisible,
      createOrEditTitle,
      peopleConfigMessage,
      peopleRules,
      peopleForm,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSubmitMessage,
      Loading,
    };
  },
});
</script>
<style scoped></style>
