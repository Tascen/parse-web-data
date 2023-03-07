import fs from "fs";
import commandLineArgs from "command-line-args";

import { T_CLI_ARGUMENTS, dirname } from "./arguments";
import { ResultStream, prepareOutputDir, RECORD_CHUNK_TYPE, LOGS_CHUNK_TYPE } from "./inOut";
import UserViewport from "./userViewport";



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
  const source = "https://www.ozon.ru/product/kreslo-oliviya-1-sht-64h88h100-sm-597198440/?_bctx=CAYQ54IY&advert=SzzkTTJTVeR6IiqoqZwezJbD_IK2y8IXV1EbLWSIPJEYSKH1y7ZiN0F6bXHKae084R5kZ35Jl_VAwXccr6hYiZS_hm1QntrCHLhBrBvzFP8MuvFzH6RZnLo4bS0QZxVv2ihp1SUCB2P4lFsqH41wcKaOkkqgcQZo0nwqCteSp6ikE5EzgwnA8rDbAXYbQ1G4y14dMDeiVR_tSROxReDUFLimJ5lb3-WXMrmbAcg-n6qkigxtxd-kWcaQrjfQ_pvTG-glbb-XZQ7bGepjtEbALZlNMtFnvlyEt5AgU-sr7Xq-KAYYVabsYA7YJG6sZvIuwid5kTOHLKTCDJHUpb-fDOvGaFxZourrNO26WuFR4vtbpWBhxQR91KJEP_DSeGcy_btWSvOCf7V9ChBygegXZ-Xs_jfJhLhx-EBRCe9VeaQBmLrG5Hh0K-1v5jf8e14-OBC6VzW17ggvoboeUGVILEZ7S3WbZwpBkGM_coUhqvNlW8h7Zn6pyijKF-5_Ts0fEQl74l9G5G_zpTy4VI23QZ31H-ZAU6mEYMq6wdwMlQWb_Ek86cwNbW0bYkNMsbegJ2X_hSY_VWSPQ7wE2R_1qYjToTzCQ7MsaeqO7Lu6nPawRWfDsUWwddtCiQrAwBfdqMInz6CzNvHaqv0cSORi-8M1ArNlrT4y75sFFRNh4DpaDEtwPNmzvac2GRnb0tG0ICCsWmZHQgi9o7MbVCzIbw&avtc=1&avte=2&avts=1677934500&sh=u57d2tCyvQ";
  const selectors = {
    "containers": "*[data-widget='webCurrentSeller'], *[data-widget='tagList']",
    "secondContainerHeading": "h2",
    "nameHeading": "*[data-widget='webProductHeading'] h1",
    "name": "*[data-widget='webProductHeading']",

    "cover": "*[data-widget='webGallery'] img[fetchpriority='high']",
  };
  const preUserActions = [
    ["click", "*[data-widget='webGallery'] *[data-index]:not(:nth-child(n+5))", {dispatchForAll: true, /*timeout = 1000*/}]
  ];

  // const id = "";
  const {html: recordPage, id} = await userViewport.getPageContent({url: source});
  console.log("recordPage: ", id, "> ", recordPage.slice(0, 8), "\n");

  const {res: [labelHeading]} = await userViewport.querySelector({url: source, id}, selectors.nameHeading, {all: false});
  console.log("labelHeading: ", id, "> ", labelHeading, "\n");

  const {res: [label]} = await userViewport.querySelector({url: source, id}, selectors.name, {all: false});
  console.log("label: ", id, "> ", label, "\n");

  const containers = await userViewport.querySelector({url: source, id}, selectors.containers, {all: true});
  console.log("containers: ", id, "> ", Object.entries(containers).filter(([key])=>!["html", "pageHtml"].includes(key)), "\n");

  const {res: [prevCover]} = await userViewport.querySelector({url: source, id}, selectors.cover, {all: false});
  console.log("prevCover: ", id, "> ", prevCover, "\n");

  const newResultedCover = await userViewport.querySelector({url: source, id}, selectors.cover, {all: false, preUserActions});
  console.log("newResultedCover without eacher: ", id, "> ", newResultedCover.map(({res, ...item})=>({keys: Object.keys(item), res})), "\n");

  const newCovers = await userViewport.querySelector({url: source, id}, selectors.cover, {all: true, queryAfterEachAction: true, preUserActions});
  console.log("newCovers: ", id, "> ", newCovers.map(({res, ...item})=>({keys: Object.keys(item), res})), "\n");

  process.exit();
})()

process.on("exit", async (code = 0)=>{
  await userViewport.close();
})
