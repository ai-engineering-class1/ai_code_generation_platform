<template>
  <div class="w-full h-full px-12 ">

    <div style="width: 100%;margin:15px 0;display:flex;justify-content: space-between;">
      <el-input v-model="searchValue"
                style="width: 200px;"
                :placeholder="$t('People.searchForName')"
                @input="handleInputSearch"><i slot="prefix"
           class="el-input__icon el-icon-search"></i></el-input>
      <el-button @click="handleCreate"
                 v-if="currentUser.role==1"
                 type="primary">
        {{ $t('People.addPeople') }}
      </el-button>
    </div>
    <div>
      <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
                style="width: 100%"
                class="mb-5"
                border
                :loading="Loading"
                :empty-text="$t('People.noData')">
        <el-table-column :label="$t('People.User')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            <div style="width:100%;display:flex;align-items: center;justify-content: left;margin-left:10px;"">
              <j-avatar :size="
                 28"
                 :avatarUrl="scope.row.avatarUrl"
                 :name="'xxxxx'"
                 class="shadow-outline-white -ml-1" />
            <span style="margin-left: 10px;">{{ scope.row.name }}</span>
    </div>
</template>
</el-table-column>
<el-table-column prop="desc" :label="$t('register.des')" align="center" min-width="100%">
</el-table-column>
<el-table-column prop="phone" :label="$t('People.Phone')" align="center" min-width="100%">
</el-table-column>
<el-table-column prop="realName" :label="$t('People.realName')" align="center" min-width="100%">
</el-table-column>
<el-table-column prop="createdAt" :label="$t('People.createdAt')" align="center" :formatter="formatterTime"
    min-width="165%">
</el-table-column>
<el-table-column prop="role" :label="$t('People.Authority')" align="center" :formatter="formatterRole" min-width="100%">
</el-table-column>
<el-table-column :label="$t('People.action')" align="center" min-width="180%"    v-if="currentUser.role==1">
    <template slot-scope="scope">
  <el-button @click="handleEdit(scope.$index, scope.row)" type="text">
    {{ $t("People.edit") }}
  </el-button>
  <el-button @click="handleDelete(scope.$index, scope.row)" type="text">
    {{ $t("People.delete") }}
  </el-button>
</template>
</el-table-column>
</el-table>
<el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
    :page-sizes="[5, 10, 20, 50]" :page-size="pageSize" :total="tableData.length"
    layout="total, sizes, prev, pager, next, jumper">
</el-pagination>
</div>

