import path from "path";
// import filenameReservedRegex, {windowsReservedNameRegex} from "filename-reserved-regex";



const ALLOWED_EXTENSIONS = [".json", ".js"];

function getModuleSync(/*this: {extensions: Array<keyof FILE_HANDLERS>, dirname: string}, */filename/*: string*/)/*: any*/ {
  const {dirname, extension = ALLOWED_EXTENSIONS} = this;

  if ( !checkValidFilename(filename) ) {throw new Error(`File name not valid string`)}
  if ( !ALLOWED_EXTENSIONS.includes(path.extname(filename)) ) { throw new Error(`Invalid file\`s extension, must be one of ${JSON.stringify(ALLOWED_EXTENSIONS)}`) }

  return require(path.resolve(dirname, filename));
}
function checkValidFilename(value/*: string*/) {
  return (value &&
    typeof(value) === "string" &&
    value.length <= 255 &&
    // !filenameReservedRegex().test(value) &&
    // !windowsReservedNameRegex().test(value) &&
    ![".", ".."].includes(value)
  );
}


export { getModuleSync }
