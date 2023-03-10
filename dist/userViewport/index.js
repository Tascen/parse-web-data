import puppeteer, {/*Browser as T_Browser, Page as T_Page, ElementHandle as T_ElementHandle*/} from "puppeteer";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";

import { createUUID, reduceWithOneWay, joinToKeyFrom, getAttribute } from "./utils";



/*
type T_USER_AGENT = string;
type T_URL = Parameters<T_Page["goto"]>[0];
type T_ID = ReturnType<typeof createUUID>;
type T_HTML = string;
type T_PAGE_BODY_HTML = string;
type T_SELECTOR = string;
type T_EVENT_NAME = string;
interface I_TAB {
  page: T_Page;
  querySelectorsCashedCount: {current: 0} //Wrapped in a "refObject", because this way allows you to always set a value that will be shared between all
}
interface I_OPTIONS {
  queriedEleCashIdAttrName: string; //Field is necessary in order to match nodes<T_HTML> with their descriptors in the original dom tree
  dispatchingFullPageRenderingEventsInterval: string;
  launch: Parameters<typeof puppeteer.launch>[0];
  viewport: Parameters<T_Page["setViewport"]>[0];
  gotoPage: Parameters<T_Page["goto"]>[1];
}
interface I_TAB_IDENTIFIERS {
  url: T_URL;
  id?: T_ID;
}
interface I_QUERY_SELECTOR_FLAGS {
  all?: string; //Indicates that the search will be runed by method "querySelectorAll" instead of "querySelector"
  queryAfterEachAction?: boolean; //Indicates that the search will be runed after each event dispatch; see this.preUserActions
  preUserActions?: Array<T_USER_ACTION> //Event`s list that will be dispatched before searching.
}
type T_USER_ACTION = [T_EVENT_NAME, T_SELECTOR, {
  dispatchForAll?: boolean; //Indicates that the event will be runed for each node found by T_SELECTOR
  timeout?: number; //Delay between event dispatchs
}]
type T_QUERY_SELECTOR_RESULT_VARIANT_1 = Array<T_QUERY_SELECTOR_RESULT_VARIANT_1> //It used when specified I_QUERY_SELECTOR_FLAGS["preUserActions"]
type T_QUERY_SELECTOR_RESULT_VARIANT_1 = {
  pageHtml: T_PAGE_BODY_HTML;
  html: T_HTML;
  res: Array<T_HTML>;
}; //It used when unspecified I_QUERY_SELECTOR_FLAGS["preUserActions"]
*/

const DEFAULT_USER_AGENTS = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"];
const DEFAULT_OPTIONS = {
  queriedEleCashIdAttrName: "data-searchedeleid",
  dispatchingFullPageRenderingEventsInterval: 1000,
  launch: {
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu", "--window-size=1200x800"]
  },
  viewport: {
    width: 1200,
    height: 800
  },
  gotoPage: {
    networkIdle2Timeout: 5000,
    waitUntil: "networkidle2",
    timeout: 3000000
  },
};
const DEFAULT_USER_ACTIONS_INTERVAL = 1000;

class UserViewport {
  /*
  private browser: T_Browser | null = null;
  private tabs: {[k: string]: I_TAB} = {};
  private userAgents: Array<T_USER_AGENT> = DEFAULT_USER_AGENTS;
  private options: I_OPTIONS = DEFAULT_OPTIONS;
  */


