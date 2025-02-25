import { Tools } from "../tools/ctools";
import { w2popup} from 'w2ui'
class ContentClassFlicker{
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



class LayoutComponent{
  constructor(){
    this.data = {
      content_id : ""
      ,format : {
        maximized : false,
        minimized : false,
        x : "0",
        y : "0",
        w : "0",
        h : "0",
        classes : [""]
      }
    
    }
  }

  toJson(){
    return this.data;
  }
  fromJson(j){
    
    if(
        !("content_id" in j)
      ||!("format" in j)
    ){
      console.error(`-cyt-mod-spec : layout-component : not all required parameters in component (content_id,format)`);
      return false;
    }
    if(
        !("maximized" in j.format)
      ||!("minimized" in j.format)
      ||!("x" in j.format)
      ||!("y" in j.format)
      ||!("w" in j.format)
      ||!("h" in j.format)
    ){
      console.error(`-cyt-mod-spec : layout-component : not all required parameters in component.format (maximized,minimized,x,y,w,h,classes)`);
      return false;
    }
    
      
    this.data.content_id       = j.content_id;
    this.data.format.maximized = j.format.maximized;
    this.data.format.minimized = j.format.minimized;
    this.data.format.x         = j.format.x;
    this.data.format.y         = j.format.y;
    this.data.format.w         = j.format.w;
    this.data.format.h         = j.format.h;
    this.data.format.classes = j.format.classes;
  
    return true;
  }
  id(v){if(v!==undefined){this.data.content_id = v};return this.data.content_id}
  X(){return this.data.format.x}
  Y(){return this.data.format.y}
  W(){return this.data.format.w}
  H(){return this.data.format.h}
  minimized(m){if(m != undefined){this.data.format.minimized = m}return (this.data.format.minimized === true);}
  maximized(m){if(m != undefined){this.data.format.maximized = m}return (this.data.format.maximized === true);}
  hasPosition(){
    return ((this.data.format.x != undefined) 
            && (this.data.format.y != undefined));
  }
  hasDimensions(){
    return ((this.data.format.w != undefined) 
          && (this.data.format.h != undefined));
  }

  
}

class Layout{
  constructor(){
    this.data = {
      id : ""
      ,name : ""
      ,active: true
      ,toolbar_fastaccess : true
      ,components : {}
    }
  }

