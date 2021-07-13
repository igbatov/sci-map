import { clone } from "@/tools/utils";

// -1 прочитал и это плохо, 0 - не читал, но хочу прочитать, 1 сойдет, 2 понравилось, 3 я под очень сильным впечатлением
export type RateValues = -1 | 0 | 1 | 2 | 3;
export type ResourceRating = {
  resourceID: string;
  comment: string;
  rating: RateValues;
  ratedCount: number; // -1 if this rate is from user himself
  spam: number; // 0 (default) if not spam, 1 - spam, 2 - not fit content, 3 - malware, ...
};
export type ResourceRatingAggregate = {
  resourceID: string;
  rating: Record<RateValues, number>;
  spam: Record<
    number /* spam reason */,
    Record<
      string,
      number
    > /* hash map of userIDs that marked this reason (number always equal 1) */
  >;
};

export type Vacancy = {
  id: string;
  title: string;
  url: string;
  description: string;
  salary: string;
  organization: string;
  place: string;
  workHours: string; // full-time; part-time etc
  isRemote: boolean;
  published: number; // date in UTC seconds from epoch
  applicationDeadline: number; // date in UTC seconds from epoch
  spam: number;
  authorID: string;
};

export type VacancyAggregate = {
  id: string;
  title: string;
  url: string;
  description: string;
  salary: string;
  organization: string;
  place: string;
  workHours: string; // full-time; part-time etc
  isRemote: boolean;
  published: number; // date in UTC seconds from epoch
  applicationDeadline: number; // date in UTC seconds from epoch
  spam: Record<
    number /* spam reason */,
    Record<
      string,
      number
    > /* hash map of userIDs that marked this reason (number always equal 1) */
  >;
  authorID: string;
};

export type Crowdfunding = {
  id: string;
  title: string;
  url: string;
  description: string;
  organization: string;
  published: number; // date in UTC seconds from epoch
  applicationDeadline: number; // date in UTC seconds from epoch
  spam: number;
  authorID: string;
};

export type CrowdfundingAggregate = {
  id: string;
  title: string;
  url: string;
  description: string;
  organization: string;
  published: number; // date in UTC seconds from epoch
  applicationDeadline: number; // date in UTC seconds from epoch
  spam: Record<
    number /* spam reason */,
    Record<
      string,
      number
    > /* hash map of userIDs that marked this reason (number always equal 1) */
  >;
  authorID: string;
};

export type NodeContentAggregate = {
  nodeID: string;
  video: Record<string, number>;
  wikipedia: Record<string, number>;
  resourceRatings: Record<string, ResourceRatingAggregate>;
  vacancies: Record<string, VacancyAggregate>;
  crowdfundingList: Record<string, CrowdfundingAggregate>;
};

export type NodeContent = {
  nodeID: string;
  video: string;
  wikipedia: string;
  comment: string;
  resourceRatings: Record<string, ResourceRating>;
  vacancies: Record<string, Vacancy>;
  crowdfundingList: Record<string, Crowdfunding>;
};

export interface State {
  generalNodeContents: Record<string, NodeContent>;
  userNodeContents: Record<string, NodeContent>;
  nodeContents: Record<string, NodeContent>;
}

export const mutations = {
  SET_GENERAL_CONTENTS: "SET_GENERAL_CONTENTS",
  SET_USER_CONTENTS: "SET_USER_CONTENTS",
  SET_CONTENTS: "SET_CONTENTS",

  // NodeContent fields
  SET_NODE_VIDEO: "SET_NODE_VIDEO",
  SET_NODE_WIKIPEDIA: "SET_WIKIPEDIA",
  SET_NODE_COMMENT: "SET_COMMENT",

  // ResourceRatings
  ADD_TO_NODE_RESOURCE_RATINGS: "ADD_TO_NODE_RESOURCE_RATINGS",
  RATE_NODE_RESOURCE_RATING: "RATE_NODE_RESOURCE_RATING",
  REMOVE_NODE_RESOURCE_RATING: "REMOVE_NODE_RESOURCE_RATING",
  SET_NODE_RESOURCE_RATING_COMMENT: "SET_NODE_RESOURCE_COMMENT",
  REPORT_SPAM: "REPORT_SPAM",

  // Vacancy
  ADD_VACANCY: "ADD_VACANCY",
  REMOVE_VACANCY: "REMOVE_VACANCY",

  // Crowdfunding
  ADD_CROWDFUNDING: "ADD_CROWDFUNDING",
  REMOVE_CROWDFUNDING: "REMOVE_CROWDFUNDING"
};