  /*public*/async open()/*: Promise<void>*/ {
    this.browser = await puppeteer.launch(this.options.launch);
  }
  /*public*/async close()/*: Promise<void>*/ {
    await this.browser.close();
  }
  /*public*/async getPageContent(identifiers/*: I_TAB_IDENTIFIERS*/ = {})/*: Promise<{id: T_ID, html: T_HTML} | never>*/ {
    this.checkCanUseTab(identifiers);

    const {id, page, isNew: isNewTab} = !identifiers.id ? (await this.openTab(identifiers.url)) : {id: identifiers.id, page: this.getTab(identifiers.id, identifiers.url)};

    if (isNewTab) {await this.dispatchFullPageRendering(page)}

    return {
      id,
      html: await page.content(),
    };
  }
  /*public*/async querySelector({html: queryHtmlContext, ...identifiers}/*: I_TAB_IDENTIFIERS & {html?: T_HTML}*/ = {}, selector/*: T_SELECTOR*/, flags/*: I_QUERY_SELECTOR_FLAGS*/ = {})/*: Promise<{id: T_ID, current: (I_QUERY_SELECTOR_FLAGS["preUserActions"] extends undefined ? T_QUERY_SELECTOR_RESULT_VARIANT_2 : T_QUERY_SELECTOR_RESULT_VARIANT_1)} | never >*/ {
    this.checkCanUseTab(identifiers);

    const {id, page, isNew: isNewTab, ...tab} = !identifiers.id ? (await this.openTab(identifiers.url)) : {id: identifiers.id, ...this.getTab(identifiers.id, identifiers.url)};
    const evaluateFuncArgs = [
      selector,
      flags,
      {//Defined only necessary fields, to reduce stringified object entities
        defaultUserActionsInterval: DEFAULT_USER_ACTIONS_INTERVAL,
        queriedEleCashIdAttrName: this.options.queriedEleCashIdAttrName,
        cachedCount: tab.querySelectorsCashedCount.current,
        htmlId: !queryHtmlContext ? undefined : Number(getAttribute(queryHtmlContext, this.options.queriedEleCashIdAttrName)),
      }
    ]

    if (isNewTab) {await this.dispatchFullPageRendering(page)}

    //A bit about evaluating problems:
    // 1)T_Page["evaluateHandle"] was used in place of T_Page["evaluate"], because last throw errors related to JSON.stringify,
    //   something like: (SyntaxError: Unexpected token '<') or (SyntaxError: Unexpected token ''')
    // 2)This problem could be solved somehow, but not in the second case;
    //   because a quote-related error requires replacing all the quotes on the page,
    //   which can lead to a "SyntaxError" error if we do it using the quick "replaceAll" method
    //   and performance problems if we do it "smartly".
    // 3)Аunction which passed in 'T_Page["evaluateHandle"]' should not be subject to changes by compilers *(babel, lint, u.t.c...).
    //   Since in this case, global variables will be inserted into it`s body, which are visible only in the context of calling the current file, but not in the context of 'T_Page["evaluateHandle"]'

    const {nodes/*: T_QUERY_SELECTOR_RESULT_VARIANT_1*/, newCachedCount/*: number*/} = await page
      .evaluateHandle((selector, flags, context)=>{
        const CLOSE_TAG_REGEXP = /<\/.*?>$/m;
        const htmlContext = (typeof(context.htmlId) == "number") ? document.querySelector(`*[${context.queriedEleCashIdAttrName}='${context.htmlId}']`) : document;
        const photoBox = document.createElement("div"); //This element need for optimized geting html of node
        const result/*: {nodes: T_QUERY_SELECTOR_RESULT_VARIANT_1, newCachedCount: number}>*/ = {
          nodes: [],
          newCachedCount: context.cachedCount,
        };

        //handlers
        const executeAction = (prevResolver/*: Promise*/, action/*: T_USER_ACTION*/, callback/*: ()=>void*/)=>{
          const eventName = action[0];
          const targets = action[1];
          const {timeout = context.defaultUserActionsInterval} = action[2];
          let promises = [];
          promises[-1] = Promise.resolve();

          targets.forEach((target, i)=>promises.push(new Promise((targetResolve)=>promises[i - 1].then(()=>{
            target.dispatchEvent(new Event(eventName));
            setTimeout(()=>targetResolve(), timeout)
          }))));

          Promise.all(promises.slice(0)).then(callback);
        };
        const lastActionsGroupHandler = ()=>{
          const elements = flags.all ? [].slice.call(htmlContext.querySelectorAll(selector)) : [htmlContext.querySelector(selector)].filter(ele=>ele);
          const {res, newCachedCount} = elements.reduce(
            (reduced, ele)=>{
              let id = ele.getAttribute(context.queriedEleCashIdAttrName);
              if (!id) {
                ele.setAttribute(context.queriedEleCashIdAttrName, id = result.newCachedCount = (Number(result.newCachedCount) + 1));
                reduced.newCachedCount = id;
              }

              photoBox.innerHTML = "";
              photoBox.appendChild(ele.cloneNode(false));
              const closePart = photoBox.innerHTML.match(CLOSE_TAG_REGEXP);
              reduced.res.push(closePart //closePart === null, is mean ele was single tag, for example img, input, u.t.c
                ? `${photoBox.innerHTML.slice(0, (-1 * closePart[0]?.length))}${ele.innerHTML}${closePart[0]}`
                : photoBox.innerHTML
              );
              return reduced;
            },
            {res: [], newCachedCount: result.newCachedCount}
          );

          result.newCachedCount = newCachedCount;
          result.nodes.push({
            pageHtml: document.body.innerHTML,
            html: document.body.innerHTML,
            res,
          });
        };

        return Promise.all(
          (flags.preUserActions || [])

          //Foreach item:    action<selector> -> (action<HtmlElement[]> | Array<action<HtmlElement[]>>)
          .map((action)=>{
            const targets = action[2].dispatchForAll ? (new Function("arr", "return [...arr]"))(htmlContext.querySelectorAll(action[1])) : [htmlContext.querySelector(action[1])];
            if (flags.queryAfterEachAction) {
              return targets.map((target)=>[action[0], [target], action[2]])
            } else {
              return [action[0], targets, action[2]]
            }
          })

          //Foreach item:    (action<HtmlElement[]> | Array<action<HtmlElement[]>>) -> action<HtmlElement[]>
          .flat(flags.queryAfterEachAction ? 1 : 0)
          [flags.queryAfterEachAction ? "map" : "reduce"](// foreach:    action<HtmlElement[]> -> Array<action<HtmlElement[]>>
            (flags.queryAfterEachAction
              ? action=>[action] // for each action self group
              : (groupsList, action)=>{groupsList[0].push(action); return groupsList} // for all actions one group
            ),
            (flags.queryAfterEachAction ? undefined : [[]])
          )

          //Foreach item:    group -> promise
          .map((group, i, groups)=>{
            if (!groups.mapResult) {
              groups.mapResult = [];
              groups.mapResult[-1] = Promise.resolve();
            };
            const promises = group.reduce(
              //create from actions list, action`s promises queue
              ((promises, action)=>{
                promises.push(new Promise((resolve)=>{
                  promises[promises.length - 1].then((res)=>executeAction(res, action, ()=>resolve()))
                }));
                return promises;
              }),
              [groups.mapResult[i - 1].then(()=>Promise.resolve())]
            );
            groups.mapResult.push(promises[promises.length - 1])
            return promises[promises.length - 1]
          })

          //For cases when preUserActions not defined or empty
          .reduce(
            (flags.preUserActions?.length
              ? (list, promise)=>{list.push(promise); return list}
              : (list)=>list
            ),
            flags.preUserActions?.length ? [] : [Promise.resolve()]
          )

          //Finish hadling
          .map((actionsGroupPromise)=>actionsGroupPromise.then(lastActionsGroupHandler))
        ).then(()=>result)
      }, ...evaluateFuncArgs)
      .then(async (eHandle)=>{
        const res = await eHandle.jsonValue();
        await eHandle.dispose();
        return res;
      });

    tab.querySelectorsCashedCount.current = newCachedCount;
    return {
      id,
      current: flags.preUserActions?.length ? nodes : nodes[0]
    };
  }
  /*public*/async closeTab(identifiers/*: I_TAB_IDENTIFIERS*/ = {})/*: Promise<void>*/ {
    this.checkCanUseTab(identifiers);
    await this._closeTab(identifiers.id, identifiers.url);
  }