  id(i){if(i!== undefined){this.data.id = i}return this.data.id}
  name(v){if(v!==undefined){this.data.name = v}return this.data.name;}
  active(a){if(a !== undefined){this.data.active = a;}return this.data.active;}
  toolbar_fastaccess(tf){if(tf !== undefined){this.data.toolbar_fastaccess = tf;}return this.data.toolbar_fastaccess;}
  component(c){if(c===undefined){return this.data.components}return this.data.components[c];}
  toJson(){
    let cs = [];
    Object.keys(this.data.components).forEach(k=>{
      cs.push(this.data.components[k].toJson());
    });
    return {
      id : this.data.id,
      name : this.data.name,
      active : this.data.active,
      toolbar_fastaccess : this.data.toolbar_fastaccess,
      components : cs
    };
  }
  fromJson(j)
  {
    console.log(`------`);
    this.data.id   = j.id;
    this.data.name = j.name;
    this.data.active = j.active;
    this.data.toolbar_fastaccess = j.toolbar_fastaccess;
    j.components.forEach(k => {
      let lc = new LayoutComponent();
      if(lc.fromJson(k) !== true){
        console.error(`-cyt-mod-spec : layout : fromjson : error parsing input`
        +` for [${this.data.id}]`);
        return;
      }
      console.log(`-cyt-mod-spec : layout : fromjson : adding component [${lc.id()}]`);
      this.data.components[lc.id()] = lc;
    });
    return true;
  }
};

class ModuleSpecification{
  constructor(n){

  
    this.data = {
      id : "",
      name : n,
      active : true,
      content : {
        html : {
          id : "",
          title : "",
          src : "",
          icon : "",
          alias : "",
          format : {
            maximized : false,
            minimized : false,
            x : "0",
            y : "0",
            w : "0",
            h : "0",
            classes : [""]
          },
          
        },
        css : [""],
        css_night : [""],
        js : [
          {
            script  : "",
            init : ""
          }
        ],
        data : [""]
      }
    }

    this.vars = {
      there_is_html : false,
      there_is_css : false,
      there_is_css_night : false,
      there_is_js : false,
      there_is_data : false,
    }
  }
  Id(i){if(i !== undefined){this.data.id = i}return this.data.id;}
  Name(n){if(n !== undefined)this.data.name = n; return this.data.name;}
  Active(a){if(a !== undefined){this.data.active = a;}return this.data.active;}
  Title(t){if(t !== undefined)this.data.content.html.title = t;return this.data.content.html.title;}
  Icon(i){if( i !== undefined)this.data.content.html.icon = i;return this.data.content.html.icon;}
  setFormat(x,y,w,h){
    this.data.content.html.format.x = x;
    this.data.content.html.format.y = y;
    this.data.content.html.format.w = w;
    this.data.content.html.format.h = h;
    return true;
  }
  X(){return this.data.content.html.format.x}
  Y(){return this.data.content.html.format.y}
  W(){return this.data.content.html.format.w}
  H(){return this.data.content.html.format.h}
  minimized(m){if(m != undefined){this.data.content.html.format.minimized = m}return (this.data.content.html.format.minimized === true);}
  maximized(m){if(m != undefined){this.data.content.html.format.maximized = m}return (this.data.content.html.format.maximized === true);}
  hasPosition(){
    return ((this.data.content.html.format.x != undefined) 
            && (this.data.content.html.format.y != undefined));
  }
  hasDimensions(){
    return ((this.data.content.html.format.w != undefined) 
          && (this.data.content.html.format.h != undefined));
  }
  fromRaw(r){
    this.data.content.js = [];
    this.data.content.css = [];
    this.data.content.html.format = {};
    this.data.content.html.src = "";
    this.data.content.html.alias = "";
    this.data.content.html.title = "";

    if( !("name" in r)){
      console.log("cyt-module-specification : error : no name specified");return false;
    }
    
    
    this.data.name = r.name;
    if( !("id" in r))
    {
      this.data.id = this.data.name;
    }else{
      this.data.id = r.id;
    }

    if( !("active" in r))
    {
      this.data.active = true;
    }else{
      this.data.active = r.active;
    }
    
    if( !("content" in r)){
      console.log("cyt-module-specification : error : no content object");return false;
    }
    let c = r.content;
    if(!("css" in c)){this.vars.there_is_css = false;}
    else{
      this.data.content.css = c.css;
      this.data.content.css_night = c.css_night;
      if(this.data.content.css.length == 1 && this.data.content.css[0].length == 0)
      {
        this.vars.there_is_css = false;
      }else{
        this.vars.there_is_css = true;
      }
    }
    if(!("css_night" in c)){this.vars.there_is_css_night = false;}
    else{
      this.data.content.css_night = c.css_night;
      if(this.data.content.css_night.length == 1 && this.data.content.css_night[0].length == 0)
      {
        this.vars.there_is_css_night = false;
      }else{
        this.vars.there_is_css_night = true;
      }
    }
    if(!("data" in c)){this.vars.there_is_data = false;}
    else{this.data.content.data = c.data;this.vars.there_is_data = true;}
    if(!("js" in c)){this.vars.there_is_js = false;}
    else{
      try{
        this.data.content.js = [];
        this.vars.there_is_js = false;
        c.js.forEach( jm => {
          if( !("script" in jm)
            ||!("init" in jm)){console.log("cyt-module-specification : ERROR : js module specification incomplete because does not have required targets ('src', 'init')");}
          else{
            this.vars.there_is_js = true;
            this.data.content.js.push(jm);
          }
        });
        
      }catch(err){
        console.log("cyt-module-specification : error : loading js-data");
      }
    }
    if(!("html" in c)){delete this.data.content.html; this.vars.there_is_html = false;}
    else{
      let hs = c.html;
      if(  !("source" in hs)
         &&!("alias" in hs)){
          this.vars.there_is_html = false;
        console.log("cyt-module-specification : error : no alias or source has been specified!");
        return false;
      }
      this.data.content.html.source = hs.source;
      this.data.content.html.alias = hs.alias;
      if(this.data.content.html.icon!== undefined)this.data.content.html.icon = hs.icon;
      if( !("title" in hs)){
        console.log("cyt-module-specification : error : no title specified");return false;
      }
      if( !("id" in hs)){
        hs.id = hs.title;
      }
      this.data.content.html.title = hs.title;
      if("format" in hs){
        let hsf = hs.format;
        this.data.content.html.format.minimized = hsf.minimized;
        this.data.content.html.format.maximized = hsf.maximized;
        this.data.content.html.format.x = hsf.x;
        this.data.content.html.format.y = hsf.y;
        this.data.content.html.format.w = hsf.w;
        this.data.content.html.format.h = hsf.h;
        if("classes" in hsf){
          this.data.content.html.format.classes = hsf.classes;
        }
      }
      this.vars.there_is_html = true;
    }
    return true;
  }

  toJson(){return this.data;}
  toJsonExport(){
    //hides to the front-end the real route to the html source
    let j=this.toJson();try{delete (j.content.html.source);}catch(err){};return j;
  };

  thereIsHtml(){return this.vars.there_is_html;}
  htmlSource(s){if(s !== undefined)this.data.content.html.source = s; return this.data.content.html.source;}
  htmlAlias(a){if(a !== undefined)this.data.content.html.alias = a; return this.data.content.html.alias;}

  thereIsCss(){return this.vars.there_is_css;}
  getCssList(){return this.data.content.css;}
  thereIsCssNight(){return this.vars.there_is_css_night;}
  getCssNightList(){return this.data.content.css_night;}
  
  thereIsJs(){return this.vars.there_is_js;}
  getJsItems(){return this.data.content.js;}

  thereIsData(){return this.vars.there_is_data;}
  getDataContent(){return this.data.content.data;}
  
