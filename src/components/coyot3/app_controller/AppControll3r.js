import { CWIoLikeWrapper } from "./communications/CWIoLikeWrapper";
import { io } from "socket.io-client" 


/*
// "modules" scoped variables.
setVar(key, value)
getVar(key)
vaue(key[, value])

//communications
comms_subscribe_event(evt : string, callback : function)
comms_send_packet(evt : string, ...args) elements to send.

//events
on(evtDescriptor : string, callback : function(...))
signal_event(evtDescript : string, ...args)
*/

export class AppControll3r{
  constructor(config){
    this.config = {
      source : config,
      comms : {
        CWIoLikeWrapper : {
            constructor : function(config){return new CWIoLikeWrapper(config);}
          , instance : null
          , reconnectionth : null
          , subscriptions : {}
        }
        , socketio : {
            constructor : function(config){return io(config);}
          , instance : null
          , reconnectionth : null
          , subscriptions : {}
        }
      }
    }
    
    this.instances = {
        comms : {
            socket_interface : null
          , config : {
              type : 'cytwebsocketwrapper'
            , claimModules : false         //claims modules to load to the server with 'service-claim-content-models'
          }
        }
      , mods : {
        obtained : false,
        nameless : [],
        list     : {},
        imported : [],
      }
      , events : {}
      , variables : {}
      , 
    }
    this.vars = {
      is_initialized : false,
      capp_connection : {
        key : "",
        ts : 0,
        ts_ext : 0,
        programmed_reboot : false
      },
      async_init : false,
    }

    this.comms_send_packet = this.__comms_send_packet_zero.bind(this);
  }
  setServerWebsocketPort(p){
    console.log(`capp-controller : set-server-websocket-port : updating port to [${p}]`);
    this.config.source.comms.port = p;
  }
  Init(){
    console.log(`capp-controller : initializing nameless modules`)
    
    this.instances.mods.nameless.forEach( m => {
      m.Init();
    });
    console.log(`capp-controller : initializing cmodules`)
    Object.keys(this.instances.mods.list).forEach(mname => {
      let r = this.instances.mods.list[mname].Init();
      if(typeof(r) != 'boolean'){
        console.warn(`capp-controller : init : cmodule [${mname}] does not `
          +`serve boolean for Init()`
        )
      }else if(r === false){
        console.warn(`capp-controller : init : cmodule [${mname}] Init() was not ok`);
      }
    });
    console.log(`capp-controller : initializating imported`)
    this.instances.mods.imported.forEach( im => {
      console.log(`TO-DO : capp-controller : init : working with imported module`);
    });
  }
  Start(){
    console.log(`capp-controller : starting nameless modules`)
    this.instances.mods.nameless.forEach( m => {
      m.Start();
    });
    console.log(`capp-controller : starting cmodules`)
    Object.keys(this.instances.mods.list).forEach(mname => {
      let r = this.instances.mods.list[mname].Start();
      if(typeof(r) != 'boolean'){
        console.warn(`capp-controller : init : cmodule [${mname}] does not `
          +`serve boolean for Init()`
        )
      }else if(r === false){
        console.warn(`capp-controller : init : cmodule [${mname}] Init() was not ok`);
      }
    });
    console.log(`capp-controller : initializating imported`)
    this.instances.mods.imported.forEach( im => {
      console.log(`TO-DO : capp-controller : init : working with imported module`);
    });
    
  }
   


  connect(){
    
    let connectorType = 'CWIoLikeWrapper';
    
    let wsproto = (window.location.protocol == 'http:' ? 'ws:' : 'wss:');
    let cchain = `${wsproto}//${window.location.hostname}:${window.location.port}/coyot3/ws`;
    this.instances.comms.socket_interface = this.config.comms[connectorType];
    if(this.instances.comms.socket_interface == undefined){
      log.error(`capp-controller : the connector [${connectorType}] is NOT defined!. stopping process`);
      return false;
    }
    console.log(`capp-controller : creating instance of [${connectorType}}] to connect to [${cchain}]`)
    this.instances.comms.socket_interface.instance = new this.instances.comms.socket_interface.constructor(cchain);
    this.instances.comms.socket_interface.instance.on('connection',this._on_connection.bind(this));
    this.instances.comms.socket_interface.instance.on('disconnect',this._on_discomms.bind(this));
    this.instances.comms.socket_interface.instance.on('ping',this.on_keep_alive_ping.bind(this));
    this.instances.comms.socket_interface.instance.on('error',this._on_error.bind(this));

    Object.keys(this.instances.comms.socket_interface.subscriptions)
    .forEach( evtDescriptor => {
      let ed = this.instances.comms.socket_interface.subscriptions[evtDescriptor];
      this._connect_socket_event_subscription(evt,ed.gencallback.bind(this));
    });
  }
  _connect_socket_event_subscription(event,callback){
    console.log(`capp-controller : connect-socket-event-subscription : subscribing to gencallback for [${event}]`);
    this.instances.comms.socket_interface.instance.on(event,callback);
  }
  
  __comms_send_packet_zero(...args){}
  csend_packet(evtDesc,...args){
    this.instances.comms.socket_interface.emit(evtDesc,...args);
  }