  /*private*/async dispatchFullPageRendering(page)/*: Promise<void>*/ {
    const {dispatchingFullPageRenderingEventsInterval} = this.options;
    const limit = 3;
    await new Promise((resolve)=>{
      setTimeout((async function loop(i = 0){
        if (i > limit) {resolve(); return}
        await scrollPageToBottom(page, {size: 500});
        loop(i + 1);
      }), dispatchingFullPageRenderingEventsInterval)
    })
  }
  /*private*/getUserAgent()/*: T_USER_AGENT*/ {
    return this.userAgents[0];
  }
  /*private*/checkCanUseTab({url, id}/*: I_TAB_IDENTIFIERS*/ = {})/*: void*/ {
    if ( !this.browser ) {throw new Error("Impossible use tab, when viewport closed")}
    if ( !url ) {throw new Error(`To access the tab, you need to specify the url<T_URL>(${url}), it\`s required`)}
    if (id && !this.getTab(id, url)) {throw new Error(`At the specified id(${id}) and url(${url}), tab was not found`)}
  }
  /*private*/async openTab(url/*: T_URL*/)/*: {id: T_ID, isNew?: boolean} & I_TAB*/ {
    const shortUrl = reduceWithOneWay(url);
    const id = createUUID( (id)=>this.tabs[joinToKeyFrom(id, shortUrl)] );
    const tab = this.tabs[joinToKeyFrom(id, shortUrl)] = {
      page: await this.browser.newPage(),
      querySelectorsCashedCount: {current: 0}
    };

    await tab.page.setUserAgent(this.getUserAgent());
    await tab.page.setViewport(this.options.viewport);
    await tab.page.goto(url, this.options.gotoPage);

    return {isNew: true, id, ...tab};
  }
  /*private*/getTab(id/*: T_ID*/, url/*: T_URL*/)/*: {isNew?: boolean} & I_TAB*/ {
    return this.tabs[joinToKeyFrom(id, reduceWithOneWay(url))] || null;
  }
  /*private*/async _closeTab(id/*: T_ID*/, url/*: T_URL*/)/*: {isNew?: boolean} & I_TAB*/ {
    const tabId = joinToKeyFrom(id, reduceWithOneWay(url));
    if (this.tabs[tabId]) {
      await this.tabs[tabId].page.close();
      delete this.tabs[tabId].querySelectorsCashedCount;
      delete this.tabs[tabId];
    }
  }
  constructor(options/*: I_OPTIONS*/ = {}) {
    Object.assign(this, {
      browser: null,
      tabs: [],
      userAgents: DEFAULT_USER_AGENTS,
      options: {
        ...DEFAULT_OPTIONS,
        ...JSON.parse(JSON.stringify(options || {})) //Сloned to prevent errors related with changing internal fields
      }
    });
  }
}


// export type { T_USER_AGENT, T_URL, T_ID, I_TAB, I_OPTIONS };
export default UserViewport;