  isEmpty(){
    return (this.thereIsCss() || this.thereIsData() || this.thereIsHtml() ||  this.thereIsJs());
  }

};

class ToolbarFastAccessButton{
  /**
   * 
   * @param {*} config : object
   *   id : mandatory : string,
   *   text : optional : text at button,
   *   tip : optional : text for string on hover
   *   img : optional : string- path to image
   *   class : optional : string with the class to add to the selector.
   *   callback : func
   *   
   */
  constructor(config){
    this.config = {
      source : config,
      models : {
        container : `<div class="cyt_toolbar_fastaccess_button">
            <img id="img" src=""/>
          <div id="txt">T</div>
          <span id="tip"></span>
        </div>`
      },
      selectors :  {
         container : `.c_milla_toolbar_fastaccess_button`
        ,image: `#img`
        ,tooltip : `#tip`
        ,text : '#txt'

        

      },
      classes : {
        enabled : `enabled`,
        disabled : `disabled`,
        selected : `selected`
      }

    };
    this.instances = {
      container : null,
      text : null,
      tooltip : null,
      img: null,

      callback : null
    }
    this.vars = {
      imgSrc : "",
      tipMsg : "",
      text : "",
      class : '',

      current_show : '',
      id : "",
      active : '',
    }

    this.instances.container  = $(this.config.models.container);
    this.instances.text       = this.instances.container.find(this.config.selectors.text);
    this.instances.img        = this.instances.container.find(this.config.selectors.image);
    this.instances.tooltip    = this.instances.container.find(this.config.selectors.tooltip);
       
      this.instances.text.removeAttr('id');
      this.instances.img.removeAttr('id');
      this.instances.tooltip.removeAttr('id');
    
    this.vars.id = this.config.source.id;
    this.imageSrc(this.config.source.img);
    this.tip(this.config.source.tip);      
    this.text(this.config.source.text);
    this.class(this.config.source.class);
    this.onclick(this.config.source.callback);
    this.active(true);
    if(this.config.source.img !== undefined)
    {
      this.imageSrc(this.config.source.img);
      this.tip(this.config.source.tip);
    }
    this.instances.callback = this.config.source.callback;

    this.instances.container.click(this._on_click.bind(this));
    console.log(`toolbar-fast-access-icon : creating [${this.vars.id}]`);

  }
  onclick(c){
    this.instances.callback = c;
  }
  _on_click(){
    if(this.instances.callback !== null){
      this.instances.callback(this.vars.id);
    }

  }
  active(a){
    if(this.vars.active === a){
      return this.vars.active;
    }
    this.vars.active = a;
    if(this.vars.active == false){
      this.instances.container.removeClass(this.config.classes.enabled);
      this.instances.container.addClass(this.config.classes.disabled);
    }else if(this.vars.active == true){
      this.instances.container.addClass(this.config.classes.enabled);
      this.instances.container.removeClass(this.config.classes.disabled);
    }
  }
  selected(s){
    if(this.vars.selected === s){
      return this.vars.selected;
    }
    this.vars.selected = s;
    if(this.vars.selected == false){
      this.instances.container.removeClass(this.config.classes.selected);
    }else if(this.vars.active == true){
      this.instances.container.addClass(this.config.classes.selected);
    }
  }

  class(c){
    if(c === undefined){
      return this.vars.class;
    }
    if(c == this.vars.class){
      return this.vars.class;
    }
    if(this.vars.class !== undefined)
    {
      this.instances.container.removeClass(this.vars.class);
    }
    this.vars.class = c;
    this.instances.container.addClass(this.vars.class);
    return this.vars.class;
    
  }
  imageSrc(path_to_image){
    if(path_to_image === undefined || path_to_image == ''){
      return this.vars.imgSrc;
    }

    
    if(this.vars.current_show !== 'img'){
      this.instances.text.hide();
      this.instances.img.show();
      this.vars.current_show = 'img';
    }

    if(path_to_image === this.vars.imgSrc){
      return this.vars.imgSrc;
    }

    this.vars.imgSrc = path_to_image;
    this.instances.img.attr("src",this.vars.imgSrc);

    return this.vars.imgSrc;
  }

  tip(alter_tip){
    this.vars.tipMsg = alter_tip;
    this.instances.tooltip.html(alter_tip);
  }
  text(text){
    if(text === undefined || text == ''){
      return this.vars.text;
    }
    if(this.vars.current_show !== 'txt')
    {
      this.instances.text.show();
      this.instances.img.hide();
      this.vars.current_show = 'txt';
    }
    if(text === this.vars.text){
      return this.vars.text;
    }
    this.vars.text = text;
    this.instances.img.hide();
    this.instances.text.html(this.vars.text[0]);

    
    return this.vars.text;
  }
  

  getInstance(){
    return this.instances.container;
  }
};

/**
 * {
 *    insertionPoint : jq-instance
 *    callback       : function
 * }
 */
class LayoutSelector{
  constructor(cfg){
    this.vars = {
      config : {
        selectors : {
          on_selected : '',
          on_unselected : '',
        }
      },
      instances : {
        insertion_point : null,
        container : null,
        on_pushed : null,
        contents : {},
        callback : null,

      },
      models : {
        container : `
        <div style="height:100%;margin-left:10pt;margin-right:10pt;display:flex;flex-direction:row;">
        </div>
        `
      },
      values : {

      }
    }
    this.vars.instances.container = $(this.vars.models.container);
    this.vars.instances.insertion_point = cfg.insertionPoint;
    this.vars.instances.insertion_point.append(this.vars.instances.container);
    this.vars.instances.callback = cfg.callback;


  }
  
