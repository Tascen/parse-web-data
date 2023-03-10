// import type { T_URL_ORIGIN, T_HTML } from "./types";



function parseUrlFromTagA(origin/*: T_URL_ORIGIN*/, nodeHtml/*: T_HTML*/ = "") {
  const url = nodeHtml.match(/href=['"`].*?['"`]/)?.[0].slice(`href="`.length, -1) || undefined;
  return checkIsAbsoluteUrl(url) ? url : (origin.toString() + url);
}
function checkIsAbsoluteUrl(url/*: T_URL_ORIGIN*/ = "")/*: boolean*/ {
  return (/^(?:[a-z+]+:)?\/\//i).test(url);
}


export { parseUrlFromTagA, checkIsAbsoluteUrl }
