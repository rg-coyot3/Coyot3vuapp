

/*
module_set = [ 
  { name : "module name"
    instance : instance
  }
]

socketio.subscriptions = [
  {
    message_type : "message type event"
    , subscriptions : [
      {
        callback : callback_function
      }
    ]
  }
]

events = 
  { 
    event_type_01 : [
      {
        name : "name",
        callback : callback01
      }
      , callback02
      , callback03
    ]
    ,event_type_02 : [
      callback04
      ,callback05
    ]
  }

*/

Log.SetLogConfig(Log.DEBUG);


var ManagedModules = [
];

var CLog = {...Log};
CLog.SetLogConfig(Log.DEBUG);

var CytWebsocket = function(target){
  this.open = function(){
    CLog.Info(`cyt websoket : opening websocket`);
    if(this.ws !== null)
    {
      CLog.Info(`cyt websoket : closing socket on init`);
      this.close();
    }
    try{
    CLog.Info(`cyt websocket : opening connection to [${this.connectionchain}]`);
    var self= this;
    this.ws = new WebSocket(this.connectionchain);
    this.ws.onopen = this.onopen;
    this.ws.onclose = this.onclose;
    this.ws.onerror = this.onerror;
    this.ws.onmessage = this.onmessage;
    }catch(err)
    {
      CLog.Error(`cyt websocket : error opening connection [${err.toString()}]`);
      this.ws = null;
    }
  }
  this.close = function(){
    CLog.Info(`cyt websocket : closing websocket`);
    try{
      this.ws.close();
    }catch(err)
    {
      CLog.Error(`cyt websocket : ERROR : close websocket error [${err.toString()}]`);
    }
    this.ws = null;
  }
  
  this.host = null;
  this.port = null;
  this.ws = null;
  this.connectionchain = "";
  
  if(typeof(target === undefined))
  {
    this.host = window.location.hostname;
    this.port = window.location.port;
    this.connectionchain = `ws://${this.host}:${this.port}`;
  }else{
    this.connectionchain = target;
  }

  CLog.Info(`cyt websocket : creating websocket instance : connecting to [${this.host}:${this.port}]`);

  var typeCallback = {
    type : ""
    ,callback : null
  }
  this.messages_callbacks = {

  }

  this.onopen   = function(evt){CLog.Info(`cyt websocket : connexion opened.`)}
  this.onclose  = function(evt){CLog.Warn(`cyt websocket : connection is closed.`)}
  this.onerror  = function(evt){CLog.Error(`cyt websocket : err ${JSON.stringify(evt)}`);}
  this.onmessage= (evt) =>{
    var packet;
    //CLog.Info(`cyt websocket : on message : DEBUG : received : ${evt.data.toString()}`);
    try{
      packet = JSON.parse(evt.data.toString());
    }catch(err)
    {
      CLog.Error(`cyt websocket : error parsing input`);
      this.onGenericMessage(evt.data);
    }
    if(typeof(packet.type) !== 'string')
    {
      this.onGenericMessage(evt.data);
    }else if(typeof(this.messages_callbacks[packet.type]) === 'undefined')
    {
      this.onGenericMessage(evt.data);
    }else {
      this.messages_callbacks[packet.type].callback(packet.payload);
    }
  }
  this.onGenericMessage = (evt) =>{
    //CLog.Info(`cyt websocket : on generic message : [${evt.toString()}]`)
    return;
  }

  this.on = (evt,callback) => {
    switch(evt)
    {
      case "connect":
        this.onopen = callback;
        this.ws.onopen = this.onopen;
        CLog.Info(`cyt websocket : subscribed to connection`);
        return;
        break;
      case "disconnect":
        this.onclose = callback;
        this.ws.onclose = this.onclose;
        CLog.Info(`cyt websocket : subscribed to disconnection`);
        return;
        break;
    }
    var subscription = {
      type : evt.toString(),
      callback : callback
    }
    CLog.Info(`cyt websocket : subscribing to packet event`);
    this.messages_callbacks[evt.toString()] = subscription;
  }


  this.emit = function(type,payload)
  {
    if(this.ws === null)
    {
      CLog.Info(`cyt websocket : WARN : trying to send [${type}] packet over a closed socket`);
      return;
    }
    var packet = {
      type : type.toString()
      ,timestamp : Date.now()
      ,payload : payload
    };
    try{
      return this.send(JSON.stringify(packet));
    }catch(err)
    {
      CLog.Info(`cyt websocket : ERROR : trying to send [${type}] packet : err [${err.toString()}]`)
    }
    return false;
  }
  this.send = function(stream){
    if(this.ws == null)
    {
      return false;
    }
    try{
      this.ws.send(stream + '\r\n');
    }
    catch(err)
    {
      CLog.Info(`cyt websocket : ERROR : error sending stream [${err.toString()}]`);
      return false;
    }
    return true;
  }


  this.open();
  this.ws.onopen    = this.onopen;
  this.ws.onclose   = this.onclose;
  this.ws.onerror   = this.onerror;
  this.ws.onmessage = this.onmessage;
};

