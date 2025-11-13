<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-white">
        <q-btn
          flat
          dense
          round
          color="black"
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title
          style="
            font-size: 18px;
            font-family: Microsoft YaHei;
            font-weight: bold;
            color: #333333;

            margin-left: 20px;
          "
        >
          <div>{{ $t("app.name") }}</div>
        </q-toolbar-title>

        <q-btn-dropdown
          text-color="black"
          :label="$t('language.language')"
          unelevated
          dense
          class="ml-3"
          dropdown-icon="expand_more"
          v-if="!isMobile"
          no-caps
        >
          <q-list>
            <q-separator />
            <q-item clickable v-close-popup @click="ChangeLanguage('zh-cn')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/zh-CN.svg"
                />
              </q-item-section>
              <q-item-section> {{ $t("language.Chinese") }} </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('en-us')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/en-us.svg"
                />
              </q-item-section>
              <q-item-section> {{ $t("language.English") }} </q-item-section>
            </q-item>

            <!-- <q-item clickable v-close-popup @click="ChangeLanguage('JA')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/ja.svg"
                />
              </q-item-section>
              <q-item-section> Japan </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('KO')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/ko.svg"
                />
              </q-item-section>
              <q-item-section> Korean </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('AR')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/ar.svg"
                />
              </q-item-section>
              <q-item-section> Arabic </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('DE')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/de.svg"
                />
              </q-item-section>
              <q-item-section> German </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('ES')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/es.svg"
                />
              </q-item-section>
              <q-item-section>Spanish </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('FR')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/fr.svg"
                />
              </q-item-section>
              <q-item-section>French </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('IT')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/it.svg"
                />
              </q-item-section>
              <q-item-section>Italian </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('IW')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/iw.svg"
                />
              </q-item-section>
              <q-item-section>Switzerland </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('LT')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/lt.svg"
                />
              </q-item-section>
              <q-item-section>Lithuanian</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('NL')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/nl.svg"
                />
              </q-item-section>
              <q-item-section>Dutch</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('PT')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/pt.svg"
                />
              </q-item-section>
              <q-item-section>Portuguese </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('RU')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/ru.svg"
                />
              </q-item-section>
              <q-item-section>Russian </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('SV')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/sv.svg"
                />
              </q-item-section>
              <q-item-section>Swedish </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('TR')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/tr.svg"
                />
              </q-item-section>
              <q-item-section>Turkish </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('VI')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/vi.svg"
                />
              </q-item-section>
              <q-item-section>Vietnamese </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="ChangeLanguage('zh-TW')">
              <q-item-section avatar>
                <img
                  width="40px"
                  src="https://sflow.io/wp-content/plugins/gtranslate/flags/svg/zh-TW.svg"
                />
              </q-item-section>
              <q-item-section>ZhTW </q-item-section>
            </q-item> -->
          </q-list>
        </q-btn-dropdown>

        <q-btn-dropdown
          v-if="!isMobile"
          dropdown-icon="null"
          flat
          text-color="white"
          class="user-info-drown float-right mt-2 mb-2 ml-5 text-capitalize no-box-shadow"
          style="height: 35px; box-sizing: content-box; width: 40px"
        >
          <template v-slot:label>
            <div class="row items-center no-wrap">
              <j-avatar
                :name="currentUser.name"
                :avatarUrl="currentUser.avatarUrl"
                :size="30"
              ></j-avatar>
            </div>
          </template>
          <q-list>
            <div class="row items-center no-wrap mx-4 mt-1">
              <j-avatar
                :name="currentUser.name"
                :avatarUrl="currentUser.avatarUrl"
                :size="30"
              ></j-avatar>

              <div class="ml-2 text-center:text-white'">
                {{ currentUser.name }}
              </div>
            </div>

            <div
              style="color: gray; font-size: 12px"
              class="ml-1 text-center mb-2"
            >
              {{ currentUser.email }}
            </div>
            <q-separator />
            <q-item clickable v-close-popup @click="profile">
              <q-item-section>
                <q-item-label> {{ $t("mainlayout.Profile") }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />

            <q-item clickable v-close-popup @click="logout">
              <q-item-section>
                <q-item-label>{{ $t("mainlayout.LOGOUT") }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="200"
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
    >
      <q-scroll-area class="fit text-white" style="background-color: #2b5aff">
        <q-list>
          <q-item class="text-gray-400 mb-1">
            <q-item-section avatar>
              <img width="24px" src="../assets/img/sflow-logo.svg" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ $t("app.name") }}</q-item-label>
            </q-item-section>
          </q-item>
          <EssentialLink
            v-for="link in linksList"
            :key="link.title"
            v-bind="link"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>


<script lang="ts">
import EssentialLink from "components/EssentialLink.vue";
import { defineComponent, ref, computed } from "@vue/composition-api";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
import { getters, mutations } from "../store/store";
import { useMutation } from "@vue/apollo-composable";
import { removeStoredAuthToken } from "src/utils/authToken";
export default defineComponent({
  name: "Register",
  components: {
    EssentialLink,
  },
  data() {
    return {
      isPwd: true,
      isMobile: getIsMobileBrowser(),
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }: { root: Vue }) {
    const currentUser = computed(getters.currentUser);
    const miniState = ref(true);

    const profile = async function () {
      root.$router.replace("/profile");
    };
    const logout = async function () {
      removeStoredAuthToken();
      void root.$router.push("/login");
    };
    const linksList = [

      // {
      //   title: root.$t("mainlayout.Log"),
      //   icon: "description",
      //   path: "/log",
      //   hidden:
      //     currentUser.value.role == 5 ||
      //     currentUser.value.role == 6 ||
      //     (currentUser.value.role == 2 &&
      //       currentUser.value.organizationId !== 1) ||
      //     (currentUser.value.role == 1 &&
      //       currentUser.value.organizationId !== 1),
      // },
      {
        title: root.$t("mainlayout.Home"),
        icon: "home",
        path: "/",
        hidden: currentUser.value.role != 1 && currentUser.value.role != 2,
      },
    ];

    const leftDrawerOpen = ref(false);

    const ChangeLanguage = (language) => {
      sessionStorage.setItem("language", language);
      root.$i18n.locale = language;
      root.$router.go(0);
    };
    return {
      ChangeLanguage,
      leftDrawerOpen,
      linksList,
      currentUser,
      profile,
      logout,
      miniState,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
  methods: {
    goBack() {
      void this.$router.replace("/login");
    },
  },
});
</script>

<style scoped>
</style>
