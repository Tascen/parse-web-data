import path from "path";
import fs from "fs";



function checkFolderExistSync(/*this: {dirname: string}, */foldername/*: string*/)/*: boolean*/ {
  return fs.existsSync(path.resolve(this.dirname, foldername));
}

function getFullPath(/*this: {dirname: string}, */foldername/*: string*/)/*: string*/ {
  return path.resolve(this.dirname, foldername);
}


export { checkFolderExistSync, getFullPath };
export { getModuleSync } from "./externalDepends";
