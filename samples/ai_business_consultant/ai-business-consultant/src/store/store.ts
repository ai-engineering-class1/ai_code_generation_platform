import { Filters, Project, User } from '../types';
import Vue from 'vue'
import Queue from '@/types/queue';
import Org from '@/types/org';

const store = Vue.observable({
  currentUser: {} as User,
  queues: {
  } as any[],
  project: {} as Project,
  projectList:[],
  org:{}as Org,
  easiioId:'',
  isAuthenticated: true,
  filters: {
    searchTerm: '',
    userIds: [],
    myOnly: false,
    recent: false,
  } as Filters,

  mainlayout: {
    currentUserAgent: {}, currentRegisterer: {}
  } as unknown as any,
});
export const getters = {
  project: () => store.project,
  filters: () => store.filters,
  easiioId: () => store.easiioId,
  currentUser: () => store.currentUser,
  queues: () => store.queues,
  org: () => store.org,
  projectList: () => store.projectList,
  isAuthenticated: () => store.isAuthenticated,
  mainlayout: () => store.mainlayout
};
export const mutations = {
  setFilters: (filters: Filters) => (store.filters = filters),
  setCurrentUser: (user: User) => (store.currentUser = user),
  setEasiioId: (easiioId: string) => (store.easiioId = easiioId),
  setQueues: (queue: any[]) => (store.queues = queue),
  setOrg: (org: Org) => (store.org = org),
  setProjectList: (project: []) => (store.projectList = project),
  setProject: (project: Project) => (store.project = project),
  setIsAuthenticated: (isAuth: boolean) => (store.isAuthenticated = isAuth),
  setMainLayout: (MainLayout: any) => (store.mainlayout = MainLayout),
};

export default {
  store,
  getters,
  mutations,
};
