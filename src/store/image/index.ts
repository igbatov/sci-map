import {DBImage} from "@/api/types";

export type Images =  Record<string, Record<string, DBImage>>;

export interface State {
  images: Images;
}

export const mutations = {
  UPDATE_IMAGES: "UPDATE_IMAGES",
};

export const store = {
  namespaced: true,
  state: {
    images: {} as Images,
  },
  mutations: {
    [mutations.UPDATE_IMAGES](state: State, v: {nodeID: string, images: Record<string, DBImage>}) {
        state.images[v.nodeID] = v.images
    },
  }
};
