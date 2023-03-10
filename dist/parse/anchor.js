import cherio from "cherio";

/*
import type {
 I_GET_VALUE_CONTEXT,

 T_ANCHOR,
 T_SOURCE,

 T_SELECTOR,
 T_SELECTOR_RESULT_DATA,

 T_HTML,
 T_HTML_INTERFACE,

} from "./types";
*/



const QUERYING_FLAGS = {queryAll: false, queryAfterEachAction: true};
const DEFAULT_SELECTOR_SPECIAL_CASES = [
  [
    selector=>isEqualSelectorFuncNames(selector, "emit"),
    {expectHtml: true},
    async (source, selector, {selector: prevSelector, nodeHtml}, queryingFlags, utils)=>{
      const [eventName, targetSelector, flags, observedSelector] = parseSelectorFuncArgs(selector, "emit");
      return await utils.queryWithUserAction(
        source,
        eventName,
        targetSelector,
        {prevSelector, nodeHtml},
        new Function(`return (${flags || "{}"})`)(),
        observedSelector,
        queryingFlags
      );
    },
  ],
]

async function getValue(/*this: I_GET_VALUE_CONTEXT, */anchor/*: T_ANCHOR*/, source/*: T_SOURCE*/)/*: ReturnType<typeof handleValue>*/ {
  const {selectorSpecialCases = [], ...utils} = this || {};
  const [, handler, , anchorId] = anchor;
  const queryingResTree/*: Array<Array<T_SELECTOR_RESULT_DATA>>*/ = [];
  const selectors/*: Array<T_SELECTOR>*/ = [(typeof(anchor[0]) === "string" || anchor[0] instanceof Array) ? anchor[0] : anchor[0].current].flat();
  const queryingFlags = {...QUERYING_FLAGS, ...anchor[0]};

  await (async function loop(i) {
    if ( !(i in selectors) ) {return;}

    const selector = selectors[i];
    const [, {expectSource, expectHtml, withInterface}, caseFunc] = [...selectorSpecialCases, ...DEFAULT_SELECTOR_SPECIAL_CASES].find(([condition])=>condition(selector)) || [null, {}, null];
    const [isStart, isEnd] = [!i, i >= (selectors.length - 1)];
    const prevQueryingRes = isStart ? [] : queryingResTree[i - 1];

    if (caseFunc && (isStart ? selectors.length <= 1 : true)) {
      queryingResTree[i] = await Promise.all(
        (isStart ? [{source, selector: "", nodeHtml: (source.html || "")}] : prevQueryingRes)
          .map(({source, selector: prevSelector, nodeHtml})=>{
            if (expectSource && !source) {throw new Error(`Result after selector(${prevSelector}) from anchor(${anchorId}) for selector(${selector}) can\`t be without source<T_SOURCE>`)}
            // if (expectHtml && !nodeHtml) {throw new Error(`Result after selector(${prevSelector}) from anchor(${anchorId}) must was type node<T_HTML_ELEMENT> for selector(${selector})`)}
            return new Promise(async (resolve)=>{
              const caseResult = await caseFunc(
                source,
                selector,
                (withInterface ? {selector, ...wrappInInterface(nodeHtml)} : {selector: prevSelector, nodeHtml}),
                queryingFlags,
                utils
              );
              resolve(caseResult.map(({res, value})=>res.map(newNodeHtml=>({source, selector, nodeHtml: newNodeHtml, value: value}))));
            })
          })
      ).then(res=>res.flat(Infinity))
    } else {
      queryingResTree[i] = await Promise.all(
        (isStart ? [{source, selector: "", nodeHtml: (source.html || "")}] : prevQueryingRes)
          .map(({source, selector: prevSelector, nodeHtml})=>{
            if (!source) {throw new Error(`Result after selector(${prevSelector}) from anchor(${anchorId}) for selector(${selector}) can\`t be without source<T_SOURCE>`)}
            return new Promise(async (resolve)=>{
              const queryResult = await utils.simpleQuery(source, selector, {prevSelector, nodeHtml}, queryingFlags);
              resolve(queryResult.map(({res})=>res.map(newNodeHtml=>({source, selector, nodeHtml: newNodeHtml}))));
            })
          })
      ).then(res=>res.flat(Infinity))
    }

    await loop(i + 1);
  })(0)

  return (handler?.forEach
    ? queryingResTree[queryingResTree.length - 1].map(item=>handleValue(anchor, [item])).flat(1)
    : handleValue(anchor, queryingResTree[queryingResTree.length - 1])
  );
}

function handleValue([{getAll}, handler, defaultValue]/*: T_ANCHOR*/, list/*: Array<T_SELECTOR_RESULT_DATA>*/)/*: any*/ {
  const func = ["string", "function"].includes(typeof(handler)) ? handler : handler?.current;
  const {expectInterface = true} = (handler || {expectInterface: true});

  return ((res)=>getAll ? res : res[0])((getAll ? list : [list[0]].filter(item=>item)).map(({source, nodeHtml, value})=>{
    let args = [];
    if (expectInterface) {
      const {$, node} = wrappInInterface(nodeHtml);
      args = [$, node, (value || node.text() || defaultValue)];
    } else {
      args = [null, nodeHtml, (value || defaultValue)];
    }

    return func
      ? (typeof(func) === "string"
        ? (new Function(`{return ${func}}`))().apply(null, args)
        : func.apply(null, args)
      )
      : args[2];
  }))
}

function wrappInInterface(html/*: T_HTML*/ = "")/*: T_HTML_INTERFACE*/ {
  const $ = cherio.load(html);
  return {
    $,
    //$($.root().children()[0].children[1].children[0]) is equal $($("body > *")), but more optimized.
    // Double wrap to provide an interface
    node: $($.root().children()[0].children[1].children[0])
  };
}

function isEqualSelectorFuncNames(selector/*: T_SELECTOR*/ = "", name/*: string*/, withArgs/*?: boolean*/ = true)/*: boolean*/ {
  return withArgs
    ? !!(new RegExp(`^@${name}\(.*?\)$`, "m")).test(selector.trim())
    : !!(new RegExp(`^@${name}$`, "m")).test(selector.trim());
}
function parseSelectorFuncArgs(selector/*: T_SELECTOR*/, name/*: string*/)/*: Array<string>*/ {
  return selector.slice(`@${name}('`.length, (-1 * "')".length)).split(",").map(str=>str.trim().replaceAll(/(^['"`]|['"`]$)/g, ""));
}


export { getValue, isEqualSelectorFuncNames, parseSelectorFuncArgs }
