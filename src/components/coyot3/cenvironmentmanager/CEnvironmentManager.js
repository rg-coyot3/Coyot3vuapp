import { Tools } from "../tools/ctools";
import { w2popup} from 'w2ui'
import { ModuleSpecification } from './CModuleSpecification'
import { ContentClassFlicker } from "./CContentFlicker";
import { LayoutComponent, Layout } from "./CLayoutComponent";
import { EngineLoaderDisplay } from "./CEngineLoaderDisplay";







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
        ask_mods_to_server : false,
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
  set_configuration(conf){this.config.source = conf;}
  setViewport(viewport){this.config.viewport = viewport;}
  
  Init(){

  }
  Start(){
    
    console.log(`cyt-modules-loader : initializing`);

    this.controller.get_content_instance = this.get_content_instance.bind(this);
    this.controller.add_window_listener  = this.add_window_listener.bind(this);

    this.controller.comms_subscribe_event("mods-loader-claim-response",this.on_modules_list_response.bind(this),'cyt-mods-loader');

    //this.instances.cyt_loader_dashboard = new CytEngineLoaderDisplay();
    this.controller.on('on-toolbar-option-click',this._dispatch_menu_command.bind(this));

        
    this.instances.dashboard = $('body');
    this.claim_modules_list();

    

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
    this.vars.modules_configuration = context.modul3s.mods;
    this.vars.layouts_configuration = context.modul3s.layouts;
    context.modul3s.mods.forEach( (mod,i) => {
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
    context.modul3s.layouts.forEach( (lo,i) => {
      
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
      //this.controller.add_layout_selector(newLayout.id(),`lo-${newLayout.id()}`)
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
      this.propagate_after_initialization_actions();
    },1000);
    //this.initialize_incoming_modules_list();
    
  }
  propagate_after_initialization_actions(){
        setTimeout( () => {
        this.controller.add_layout_selector("Tiled", "lo-tiled");
        this.controller.add_layout_selector("Cascade", "lo-cascade");
        Object.keys(this.vars.layouts).forEach( (loid) => {
          this.controller.add_layout_selector(this.vars.layouts[loid].name(),`lo-${this.vars.layouts[loid].id()}`);
        });
        this.set_default_layout();
        //self.instances.cyt_loader_dashboard.hide(750);
        this.controller.signal_event('engine-initialized',true)
      },1500);

  }
  set_default_layout(){
    try{
      this._organize_windows_layout("default");
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
      let configObject = {};
      configObject = {
        root : document.getElementById(this.config.source.d3sktop.viewportRoot)
        
        , title : mod.Title()
        ,onload : () => {
        }
        ,class : ["no-close","no-full", "coyot3"]
        ,border: 1
      };
      configObject = Object.assign(configObject, this.config.viewport);
      //document.getElementById(this.config.source.d3sktop.viewportRoot).style["background-color"] = "blue";
      if(mod.Icon() !== undefined)
      {
        configObject.icon=mod.Icon();
      }

      this.instances.contents.winboxes[mod.Name()] = new WinBox( configObject 
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
      //this.instances.contents.winboxes[mod.Name()].move();
      //this.instances.contents.winboxes[mod.Name()].onmove

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
      if((jsItem.script.length == 0) || (jsItem.script == ":none:")){
        
        if(jsItem.init.length > 0){
          try{
            eval(jsItem.init);
          }catch(err){
            console.error(`cyt-modules-manager : -initialize-module-js : for `
            +`[${mod.Name()}] error initializing js with command `
            +`[${jsItem.init}]. Error=((${err}))`);
          }
        }
        return ;
      }
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

    // let self = this;
    // (function(){
    //   let oldLog = console.log;
    //   console.log = function (message) {
    //       // DO MESSAGE HERE.
    //       self.instances.cyt_loader_dashboard.logger_add_line(message);
    //       oldLog.apply(console, arguments);
    //   };
    // })();

    // (function(){
    //   let oldLog = console.error;
    //   console.error = function (message) {
    //       // DO MESSAGE HERE.
    //       //self.instances.cyt_loader_dashboard.logger_add_line(message);
    //       oldLog.apply(console, arguments);
    //   };
    // })();