  setVar(name,v){this.instances.variables[name] = v;}
  getVar(name){return this.instances.variables[name];}
  value(key, val){if(val !== undefined){this.instances.variables[key] = val}return this.instances.variables[key];}
  on(evtDesc,callback){
    if(this.instances.events[evtDesc] == undefined){
      this.instances.events[evtDesc] = [];
    }
    this.instances.events[evtDesc].push(callback);
  }
  signal_event(evtDesc,...args){
    //console.log(`app-controller : event signaled [${evtDesc} ... [${args.toString()}]]`)
    if(this.instances.events[evtDesc] == undefined)return false;
    let res = true;
    this.instances.events[evtDesc].forEach ( c => {res |= (c(...args) !== false);});
    return true;
  }
  comms_send(...args){return this.comms_send_packet(...args);}
  comms_send_packet(evtDescriptor,...args){
    this.instances.comms.socket_interface.emit(evtDescriptor,...args);
  }

  comms_on(...args){return this.comms_subscribe_event(...args);}
  comms_subscribe_event(evtDescriptor, callback,name){
    console.log(`capp-controller : socketio-wrapper : event [${evtDescriptor}], subscribing [${name}]`);
    if(typeof(evtDescriptor) !== 'string')
    {
      console.error(`socket io subscribe : making subscription `
      +`with name [${name}] to an non-string event [${JSON.stringify(evtDescriptor)}]`);
      return false;
    }
    console.log(`capp-controller : socketio-wrapper : event [${evtDescriptor}], subscribing [${name}]`);
    if(this.instances.comms.socket_interface.subscriptions[evtDescriptor] === undefined)
    {
      this.instances.comms.socket_interface.subscriptions[evtDescriptor] = {
        gencallback : (...args) => {
          this
            .instances
            .comms
            .socket_interface
            .subscriptions[eval(`"${evtDescriptor}"`)]
            .callbacks.forEach( c => {
              c(...args);
            });
        },
        callbacks : []
      };
      this.instances.comms.socket_interface.instance.on(
        evtDescriptor,
        this.instances
            .comms
            .socket_interface
            .subscriptions[evtDescriptor]
            .gencallback.bind(this));
    }
    let newSubscription = {
      name : name
      ,callback : callback
    }

    this.instances
        .comms
        .socket_interface
        .subscriptions[evtDescriptor]
        .callbacks.push(callback);
    return true;
  }



  on_keep_alive_check_pulse(){
    if((this.vars.capp_comms.ts - Date.now()) > 10000){
      console.log(`capp-controller : no connection to server`);
    }
  }

  on_socket_connects(){
    this.comms_send_packet = this.csend_packet.bind(this);
  }
  on_socket_disconnects(){
    this.comms_send_packet = this.__comms_send_packet_zero.bind(this);
  }
  on_socket_error(){
    console.log(`capp-controller : error communicating with server.`)
  }


  add_module(m,name,forceLaunch = false){
    m.controller = this;
    if((name == undefined) && (m.mod_name == undefined)){
      
      console.log(`capp-controller : inserting nameless module`);
      this.instances.mods.nameless.push(m);
    }else{
      let mname;
      if(name == undefined)mname = m.mod_name;
      else                 mname = name;
      console.log(`capp-controller : inserting module [${mname}]`)
      if(this.instances.mods.list[mname] != undefined){
        console.error(`capp-controller : insert-module : module `
          +`[${name.toString()}] already inserted`);
        return false;
      }
      m.app_controller = this;
      this.instances.mods.list[mname] = m;
    }

    if((this.is_initialized() == true) || (forceLaunch == true)){
      console.log(`capp-controller : initializing module`);
      if( typeof m.Init === 'function'){
        m.Init();
        m.Start();
      }else if(typeof m.initialize === 'function'){
        m.initialize(this);
      }
    }

    return true;
  }

  //
  _on_connection(){
    console.warn(`connected`)
  }
  _on_discomms(){
    console.warn(`disconnected`)
    setTimeout(() => {this.instances.comms.socket_interface.instance.open()},5000);
  }

  _on_error(){

  }
  /**
   * 
   * @param {*} data {ts : number , key : string}
   * @returns 
   */
  on_keep_alive_ping(data){
    //console.log(`received ping data ${JSON.stringify(data)}`)
    if(data.key !== this.vars.capp_connection.key){
      if(this.vars.capp_connection.key !== ""){
        if(this.vars.capp_connection.programmed_reboot == true)return;
        console.warn(`capp-controller : observed session key change from `
          +`server. from [${this.vars.capp_connection.key}] to [${data.key}] `
          +`programming reboot in 20 seconds`)
        setTimeout(() => { 
          location.reload()
        },20000);
        this.vars.capp_connection.programmed_reboot == true;
        return;
      }
      
      this.vars.capp_connection.key = data.key;
    }
    this.vars.capp_connection.ts = Date.now();
    this.vars.capp_connection.ts_ext = data.ts;
  }
  //

  hello(){
    console.log(`hello from the controller!`)
    return `hello there!`;
  }
  is_initialized(){return this.vars.is_initialized;}
}

