// import type { I_CONFIG, I_GET_VALUE_UTILS, T_SOURCE_URL } from "./types";
import { getValue } from "./anchor";
import { parseUrlFromTagA, checkIsAbsoluteUrl } from "./utils";



async function getSourceUrls(/*this: {config: I_CONFIG, utils: I_GET_VALUE_UTILS}, */)/*: Array<T_SOURCE_URL>*/ {
  const {config: {origin, sources}, utils} = this;

  return (sources instanceof Array
    ? sources.map((url)=>(checkIsAbsoluteUrl(url) ? url : (origin + url)))
    : (await getValue.call(
      utils,
      [
        (typeof(sources.next) === "object"
          ? {queryAll: true, ...sources.next, current: sources.next.current}
          : {queryAll: true, current: sources.next}
        ),
        {forEach: true, expectInterface: false, current: (...[, hrefHtml])=>parseUrlFromTagA(origin, hrefHtml)},
        []
      ],
      {url: sources.start}
    ).then(res=>res.filter((url)=>url)))
  );
}


export { getSourceUrls }