<!-- 编辑添加弹窗 -->
<el-dialog :close-on-click-modal="false" :visible.sync="dialogPeopleVisible" :title="createOrEditTitle"
    :width="isMobile ? 'calc(100vw - 54px)' : 'calc(55% - 260px)'" :append-to-body="true" class="channel-dialog">
    <el-form :model="peopleConfigMessage" :rules="peopleRules" ref="peopleForm" label-width="80px" label-position="top">
        <el-form-item :label="$t('People.userName')" prop="name">
            <el-input class="channel-input" v-model="peopleConfigMessage.name" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.des')" prop="desc">
            <el-input class="channel-input" v-model="peopleConfigMessage.desc" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.Phone')" prop="phone">
            <el-input class="channel-input" v-model="peopleConfigMessage.phone" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.email')" prop="email">
            <el-input class="channel-input" v-model="peopleConfigMessage.email" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('People.InitialPassword')" prop="password" v-if="createOrEditTitle == $t('People.add')"
            :rules="[
                { required: true, message: $t('People.userInitialPassword'), trigger: 'blur' },
            ]">
            <el-input class="channel-input" v-model="peopleConfigMessage.password" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
          <el-form-item :label="$t('People.resetPassword')" prop="password" v-if="createOrEditTitle != $t('People.add')"
           >
            <el-input class="channel-input" v-model="resetPassword" :validate-event="false"
                autocomplete="off"></el-input>
        </el-form-item>
         <el-form-item :label="$t('People.weixinUser')" prop="password"
           >
             <el-select  clearable filterable v-model="peopleConfigMessage.wxUserId" :placeholder="$t('People.PleaseSelect')" style="width:100%">
                <el-option v-for="item in allWeixinUsers" :key="item.id" :label="item.name" :value="item.id">

                      <j-avatar :size="28"
                        :avatarUrl="item.avatarUrl"
                        :name="'xxxxx'"
                        class="shadow-outline-white -ml-1" />
              <span  style="margin-left: 20px; padding-bottom: 5px; ">{{ item.name }}</span>

                </el-option>
            </el-select>
        </el-form-item>
        <el-form-item :label="$t('People.Authority')" prop="role" >
            <el-select v-model="peopleConfigMessage.role" :placeholder="$t('People.PleaseSelect')" style="width:100%">
                <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
        </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
        <el-button @click="dialogPeopleVisible = false">{{ $t('People.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitMessage">{{ $t('People.confirm') }}</el-button>
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
import { getWxUsers } from "src/graphql/queries/people";
import {
  getUsers,
  deleteUser,
  updateUserInfoByAdmin,
  createUser,
} from "src/graphql/queries/people";
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
    const { mutate: getUsersMutation } = useMutation(getUsers);
    const { mutate: getWxUsersMutation } = useMutation(getWxUsers);
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
    const allWeixinUsers = ref<any>([]);
    const getWeixinUsers = async () => {
      try {
        const {
          data: { getWxUsers: users },
        } = await getWxUsersMutation();
        allWeixinUsers.value = users;
      } catch (error) {
        console.log("----------getWeixinUsers error");
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
    const peopleConfigMessage = ref<any>({
      name: "",
      email: "",
      phone: "",
      avatarUrl: "https://file.sflow.pro/avatar_default.png",
      role: 1,
      wxUserId: "",
      desc: "",
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
        desc: "",
        wxUserId: "",
      };
      dialogPeopleVisible.value = true;
    };

    // 编辑
    const userId = ref<any>("");
    const handleEdit = (index, row) => {
      createOrEditTitle.value = root.$t("People.edit");
      resetPassword.value = "";
      peopleConfigMessage.value = {
        name: row.name,
        email: row.email,
        wxUserId: row.wxUserId,
        phone: row.phone,
        desc: row.desc,
        avatarUrl: row.avatarUrl,
        role: row.role,
      };
      userId.value = row.id;
      console.log(row.wxUserId);
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
    const resetPassword = ref("");
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
                peopleConfigMessage.value.wxUserId =
                  peopleConfigMessage.value.wxUserId == ""
                    ? null
                    : peopleConfigMessage.value.wxUserId;
                const createRes = await createUserMutation({
                  user: peopleConfigMessage.value,
                } as any);
                console.log(createRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              } else {
                if (resetPassword.value) {
                  let peopleInfo = {
                    name: peopleConfigMessage.value.name,
                    email: peopleConfigMessage.value.email,
                    phone: peopleConfigMessage.value.phone,
                    desc: peopleConfigMessage.value.desc,
                    avatarUrl: peopleConfigMessage.value.avatarUrl,
                    role: peopleConfigMessage.value.role,
                    wxUserId:
                      peopleConfigMessage.value.wxUserId == ""
                        ? null
                        : peopleConfigMessage.value.wxUserId,
                    password: resetPassword.value,
                  };
                  const updateRes = await updateUserInfoByAdminMutation({
                    user: peopleInfo,
                    userId: userId.value,
                  } as any);
                  console.log(updateRes);
                } else {
                  peopleConfigMessage.value.wxUserId =
                    peopleConfigMessage.value.wxUserId == ""
                      ? null
                      : peopleConfigMessage.value.wxUserId;
                  const updateRes = await updateUserInfoByAdminMutation({
                    user: peopleConfigMessage.value,
                    userId: userId.value,
                  } as any);
                  console.log(updateRes);
                }

                getPeople();
                notify.success(root.$t("People.succeed"));
              }
              dialogPeopleVisible.value = false;
              peopleConfigMessage.value = {
                name: "",
                email: "",
                phone: "",
                desc: "",
                wxUserId: "",
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
        notify.success(root.$t("People.succeed"));
        await deleteUserMutation({ userId: row.id } as any);
        getPeople();
        notify.success(root.$t("People.succeed"));
      });
    };
    const currentPage = ref(1); // 当前页
    const pageSize = ref(10); // 每页显示条数
    const handleSizeChange = (val) => {
      pageSize.value = val;
    };
    // 当前页改变
    const handleCurrentChange = (val) => {
      currentPage.value = val;
    };
    onMounted(() => {
      getPeople();
      getWeixinUsers();
    });
    return {
      tableData,
      searchValue,
      handleInputSearch,
      currentPage,
      resetPassword,
      pageSize,
      handleSizeChange,
      handleCurrentChange,
      formatterTime,
      formatterRole,
      currentUser,
      roleOptions,
      allWeixinUsers,
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
