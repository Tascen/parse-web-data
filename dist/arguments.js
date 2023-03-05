import path from "path";
import { getModuleSync, checkFolderExistSync, getFullPath } from "./inOut";



const dirname = path.resolve(__dirname, "../");
const T_CLI_ARGUMENTS = [
  {
    name: "config",
    type: wrappInTryCatch((name)=>getModuleSync.call({dirname, extension: ["js", "json"]}, name), "config")
  },
  {
    name: "useStdOutput",
    type: Boolean,
  },
  {
    name: "outputDir",
    type: wrappInTryCatch(name=>(checkFolderExistSync.call({dirname}, name) ? getFullPath.call({dirname}, name) : ""), "outputDir")
  },
];
function wrappInTryCatch(funs/*(...args: any)=>any*/, argumentName/*: string*/ = "unknow")/*: any*/ {
  try {
    return (...args)=>funs.apply(null, args);
  } catch (err) {
    throw new Error(`When try read file by process.args<--${argumentName}> was thrown error: \n${err}`);
  }
}


export { T_CLI_ARGUMENTS, dirname };
