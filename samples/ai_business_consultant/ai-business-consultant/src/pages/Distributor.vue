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
      <div>
        <el-button
          @click="gotoDistributorDetail"
          v-if="currentUser.role == 1"
          type="primary"
        >
          {{ $t("mainlayout.DistributorSplitRatios") }}
        </el-button>
        <el-button
          @click="handleCreate"
          v-if="currentUser.role == 1"
          type="primary"
        >
          {{ $t("Distributor.addDistributor") }}
        </el-button>
      </div>
    </div>
    <div>
      <el-table
        :data="
          tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        "
        style="width: 100%"
        class="mb-5"
        :loading="Loading"
        :empty-text="$t('People.noData')"
      >
        <!-- <el-table-column type="expand">
          <template slot-scope="props">
            <el-table :data="props.row.t2Distributors"
                      style="width: 100%"
                      class="mx-10 my-3"
                      border
                      :cell-style="{fontSize: '14px', backgroundColor: '#F8F8F8'}"
                      :header-cell-style="{fontSize: '14px', backgroundColor: '#F8F8F8'}"
                      default-expand-all
                      :loading="Loading"
                      :empty-text="$t('People.noData')"><el-table-column :label="$t('Distributor.name')"
                               align="center"
                               >
                <template slot-scope="scope">
                  <div style="width:100%;display:flex;align-items: center;justify-content: left;margin-left:10px;">

                    <span style="margin-left: 10px;">{{ scope.row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="desc"
                               :label="$t('Distributor.describe')"
                               align="center"
                               >
              </el-table-column>
              <el-table-column prop="username"
                               :label="$t('register.username')"
                               align="center"
                               >
                <template slot-scope="scope">
                  {{ scope.row.user.name }}
                </template>

              </el-table-column>
              <el-table-column prop="t1DistributorId"
                               :label="$t('Distributor.grade')"
                               align="center"
                               :formatter="formatterTime"
                               min-width="165%">
                二级
              </el-table-column>
              <el-table-column prop="createdAt"
                               :label="$t('People.createdAt')"
                               align="center"
                               :formatter="formatterTime"
                               min-width="165%">
              </el-table-column>
              <el-table-column prop="role"
                               :label="$t('Distributor.wxQrCode')"
                               align="center"
                               >
                <template slot-scope="scope">
                  <el-image style="width: 100px; height: 100px"
                            :src="'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+scope.row.wxQrCode"
                            ></el-image>
                </template>
              </el-table-column>
              <el-table-column prop="role"
                               :label="$t('Distributor.t2QrCode')"
                               align="center"
                               >
                <template slot-scope="scope">
                  <el-image style="width: 100px; height: 100px"
                            v-if="scope.row.t2QrCode!=null"
                            :src="scope.row.t2QrCode"
                            ></el-image>
                </template>
              </el-table-column>
              <el-table-column :label="$t('People.action')"
                               align="center"
                               min-width="180%"
                               v-if="currentUser.role==1">
                <template slot-scope="scope">
                  <el-button @click="handleEdit(scope.$index, scope.row,'child')"
                             type="text">
                    {{ $t("People.edit") }}
                  </el-button>
                  <el-button @click="handleDelete(scope.$index, scope.row)"
                             type="text">
                    {{ $t("People.delete") }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column> -->
        <el-table-column :label="$t('Distributor.name')" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="desc"
          :label="$t('Distributor.describe')"
          align="center"
        >
        </el-table-column>
        <el-table-column :label="$t('register.username')" align="center">
          <template slot-scope="scope">
            {{ scope.row.user.name }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="
            currentUser.role != 5 ||
            currentUser.distributor.t1DistributorId == null
          "
          :label="$t('Distributor.grade')"
          align="center"
        >
          <template slot-scope="scope">
            {{ scope.row.t1Distributor ? scope.row.t1Distributor.name : "" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('People.createdAt')"
          align="center"
          :formatter="formatterTime"
        >
        </el-table-column>
        <el-table-column label="Url" show-overflow-tooltip align="center">
          <template slot-scope="scope">
            <i
              class="el-icon-document-copy ml-3 cursor-pointer"
              @click="
                handlecopy(
                  'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' +
                    scope.row.wxQrCode
                )
              "
            ></i>
            {{
              "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=" +
              scope.row.wxQrCode
            }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('Distributor.wxQrCode')" align="center">
          <template slot-scope="scope">
            <el-image
              style="width: 100px; height: 100px"
              :src="
                'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' +
                scope.row.wxQrCode
              "
            ></el-image>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Distributor.t2QrCode')"
          v-if="
            currentUser.role != 5 ||
            currentUser.distributor.t1DistributorId == null
          "
          align="center"
        >
          <template slot-scope="scope">
            <el-image
              style="width: 100px; height: 100px"
              v-if="scope.row.t2QrCode != null"
              :src="scope.row.t2QrCode"
            ></el-image>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('People.action')"
          align="center"
          v-if="currentUser.role == 1"
        >
          <template slot-scope="scope">
            <el-button
              @click="handleEdit(scope.$index, scope.row, 'parent')"
              type="text"
            >
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
        :rules="peopleRules"
        ref="peopleForm"
        label-width="180px"
        label-position="left"
      >
        <el-form-item :label="$t('Distributor.name')" prop="name">
          <el-input
            class="channel-input"
            v-model="distributorInfo.name"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('Distributor.describe')" prop="describe">
          <el-input
            class="channel-input"
            v-model="distributorInfo.desc"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.username')" prop="username">
          <el-input
            class="channel-input"
            :disabled="isEidt"
            v-model="distributorInfo.username"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.email')" prop="email">
          <el-input
            class="channel-input"
            :disabled="isEidt"
            v-model="distributorInfo.email"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.phoneNumber')" prop="phone">
          <el-input
            class="channel-input"
            v-model="distributorInfo.phone"
            :validate-event="false"
            :disabled="isEidt"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('register.password')"
          v-if="!isEidt"
          prop="password"
        >
          <el-input
            class="channel-input"
            v-model="distributorInfo.password"
            :validate-event="false"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="$t('Distributor.t1SplitRatio')"
          v-if="distributorInfo.t2QrCode || !isEidt"
          prop="distributorSplitRatioId"
        >
          <el-select
            clearable
            v-model="distributorInfo.distributorSplitRatioId"
          >
            <el-option
              v-for="item in SplitRatios"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t('Distributor.t2SplitRatio')"
          v-if="distributorInfo.t2QrCode || !isEidt"
          prop="distributorSplitRatio2Id"
        >
          <el-select
            clearable
            v-model="distributorInfo.distributorSplitRatio2Id"
          >
            <el-option
              v-for="item in SplitRatios"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t('Distributor.t3SplitRatio')"
          v-if="distributorInfo.t2QrCode || !isEidt"
          prop="distributorSplitRatio3Id"
        >
          <el-select
            v-model="distributorInfo.distributorSplitRatio3Id"
            clearable
          >
            <el-option
              v-for="item in SplitRatios"
              :key="item.id"
              :label="item.name"
              :value="item.id"
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
import { Dialog, copyToClipboard } from "quasar";
import {
  getOrgDistributors,
  deleteDistributor,
  updateDistributor,
  createDistributor,
} from "src/graphql/queries/distributor";
import { getOrgDistributorSplitRatios } from "src/graphql/queries/distributorSplitRatios";
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
    const SplitRatios = ref([]);
    const getSplitRatios = async () => {
      try {
        const {
          data: { getOrgDistributorSplitRatios: result },
        } = await getOrgDistributorSplitRatiosMutation();
        SplitRatios.value = result;
      } catch (error) {
        console.log("----------getPeople error");
      }
    };
    const isT2 = ref(false);
    const handlecopy = (item) => {
      copyToClipboard(item);
      notify.success(root.$t("flow.CopySuccess"));
    };
    const { mutate: getOrgDistributorsMutation } =
      useMutation(getOrgDistributors);
    const getPeople = async () => {
      try {
        Loading.value = true;
        const {
          data: { getOrgDistributors: result },
        } = await getOrgDistributorsMutation();
        allPeopleData.value = result;
        tableData.value = result;

        if (currentUser.value.role == 5) {
          if (currentUser.value.distributor) {
            if (currentUser.value.distributor.t1DistributorId) {
              isT2.value = true;
            }
            // tableData.value.push(result[0].t1Distributor as never)
          }
          if (result[0].t2Distributors != null) {
            result[0].t2Distributors.forEach((element) => {
              tableData.value.push(element as never);
              tableData.value.forEach((element) => {
                if (element.t1DistributorId != null) {
                  let t1Distributor = {
                    name: result[0].name,
                  };
                  element.t1Distributor = t1Distributor;
                }
              });
            });
          }
        }
        console.log(tableData.value);
        Loading.value = false;
      } catch (error) {
        console.log("----------getPeople error");
      }
    };
    const gotoDistributorDetail = () => {
      root.$router.push("/distributorSplitRatios");
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
      distributorSplitRatioId: "",
      distributorSplitRatio2Id: "",
      distributorSplitRatio3Id: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      t2QrCode: "",
    });

    //添加人员
    const handleCreate = () => {
      isEidt.value = false;
      isEditChild.value = false;
      createOrEditTitle.value = root.$t("People.add");
      distributorInfo.value = {
        ...distributorInfo.value,
        name: "",
        desc: "",
        distributorSplitRatioId: "",
        distributorSplitRatio2Id: "",
        distributorSplitRatio3Id: "",
        username: "",
        email: "",
        phone: "",
        password: "",
      };
      dialogPeopleVisible.value = true;
    };

    // 编辑
    const userId = ref<any>("");
    const isEditChild = ref(false);
    const isEidt = ref(false);
    const handleEdit = (index, row, type) => {
      isEidt.value = true;
      type == "child"
        ? (isEditChild.value = true)
        : (isEditChild.value = false);
      createOrEditTitle.value = root.$t("People.edit");
      distributorInfo.value = {
        name: row.name,
        desc: row.desc,
        username: row.user.name,
        email: row.user.email,
        phone: row.user.phone,
        distributorSplitRatioId: row.distributorSplitRatioId,
        distributorSplitRatio2Id: row.distributorSplitRatio2Id,
        distributorSplitRatio3Id: row.distributorSplitRatio3Id,
        t2QrCode: row.t2QrCode,
      };
      userId.value = row.id;
      console.log(userId.value);
      dialogPeopleVisible.value = true;
    };

    const peopleForm = ref<any>(null);
    const peopleRules = {
      name: [
        {
          required: true,
          message: root.$t("Distributor.DistributorMessage"),
          trigger: "blur",
        },
      ],
      username: [
        {
          required: true,
          message: root.$t("register.invaildName"),
          trigger: "blur",
        },
      ],
      email: [
        {
          required: true,
          message: root.$t("register.emailRequire"),
          trigger: "blur",
        },
      ],
      phone: [
        {
          required: true,
          message: root.$t("register.PhoneRequire"),
          trigger: "blur",
        },
      ],
      password: [
        {
          required: isEidt ? false : true,
          message: root.$t("register.EnterNewPassword"),
          trigger: "blur",
        },
      ],
    };
    const { mutate: createDistributorMutation } =
      useMutation(createDistributor);
    const { mutate: updateDistributorMutation } =
      useMutation(updateDistributor);
    const handleSubmitMessage = () => {
      if (peopleForm.value) {
        peopleForm.value.validate(async (valid) => {
          if (valid) {
            try {
              if (Number(distributorInfo.value.distributorSplitRatioId) == 0) {
                notify.error("请选择一级发展用户的分成比例");
                return false;
              }
              if (Number(distributorInfo.value.distributorSplitRatio2Id) == 0) {
                notify.error("请选择二级发展用户的分成比例");
                return false;
              }
              if (Number(distributorInfo.value.distributorSplitRatio3Id) == 0) {
                notify.error("请选择二级发展给一级分成比例");
                return false;
              }
              let info = {
                name: distributorInfo.value.name,
                desc: distributorInfo.value.desc,
                distributorSplitRatioId:
                  Number(distributorInfo.value.distributorSplitRatioId) == 0
                    ? null
                    : Number(distributorInfo.value.distributorSplitRatioId),
                distributorSplitRatio2Id:
                  Number(distributorInfo.value.distributorSplitRatio2Id) == 0
                    ? null
                    : Number(distributorInfo.value.distributorSplitRatio2Id),
                distributorSplitRatio3Id:
                  Number(distributorInfo.value.distributorSplitRatio3Id) == 0
                    ? null
                    : Number(distributorInfo.value.distributorSplitRatio3Id),
              };
              let user = {
                name: distributorInfo.value.username,
                email: distributorInfo.value.email,
                phone: distributorInfo.value.phone,
                password: distributorInfo.value.password,
                avatarUrl: "https://file.sflow.pro/avatar_default.png",
              };
              if (createOrEditTitle.value == root.$t("People.add")) {
                const createRes = await createDistributorMutation({
                  user: user,
                  distributor: info,
                } as any);
                console.log(createRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              } else {
                const updateRes = await updateDistributorMutation({
                  distributor: info,
                  id: userId.value,
                } as any);
                console.log(updateRes);
                getPeople();
                notify.success(root.$t("People.succeed"));
              }
              dialogPeopleVisible.value = false;
              distributorInfo.value = {
                name: "",
                desc: "",
              };
              console.log(distributorInfo.value);
            } catch (error) {
              notify.error(error.message);
            }
          }
        });
      }
    };

    // 删除
    const { mutate: deleteDistributorMutation } =
      useMutation(deleteDistributor);
    const handleDelete = async (index, row) => {
      Dialog.create({
        title: root.$t("People.confirm") as any,
        message: root.$t("Distributor.confirmDeleteDistributor") as any,
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
        await deleteDistributorMutation({ id: row.id } as any);
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
      getSplitRatios();
      getPeople();
    });
    return {
      tableData,
      searchValue,
      isEditChild,
      handleInputSearch,
      currentPage,
      pageSize,
      getSplitRatios,
      SplitRatios,
      handleSizeChange,
      handleCurrentChange,
      formatterTime,
      formatterRole,
      currentUser,
      roleOptions,
      dialogPeopleVisible,
      handlecopy,
      createOrEditTitle,
      distributorInfo,
      peopleRules,
      gotoDistributorDetail,
      peopleForm,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSubmitMessage,
      Loading,
      isEidt,
      isT2,
    };
  },
});
</script>
<style scoped></style>
