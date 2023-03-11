import fs from "fs";
import {performance} from "perf_hooks";
import commandLineArgs from "command-line-args";

import { T_CLI_ARGUMENTS, dirname } from "./arguments";
import { ResultStream, prepareOutputDir, RECORD_CHUNK_TYPE, LOGS_CHUNK_TYPE } from "./inOut";
import UserViewport from "./userViewport";
import TasksQueue from "./tasksQueue";
import { getSourceUrls, splitIntoRecords, parseRecordData } from "./parse";



const OPTIONS = commandLineArgs(T_CLI_ARGUMENTS);
const resultStream = new ResultStream();
const userViewport = new UserViewport();
const tasksQueue = new TasksQueue({queueConcurrency: 4});
const parseUtils = {
  async simpleQuery({url}, selector, {nodeHtml: htmlContext = ""}, {queryAll}) {
    const {id, current} = await userViewport.querySelector(
      {url, html: htmlContext},
      selector,
      {all: !!queryAll}
    );
    await userViewport.closeTab({id, url});
    return [current].flat(1);
  },
  async queryWithUserAction({url}, eventName, targetSelector, {nodeHtml: htmlContext = ""}, {dispatchForAll}, observedSelector, {queryAll, queryAfterEachAction}) {
    const {id, current} = await userViewport.querySelector(
      {url, html: htmlContext},
      observedSelector,
      {all: !!queryAll, queryAfterEachAction: !!queryAfterEachAction, preUserActions: [[eventName, targetSelector, {dispatchForAll}]]}
    );
    await userViewport.closeTab({id, url});
    return [current].flat(1);
  }
};
const logs = {
  recordsCount: 0,
  sourcesCount: 0,
  timeSpent: 0,
  timeStart: performance.now(),
  err: undefined,
};


(async function main() {
  if ( !(OPTIONS.config && (OPTIONS.useStdOutput || OPTIONS.outputDir)) ) {throw new Error("Required process arguments ['config', 'outputDir/useStdOutput'] not defined")}

  await userViewport.open();

  if (OPTIONS.useStdOutput) {
    resultStream.bindWithEnd(
      resultStream
        .pipe(ResultStream.createFormatter(...[OPTIONS.config.format ? (OPTIONS.config.format || []) : [[], false]]))
        .pipe(process.stdout)
    );
  } else {
    const {recordsFilename, logsFilename} = await prepareOutputDir.call({dirname}, OPTIONS.outputDir);
    resultStream.bindWithEnd(
      resultStream
        .pipe(ResultStream.createFilter({excludeTypes: [LOGS_CHUNK_TYPE]}))
        .pipe(ResultStream.createFormatter(...(OPTIONS.config.format || [])))
        .pipe(fs.createWriteStream(recordsFilename)),
      resultStream
        .pipe(ResultStream.createFilter({excludeTypes: [RECORD_CHUNK_TYPE]}))
        .pipe(ResultStream.createFormatter(...(OPTIONS.config.format || [])))
        .pipe(fs.createWriteStream(logsFilename))
    );
  }

  tasksQueue.on("solveTask", (res)=>(res && resultStream.write(res)));
  tasksQueue.on("finish", ()=>{
    logs.timeSpent = performance.now() - logs.timeStart;
    resultStream.end(logs);
    resultStream.on("finishPipeLine", ()=>process.exit(0));
  })
  tasksQueue.on("error", (err)=>{
    logs.error = err;
    resultStream.end(logs);
    resultStream.on("finishPipeLine", ()=>process.exit(1));
  })

  const allSourcesAlreadyFound = OPTIONS.config.sources instanceof Array;
  const parseContext = {utils: parseUtils, config: OPTIONS.config};
  let sources = (allSourcesAlreadyFound ? OPTIONS.config.sources : [OPTIONS.config.sources.start]).filter(url=>url).map(url=>({url}));
  let remainedRecordsCount = Number(OPTIONS.config.records.limit || Infinity);
  let isEmptyResult = false;

  (async function loop(i) {
    const {url} = sources[i];
    const {current: items, isUrls} = await splitIntoRecords.call(parseContext, {url});

    if ( !allSourcesAlreadyFound && sources.length < (OPTIONS.config.sources.limit - 1) ) {
      await getSourceUrls.call(parseContext).then(urls=>urls.map(url=>sources.push({url})));
      if (sources.length > OPTIONS.config.sources.limit) {sources = sources.slice(0, OPTIONS.config.sources.limit)}
    };

    if ((remainedRecordsCount -= items.length) >= 0) {
      logs.recordsCount += items.length;
      items.forEach((item, i)=>tasksQueue.push(async ()=>{
        const [html, subUrl] = isUrls ? [undefined, item] : [item, url];
        const record = await parseRecordData.call(parseContext, {html, url: subUrl});
        return record;
      }));

      logs.sourcesCount += 1;
      (i < (sources.length - 1)) && loop(i + 1);
    }
  })(0);
})()

process.on("exit", async (code = 0)=>{
  await userViewport.close();
})