  /*
  *   id : mandatory : string,
  *   text : optional : text at button,
  *   tip : optional : text showed on-hover
  *   img : optional : string- path to image
  *   class : optional : string with the class to add to the selector.
  * */
  add_choice(cfg){
    this.vars.instances.contents[cfg.id] = new ToolbarFastAccessButton(
      {
        id       : cfg.id,
        text     : cfg.text,
        tip      : cfg.tip,
        img      : cfg.img,
        class    : cfg.class,
        callback : this._on_choice_clicked.bind(this)
      });
    
    
    this.vars.instances.contents[cfg.id].onclick = this._on_choice_clicked.bind(this);
    //console.log(`**** : ${this.vars.instances.contents[cfg.id].getInstance().html()}`)
    this.vars.instances.container.append(
      this.vars.instances.contents[cfg.id].getInstance()
    );
  }
  

  onclick(f){
    this.vars.instances.callback = f;
  }
  _on_choice_clicked(id){
    //console.log(`#### --- #) ${Object.keys(this.vars.instances.contents).length} : ${id}`)

    Object.keys(this.vars.instances.contents).forEach(sid => {
      //console.log(`#### --- ${id} : ${sid}`)
      this.vars.instances.contents[sid].selected( (id == sid?true:false) );
    });
    if(this.vars.instances.callback !== null){
      this.vars.instances.callback(id);
    }
  }


  class_set_on_selected(c){

  }
  class_set_on_unselected(c){

  }
  


};

class CytEngineLoaderDisplay{
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


/**
 * 
 * Exposed methods:
 *  add_window_listener(module-name,window-event-type,callback)
 * 
 * Events:
 *  
 *  CYT3_HOTKEYS_OFF : disable hotkeys
 *  CYT3_HOTKEYS_ON  : enable hotkeys
 * 
 * 
 */

export class CEnvironmentManager {
  constructor(ac){
    console.log(`creating instance of environment-manager`)
    this.controller = ac;
    this.controller.get_content_instance = this.get_content_instance.bind(this);

    this.config = {
      selectors : {
        windows_selector : '',
        dashboard : '#app',
        toolbarModel : '#milla-toolbar',
        toolbarAboutIcon : '#milla-toolbar-icon', 
        layouts_selector : '#desktop-layouts-selector',
      },
      classes : {
        windowContainerAlert : "milla_window_modifier_state_alert",
      }
      ,models : {
        toolbar : `<div class="c_milla_toolbar"></div>`
      }
      ,params : {
        ask_mods_to_server : true,
      }
      ,misc : {
        cascade_increment : 30
        ,custom_layout_select_prefix : `custom_layout_select_`
      }
      ,viewport : { top : 0 , bottom : 0, left : 0, right : 0}
    };
    this.vars = {
      modules : {
        do_request : true
        ,list : {}
      },
      layouts : {}
      ,
      initial_position : {
        x : 5,
        y : 5
      }
      ,misc : {
        cascade_window_size : 0,
        ongoing_global_alert : {
          state_on : false,
          timer_instance : null,
          frontend_transition_state : false,
        }
      },
      hotkeys : {
        enabled : true,
        layouts : {}
      }
      ,windows : {
        listeners : {        
          
          instances : {}
        }
      }
      ,layout : {
        font_size : 14,
        font_size_default : 14,
        badge_dimension : 92,
        badge_dimension_default : 92,
        night_mode : false
      }
      
    };
  this.instances = {
      appcontroller : null,
      test : null,
      screen_lock : null,
      toolbarContainer : null,
      contents : {
        winboxes : {},
        html : {},
        css : {},
        js : {}
      }

      ,dashboard : null
      ,layout_selector : null
      ,layout_selector_insertion_point : null
      ,layout_fonts_size_choice : null
      ,layout_selector_daynight : null

      ,flicker_events : {

      }

    };
  }
  setViewport(viewport){this.config.viewport = viewport;}
  askModsToServer(opt){this.config.params.ask_mods_to_server = opt;}
  Init(){

  }
  Start(){
    
    console.log(`cyt-modules-loader : initializing`);

    this.controller.get_content_instance = this.get_content_instance.bind(this);
    this.controller.add_window_listener  = this.add_window_listener.bind(this);

    this.controller.comms_subscribe_event("mods-loader-claim-response",this.on_modules_list_response.bind(this),'cyt-mods-loader');

    //this.instances.cyt_loader_dashboard = new CytEngineLoaderDisplay();
    this.controller.on('on-toolbar-option-click',this._dispatch_menu_command.bind(this));
    this.controller.add_layout_selector("Tiled", "lo-tiled");
    this.controller.add_layout_selector("Cascade", "lo-cascade");
        
    this.instances.dashboard = $('body');
    this.claim_modules_list();

    
    let self = this;
    // (function(){
    //   let oldLog = console.log;
    //   console.log = function (message) {
    //       // DO MESSAGE HERE.
    //       self.instances.cyt_loader_dashboard.logger_add_line(message);
    //       oldLog.apply(console, arguments);
    //   };
    // })();

    (function(){
      let oldLog = console.error;
      console.error = function (message) {
          // DO MESSAGE HERE.
          //self.instances.cyt_loader_dashboard.logger_add_line(message);
          oldLog.apply(console, arguments);
      };
    })();
  }


