// import type { I_CONFIG, I_GET_VALUE_CONTEXT, I_GET_VALUE_UTILS, T_SOURCE, I_SCHEME, T_SCHEME_FIELD, T_SCHEME_VALUE, T_SOURCE } from "./types";
import { getValue, isEqualSelectorFuncNames, parseSelectorFuncArgs } from "./anchor";
import { checkIsAbsoluteUrl } from "./utils";



const _RES = Symbol(); //Field name to keeping result of createDataObject call;

async function parseRecordData(/*this: {config: I_CONFIG, utils: I_GET_VALUE_UTILS}, */source/*: T_SOURCE*/)/*: object*/ {
  const {config: {origin, records: {store: storeScheme, scheme: recordsScheme}}, utils} = this;
  const context/*: I_GET_VALUE_CONTEXT & {store: object}*/ = {...utils, store: {}, selectorSpecialCases: [
    [
      (selector)=>isEqualSelectorFuncNames(selector, "source", false),
      {expectSource: true},
      (prevSource)=>([{
        res: [""],
        value: (checkIsAbsoluteUrl(prevSource.url) ? prevSource.url : (origin + prevSource.url)),
      }]),
    ],
    [
      selector=>isEqualSelectorFuncNames(selector, "store"),
      {},
      (source, selector)=>{
        const pathToValue = parseSelectorFuncArgs(selector, "store")[0].split("/");
        if ( !context.store[pathToValue[0]] ) {throw new Error(`Value by path<${pathToValue[0]}> in store not founded`)}
        return [{
          res: [""],
          value: deepingTo(context.store, pathToValue),
        }]
      },
    ],
  ]};

  if ( (Object.keys(storeScheme || {}).length > 0) ) {
    Object.assign(context.store, (await createDataObject.call({...context, maxDeep: 0, schemePath: "config.records.store"}, storeScheme, source)));
  }
  return await createDataObject.call({...context, schemePath: "config.records.scheme"}, recordsScheme, source);
}

async function createDataObject(/*this: {maxDeep?: number; schemePath: string, utils: I_GET_VALUE_UTILS}, */scheme/*: I_SCHEME*/, source/*T_SOURCE*/, parentLayPath/*Array<T_SCHEME_FIELD>*/ = [], currentDeep/*: number*/ = 0) {
  const {maxDeep = Infinity, schemePath} = this;
  if ( !this[_RES] ) {this[_RES] = {};}

  if (currentDeep > maxDeep) {throw new Error(`For scheme<T_SCHEME>(${schemePath}) path<T_SCHEME_PATH>(${parentLayPath.join(".")}) go beyond the maximum nesting depth`);}

  for (const [name, arg]/*: [T_SCHEME_FIELD, T_SCHEME_VALUE]*/ of Object.entries(scheme)) {
    if ( arg && typeof(arg) === "string" ) {
      deepingTo(this[_RES], parentLayPath)[name] = await getValue.call(this, [arg, , , [...parentLayPath, name].join(".")], source);

    } else if ( arg instanceof Array ) {
      deepingTo(this[_RES], parentLayPath)[name] = await getValue.call(this, (args=>{args[3] = [...parentLayPath, name].join("."); return args})(arg), source);

    } else if ( arg && typeof(arg) === "object" ) {
      deepingTo(this[_RES], parentLayPath)[name] = {};
      await createDataObject.call(this, arg, source, [...parentLayPath, name], currentDeep + 1);

    } else {throw new Error(`Scheme<T_SCHEME>(${schemePath}) not valid, on path<T_SCHEME_PATH>(${[...parentLayPath, name].join(".")})`)}
  }

  return this[_RES];
}

function deepingTo(lay/*object | any*/, path/*Array<T_SCHEME_FIELD>*/ = [])/*: any*/ {
  return path.length == 0 ? lay : deepingTo(lay[path[0]], path.slice(1));
}


export { parseRecordData }
