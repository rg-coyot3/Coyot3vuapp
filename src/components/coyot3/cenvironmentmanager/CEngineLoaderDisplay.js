export class EngineLoaderDisplay{
  constructor(){

    
    this.vars = {
      instances : {
        loader_container : null,
        logger_dashboard : null,
      }
      ,config : {
        defaults : {

        }
        ,selectors :  {
          loader_container : "#cyt_engine_loader"
          ,logger_dashboard : "#cyt_engine_dashboard_logger"
        }
      }
      ,values : {
        hidden : false
      }
    }
    this.vars.instances.loader_container = $(this.vars.config.selectors.loader_container);
    this.vars.instances.logger_dashboard = $(this.vars.config.selectors.logger_dashboard);

    this.logger_add_line("Initializing...");
    console.log(`cyt-engine-display : created`)
    document.body.addEventListener('keydown', (e)=> {
      this.on_key_press(e);
    });
  }
  show(t){
    this.vars.instances.loader_container.fadeIn( (t === undefined?200:t));
    console.log(`cyt-engine-display : hidding`);
    this.vars.values.hidden = false;
  }
  hide(t){
    this.vars.instances.loader_container.fadeOut( (t === undefined?200:t));
    this.vars.values.hidden = true;
  }
  toggle(t){
    if(this.vars.values.hidden == true){
      this.show(t);
    }else{
      this.hide(t);
    }
  }
  logger_add_line(l)
  {
    this.vars.instances.logger_dashboard.prepend(`<div>${l}</div><br>`);
  }
  logger_clear(){

  }
  on_key_press(e){
    if(this.vars.values.hidden == true){
      return;
    }
    //this.logger_add_line(`pressed ${e.key}`)
    switch(e.key){
      case 'Escape':
        this.hide();
        break;

    }
  }

}