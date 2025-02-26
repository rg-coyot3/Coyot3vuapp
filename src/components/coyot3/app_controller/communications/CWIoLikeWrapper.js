



/**
 * configObject
 * {
 *  connection : {
 *    host: "",
 *    port: 0,
 *    protool : 'ws:'
 *  },
 *  callbacks : {
 *    onopen : function(){}
 *    onclose : function(){}  
 *    onerror : function(){}
 *    onmessage : function(){}
 *    onrawdata : function(){}
 *  }
 * }
 */


export class CWIoLikeWrapper {
  constructor(config){
    this.config = {
      source : config,
      connectionchain : null,

      hostname  : null,
      port      : 0,
      protocol  : 'ws://',
    } 

    this.vars = {
      connectionchain : "",

      connected : false,
    }
    
    this.instances = {
      socket : null,
      callbacks : {
        onopen : [],
        onclose : [],
        onerror : [],
        onrawdata : [],
        onmessage : {},
      }
    }

    if(typeof(this.config.source) == 'string'){
      this.vars.connectionchain = this.config.source;
    }else if(this.config.source == null){
      this.config.hostname = window.location.hostname;
      this.config.port = window.location.port;
      this.config.protocol = (window.location.protocol == 'http:' ? 'ws:' : 'wss:');
      this.vars.connectionchain = `${this.config.protocol}//${this.config.source.hostname};${this.config.source.port}/coyot3/ws`;
    }
    console.log(`constructed ${typeof(this.config.source)} : ${this.vars.connectionchain}`)
    this.open();
  }

  open(){
    let target = this.vars.connectionchain;
    console.log(`cwebsocketiowrap : open : opening connection to [${target}]`);
    if(this.instances.socket !== null){
      this.instances.socket.close();
      this.instances.socket = null;
    }

    try{
      this.instances.socket = new WebSocket(target);
      this.instances.socket.onopen = this.onopen.bind(this);
      this.instances.socket.onclose = this.onclose.bind(this);
      this.instances.socket.onerror = this.onerror.bind(this);
      this.instances.socket.onmessage = this.onmessage.bind(this);
      console.log(`cwebsocketwrapper : open : launched connection to `
        +`[${target}]`
      )
    }catch(err){
      this.instances.socket = null;
      console.error(`cwebsocketwrapper : error opening connection with `
        +`[${target}] , reason(${err})`);
      setTimeout( () => this.open(),5000);
    }
  }

  close(){
    try{
      this.instances.socket.close();
      console.log(`cwebsocketwrapper : close : closed connection`)
    }catch(err){
      log.error(`cwebsocketwrapper : error closing socket-wrapper : reason(${err})`);
    }
    this.instances.socket = null;
  }

  onopen(evt){
    if(this.instances.callbacks.onopen.length == 0)return;
    this.instances.callbacks.onopen.forEach( c => {c(evt);})
  }
  onclose(evt){
    if(this.instances.callbacks.onclose.length == 0)return;
    this.instances.callbacks.onclose.forEach( c => {c(evt);})
  }
  onerror(evt){
    if(this.instances.callbacks.onerror.length == 0)return;
    this.instances.callbacks.onerror.forEach( c => {c(evt);})
  }
  onrawdata(data){
    if(this.instances.callbacks.onrawdata.length == 0)return;
    this.instances.callbacks.onrawdata.forEach( c => {c(data);})
  }
  
  onmessage(evt){
    let packet;
    //console.log(`on-message : ${evt.data.toString()}`)
    try{
      packet = JSON.parse(evt.data.toString());
    }catch(err){
      this.onmessageraw(evt.data);
    }
    if('type' in packet){
      this.onmessagepacket(packet);
    }else{
      this.onmessageraw(evt.data);
    }

  }


  onmessageraw(data){
    if(this.vars.instances.onrawdata !== undefined)this.vars.instances.onrawdata(data);
  }
  onmessagepacket(p){
    const obk = this.instances.callbacks.onmessage;
    if(obk[p.type] == undefined){return;}
    let cbs = obk[p.type];
    cbs.forEach( k => {
      //console.log(`found [${p.type}]`)
      k(p.payload);      
    });
  }



  on(evt,callback){
    switch(evt){
      case 'connection':
        this.instances.callbacks.onopen.push(callback);
        break;
      case 'disconnect':
        this.instances.callbacks.onclose.push(callback);
        break;
      case 'error':
        this.instances.callbacks.onerror.push(callback);
        break;
      case 'rawdata':
        this.instances.callbacks.onrawdata.push(callback);
        break;
    }

    if(this.instances.callbacks.onmessage[evt] === undefined){
      this.instances.callbacks.onmessage[evt] = [];
    }
    this.instances.callbacks.onmessage[evt].push(callback);
  }

  emit(type,payload){
    if(this.instances.socket == null)return false;

    var packet = {
      type : type.toString(),
      timestamp : Date.now(),
      payload : payload
    }
    try{
      this.instances.send(JSON.stringify(packet) + '\r\n');
    }catch(err){
      console.error(`CWIoLikeWrapper : emit : error sending message (${err})`);
      return false;
    }
    return true;
  }



}