import {w2ui, w2toolbar} from 'w2ui'

/**
 * method: add_application_selector(text,id,callbackOnClick,options)
 * method: add_startup_menu_option(text,id,callbackOnClick,options)
 * method: add_layout_selector(text, id, callbackOnClick, options)
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
      selector  : config.selector,
      id        : config.id,

      styles : {
        mainToolbar : `border-top: 1px solid black; background-color: blue`,
        button : ``, 
      },
      toolbarMainMenu : { type: 'menu', id: 'main-menu', text: 'APP', icon: 'fa fa-camera',
        items: [
          { text : '--' , id : 'main-menu-sep-02'},
          { text: 'About', id : 'main-menu-about' , icon: 'fa fa-camera'},
        ]
      }
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
      }
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
      onClick : (callbackOnClick === undefined?null:callbackOnClick),
    }
    this.instances.container.insert("layouts-selectors-ep",v);
  }
  add_application_selector(text,id,callbackOnClick,options){
    let v = {
      type : 'button',
      id   : id,
      text : text,
      onClick : (callbackOnClick === undefined?null:callbackOnClick),
    }
    if(this.instances.container== null) {this.vars.toolbarItems.push(v);return;}
    this.instances.container.insert("apps-instances-ep",v);
  }  
  add_application_selector_(text,id,callbackOnClick,options){
    let v = {
      type : 'button',
      id   : id,
      text : text,
      onClick : (callbackOnClick === undefined?null:callbackOnClick),


    }
    if(this.instances.container== null) {this.vars.toolbarItems.push(v);return;}
    this.instances.container.add(v);
  }
  add_startup_menu_option(text,id,callback,options){
    let v = {
      type : 'button',
      id   : id,
      text : text,
      onClick : (callback === undefined?null : callback)
    }
    if(this.config.toolbarMainMenu.items.length == 1){
      let w = {type : 'break'};
      this.config.toolbarMainMenu.items = [w].concat(this.config.toolbarMainMenu.items);
    } 
    this.config.toolbarMainMenu.items = [v].concat(this.config.toolbarMainMenu.items);
    if(this.instances.container== null) {return;}
    this.instances.container.get('main-menu').items = this.config.toolbarMainMenu.items;
    this.instances.container.refresh();
  }
  appcontroller(c){if(c !== undefined)this.controller = c; 
    if(this.controller != undefined){
      this.controller.add_startup_menu_option = this.add_startup_menu_option.bind(this);
      this.controller.add_application_selector = this.add_application_selector.bind(this);
      this.controller.add_layout_selector = this.add_layout_selector.bind(this);
      this.controller.on('add-window-selector', this.add_application_selector.bind(this) )
      this.controller.on('add-startup-option', this.add_startup_menu_option.bind(this) )
      
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
          self.vars.initialized = true;
          if(self.onRendered === undefined)return;
          self.onRendered();
        }
        ,onClick(event){
          console.log(`ctoolbar : clicked : [${event.target}]`)
          self._button_clicked(event.target);
          self.controller.signal_event("on-toolbar-option-click",event.target);

        }
      }

    );
  
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
