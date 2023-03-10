import fs from "fs";
import commandLineArgs from "command-line-args";

import { T_CLI_ARGUMENTS, dirname } from "./arguments";
import { ResultStream, prepareOutputDir, RECORD_CHUNK_TYPE, LOGS_CHUNK_TYPE } from "./inOut";
import UserViewport from "./userViewport";
import { getSourceUrls, splitIntoRecords, parseRecordData } from "./parse";



const OPTIONS = commandLineArgs(T_CLI_ARGUMENTS);
const resultStream = new ResultStream();
const userViewport = new UserViewport();

(async function main() {
  if ( !(OPTIONS.config && (OPTIONS.useStdOutput || OPTIONS.outputDir)) ) {throw new Error("Required process arguments ['config', 'outputDir/useStdOutput'] not defined")}

  if (OPTIONS.useStdOutput) {
    resultStream
      .pipe(ResultStream.createFormatter([], false))
      .pipe(process.stdout)
      .on("finish", ()=>process.exit());
  } else {
    const {recordsFilename, logsFilename} = await prepareOutputDir.call({dirname}, OPTIONS.outputDir);
    resultStream
      .pipe(ResultStream.createFilter({excludeTypes: [LOGS_CHUNK_TYPE]}))
      .pipe(ResultStream.createFormatter())
      .pipe(fs.createWriteStream(recordsFilename))
      .on("finish", ()=>process.exit());
    resultStream
      .pipe(ResultStream.createFilter({excludeTypes: [RECORD_CHUNK_TYPE]}))
      .pipe(ResultStream.createFormatter())
      .pipe(fs.createWriteStream(logsFilename))
      .on("finish", ()=>process.exit());
  }

  await userViewport.open();

  console.log('it`s test section runed with args:', OPTIONS);
  const USE_PREPARED_SOURCES = true;
  const config = {
    origin: "https://www.ozon.ru",
    sources: (USE_PREPARED_SOURCES
      ? [
        "https://www.ozon.ru/highlight/divany-i-kresla-393575/?page=2&tf_state=Nhc5tjzNg1-pFFGGdbsZ6lCDhEgdMkct7xgbZf5zznnF6OMG",
        // "https://www.ozon.ru/highlight/divany-i-kresla-393575/?page=3&tf_state=Nhc5tjzNg1-pFFGGdbsZ6lCDhEgdMkct7xgbZf5zznnF6OMG",
      ]
      : {
        "start": "https://www.ozon.ru/category/kresla-15019/",
        "next": "*[data-widget='megaPaginator'] > *:nth-last-child(1) a ~ a[href]:not(:nth-last-child(1)):not(:nth-child(n+7))"
      }
    ),

    records: {
      seporator: "*[data-widget='searchResultsV2'] > * > *:not(:nth-child(n+3)) a:has(img[src*='jpg'])",
      separateIntoSources: true,
      limit: 2,
      useHtmlInterface: true,

      store: {
        "characteristics": [
          "#section-characteristics > *:nth-child(2)",
          {
            forEach: false,
            current: ($, node)=>Object.fromEntries([].slice.call(node.children()).map((child)=>[
              $(child.children[0]).text(),
              [].slice.call($('dl', child))
                .reduce((res, {children: [dt, dd]})=>{
                  res[$(dt).text().replaceAll(/:( )*$/g, '').trim()] = $(dd).text();
                  return res
                }, {})
            ]))
          }
        ]
      },
      scheme: {
        "source": "@source",

        "name": "*[data-widget='webProductHeading']",
        "desc": [
          "#section-description",
          (...[, , res])=>(res
            .replaceAll(/\\n/g, '')
            .trim()
            .replace(/[!]?Показать полностью[ \\s]*$/m, '')
            .replace(/^[ \\s]*Описание[ \\s]*/m, '')
            .trim()
            .replace(/^[ \\s]*О товаре[ \\s]*/m, '')
          ),
        ],
        "rate": [
          "*[data-widget='webReviewProductScore'] *[style*='width']",
          (...[, node])=>(node.css('width').slice(0, -1) / 20),
        ],
        "cover": [
          {
            queryAll: true,
            queryAfterEachAction: true,
            current: [
              "@emit('click', '*[data-widget=\'webGallery\'] *[data-index]:not(:nth-child(n+5))', {dispatchForAll: true}, '*[data-widget=\'webGallery\'] img[fetchpriority=\'high\']')",
            ]
          },
          {
            forEach: true,
            current: (...[, node])=>(node.attr("src"))
          }
        ],

        "warrantyTime": "@store('characteristics/Дополнительные/Гарантийный срок')",
      }
    }
  };
  const utils = {
    async simpleQuery({url}, selector, {nodeHtml: htmlContext = ""}, {queryAll}) {
      return [await userViewport.querySelector(
        {url, html: htmlContext},
        selector,
        {all: !!queryAll}
      )].flat(1);
    },
    async queryWithUserAction({url}, eventName, targetSelector, {nodeHtml: htmlContext = ""}, {dispatchForAll}, observedSelector, {queryAll, queryAfterEachAction}) {
      return [await userViewport.querySelector(
        {url, html: htmlContext},
        observedSelector,
        {all: !!queryAll, queryAfterEachAction: !!queryAfterEachAction, preUserActions: [[eventName, targetSelector, {dispatchForAll}]]}
      )].flat(1);
    }
  }

  const getSourceUrlsRes = await getSourceUrls.call({config, utils});
  console.log("getSourceUrls: ", getSourceUrlsRes, "\n");

  await (async function loop(i) {
    if ( !(i in getSourceUrlsRes) ) {return}
    const url = getSourceUrlsRes[i];

    const {current: items, isUrls} = await splitIntoRecords.call({config, utils}, {url});
    console.log("splitIntoRecords: ", url, "->", {current: items, isUrls}, "\n");

    await (async function subLoop(j) {
      if ( !(j in items) ) {return}
      const subUrl = isUrls ? items[j] : url;

      const parseRecordDataRes = await parseRecordData.call({config, utils}, {url: subUrl, html: isUrls ? undefined : items[j]});
      console.log("parseRecordData: ", url, "->", parseRecordDataRes, "\n");

      await subLoop(j + 1);
    })(0);

    await loop(i + 1);
  })(0)

  process.exit();
})()

process.on("exit", async (code = 0)=>{
  await userViewport.close();
})
