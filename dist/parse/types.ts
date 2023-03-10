// import cherio from "cherio";



interface I_CONFIG {
  origin: T_URL_ORIGIN,
  sources: Array<T_SOURCE_URL> | {
    start: T_SOURCE_URL;
    next: T_SELECTOR;
  };

  records: {
    seporator: T_SELECTOR;
    separateIntoSources?: boolean;
    limit?: number;
    // useHtmlInterface?: boolean

    store: I_SCHEME<1>;

    records: I_SCHEME;
  }
}

interface I_SCHEME<Deep = Infinity> {
  [k: T_SCHEME_FIELD]: Deep extends 1 ? T_ANCHOR : T_SCHEME_VALUE;
}
type T_SCHEME_FIELD = string;
type T_SCHEME_VALUE = I_SCHEME | T_ANCHOR;

type T_SOURCE = {url: T_SOURCE_URL};
type T_SOURCE_URL = string;
type T_URL_ORIGIN = string;

type T_ANCHOR = [
  T_SELECTOR | Array<T_SELECTOR> | (I_QUERYING_FLAGS & {current: T_SELECTOR | Array<T_SELECTOR>}),
  Function | T_JS_STRINGIFIED_FUNCTION | {forEach?: boolean; expectInterface?: boolean; current: Function | T_JS_STRINGIFIED_FUNCTION},
  any, //It`s default value
  T_ANCHOR_ID
];
type T_ANCHOR_ID = string;

type T_SELECTOR = string | `@${string}${"" | "("}${"" | "," | " ", | "\"" | "\`" | "'" | string}${"" | ")"}`;
type T_EVENT_NAME = string;

type T_JS_STRINGIFIED_FUNCTION = string;

interface I_QUERYING_FLAGS {
  queryAll?: boolean;
  queryAfterEachAction?: boolean;
}

type T_HTML = string;
type T_HTML_ROOT_INTERFACE = ReturnType< cherio.load(T_HTML) >;
type T_HTML_INTERFACE = ReturnType< cherio.load(cherio.load(T_HTML)("body > *")) >;

interface I_GET_VALUE_CONTEXT extends I_GET_VALUE_UTILS {
  selectorSpecialCases?: Array<[
    (T_SELECTOR)=>boolean,
    {expectSource?: boolean, expectHtml?: boolean, withInterface?: boolean},
    (
      so: T_SOURCE,
      se: T_SELECTOR,
      {selector: T_SELECTOR; $?: T_HTML_ROOT_INTERFACE; node?: T_HTML_INTERFACE; nodeHtml?: T_HTML},
      f: I_QUERYING_FLAGS,
      {simpleQuery: I_GET_VALUE_CONTEXT["simpleQuery"]; queryWithUserAction: I_GET_VALUE_CONTEXT["queryWithUserAction"]}
    )=>Array<{res: T_HTML, value?: any}>,
  ]>;
}
interface I_GET_VALUE_UTILS {
  simpleQuery: (
    so: T_SOURCE,
    se: T_SELECTOR,
    qr: {prevSelector: T_SELECTOR, nodeHtml: T_HTML},
    f: I_QUERYING_FLAGS
  )=>Array<{res: T_HTML}>;

  queryWithUserAction: (
    so: T_SOURCE,
    ev: T_EVENT_NAME,
    tse: T_SELECTOR,
    qr: {prevSelector: T_SELECTOR, nodeHtml: T_HTML},
    evf: {dispatchForAll?: boolean},
    ose: T_SELECTOR,
    f: I_QUERYING_FLAGS
  )=>Array<{res: T_HTML}>;
};
