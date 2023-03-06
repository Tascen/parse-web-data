import fs from "fs";
import commandLineArgs from "command-line-args";

import { T_CLI_ARGUMENTS, dirname } from "./arguments";
import { ResultStream, prepareOutputDir, RECORD_CHUNK_TYPE, LOGS_CHUNK_TYPE } from "./inOut";



const OPTIONS = commandLineArgs(T_CLI_ARGUMENTS);
const resultStream = new ResultStream();

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

  console.log('it`s test section runed with args:', OPTIONS);

  setTimeout(()=>resultStream.write({recordId: 0}), 2000);
  setTimeout(()=>{
    try {
      if (Math.random() < 0.5) {
        throw new Error("some fail");
      }
      resultStream.write({recordId: 1});
    } catch (err) {
      resultStream.end({err: {message: err.message}});
      process.exit();
    }
  }, 3000);
  setTimeout(()=>resultStream.end({recordsCount: 2}), 6000);
})()