/*  REMINDER:
includeModule(instance)
comms_send_packet(packet type, payload)
comms_subscribe_event(packet_type, payload)

*/
var MainController = {
  modules_set : []
  ,cytwebsocketwrapper : {
    constructor : function(){return new CytWebsocket();}
    ,instance : null
    ,reconnection_th : null
    ,times_disconnected_from_server : 0
    ,subscriptions : {

    }
  }
  ,socketio : {
      constructor                   : function(){return io();}
    , instance                      : null
    , reconnection_th               : null
    , times_disconnected_from_server: 0
    , subscriptions                 : {
    }
  }
  ,socket_interface : null
  ,config : {
    socketType : "socketio"
    ,claim_modules : false
  }
  ,_vars : {
    modules : {
      obtained  : false
      ,list     : []
      ,imported : []
    }
    ,is_initialized : false
  }
  ,events : {}
  ,variables : {}
  ,webapp_session_key : ""
  ,last_ping_from_server : 0
  ,comms_send_packet : function(eventDesc,...args){
    this.socket_interface.instance.emit(eventDesc,...args);
  }
  ,initialize : function(){
    this.asynchrone_module_initialization(false);
    this.socket_interface = this[this.config.socketType];
    
    this.comms_subscribe_event('connect',this._on_socket_connect.bind(this),'controller connects');
    this.comms_subscribe_event('disconnect',this._on_socket_disconnect.bind(this),'controller disconnect');
    //this.comms_subscribe_event(UIEvents.EVENT_CONTROLLER_MODULES_LIST_RESPONSE,this._on_server_sends_modules_list.bind(this),'controller')
    this.comms_subscribe_event('KEEP_ALIVE_CONTROL',this.keep_alive_controller.bind(this),'keep alive');

    CLog.Info(`initialize : creating instance of socket io`);
    this.socket_interface.instance = this.socket_interface.constructor();
    CLog.Info(`initialize : subscribing events`);

    ManagedModules.forEach(m => {
      this.modules_set.push(m);
    });
    this.modules_set.forEach( m => {
      CLog.Info(`initialize : initializing module [${m.name}]`);
      m.initialize(this);
    });

    this._comms_subscribe_events();
    setInterval(this.keep_alive_check_connection.bind(this),2000);
    if(this.config.claim_modules == true)
    {
      this._claim_modules_list();
    }



    this.on('cyt-reload-window',function(){
      location.reload();
    });

    this._vars.is_initialized = true;
  }
  ,includeModule(m)
  {
    if(this._vars.is_initialized == false)
    {
      console.log(``)
      this.modules_set.push(m);
      
    }else{
      this.modules_set.push(m);
      this.asynchrone_module_initialization(true);
      m.initialize(this);
      this.asynchrone_module_initialization(false);
    }
    
  }
  ,setVar : function(name,value){
    //CLog.Info(`IO CONTROLLER : setting variable [${name} , ${value}]`)
    this.variables[name] = value;
  }
  ,getVar : function(name){
    return this.variables[name];
  }
  ,on : function(eventType,callback,name)
  {
    CLog.Info(`subscribing to event type [${eventType}], named [${name}]`);
    if(this.events[eventType] === undefined)
    {
      this.events[eventType] = []
    }
    this.events[eventType].push({
      name : name
      ,callback : callback
    });
  }
  ,signal_event : function(eventType,...args)
  {
    if(this.events[eventType] === undefined)
    {
      CLog.Info(`event type [${eventType}] : lost`);
      return;
    }
    this.events[eventType].forEach( c => {
      CLog.Info(`event type [${eventType}] for callback [${c.name}]`);
      c.callback(...args);
    });
  }
  
  ,asynchrone_module_initialization(on = false){
    if(on==false){
      this.comms_subscribe_event = this.comms_subscribe_event_on_init.bind(this);
    }else{
      this.comms_subscribe_event = this.comms_subscribe_event_deferred.bind(this);
    }
  }
  // ,comms_subscribe_event(eventType,callback, name)
  // {
  //   CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
  //   if(this.socket_interface.subscriptions[eventType] === undefined)
  //   {
  //     this.socket_interface.subscriptions[eventType] = [];
  //   }
  //   var newSubscription = {
  //     name : name
  //     ,callback : callback
  //   }
  //   this.socket_interface.subscriptions[eventType].push(newSubscription);
  // }
  ,comms_subscribe_event(eventType,callback, name){CLog.Info(`dummy function`)}
  /**
   * relates a socket io event type to a callback function
   */
  ,comms_subscribe_event_on_init(eventType,callback, name)
  {
    CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
    if(typeof(eventType) !== 'string')
    {
      console.error(`socket io subscribe : making subscription `
      +`with name [${name}] to an non-string event [${JSON.stringify(eventType)}]`);
      return;
    }
    CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
    if(this.socket_interface.subscriptions[eventType] === undefined)
    {
      this.socket_interface.subscriptions[eventType] = [];
    }
    var newSubscription = {
      name : name
      ,callback : callback
    }
    this.socket_interface.subscriptions[eventType].push(newSubscription);
  }

  ,comms_subscribe_event_deferred(eventType,callback, name)
  {

    CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
    if(typeof(eventType) !== 'string')
    {
      console.error(`socket io subscribe : making subscription `
      +`with name [${name}] to an non-string event [${JSON.stringify(eventType)}]`);
      return;
    }
    var isNew = false;
    if(this.socket_interface.subscriptions[eventType] === undefined)
    {
      this.socket_interface.subscriptions[eventType] = [];
      isNew = true;
      CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
    }
    else{
      CLog.Info(`socket io subscribe : event [${eventType}], subscribing [${name}]`);
    }
    var newSubscription = {
      name : name
      ,callback : callback
    }
    this.socket_interface.subscriptions[eventType].push(newSubscription);
    if(isNew == true)
    {
      var evalChain = `
        this.socket_interface.instance.on('${eventType}', (...args) => {
            //CLog.Info('on - [${eventType}] ; data [()'+ JSON.stringify(ioObject) +'()[]]');

            this.socket_interface.subscriptions['${eventType}'].forEach( cf => {
              cf.callback(...args)
            });
        });
      `;
      eval(evalChain);
    }
  }
  
  ,_comms_subscribe_events()
  {
    CLog.Info(`socket make subscriptions : subscribing for socket type [${this.config.socketType}]`);
    Object.keys(this.socket_interface.subscriptions).forEach( (sioevent,i,a) => {
      CLog.Info(`socket make subscriptions : creating subscription for socket io event [${sioevent}]`);
      // :: debug out forEach :: CLog.Info("socket io event ['${sioevent}'] : invoking callback for [" + ioObject.name + "]");
      // :: debug in  forEach :: CLog.Info("socket io event ['${sioevent}'] : callback name ["+cf.name+"]");

      this.socket_interface.instance.on(sioevent,ioObject => {
        this.socket_interface.subscriptions[sioevent].forEach(cf => {
          cf.callback(ioObject);
        });
      });
      // eval(`
      //   this.socket_interface.instance.on('${sioevent}', ioObject => {
          

      //       this.socket_interface.subscriptions['${sioevent}'].forEach( cf => {
      //         cf.callback(ioObject)
      //       });
      //   });
      // `)
    })
  }
  ,keep_alive_controller : function(data){
    if(data !== this.webapp_session_key)
    {
      if(this.webapp_session_key !== "")
      {
        location.reload()
      }
      else{
        this.webapp_session_key = data;
      }
    }
    this.last_ping_from_server = Date.now();
  }

  ,_on_socket_connect : function(socket){
    CLog.Info(`socket connected`);
    this.stop_reconnection();
  }
  ,_on_socket_disconnect : function(reason){
    CLog.Info(`socket DISCONNECT! (${reason})`);
    this.start_reconnection();
    try{
      if(reason.indexOf('io server') != -1)
      {
        this.socket_interface.times_disconnected_from_server++;
        CLog.Info(`disconnected from server. Times [${this.socket_interface.times_disconnected_from_server}]`)
      }
    }catch(err){
      CLog.Warn(`disconnection from server : unknown reason of disconnection`);
    }
    if(this.socket_interface.times_disconnected_from_server > 10)
    {

      location.reload();
    }
  }
  ,keep_alive_check_connection : function()
  {
    var now = Date.now();
    if((now - this.last_ping_from_server) > 6000)
    {
      this.setVar('connection_state',false);
    }
    else
    {
      this.socket_interface.times_disconnected_from_server = 0;

      this.setVar('connection_state',true);
    }
  }
  ,start_reconnection()
  {
    if(this.socket_interface.reconnection_th === null)
    {
      this.socket_interface.reconnection_th = setInterval(this._reconnect.bind(this),1000);
    }
  }
  ,stop_reconnection()
  {
    clearInterval(this.socket_interface.reconnection_th);
    this.socket_interface.reconnection_th = null;
  }
  ,_reconnect()
  {
    CLog.Info(`reconnect socket io`);
    this.socket_interface.instance.open();
  }
  ,_claim_modules_list()
  {
    if(this._vars.modules.obtained == true)
    {
      CLog.Info(`modules list already obtained`);
      return;
    }
    CLog.Info(`claim modules list : claiming`);
    this.comms_send_packet('EVENT_CONTROLLER_MODULES_LIST_REQUEST',"");
    setTimeout(this._claim_modules_list.bind(this),1000);
  }
  ,_on_server_sends_modules_list(modules_list)
  {
    if(this._vars.modules.obtained == true)
    {
      CLog.Info(`on server sends modules list : list already obtained`);
      return;
    }
    this._vars.modules.obtained = true;
    this._vars.modules.list = modules_list;
    CLog.Info(`received modules list : [${JSON.stringify(modules_list,null,'\t')}]`)
    this._modules_deferred_load();
  }
  ,module_deferred_load(module_specs)
  {
    CLog.Info(`DEFERRED MODULE LOAD`);
    /*
      path
      targetModule
      initMethodPointerString
      sendController
    */
    var script = document.createElement("script");
    script.src = module_specs.path;
    script.type = "text/javascript";
    script.defer= true;
    this._vars.modules.imported.push(script);
    var self = this;
    if(module_specs.sendController == true)
    {
      eval(`
          script.onload = function(){
          CLog.Info('module ${module_specs.path} loaded');
          
          MainController.modules_set.push(${module_specs.targetModule});
          MainController.asynchrone_module_initialization(true);
          ${module_specs.initMethodPointerString}(MainController);
          MainController.asynchrone_module_initialization(false);
        }`
      );
    }else{
      eval(`
          script.onload = function(){
          CLog.Info('module ${module_specs.path} loaded');
          
          MainController.modules_set.push(${module_specs.targetModule});
          MainController.asynchrone_module_initialization(true);
          ${module_specs.initMethodPointerString}();
          MainController.asynchrone_module_initialization(false);
        }`
      );
    }
    document.body.appendChild(script);
  }
  ,_modules_deferred_load()
  {
    this._vars.modules.list.forEach( sp => {
      CLog.Info(` SUBMODULES LOADER : on script specification : including script [${sp.path}]`);
    
      var script = document.createElement("script");
      script.src = sp.path;
      script.type="text/javascript";
      script.defer=true;
      this._vars.modules.imported.push(script);
      var self = this;
      eval(`
          script.onload = function(){
          CLog.Info('module ${sp.path} loaded');
          
          MainController.modules_set.push(${sp.targetModule});
          MainController.asynchrone_module_initialization(true);
          ${sp.initMethodPointerString}(MainController);
          MainController.asynchrone_module_initialization(false);
        }`
      );
      document.body.appendChild(script);
      
      if(sp.sendController == true)
      {
        CLog.Info(`SUBMODULES LOADER : initializing script [${sp.path}] - controller`);
        //eval(`this.controller.modules_set.push(${sp.targetModule})`);
        //eval(`${sp.initMethodPointerString}(this.controller)`);
      }else{
        CLog.Info(`SUBMODULES LOADER : initializing script [${sp.path}] - no controller`);
        //eval(`${sp.initMethodPointerString}()`);
      } 
        
      
  
  
      
    });
  }
}


