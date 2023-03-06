import path from "path";
import fs from "fs";



function checkFolderExistSync(/*this: {dirname: string}, */foldername/*: string*/)/*: boolean*/ {
  return fs.existsSync(path.resolve(this.dirname, foldername));
}

function getFullPath(/*this: {dirname: string}, */foldername/*: string*/)/*: string*/ {
  return path.resolve(this.dirname, foldername);
}

async function prepareOutputDir(/*this: {dirname: string}, */foldername/*: string*/)/*: Promise<{recordsFilename: string; logsFilename: string}>*/ {
  let recordsHeadResolve, recordsHeadReject, recordsPromise = new Promise((res, rej)=>{ recordsHeadResolve = res; recordsHeadReject = rej; })
  let logsHeadResolve, logsHeadReject, logsPromise = new Promise((res, rej)=>{ logsHeadResolve = res; logsHeadReject = rej; })
  const res = {
    recordsFilename: path.resolve(this.dirname, "../", foldername, "records.json"),
    logsFilename: path.resolve(this.dirname, "../", foldername, "logs.json"),
  };

  fs.appendFile(res.recordsFilename, "", (err)=>err ? recordsHeadReject(err) : recordsHeadResolve());
  fs.appendFile(res.logsFilename, "", (err)=>err ? logsHeadReject(err) : logsHeadResolve());

  return Promise.all([recordsPromise, logsPromise]).then(()=>res);
}


export { checkFolderExistSync, getFullPath, prepareOutputDir };
export { getModuleSync } from "./externalDepends";
export { LOGS_CHUNK_TYPE, RECORD_CHUNK_TYPE } from "./resultStream";
export { default as ResultStream } from "./resultStream";