export const actions = {
  getNodeContent: "getNodeContent"
};

export const EmptyNodeContent = {
  nodeID: "",
  video: "",
  wikipedia: "",
  comment: "",
  resourceRatings: {},
  vacancies: {},
  crowdfundingList: {}
} as NodeContent;

export const EmptyResourceRating = {
  resourceID: "",
  comment: "",
  rating: 0, // -1 прочитал и это плохо, 0 - не читал, но хочу прочитать, 1 сойдет, 2 понравилось, 3 я под очень сильным впечатлением
  ratedCount: -1,
  spam: 0
} as ResourceRating;

export const EmptyVacancy = {
  id: "",
  title: "",
  url: "",
  description: "",
  salary: "",
  organization: "",
  place: "",
  workHours: "", // full-time; part-time etc
  isRemote: false,
  published: 0, // date in UTC seconds from epoch
  applicationDeadline: 0, // date in UTC seconds from epoch
  spam: 0,
  authorID: ""
} as Vacancy;

export const EmptyCrowdfunding = {
  id: "",
  title: "",
  url: "",
  description: "",
  organization: "",
  published: 0, // date in UTC seconds from epoch
  applicationDeadline: 0, // date in UTC seconds from epoch
  spam: 0,
  authorID: ""
} as Crowdfunding;

function createIfNotExist(
  nodeContents: Record<string, NodeContent>,
  nodeID: string
) {
  if (!nodeContents[nodeID]) {
    nodeContents[nodeID] = clone(EmptyNodeContent);
    nodeContents[nodeID].nodeID = nodeID;
  }
}

