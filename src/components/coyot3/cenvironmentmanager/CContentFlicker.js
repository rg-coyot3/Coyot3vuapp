export class ContentClassFlicker{
  constructor(commonClassName,commonFlickerClass,flickerInterval){
    
    this.vars = {
      indexClass          : commonClassName ,
      flickerClass        : commonFlickerClass,
      flickInterval       : flickerInterval,
      state               : false,
      last_transition_ts  : 0,
      flick               : false
    }
    this.instances = {
      contents : $(`.${commonClassName}`),
      interval : null,
    }
  }

  check_transition(){
    switch(this.vars.flick){
      case true:
        this.remove_common_flick_property();
        this.vars.flick = false;
      break;
      case false:
        this.add_common_flick_property();
        this.vars.flick = true;
      break;
    }
  }
  remove_common_flick_property(){
    this.instances.contents.removeClass(this.vars.flickerClass);
  }
  add_common_flick_property(){
    this.instances.contents.addClass(this.vars.flickerClass);
  }

  state(v){
    if(v === undefined)return this.vars.state;
    if(v === this.vars.state){return this.vars.state;}
    this.vars.state = v;

    switch(v){
      case false:
        clearInterval(this.instances.interval);
        this.instances.interval = null;
        this.remove_common_flick_property();
        break;
      case true:
        this.instances.interval = setInterval(this.check_transition.bind(this),this.vars.flickInterval);
        break;
    }
  }
};