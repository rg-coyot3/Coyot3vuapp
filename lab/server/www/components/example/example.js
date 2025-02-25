


class ExampleManagerClass {
  constructor(){
    this.config = {
      selectors : {
        counter : "#ccounter"
      }
    }

    this.instances = {
      container : null,
      fe : {
        counter : null
      }
    }
    this.vars = {
      counter : 0
    }

    
  }
  Init(){
    this.instances.container = this.controller.get_content_instance("example");
    this.instances.fe.counter = this.instances.container.find(this.config.selectors.counter);
    this.controller.comms_on('ping', this.on_ping.bind(this));

  }
  Start(){
    setInterval( () => {
      //console.log(`counting [${this.vars.counter}]`)
      this.instances.fe.counter.text((this.vars.counter++).toString());
    },1000);
  }


  on_ping(p){
    
  }

}


window.CAppControll3r.add_module(new ExampleManagerClass(),'example-class',true)