  claim_modules_list(){
    if(this.config.params.ask_mods_to_server !== true){
      console.log(`cenvironment-manager : claim-modules-list : from server is deactivated.`);
      return true;
    }
    console.log(`cyt-modules-loader : claim-modules-list : `);
    if(this.vars.modules.do_request != true){
      console.log(`cyt-modules-loader : claim-modules-list : already here`);
      return false;
    }
    
    this.controller.comms_send_packet("mods-loader-claim-request","");
    setTimeout( this.claim_modules_list.bind(this),2000);
  }
  on_modules_list_response(context){
    //console.log(`cyt-modules-loader : mods-list-response : ${JSON.stringify(context,null,'\t')} `);
    console.log("Obtained modules list from server. Now parsing.");
    if(this.vars.modules.do_request === false){
      return true;
    }
    this.vars.modules.do_request = false;
    this.configure_workspace_context(context);    
    return true;
    
  }


  configure_workspace_context(context){
    this.vars.modules_configuration = context.mods;
    this.vars.layouts_configuration = context.layouts;
    context.mods.forEach( (mod,i) => {
      console.log(`Parsing module [${mod.name}]`);
      let modSpec = new ModuleSpecification();
      if(!modSpec.fromRaw(mod)){
        console.error(`cyt-modules-controller : error : imposible to create module model instance from [${JSON.stringify(mod)}]`);
        console.log(`Parsing module [${mod.name}] : ERROR PARSING MODULE SPECIFICATION.`);
        return false;
      }
      console.log(`cyt-modules-controller : on-mods-list-response : checking-in instance for [${modSpec.Name()}]`);
      this.vars.modules.list[modSpec.Name()] = modSpec;
      console.log(`Parsing module [${mod.name}] : OK.`);

    });
    let hotkey=1;
    context.layouts.forEach( (lo,i) => {
      
      let newLayout = new Layout();
      console.log(`Parsing layout specification: [${lo.name}]`);
      if(newLayout.fromJson(lo) == false)
      {
        console.log(`cyt-modules-controller : on-mods-list-response specification: checking-in instance for [${newLayout.id()}]`);
        console.log(`Parsing layout : [${lo.name}] : ERROR!`);
        return false;
      }
      if(newLayout.active() !== true)
      {
        console.log(`cyt-modules-controller : on-mods-list-response specification: ignoring layout [${newLayout.id()}]`);
        return;
      }
      this.vars.layouts[newLayout.id()] = newLayout;
      this.controller.add_layout_selector(newLayout.id(),`lo-${newLayout.id()}`)
      console.log(`Parsing layout specification: [${lo.name}] : ok`);
      //AQUI : INJECTAR SELECTOR DE LAYOUT

      if(hotkey <10)
      {
        this.vars.hotkeys.layouts[hotkey.toString()] = newLayout;
        hotkey++;
      }
    });
    setTimeout(() => {
      this.vars.module_initialization_index = 0;
      this.initialize_incoming_modules_list();
      
      setTimeout( () => {
        this.set_default_layout();
        //self.instances.cyt_loader_dashboard.hide(750);
        this.controller.signal_event('engine-initialized',true)
      },1500);
    },1000);
    //this.initialize_incoming_modules_list();
    
  }
  
  set_default_layout(){
    try{
      //this._organize_windows_layout("default");
    }catch(err){
      console.error(`configure-workspace-context : exception rised while `
        +`configuring workspace : retrying to set the default layout. [${err.toString()}]`);
      setTimeout(() => {
        this.set_default_layout();
      },500);
    }
    
  }

  get_content_instance(target){
    if(this.instances.contents.html[target] == undefined){
      console.error(`cyt-modules-manager : get-content-instance : not found content-instance for [${target}]`);
      return null;
    }
    console.log(`cyt-modules-manager : get-content-instance : serving jqmodel for [${target}]`);
    return this.instances.contents.html[target];
  }

  initialize_incoming_modules_list(){
    if(this.vars.module_initialization_index >= Object.keys(this.vars.modules.list).length){
      console.log(`cyt-modules-manager : all modules initialized`);
      this.set_default_layout();
      return;
    }
    this._initialize_module(this.vars.modules.list[Object.keys(this.vars.modules.list)[this.vars.module_initialization_index]]);
  }

  _initialize_module_prepare_next(){
    this.vars.module_initialization_index++;
    this.initialize_incoming_modules_list();
  }
  _initialize_module(m){
    console.log(`cyt-modules-loader : initialize_module : initializing [${m.Name()}]`);
    //load data?

    //load css
    if(m.thereIsCss()== true)
    {
      this._initialize_module_css(m.getCssList(),m.Name());
    }
    

    //load html and include in window as well as in a tab
    if(m.thereIsHtml() == true)
    {
      this._initialize_module_html(m);
    }else if(m.thereIsJs() == true){
      this._initialize_module_js(m);
    }else{
      this._initialize_module_prepare_next();
    }
    //load js
  }

