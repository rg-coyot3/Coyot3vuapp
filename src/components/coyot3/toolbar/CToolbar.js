import {w2ui, query, w2toolbar} from 'w2ui'
import { Tools } from '../tools/ctools'
/**
 * method: add_application_selector(text,id,callbackOnClick,options)
 * method: add_menu_option(text,id,callbackOnClick,options)
 * method: add_layout_selector(text, id, callbackOnClick, options)
 * method: add_toolbar_widget(elinstance, id, callbackOnClick?, options)
 * -- emits
 * event : on-toolbar-option-click , 'text'
 * -- slots
 * add-window-selector
 * add-startup-option
 */

export class ToolbarManager {
  constructor(config){
    this.config = {
      source    : config , 
      selector  : config.d3sktop.toolbar.selector,
      id        : config.d3sktop.toolbar.id,

      styles : {
        mainToolbar : `border-top: 1px solid black; background-color: blue`,
        button : ``, 
      },
      toolbarMainMenu : { type: 'menu', id: 'main-menu', text: 'APP', style: Tools.json2cssstring(config.d3sktop.toolbar.style.bar.css),
        items: [
          { text : '--' , id : 'main-menu-sep-02',style: Tools.json2cssstring(config.d3sktop.toolbar.style.bar.css)},
          { text: 'About', id : 'main-menu-about' , icon: 'fa fa-camera',style: Tools.json2cssstring(config.d3sktop.toolbar.style.bar.css) , items : []},
        ]
      },
      appsSelectorsOptions : {}
    }
    this.instances = {
      container : null,
      callbacks : {
        optionClicked : null,
      }
    }
    this.vars = {
      initialized : false,
      toolbarItems : [
        this.config.toolbarMainMenu,
        { type: 'break' , id : "apps-instances-ep"},
        { type: 'break' },
        { type: 'spacer' , id : "spacer-a"},
        { type: 'break' , id : "layouts-selectors-ep"},
        { type: 'break' , id : "rightest-zone"},
      ]
      ,layoutSelectorsInfo : {
        "@" : "nameOfTheDistribution"
      },
      im_rendered : false
    }
    
  }

  onButtonClicked(cb){this.instances.callbacks.optionClicked = cb;}
  add_layout_selector(text, id, callbackOnClick, options){
    
    let t = text.toString().toUpperCase();
    let f = false;
    let l = '';
    for(let i = 0;(i < t.length) && (f == false); ++i){
      if(this.vars.layoutSelectorsInfo[t[i]]==undefined){
        f = true;
        this.vars.layoutSelectorsInfo[t[i]] = text;
        l = t[i];
      }
    }
    if(f == false){l = t[0];}

    let v = {
      type : 'button',
      id   : id,
      text : l,
      tooltip : text, 
      onClick : (callbackOnClick === undefined?null:callbackOnClick)
      ,style : Tools.json2cssstring(this.config.source.d3sktop.toolbar.style.selectors.css)
    }
    this.instances.container.insert("layouts-selectors-ep",v);
  }
  __defer_til_rendered(func,...args){
    //console.log(`TEST15- deferring til rendered: [${JSON.stringify(...args)}]`)
    if(this.vars.im_rendered === true)return false;
    setTimeout(() => {
      console.log(`CTOOLBAR : DEFERRED ACTION : `);
      if(this.vars.im_rendered === false)return this.__defer_til_rendered(func,...args);
      func(...args);
    },1000);
    return true;
  }
  add_toolbar_widget(element, id, callbackOnClick, options){
    console.log( `CTOOLBAR: adding widget : ${id}`);
    if(this.__defer_til_rendered(
        this.add_toolbar_widget.bind(this),
        element,
        id,
        callbackOnClick,
        options)== true)
      return true;


    let self = this;
    let v = {
      type : 'html',
      id   : id,
      onClick : (callbackOnClick === undefined?null:callbackOnClick),
      async onRefresh(event){
        await event.complete;
        query(this.box).find(`#tb_${self.config.source.d3sktop.toolbar.id}_item_${id}`).append(element);
      }
    }
    this.instances.container.insert("rightest-zone",v);
  }



