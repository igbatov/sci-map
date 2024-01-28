
export type TitleBox = {
  position: {
    x: number,
    y: number
  },
  bbox: {
    width: number,
    height: number,
  }
};

export type TitleBoxMap = Record<
  string /* node_id */,
  TitleBox /* title box attributes */
>;

export interface State {
  layerMap: Record<string, TitleBoxMap>;
}

export const mutations = {
  SET_MAP: "SET_MAP",
};

export const store = {
  namespaced: true,
  state: {
    layerMap: {},
  },
  mutations: {
    [mutations.SET_MAP](state: State, v: { layerName: string; titleBoxMap: TitleBoxMap }) {
      state.layerMap[v.layerName] = v.titleBoxMap
    },
  }
};