  _initialize_module_css(cssList,logname){

    cssList.forEach(item => {
      console.log(`cyt-modules-loader : -initialize-module-css : loading [${item}]`);
      console.log(`Rendering module [${logname}] : loading css : ${item}`);
      this.instances.contents.css[item] = Tools.LoadExternalCss(item,this._initialize_module_css_callback_initialized.bind(this));

    });
  }
  _initialize_module_css_callback_initialized(url){
    console.log(`cyt-modules-manager : -initialize-module-css-loaded : done [${url}]`);

  }

  
  add_window_listener(mod_name, event_type, callback){
    // mod_name : name of the module

    if(this.vars.windows.listeners.instances[mod_name] === undefined){
      console.log(`cyt-environment-loader : add-window-listener : ERROR : `
        +`no module found with name [${mod_name}]`);
      return false;
    }
    if(this.vars.windows.listeners.instances[mod_name][event_type] === undefined)
    {
      console.log(`cyt-environment-loader : add-window-listener : ERROR : `
        +`for module [${mod_name}] it is not possible to add listener for event `
        +`[${event_type}]`);
      return false;
    }
    this.vars.windows.listeners.instances[mod_name][event_type].push(callback);
    console.log(`cyt-environment-loader : add-window-listener : for module `
      +`[${mod_name}] added listener callback for event [${event_type}]`);
    return true;
  }

  _dispatch_window_event(mod_name,event_type,...args){
    try{
      this.vars.windows.listeners.instances[mod_name][event_type].forEach(cb => {
        //console.log(`img-container resized dispatch-event [${mod_name}][${event_type}] ${JSON.stringify(args,null,'\t')}`);

        cb(...args);
      });
    }catch(err){
      console.log(`For [${mod_name}], exception rised dispatching event [${event_type}] because [${err.toString()}]`);
    }
  }

  _initialize_module_html(mod){
    let target = "";

    if(mod.htmlSource() != undefined)
    {
      target = mod.htmlSource();
    }else{
      target = mod.htmlAlias();
    }

    console.log(`cyt-modules-manager : -initialize-module-html : loading module [${target}]`);
    console.log(`Rendering module [${mod.Name()}] : loading html : [${target}]`);
    this.instances.contents.html[mod.Name()] = Tools.LoadExternalHtmlContent(target
    ,(url,jqInstance) => {
      console.log(`-initialize-module-html : loaded for module [${mod.Name()}]. Now checking Js`);
      let configObject = {
        onload : () => {
        }
        ,top : this.config.viewport.top
        ,bottom : this.config.viewport.bottom
        ,left : this.config.viewport.left
        ,right : this.config.viewport.right
        
        ,class : ["no-close","no-full", "modern"]
        ,border: 2
        
        
      };
      if(mod.Icon() !== undefined)
      {
        configObject.icon=mod.Icon();
      }

      this.instances.contents.winboxes[mod.Name()] = new WinBox(mod.Title()
      , configObject 
      );
      this.controller.signal_event('add-window-selector',mod.Title(),mod.Name(),this.on_toolbar_selector_clicked.bind(this))

      //winbox callbacks - begin

      this.vars.windows.listeners.instances[mod.Name()] = {
      oncreate : [],
      onshow : [],
      onhide : [],
      onclose : [],
      onfocus : [],
      onblur : [],
      onmove : [],
      onresize : [],
      onfullscreen : [],
      onmaximize : [],
      onminimize : [],
      onrestore : [],
      }

      let self = this;

      this.instances.contents.winboxes[mod.Name()].onfocus = function(){
        self.on_winbox_focus(this);
        self._dispatch_window_event(mod.Name(),'onfocus');
        this.show();
      };
      this.instances.contents.winboxes[mod.Name()].onminimize = function(){
        this.hide();
        self._dispatch_window_event(mod.Name(),'onminimize');
      }
      this.instances.contents.winboxes[mod.Name()].onrestore = function(){
        this.show();
        self._dispatch_window_event(mod.Name(),'onrestore');
      }
      this.instances.contents.winboxes[mod.Name()].oncreate = function(options){
        self._dispatch_window_event(mod.Name(),'oncreate',options,this.width,this.height);
      }
      this.instances.contents.winboxes[mod.Name()].onmove = function(x,y){
        self._dispatch_window_event(mod.Name(),'onmove',x,y,this.width,this.height);
      }
      this.instances.contents.winboxes[mod.Name()].onresize = function(w,h){
        //console.log(`window resized : ${w},${h}`);
        self._dispatch_window_event(mod.Name(),'onresize',w,h);
      }
      this.instances.contents.winboxes[mod.Name()].onfullscreen = function(x,y){
        self._dispatch_window_event(mod.Name(),'onfullscreen',x,y,this.width,this.height);
      }
      this.instances.contents.winboxes[mod.Name()].onmaximize = function(){
        self._dispatch_window_event(mod.Name(),'onmaximize');
      }
      this.instances.contents.winboxes[mod.Name()].onrestore = function(){
        self._dispatch_window_event(mod.Name(),'onrestore');
      }
      this.instances.contents.winboxes[mod.Name()].onhide = function(){
        self._dispatch_window_event(mod.Name(),'onhide');
      }
      this.instances.contents.winboxes[mod.Name()].onshow = function(){
        self._dispatch_window_event(mod.Name(),'onshow');
      }
      this.instances.contents.winboxes[mod.Name()].onclose = function(force){
        self._dispatch_window_event(mod.Name(),'onclose',force);
      }
      this.instances.contents.winboxes[mod.Name()].onblur = function(force){
        self._dispatch_window_event(mod.Name(),'onblur');
      }
      
      //winbox callbacks - end ::: this.instances.contents.html[mod.Name()]
      this.instances.contents.html[mod.Name()].container = this.instances.contents.winboxes[mod.Name()].body;
      this.instances.contents.winboxes[mod.Name()].mount(this.instances.contents.html[mod.Name()].get(0));
      if(mod.hasDimensions()){
        this.instances.contents.winboxes[mod.Name()].resize(mod.W(),mod.H());
      }
      
      if(mod.hasPosition()){
        this.instances.contents.winboxes[mod.Name()].move(mod.X(),(mod.Y()))
      }else{
        this.instances.contents.winboxes[mod.Name()].move(`${this.vars.initial_position.x}px`,`${this.vars.initial_position.y}px`);
        this.vars.initial_position.x+=15;
        this.vars.initial_position.y+=15;
      }
      //this.instances.contents.winboxes[mod.Id()].minimize();

      this.instances.contents.winboxes[mod.Name()].onmove

      if(mod.thereIsJs() == true)
      {
        console.log('-initialize-module-html-winbox-created : contains js-modules')
        this._initialize_module_js(mod);
      }else{
        this._initialize_module_prepare_next();
      }

      console.log(`Rendering module [${mod.Name()}] : loading html : DONE : [${target}]`);
    });
    
  }
  on_toolbar_selector_clicked(e){
    console.log(`cenvironment-manager : toolbar-selector-clicked : [${e.target}]`);
    this.instances.contents.winboxes[e.target].focus();
  }

