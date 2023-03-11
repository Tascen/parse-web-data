import { /*Write, Read*/Duplex, Transform } from "stream";



const RECORD_CHUNK_TYPE = "record";
const RECORDS_UTIL_CHUNK_TYPE = "utilR";
const LOGS_CHUNK_TYPE = "logs";
const LOGS_UTIL_CHUNK_TYPE = "utilL";
const TYPE_UTIL_CHUNKS_PAIR = {
  //These pairs with key equal to the type of chunk and value equal to the admited for it type of utility chunk
  [LOGS_CHUNK_TYPE]: LOGS_UTIL_CHUNK_TYPE,
  [RECORD_CHUNK_TYPE]: RECORDS_UTIL_CHUNK_TYPE,
}

class ResultStream extends Duplex {
  /*
  private isLastData: boolean = false;
  private methodBindWithEndDidCall: boolean = false;
  private endPipesPromises: Array<Promise> = [];
  */


  static createFormatter([listStart = "", objectSeparator = "", listEnd = ""] = ["[", ",", "]"], unwrappChunkObj = true, objectFormatFunc = JSON.stringify) {
    let i = 0;
    let isLogs = false;
    let isClosedList = false;
    return new Transform({
      objectMode: true,
      transform(...[data, , callback]) {
        if (data.type === RECORDS_UTIL_CHUNK_TYPE) {
          //This case is used for the place of the "Transform.flush" event handler,
          // because the event will not be processed every time after calling the "ResultStream.end" method
          (data.current === "isEnd") && this.push(listEnd);
        } else {
          this.push((isLogs = (data.type === LOGS_CHUNK_TYPE))
            ? objectFormatFunc(unwrappChunkObj ? data.current : data)
            : `${++i === 1 ? listStart : objectSeparator}${objectFormatFunc(unwrappChunkObj ? data.current : data)}`
          );
        }
        callback();
      },
    });
  }
  static createFilter({excludeTypes = []}/*: {excludeTypes?: Array<LOGS_CHUNK_TYPE | RECORD_CHUNK_TYPE | UTIL_CHUNK_TYPE>}*/ = {}) {
    excludeTypes = [
      ...JSON.parse(JSON.stringify(excludeTypes)),
      ...Object.entries(TYPE_UTIL_CHUNKS_PAIR)
        .filter(([chunkType])=>excludeTypes.includes(chunkType))
        .map(([, excludedUtilChunkType])=>excludedUtilChunkType),
    ];
    return new Transform({
      objectMode: true,
      transform(...[data, , callback]) {
        !excludeTypes.includes(data.type) && this.push(data);
        callback();
      },
    });
  }
  /*public*/bindWithEnd(...streams/*Array<Write | Read | Duplex | Transform>*/) {
    if ( !(this.methodBindWithEndDidCall = !this.methodBindWithEndDidCall) ) {throw new Error("Method 'bindWithEnd' can`t be called again, this method is called once for avoid errors and unexpected logic")}
    this.endPipesPromises = streams.map((stream)=>(new Promise((resolve, reject)=>{
      stream.on("finish", ()=>resolve());
      stream.on("error", (err)=>reject(err));
    })));
  }
  /*public*/on(eventName, callback, ...args) {
    if (eventName === "finishPipeLine") {
      Promise.all(this.endPipesPromises).then(()=>callback());
      return null;
    } else {
      return super.on.apply(this, [eventName, callback, ...args]);
    }
  }
  /*public*/end() {
    this.isLastData = true;
    return super.end.apply(this, arguments);
  }

  /*private*/_write(...[data, , callback]) {
    this.isLastData && this.push({type: RECORDS_UTIL_CHUNK_TYPE, current: "isEnd"});
    this.push({type: this.isLastData ? LOGS_CHUNK_TYPE : RECORD_CHUNK_TYPE, current: data});
    this.isLastData && this.push(null);
    callback();
  }
  /*private*/_read() {}
  constructor() {
    super({allowHalfOpen: false, readableObjectMode: true, writableObjectMode: true});
    this.isLastData = false;
    this.methodBindWithEndDidCall = false;
    this.endPipesPromises = [];
  }
}


export { LOGS_CHUNK_TYPE, RECORD_CHUNK_TYPE };
export default ResultStream;
