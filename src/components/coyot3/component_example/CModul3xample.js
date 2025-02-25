import { CModul3 } from "../module/CModul3.js";



export class CModul3xample extends CModul3{
  constructor(ac,name){
    super(ac,name);
    this.cmodprops = {
      creationTs : Date.now()
    }
    this.instances = {
      list : [1,2,23,4,5,6,6]
    }
    console.log("i'm alive")
  }
  Init(){
    super.Init();
    console.log(`cmodul3xample : init`)
  }
  Start(){
    super.Start();
    console.log(`cmodul3xample : start`)
    setInterval( () => {
      //console.log(`pulse`);
      if(this.instances.list.length >10)this.instances.list = [];
      this.instances.list.push(Math.random() * 1000);
      //console.log(`::: ${this.instances.list}`)
      if(this.onPulse)this.onPulse(this.instances.list);
    },1000);
  }



}