var AppNotifications = {
  controller : null,
  
  instances : {
    bodyContainer   : null,
    globalContainer : null,
    globalContainerStyle : null,
    headerText      : null,
    contentText     : null,
    mask            : null,
    buttonOk        : null,
    windowContainer : null,
  }
  ,config : {
    models : {
      style : `
      <style>
      :root{
        --cytgn-container-width : 30%;
        --cytgn-container-height : 30%;
        --cytgn-height-header  : 40pt;
        --cytgn-height-choices : 50pt;
        --cytgn-width-borders  : 3pt;
        --cytgn-color-mask : rgba(0,0,0,0.5);
        --cytgn-button-height : 30pt;
        --cytgn-button-width : 75pt;
        --cytgn-button-font-size : 12pt;
        --cytgn-color-notif : green;
        --cytgn-color-warn : orange;
        --cytgn-color-error : red;
      }
      #cytNotifEmbedContainer{
        position: absolute;
        width: 100%;height: 100%;
      }
      .CytNotifGlobalMask{
        position: absolute;top:0;left: 0;height: 100%;width: 100%;
        background-color: var(--cytgn-color-mask);
      }
      .CytNotifContainer{
        position: absolute;
        top:  20pt;
        left: 20pt;
        
        width: var(--cytgn-container-width);
        height: var(--cytgn-container-height);
        background-color: white;
        border: var(--cytgn-width-borders) solid black;
        border-radius: 20pt;
        overflow: hidden;
      }
      .CytNotifHeader{
        position: absolute;top:0;left: 0;width: 100%;height: 40pt;
        border-bottom: var(--cytgn-width-borders) solid black;
        background-color: green;
        
      }
      
        .CytNotifHeader>div{
          position: absolute;left: 50%;top:50%;
          transform: translate(-50%,-50%);-webkit-transform: translate(-50%,-50%);
          font-size: 1.5rem;
          font-weight: bolder;
          color: white;
        }
      
      .CytNotifContent{
        position: absolute;top:var(--cytgn-height-header);left: 10pt;width: calc(100% - 20pt);
        height: calc(100% - var(--cytgn-height-header) - var(--cytgn-height-choices));
      }
        .CytNotifContent>div{
          position: absolute;top:50%;left: 0;width: 100%;transform: translate(-0%,-50%);-webkit-transform: translate(-0%,-50%);
          margin: 5pt;
        }
      .CytNotifOpts{
        position: absolute;left: 0;bottom: 0;width: 100%;height: var(--cytgn-height-choices);
  
      }
        .CytNotifOpts>div{
          position: absolute;
          top:50%;right: 10pt;transform: translateY(-50%);-webkit-transform: translateY(-50%);
        }
  
        .CytNotifButton{
          position: relative;
          width: var(--cytgn-button-width);height: var(--cytgn-button-height);
          border:2pt solid black;border-radius: 5pt;
          background-color: rgb(211, 255, 240);
  
        }
        .CytNotifButton:hover{
          background-color: aquamarine;
        }
        .CytNotifButton:active{
          background-color: aqua;
        }
        
        
        .CytNotifButton>div{
          position: absolute;top:50%;left: 50%;transform: translate(-50%,-50%);-webkit-transform: translate(-50%,-50%);
          font-size: var(--cytgn-button-font-size);
        }
    </style>`,
      container : `
      
    <div id="cytNotifEmbedContainer">
  
    
      <div id ="cytNotifGlobalMask" class="CytNotifGlobalMask"></div>
      <div id="cytNotifContainer" class="CytNotifContainer">
        <div>
          <div id="cytNotifHeaderTitleContainer" class="CytNotifHeader">
            <div id="cytNotifHeaderTitle">title</div>
          </div>
          <div class="CytNotifContent">
            <div id="cytNotifHeaderContentText">
              this is the text contentthis is the text contentthis is the text contentthis is the text contentthis is the text contentthis is the text contentthis is the text content
            </div>
          </div>
          <div class="CytNotifOpts">
            <div>
              <div id="cytNotifOkButton" class="CytNotifButton">
                <div>
                  OK
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      `
    }
    ,selectors : {
       styleContainer   : 'head'
      ,bodyContainer    : 'body'
      ,globalContainer  : "#cytNotifEmbedContainer"
      ,windowContainer  : '#cytNotifContainer'
      ,headerContainer  : '#cytNotifHeaderTitleContainer'
      ,headerText       : "#cytNotifHeaderTitle"
      ,contentText      : '#cytNotifHeaderContentText'
      ,mask             : "#cytNotifGlobalMask"
      ,buttonOk         : '#cytNotifOkButton'
    }

    ,classes : {

    }

  }
  ,vars : {
    hide_on_mask_click : true,
    hide_on_button_ok : true
  }
  ,initialize(c)
  {
    this.controller = c;
    this.instances.stylesContainer  = $(this.config.selectors.headerContainer);
    this.instances.bodyContainer    = $(this.config.selectors.bodyContainer);
    //this.instances.globalContainer  = $(this.config.selectors.globalContainer);
    this.instances.globalContainer = $(this.config.models.container);
    this.instances.globalContainer.click(function(e){
      e.stopPropagation();
    });
    this.instances.style = $(this.config.models.style);
    this.instances.windowContainer = $(this.config.selectors.windowContainer);


    var self = this;
    this.instances.globalContainerStyle = $(this.config.models.style);
    $('head').append(this.instances.globalContainerStyle);
    this.instances.globalContainer.fadeOut(0,function(){});
    
    this.instances.bodyContainer.append(this.instances.globalContainer);
    this.instances.stylesContainer.append(this.instances.style);
    // this.instances.headerContainer  = $(this.config.selectors.headerContainer);
    // this.instances.headerText       = $(this.config.selectors.headerText);
    // this.instances.contentText      = $(this.config.selectors.contentText);
    // this.instances.mask             = $(this.config.selectors.mask);
    // this.instances.buttonOk         = $(this.config.selectors.buttonOk);

    this.instances.headerContainer  = this.instances.globalContainer.find(this.config.selectors.headerContainer);
    this.instances.headerText       = this.instances.globalContainer.find(this.config.selectors.headerText);
    this.instances.contentText      = this.instances.globalContainer.find(this.config.selectors.contentText);
    this.instances.mask             = this.instances.globalContainer.find(this.config.selectors.mask);
    this.instances.buttonOk         = this.instances.globalContainer.find(this.config.selectors.buttonOk);


    this.instances.mask.click(this.on_mask_clicked_.bind(this));
    this.instances.buttonOk.click(this.on_buttonok_clicked_.bind(this));


    this.controller.on('cyt-show-notif',this.show_information.bind(this));
    this.controller.on('cyt-show-warn',this.show_warning.bind(this));
    this.controller.on('cyt-show-error',this.show_error.bind(this));


    //Tools.dragAndResize(this.config.selectors.globalContainer,this.on_container_resized_.bind(this),"ALL");
    Tools.dragheader(this.config.selectors.windowContainer.substring(1),this.config.selectors.headerContainer.substring(1));
    Tools.resizable(this.config.selectors.windowContainer.substring(1),this.on_container_resized_.bind(this));
  }
  ,on_container_resized_(){
    console.log(`resized`)
  }
  ,show_information(header,text){
    this.instances.headerContainer.css('background-color','var(--cytgn-color-notif)');
    this.show_notif_(header,text);
  }
  ,show_warning(header,text){
    this.instances.headerContainer.css('background-color','var(--cytgn-color-warn)');
    this.show_notif_(header,text);
  }
  ,show_error(header,text){
    this.instances.headerContainer.css('background-color','var(--cytgn-color-error)');
    this.show_notif_(header,text);
  }
  ,show_notif_(header,text){
    this.instances.headerText.html(header);
    this.instances.contentText.html(text);
    this.vars.hide_on_mask_click = false;
    this.vars.hide_on_button_ok = true;
    this.instances.globalContainer.css('z-index','5000');
    //this.instances.windowContainer.css('top','var(--cytgn-container-default-topleft-corner-distance)');
    //this.instances.windowContainer.css('left','var(--cytgn-container-default-topleft-corner-distance)');

    this.instances.globalContainer.fadeIn(250);
    
  }
  ,on_system_reboot(seconds)
  {
    this.show_warning("the ")
  }



  ,on_mask_clicked_(evt){
    if(this.vars.hide_on_mask_click == false)
    {
      return;
    }
    var self = this;
    console.log(`CYT-NOTIF : on-mask-clicked`);
    //this.instances.bodyContainer.hide();
    this.instances.globalContainer.fadeOut(250,function() {
      console.log(`all out`);
    });
  }
  ,on_buttonok_clicked_(evt){
    if(this.vars.hide_on_button_ok==false)
    {
      return;
    }
    console.log(`CYT-NOTIF : on-button-ok-clicked`);
    this.instances.globalContainer.fadeOut(250,function(){

    });
  }

  




}
MainController.includeModule(AppNotifications);


$(document).ready(()=>{
  CLog.Info("document is ready : initializing controller");
  MainController.initialize();
  CLog.Init(Log.NONE);
  CLog.SetOwner(`MAIN CONTROLLER`);

});