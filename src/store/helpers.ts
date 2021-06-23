import firebase from "firebase";
import api from "@/api/api";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { mutations as resourcesMutations } from "@/store/resources";
import {
  Crowdfunding,
  CrowdfundingAggregate,
  mutations as nodeContentMutations,
  NodeContent,
  RateValues,
  ResourceRating,
  ResourceRatingAggregate,
  Vacancy,
  VacancyAggregate
} from "@/store/node_content";
import { store } from "@/store/index";
import { clone, printError, round } from "@/tools/utils";

const GENERAL_SPAM_THRESHOLD = 2;

export async function fetchMap(user: firebase.User | null) {
  const [tree, err] = await api.getMap(user);
  if (tree == null || err) {
    printError("fetchMap: cannot api.getMap(user)", { err });
  }

  //// Commented out because reading map from DB is always made from single general version
  // if (user && !tree) {
  //   [tree, err] = await api.getMap(null);
  //   if (tree == null || err) {
  //     printError("fetchMap: cannot api.getMap(null)", { err });
  //   }
  // }

  store.commit(`tree/${treeMutations.SET_TREE}`, tree);
}

export async function fetchPins(user: firebase.User | null) {
  let [pins, err] = await api.getPins(user);
  if (pins == null || err) {
    console.error(err);
  }

  if (user && !pins) {
    [pins, err] = await api.getPins(null);
    if (pins == null || err) {
      console.error(err);
      pins = {};
    }
  }

  store.commit(`pin/${pinMutations.SET_PINS}`, pins);
}

export async function fetchResources() {
  const [resources, err] = await api.getResources();
  if (resources == null || err) {
    printError("fetchResources error", { err });
    return;
  }

  store.commit(`resources/${resourcesMutations.SET_RESOURCES}`, resources);
}

function getTopValue(obj: Record<string, number>): string {
  const sortable = [];
  for (const key in obj) {
    sortable.push([key, obj[key]]);
  }
  if (sortable.length == 0) {
    return "";
  }
  sortable.sort((a, b) => {
    const aVal = a[1] as number;
    const bVal = b[1] as number;
    return bVal - aVal;
  });
  return sortable[0][0] as string;
}

function aggregateSpam(spam: Record<number, string[]>): number {
  let spamSum = 0;
  for (const spamType in spam) {
    spamSum = spamSum + spam[spamType].length;
  }

  return spamSum;
}

function aggregateRatings(
  agg: Record<string, ResourceRatingAggregate>
): Record<string, ResourceRating> {
  const rr: Record<string, ResourceRating> = {};
  for (const resourceID in agg) {
    let sum = 0;
    let count = 0;
    for (const rating in agg[resourceID].rating) {
      const rt = Number(rating) as RateValues;
      sum = sum + Number(rating) * agg[resourceID].rating[rt];
      count = count + agg[resourceID].rating[rt];
    }

    rr[resourceID] = {
      resourceID: resourceID,
      comment: "",
      rating: count > 0 ? (round(sum / count) as RateValues) : 0,
      ratedCount: count,
      spam: aggregateSpam(agg[resourceID].spam) > GENERAL_SPAM_THRESHOLD ? 1 : 0
    };
  }

  return rr;
}

function aggregateVacancies(
  vacanciesAgg: Record<string, VacancyAggregate>
): Record<string, Vacancy> {
  const vacancies = {} as Record<string, Vacancy>;
  if (!vacanciesAgg) {
    return vacancies;
  }

  for (const id in vacanciesAgg) {
    vacancies[id] = clone(vacanciesAgg[id]);
    vacancies[id].spam = aggregateSpam(vacanciesAgg[id].spam);
  }
  return vacancies;
}

function aggregateCrowdfunding(
  crowdfundingListAgg: Record<string, CrowdfundingAggregate>
): Record<string, Crowdfunding> {
  const crowdfundingList = {} as Record<string, Crowdfunding>;
  if (!crowdfundingListAgg) {
    return crowdfundingList;
  }

  for (const id in crowdfundingListAgg) {
    crowdfundingList[id] = clone(crowdfundingListAgg[id]);
    crowdfundingList[id].spam = aggregateSpam(crowdfundingListAgg[id].spam);
  }
  return crowdfundingList;
}

function mergeResourceRatings(
  userRatings: Record<string, ResourceRating>,
  generalRatings: Record<string, ResourceRating>
): Record<string, ResourceRating> {
  const r: Record<string, ResourceRating> = {};
  for (const resourceID in generalRatings) {
    if (userRatings && userRatings[resourceID]) {
      r[resourceID] = userRatings[resourceID];
    } else {
      r[resourceID] = generalRatings[resourceID];
    }
  }

  return r;
}

export async function fetchNodeContents(user: firebase.User | null) {
  // fetch node_content from general map
  const [nodeContentAggregate, err] = await api.getNodeContentAggregate();
  if (nodeContentAggregate == null || err) {
    printError("fetchNodeContents error", { err });
    return;
  }

  // convert nodeContentAggregate to nodeContents
  const nodeContents: Record<string, NodeContent> = {};
  for (const i in nodeContentAggregate) {
    nodeContents[i] = {
      nodeID: nodeContentAggregate[i].nodeID,
      video: getTopValue(nodeContentAggregate[i].video),
      wikipedia: getTopValue(nodeContentAggregate[i].wikipedia),
      comment: "",
      resourceRatings: aggregateRatings(
        nodeContentAggregate[i].resourceRatings
      ),
      vacancies: aggregateVacancies(nodeContentAggregate[i].vacancies),
      crowdfundingList: aggregateCrowdfunding(
        nodeContentAggregate[i].crowdfundingList
      )
    } as NodeContent;
  }

  if (user) {
    const [userNodeContents, err] = await api.getNodeContents(user);
    if (userNodeContents == null || err) {
      printError("fetchNodeContents error", { err, user });
      return;
    }

    // "merge" into general node content
    for (const id in userNodeContents) {
      nodeContents[id].video = userNodeContents[id].video;
      nodeContents[id].wikipedia = userNodeContents[id].wikipedia;
      nodeContents[id].comment = userNodeContents[id].comment;
      nodeContents[id].resourceRatings = mergeResourceRatings(
        userNodeContents[id].resourceRatings,
        nodeContents[id].resourceRatings
      );
      for (const i in userNodeContents[id].vacancies) {
        nodeContents[id].vacancies[i].spam =
          userNodeContents[id].vacancies[i].spam;
      }
      for (const i in userNodeContents[id].crowdfundingList) {
        nodeContents[id].crowdfundingList[i].spam =
          userNodeContents[id].crowdfundingList[i].spam;
      }
    }
  }

  console.log("nodeContents", nodeContents);

  store.commit(
    `nodeContent/${nodeContentMutations.SET_CONTENTS}`,
    nodeContents
  );
}