  add_application_selector(text,id,callbackOnClick,options){
    if(this.__defer_til_rendered(
      this.add_application_selector.bind(this),
      text,
      id,
      callbackOnClick,
      options)== true)
    return true;
    let v = {
      type : 'button',
      id   : id,
      text : text,
      onClick : (callbackOnClick === undefined?null:callbackOnClick),
      style : Tools.json2cssstring(this.config.source.d3sktop.toolbar.style.selectors.css)
    }
    this.config.appsSelectorsOptions[v.id] = {...v};
    if(this.instances.container== null) {this.vars.toolbarItems.push(v);return;}
    console.log(`TEST15- CTOOLBAR-ADD APPS SELECOR OPTIONS FOR [${v.id}]((${JSON.stringify(this.config.appsSelectorsOptions)}))`)
    
    this.instances.container.insert("apps-instances-ep",v);
  }  
  __search_index_for_start_menu_option(index,o){
    let obj = null;
    if(o.items == null)return null;
    o.items.forEach( opt => {
      
      if(obj !== null)return;
      console.log(`checking [${opt.id}] == [${index}]? (${opt.id == index})`)
      if(opt.id == index) { 
        console.log(`found [${index}]`)
        obj = opt; 
        if(opt.items == undefined)
        {
          opt.items = [];
          opt.type = 'menu';
        }
        return;
      }else{
        obj = this.__search_index_for_start_menu_option(index,opt); 
      }
    });
    return obj;
  }
  add_menu_option(text,id,callback,options){
    if(this.__defer_til_rendered(
      this.add_menu_option.bind(this),
      text,
      id,
      callback,
      options) == true)
    return true;
    let v = {
      type : 'button',
      id   : id,
      text : text,
      onClick : (callback === undefined?null : callback)
    }

    let indexInstanceConf;
    //console.log(`TEST15- buscando : ${JSON.stringify(options)} || ${JSON.stringify(this.config.appsSelectorsOptions)}`)
    let getItFromBar = false;

    // SLEECT THE GOOD BUTTON
    if(options == null)options = {};
    if(options.appSelector == undefined){
      indexInstanceConf = this.config.toolbarMainMenu;
    }
    else if(this.config.appsSelectorsOptions[options.appSelector] == undefined){
      indexInstanceConf = this.config.toolbarMainMenu;
    }else{
      indexInstanceConf = this.config.appsSelectorsOptions[options.appSelector];
      if(indexInstanceConf.type != 'menu'){
        indexInstanceConf.type = 'menu';
        indexInstanceConf.items = [];
        console.log(`TEST15- REDRAWING!!!`)
        this.instances.container.get(indexInstanceConf.id).items = [];
        this.instances.container.get(indexInstanceConf.id).type = 'menu';
        this.instances.container.refresh();
      }
    }
    let indexObject;
    if(options.index != null){
      indexObject = this.__search_index_for_start_menu_option(options.index,indexInstanceConf)
    }else{
      indexObject = indexInstanceConf;
    }
    if(indexObject == null) indexObject = indexInstanceConf;
    if(indexObject == indexInstanceConf){
      getItFromBar = true;
    }
    indexObject.items = [v].concat(indexObject.items);
    if(this.instances.container == null)return;
    if(getItFromBar == true){
      this.instances.container.get(indexObject.id).items = indexObject.items;
    }


    return;

    indexObject.items = [v].concat(indexObject.items);
    if(this.instances.container== null) {return;}
    console.log(`getting ${indexObject.id}, and appending ((${JSON.stringify(indexObject,null,`\t`)}))`)
    try{this.instances.container.get(indexObject.id).items = indexObject.items;}
    catch(err){console.warn(`*** - to debug... why this works even if: [${err.toString()}]`);}
    this.instances.container.refresh();
  }
  appcontroller(c){if(c !== undefined)this.controller = c; 
    if(this.controller != undefined){
      this.controller.add_menu_option = this.add_menu_option.bind(this);
      this.controller.add_application_selector = this.add_application_selector.bind(this);
      this.controller.add_layout_selector = this.add_layout_selector.bind(this);
      this.controller.add_toolbar_widget = this.add_toolbar_widget.bind(this);
      this.controller.on('add-window-selector', this.add_application_selector.bind(this) )
      this.controller.on('add-startup-option', this.add_menu_option.bind(this) )
      
    }
    return this.controller;
    
  }
  Init(){
    
  }
  Start(){
    this._scrach_start();
    this._render();

    
  }


  _scrach_start(){
    console.log(`scrach toolbar`);
    if(w2ui.hasOwnProperty(this.config.id)){w2ui[this.config.id].destroy();}
    let self = this;
    this.instances.container = new w2toolbar(
      {
        name : this.config.id,
        style : 'border-top: 1px solid black',
        items: self.vars.toolbarItems
        ,onRender(event){
          console.log(`CTOOLBAR I'M RENDERED`)
          if(self.onRendered === undefined)return;
          
        }
        ,onClick(event){
          console.log(`ctoolbar : clicked : [${event.target}]`)
          self._button_clicked(event.target);
          self.controller.signal_event("on-toolbar-option-click",event.target);

        }
        ,onRefresh : function(evt){
          self.vars.im_rendered = true;
          self.vars.initialized = true;

        },
        style : Tools.json2cssstring(this.config.source.d3sktop.toolbar.style.bar.css)
      }

    );
  console.log(`TOOLBAR STYLE: ${Tools.json2cssstring(this.config.source.d3sktop.toolbar.style.bar.css)}`)
  }

  _render(){
    this.instances.container.render(this.config.selector);
  }

  _button_clicked(idString){
    if(this.instances.callbacks.optionClicked != null){
      this.instances.callbacks.optionClicked(idString);
    }
  }
    

  
}







const buttonItem = function(){
  this.conf = {
    id       : null,    // id of the item
    type     : 'button',// type of the item (button, check, radio, drop, menu, break, spacer, html)
    text     : '',      // caption of the item, can be string or function
    html     : '',      // html text for the item (only if type = html), can be string or function
    tooltip  : null,    // tooltip for the item (see w2toolbar.tooltip), can be string or function
    count    : null,    // count badge
    hidden   : false,   // indicates if item is hidden
    disabled : false,   // indicates if item is disabled
    checked  : false,   // indicates if item is checked
    icon     : '',      // css class of the icon font for the item, can be string or function
    route    : null,    // route to follow, can have dynamic parts as /item/:id/details (see routeData)
    arrow    : true,    // down arrow for drop/menu types
    style    : null,    // extra css style for caption
    color    : null,    // color value - used in color pickers
    group    : null,    // group name for the item, used for radio buttons, can be integer or string
    items    : null,    // for type=menu it is an array of items in the menu
    selected : null,    // id of array of ids of the selected item(s) for menu-check and menu-radio
    overlay  : {},      // for drop down menus additional params for overlay, see overlay
    options: {
        advanced: false,   // advanced picker t/f - user in color picker
        transparent: true, // transparent t/f - used in color picker
        html: ''           // additional buttons for color picker
    },
    onClick  : null,    // click event handler for this item only
    onRefresh: null     // refresh event handler for this item only
  };
}