  on_winbox_focus(i){
    // let dw = this.instances.dashboard.width();
    // let dh = this.instances.dashboard.height();
    // console.log(`window focus [(${i.x},${i.y}) => (${i.width},${i.height})]`)
    // console.log(`window focus [(${(i.x / dw)*100}%,${(i.y / dh)* 100}%) => (${(i.width / dw) * 100}%,${(i.height / dh) * 100}%)]`)
  }

  _initialize_module_js(mod){
    if(mod.thereIsJs() == false){
      return;
    }
    let res = 0;
    mod.getJsItems().forEach( (jsItem,index) => {
      console.log(`cyt-modules-manager : -initialize-modules-js : for [${mod.Name()}] getting js item [${jsItem.script}]`)
      console.log(`Rendering module [${mod.Name()}] : loading js : [${jsItem.script}]`);
      Tools.LoadExternalJs(jsItem.script, (err) => {
        res++;
        if(err){
          console.error(`cyt-modules-manager : -initialize-module-js : error loading js-item [${jsItem.script}]. Error=((${JSON.stringify(err)}))`);
          return false;
        }
        console.log(`cyt-modules-manager : -initialize-module-js : initialized ((${jsItem.script})). Now launching Init command [${jsItem.init}]`)
        try{
          if(jsItem.init.length >0)
          {
            eval(jsItem.init);
          }
          console.log(`Rendering module [${mod.Name()}] : loading js : OK : [${jsItem.script}]`);

        }catch(err){
          console.error(`cyt-modules-manager : -initialize-module-js : for `
          +`[${mod.Name()}] error initializing js with command [${jsItem.init}]`
          +`. Error=((${err}))`)
          console.log(`Rendering module [${mod.Name()}] : loading js : ERROR!: [${jsItem.script}]`);
        }
        if(res >= mod.getJsItems().length){
          this._initialize_module_prepare_next();
        }
      });
    });
  }

  check_environment_status()
  {
    let ls = this.controller.getVar('linkStatus');
    //console.log(`global alert = ${ls}`);
    switch(ls)
    {
      case 'good':
          this.ongoing_global_alert(false);
          break;
      case 'bad':
          this.ongoing_global_alert(true);
          break;
      default:
          this.ongoing_global_alert(false);
        
    }
  }



  _dispatch_menu_command(action)
  {
    
    let acts = action.split(':');
    console.log(`dispatching-menu-command : ${action} >> ${acts[acts.length - 1]}`);
    

    switch(acts[acts.length-1])
    {
      case 'lo-tiled':
        return this._organize_windows_tiled();
        break;
      case 'lo-cascade':
        return this._organize_windows_cascade();
        break;
      case 'reload':
        return this._reload_contents();
        break;
      case 'main-menu-about':
        return this._show_about_box();
        break;  
    }
    if(acts[acts.length-1].startsWith('lo-'))return this._organize_windows_layout(acts[acts.length-1].substring(3));
    if(acts[acts.length-1].indexOf(this.config.misc.custom_layout_select_prefix) == 0){
      
      let loname = acts[acts.length-1].substring(this.config.misc.custom_layout_select_prefix.length);
      console.log(`-dispatch-menu-command : custom layout select : ${acts[acts.length - 1]}] => [${loname}]`);
      this._organize_windows_layout(loname);

    }
  }

