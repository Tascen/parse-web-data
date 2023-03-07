import crypto from "crypto";



const GENERATE_UUID_ATTEMPTS_MAX_COUNT = 3;

function createUUID(checkExist/*: (id: string)=>boolean*/)/*: string*/ {
  let id = crypto.randomUUID();
  let counter = 0;
  while (!checkExist(id) && (counter++) < GENERATE_UUID_ATTEMPTS_MAX_COUNT) {id = crypto.randomUUID()}
  if (counter === GENERATE_UUID_ATTEMPTS_MAX_COUNT) {throw new Error("Attempts count to generate a unique id has been exhausted")}
  return id;
}

function reduceWithOneWay(largeText/*: string*/)/*: string*/ {
  return crypto.createHash('md5').update(largeText).digest('hex');
}

function joinToKeyFrom(...args/*: Array<string>*/)/*: string*/ {
  return args.join("_");
}

function getAttribute(html/*: string*/, name/*: string*/)/*: string*/ {
  return html.match(new RegExp(`${name}=['"\`][0-9]*?['"\`]`, "m"))[0].slice(`${name}="`.length, -1)
}


export { createUUID, reduceWithOneWay, joinToKeyFrom, getAttribute }
