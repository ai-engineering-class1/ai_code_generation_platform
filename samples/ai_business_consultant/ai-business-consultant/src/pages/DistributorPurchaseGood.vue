<template>
  <div class="w-full h-full px-12">
    <div>
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
      </div>
      <div>
        <el-table
          :data="
            TabelDate.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )
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
                  : $t('Distributor.legaladvice')
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
          <el-table-column
            prop="price"
            :label="$t('goods.price')"
            align="center"
          >
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
          <!-- <el-table-column
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
          </el-table-column> -->
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
    </div>
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
import {
  getSellDistributorCommoditys,
  getAllOrganizations,
  getCommoditysFromDistributor,
} from "src/graphql/queries/distributor";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
import dayjs from "dayjs";
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
    const loading = ref(false);
    const TabelDate = ref([]);
    const allTabelDate = ref([]);
    const currentUser = computed(getters.currentUser);
    const { mutate: getSellDistributorCommoditysMutation } = useMutation(
      getSellDistributorCommoditys
    );
    const { mutate: getAllOrganizationsMutation } =
      useMutation(getAllOrganizations);
    const { mutate: getCommoditysFromDistributorMutation } = useMutation(
      getCommoditysFromDistributor
    );
    const getStatus = (status) => {
      switch (status) {
        case "Release":
          return root.$t("Distributor.Officiallyreleased");
        case "Testing":
          return root.$t("Distributor.Internaltesting");
        case "Offline":
          return root.$t("Distributor.Offline");
      }
    };
    const getDistributorBuyGoods = async () => {
      try {
        loading.value = true;
        const {
          data: { getCommoditysFromDistributor: BuyGoods },
        } = await getCommoditysFromDistributorMutation({
          orgId: Number(currentUser.value.organizationId),
        });
        BuyGoods.forEach((element) => {
          element.price = element.price / 100;
          element.marketPrice = element.marketPrice / 100;
        });
        allTabelDate.value = BuyGoods;
        TabelDate.value = BuyGoods;
        loading.value = false;
        console.log(TabelDate.value);
      } catch (error) {
        console.log("----------getBuyGoods error");
      }
    };
    const getAllOrgDistributors = async () => {
      try {
        const {
          data: { getAllOrganizations: distributors },
        } = await getAllOrganizationsMutation();
        // console.log("dddd", distributors);
      } catch (error) {
        console.log("----------getDistributors error");
      }
    };
    // 时间戳
    const forateTime = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    const formatterTime = (row) => {
      let FormatTime = forateTime(row.createdAt);
      return FormatTime;
    };
    // 搜索人员
    const searchValue = ref("");
    const handleInputSearch = () => {
      TabelDate.value = allTabelDate.value.filter((item) => {
        return item.name.includes(searchValue.value);
      });
      console.log(searchValue.value, TabelDate.value);
    };

    onMounted(() => {
      getDistributorBuyGoods();
      getAllOrgDistributors();
    });
    return {
      handleInputSearch,
      searchValue,
      currentUser,
      allTabelDate,
      TabelDate,
      loading,
      getStatus,
      formatterTime,
      forateTime,
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

<style>
</style>
