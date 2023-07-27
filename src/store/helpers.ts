import firebase from "firebase";
import api from "@/api/api";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { mutations as preconditionMutations } from "@/store/precondition";
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

export async function fetchPreconditions(user: firebase.User | null) {
  let [preconditions, err] = await api.getPreconditions(user);
  if (preconditions == null || err) {
    console.error(err);
    preconditions = {};
  }

  if (user && !preconditions) {
    [preconditions, err] = await api.getPreconditions(null);
    if (preconditions == null || err) {
      console.error(err);
      preconditions = {};
    }
  }

  console.log("preconditions", preconditions)
  store.commit(`precondition/${preconditionMutations.SET_PRECONDITIONS}`, preconditions);
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

function aggregateSpam(spam: Record<number, Record<string, number>>): number {
  let spamSum = 0;
  for (const spamType in spam) {
    let spamReportersCount = 0;
    for (const userID in spam[spamType]) {
      if (spam[spamType][userID]) {
        spamReportersCount++;
      }
    }
    spamSum = spamSum + spamReportersCount;
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
    if (
      userRatings &&
      userRatings[resourceID] &&
      userRatings[resourceID].rating !== undefined &&
      userRatings[resourceID].rating !== null)
    {
      r[resourceID] = userRatings[resourceID];
    } else {
      r[resourceID] = generalRatings[resourceID];
    }
  }

  return r;
}

export function mergeUserContentIntoGeneral(
  userNodeContents: Record<string, NodeContent>,
  nodeContents: Record<string, NodeContent>
) {
  for (const id in userNodeContents) {
    if (!nodeContents[id]) {
      continue
    }
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

  // fix in store
  store.commit(
    `nodeContent/${nodeContentMutations.SET_GENERAL_CONTENTS}`,
    clone(nodeContents)
  );

  if (user) {
    const [userNodeContents, err] = await api.getNodeContents(user);
    if (userNodeContents == null || err) {
      printError("fetchNodeContents error", { err, user });
      return;
    }

    // fix in store
    store.commit(
      `nodeContent/${nodeContentMutations.SET_USER_CONTENTS}`,
      userNodeContents
    );

    // "merge" into general node content
    mergeUserContentIntoGeneral(userNodeContents, nodeContents)
  }

  store.commit(
    `nodeContent/${nodeContentMutations.SET_CONTENTS}`,
    nodeContents
  );
}

export async function fetchData(user: firebase.User | null) {
  await fetchMap(user);
  await fetchPins(user);
  await fetchPreconditions(user);
  await fetchResources();
  await fetchNodeContents(user);
}
