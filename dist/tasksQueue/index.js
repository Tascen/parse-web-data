import EventEmitter from "events";
import queue from "async/queue";



const DEFAULT_OPTIONS = {
  queueConcurrency: 4
}

class TasksQueue extends EventEmitter {
  /*
  private queue: typeof queue = null;
  private onError: (err)=>void = undefined;
  */

  /*public*/push(task/*()=>(Promise<void> | void)*/, callback/*: ()=>void*/ = undefined)/*: void*/ {
    callback && this.on("solveTask", callback);
    this.queue.push((...args)=>task(...args).then(
      res=>this.emit("solveTask", res),
      err=>this.emit("error", err),
    ));
  }

  constructor(options/*: typeof DEFAULT_OPTIONS*/ = DEFAULT_OPTIONS) {
    super();
    this.queue = queue((async function onClaim(task, done) {
      try {
        await task();
        done();
      } catch (err) {
        this.emit("error", err);
      }
    }).bind(this), options.queueConcurrency);
    this.queue.drain(()=>{
      this.emit("finish", undefined);
      this.removeAllListeners(["error", "finish"]);
    });
  }
}


export default TasksQueue;
