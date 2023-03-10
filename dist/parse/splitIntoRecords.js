// import type { I_CONFIG, I_GET_VALUE_UTILS, T_SOURCE, T_SOURCE_URL, T_HTML } from "./types";
import { getValue } from "./anchor";
import { parseUrlFromTagA } from "./utils";



async function splitIntoRecords(/*this: {config: I_CONFIG, utils: I_GET_VALUE_UTILS}, */source/*: T_SOURCE*/)/*: {current: Array<T_SOURCE_URL | T_HTML>; isUrls: boolean}*/ {
  const {config: {origin, records: {seporator, separateIntoSources}}, utils} = this;

  return {
    isUrls: !!separateIntoSources,
    current: await getValue.call(
      utils,
      [
        (typeof(seporator) === "object"
          ? {queryAll: true, ...seporator, current: seporator.current}
          : {queryAll: true, current: seporator}
        ),
        !separateIntoSources ? undefined : {forEach: true, expectInterface: false, current: (...[, hrefHtml])=>parseUrlFromTagA(origin, hrefHtml)},
        []
      ],
      source
    ).then(res=>res.filter((url)=>url))
  };
}


export { splitIntoRecords }
