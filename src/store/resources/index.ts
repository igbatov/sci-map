export type ResourceType =
  | "book"
  | "article"
  | "other";
export type Resource = {
  id: string;
  type: ResourceType;
  author: string;
  title: string;
  chapterNumber: string;
  chapterName: string;
  findPhrase: string; // как найти - цитата, главы, ссылки
  url: string;
  doi: string;
  isbn: string;
  createdAt: number; // = Date.UTC()
  updatedAt: number; // = Date.UTC()
};

export type Resources = Record<
  string /* id of resource */,
  Resource /* resource */
>;

export interface State {
  resources: Resources;
}

export const mutations = {
  SET_RESOURCES: "SET_RESOURCES",
  ADD_TO_RESOURCES: "ADD_TO_RESOURCES"
};

export const actions = {
  find: "find",
  getByID: "getByID"
};

export const store = {
  namespaced: true,
  state: {
    resources: {} as Resources
  },
  actions: {
    [actions.find]({ state }: { state: State }, str: string): Resource[] {
      const result = [];
      for (const id in state.resources) {
        const resource = state.resources[id];
        if (
          resource.author.indexOf(str) != -1 ||
          resource.title.indexOf(str) != -1 ||
          resource.chapterName.indexOf(str) != -1 ||
          resource.doi.indexOf(str) != -1 ||
          resource.isbn.indexOf(str) != -1
        ) {
          result.push(resource);
        }
      }

      return result;
    },
    [actions.getByID]({ state }: { state: State }, id: string): Resource {
      return state.resources[id];
    }
  },
  mutations: {
    [mutations.SET_RESOURCES](state: State, resources: Resources) {
      state.resources = resources;
    },
    [mutations.ADD_TO_RESOURCES](state: State, resource: Resource) {
      state.resources[resource.id] = resource;
    }
  }
};