  _engine_toggle(){
    //this.instances.cyt_loader_dashboard.toggle();
  }
  _show_about_box()
  {
    console.log(`show about`);
    let content = 'Coyot3.vueapp'
      +'<br><br>Version 0.0.1';
    w2popup.open({
      title: 'About',
      body: content,
      actions: {
          Close(event) {
             w2popup.close()
          }
      }
    });
  }

  _reload_contents()
  {
    let thisIsTeleopInstance = this.controller.getVar('isTeleopInstance');
    console.log(`reload-contents`);
    let content = 'This control interface will reload. ';
    if(thisIsTeleopInstance === true)
    {
      content+='<br>Currently THIS IS the active Teleoperation interface. Once'
      +' reloaded this instance, the Milla vehicle will consider that there is'
      +' no active teleoperator supervising the operation.';
    }
    content+='<br><br>Are you sure you want to continue?'
    w2popup.open({
      title: 'Reload Window',
      body: 'Do you really want to reload this window?',
      actions: {
          Ok(event) {
             w2popup.close();
             location.reload();
          },
          Cancel(event) {
             w2popup.close()
          }
      }
    });
  }

  _organize_windows_tiled()
  {
    let x = 0,y=0;
    
    let dimhor,dimver;
    dimhor = this.instances.dashboard.width();
    dimver = this.instances.dashboard.height();
    let numWindows = Object.keys(this.instances.contents.winboxes).length;
    let winsPerRows = Math.ceil(Math.sqrt(numWindows));
    console.log(`organize-windows-tiled : ${winsPerRows} per row`);
    dimhor=(dimhor/winsPerRows);
    dimver=(dimver/winsPerRows);

    let indexRow = 0;
    Object.keys(this.instances.contents.winboxes).forEach( wbk => {
      let target = this.instances.contents.winboxes[wbk];
      target.move(`${x}px`,`${y}px`);
      target.resize(`${dimhor}px`,`${dimver}px`);
      x+=dimhor;
      indexRow++;
      //console.log(`**** indexRow = ${indexRow} vs winsperrow ${winsPerRows}`)
      if(indexRow >= winsPerRows)
      {
        x=0;
        y+=dimver;
        indexRow = 0;
      }
    });
  }
  _calculate_cascade_size()
  {
    
    let dimhor,dimver;
    dimhor = this.instances.dashboard.width() - 100;
    dimver = this.instances.dashboard.height() - 100;
    let numWindows = Object.keys(this.instances.contents.winboxes).length;
    if(dimhor > dimver){
      this.vars.misc.cascade_window_size = (dimver - (this.config.misc.cascade_increment * numWindows));
    }else{
      this.vars.misc.cascade_window_size = (dimhor - (this.config.misc.cascade_increment * numWindows));
    }
  }
  _organize_windows_cascade()
  {
    let x = 0;
    let dim = 0;
    let dimhor,dimver;
    dimhor = this.instances.dashboard.width();
    dimver = this.instances.dashboard.height();
    this._calculate_cascade_size();
    dim = this.vars.misc.cascade_window_size;

    Object.keys(this.instances.contents.winboxes).forEach( wbk => {
      let target = this.instances.contents.winboxes[wbk];
      target.move(`${x}px`,`${x}px`);
      target.resize(`${dim}px`,`${dim}px`);
      x+=this.config.misc.cascade_increment;

    });
  }


  __set_window_layout(wb,lo){

    if(lo.minimized()== true)
    {
      wb.minimize(lo.minimized());
      return;
    }else if(lo.maximized()== true)
    {
      wb.maximize(lo.maximized());
      wb.focus();
      return ;
    }
    wb.minimize(false);
    wb.maximize(false);
    

    if(lo.hasPosition())
    {
      wb.move(lo.X(),lo.Y());
    }
    if(lo.hasDimensions())
    {
      wb.resize(lo.W(),lo.H());
    }
    wb.focus();
    
  }
  
  _organize_windows_layout(loname)
  {
    let loi = this.vars.layouts[loname];
    
    console.log(`**** ${JSON.stringify(loi,null,'\t')}`);

    Object.keys(this.vars.layouts[loname].component()).forEach( ck => {
      //console.log(`**** ${ck}`)
      
      let c = this.vars.layouts[loname].component(ck);
      if(this.instances.contents.winboxes[c.id()] === undefined){
        console.warn(`organize-windows-layout : module [${c.id()}] not found. Is it disabled?`);
        return;
      }
      let target = this.instances.contents.winboxes[c.id()];
      this.__set_window_layout(target,c);
      
    });

  }





  _winbox_focus(id){
    if(this.instances.contents.winboxes[id] === undefined){
      return;
    }
    console.log("*** focusalizannnndo")
    this.instances.contents.winboxes[id].focus();

    this.instances.contents.winboxes[id].restore();
  }



}

