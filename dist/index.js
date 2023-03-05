import commandLineArgs from "command-line-args";

import { T_CLI_ARGUMENTS, dirname } from "./arguments";



const OPTIONS = commandLineArgs(T_CLI_ARGUMENTS);

(async function main() {
  console.log('app is runed with args:', OPTIONS);
})()