export const store = {
  namespaced: true,
  state: {
    nodeContents: {} as Record<string, NodeContent>
  } as State,
  actions: {
    [actions.getNodeContent](
      { state }: { state: State },
      nodeID: string
    ): NodeContent {
      return state.nodeContents[nodeID];
    }
  },
  mutations: {
    /**
     * SET_CONTENTS
     * @param state
     * @param nodeContents
     */
    [mutations.SET_CONTENTS](
      state: State,
      nodeContents: Record<string, NodeContent>
    ) {
      state.nodeContents = nodeContents;
    },

    /**
     * SET_USER_CONTENTS
     * @param state
     * @param nodeContents
     */
    [mutations.SET_USER_CONTENTS](
      state: State,
      nodeContents: Record<string, NodeContent>
    ) {
      state.userNodeContents = nodeContents;
    },

    /**
     * SET_AGGREGATE_CONTENTS
     * @param state
     * @param nodeContents
     */
    [mutations.SET_GENERAL_CONTENTS](
      state: State,
      nodeContents: Record<string, NodeContent>
    ) {
      state.generalNodeContents = nodeContents;
    },

    /**
     * SET_NODE_VIDEO
     * @param state
     * @param v
     */
    [mutations.SET_NODE_VIDEO](
      state: State,
      v: { nodeID: string; video: string }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      state.nodeContents[v.nodeID].video = v.video;
    },
    /**
     * SET_NODE_WIKIPEDIA
     * @param state
     * @param v
     */
    [mutations.SET_NODE_WIKIPEDIA](
      state: State,
      v: { nodeID: string; wikipedia: string }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      state.nodeContents[v.nodeID].wikipedia = v.wikipedia;
    },
    /**
     * SET_NODE_COMMENT
     * @param state
     * @param v
     */
    [mutations.SET_NODE_COMMENT](
      state: State,
      v: { nodeID: string; comment: string }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      state.nodeContents[v.nodeID].comment = v.comment;
    },

    /**
     * ADD_TO_NODE_RESOURCE_RATINGS
     * @param state
     * @param v
     */
    [mutations.ADD_TO_NODE_RESOURCE_RATINGS](
      state: State,
      v: { rr: ResourceRating; nodeID: string }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      state.nodeContents[v.nodeID].resourceRatings[v.rr.resourceID] = v.rr;
    },
    /**
     * RATE_NODE_RESOURCE_RATING
     * @param state
     * @param v
     */
    [mutations.RATE_NODE_RESOURCE_RATING](
      state: State,
      v: { nodeID: string; resourceID: string; rating: RateValues }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      if (!state.nodeContents[v.nodeID].resourceRatings[v.resourceID]) {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = clone(
          EmptyResourceRating
        );
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID].resourceID =
          v.resourceID;
      }
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].rating =
        v.rating;
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].ratedCount = -1
    },
    /**
     * REMOVE_NODE_RESOURCE_RATING
     * @param state
     * @param v
     */
    [mutations.REMOVE_NODE_RESOURCE_RATING](
      state: State,
      v: { nodeID: string; resourceID: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        return;
      }
      if (typeof state.nodeContents[v.nodeID].resourceRatings[v.resourceID] === 'undefined') {
        return;
      }
      delete state.nodeContents[v.nodeID].resourceRatings[v.resourceID];
      if (typeof state.generalNodeContents[v.nodeID].resourceRatings[v.resourceID] !== 'undefined') {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = state.generalNodeContents[v.nodeID].resourceRatings[v.resourceID]
      }
    },

    /**
     * REPORT_SPAM
     * @param state
     * @param v
     */
    [mutations.REPORT_SPAM](
      state: State,
      v: {
        nodeID: string;
        type: "resourceRatings" | "vacancies" | "crowdfundingList";
        id: string;
        spam: number;
      }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      const r: any = state.nodeContents[v.nodeID][v.type];
      r[v.id].spam = v.spam;
    },

    /**
     * SET_NODE_RESOURCE_RATING_COMMENT
     * @param state
     * @param v
     */
    [mutations.SET_NODE_RESOURCE_RATING_COMMENT](
      state: State,
      v: { nodeID: string; resourceID: string; comment: string }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      if (!state.nodeContents[v.nodeID].resourceRatings[v.resourceID]) {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = clone(
          EmptyResourceRating
        );
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID].resourceID =
          v.resourceID;
      }
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].comment =
        v.comment;
    },

    /**
     * ADD_VACANCY
     * @param state
     * @param v
     */
    [mutations.ADD_VACANCY](
      state: State,
      v: { nodeID: string; vacancy: Vacancy }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      if (!state.nodeContents[v.nodeID].vacancies) {
        state.nodeContents[v.nodeID].vacancies = {};
      }
      state.nodeContents[v.nodeID].vacancies[v.vacancy.id] = v.vacancy;
    },
    /**
     * REMOVE_VACANCY
     * @param state
     * @param v
     */
    [mutations.REMOVE_VACANCY](
      state: State,
      v: { nodeID: string; vacancyID: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        return;
      }
      delete state.nodeContents[v.nodeID].vacancies[v.vacancyID];
    },

    /**
     * ADD_CROWDFUNDING
     * @param state
     * @param v
     */
    [mutations.ADD_CROWDFUNDING](
      state: State,
      v: { nodeID: string; crowdfunding: Crowdfunding }
    ) {
      createIfNotExist(state.nodeContents, v.nodeID);
      if (!state.nodeContents[v.nodeID].crowdfundingList) {
        state.nodeContents[v.nodeID].crowdfundingList = {};
      }
      state.nodeContents[v.nodeID].crowdfundingList[v.crowdfunding.id] =
        v.crowdfunding;
    },
    /**
     * REMOVE_CROWDFUNDING
     * @param state
     * @param v
     */
    [mutations.REMOVE_CROWDFUNDING](
      state: State,
      v: { nodeID: string; crowdfundingID: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        return;
      }
      delete state.nodeContents[v.nodeID].crowdfundingList[v.crowdfundingID];
    }
  }
};
