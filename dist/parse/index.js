// import type { I_CONFIG } from "./types";



function validateConfig(config/*: object*/ = {})/*: I_CONFIG | null*/ {
  return config;
}


export { validateConfig };
export { getSourceUrls } from "./getSourceUrls";
export { parseRecordData } from "./parseRecordData";
export { splitIntoRecords } from "./splitIntoRecords";
