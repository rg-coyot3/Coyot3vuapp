

const Log           = require('../tools/simple-logger')
                            .CreateInstance(`SUPERVISION INTERFACE`)
                            .setDebugLevel(3);
const Tools         = require('../tools/init-tools');
const WebappBase    = require('./webapp_v1');
const path          = require('path');
const UIEvents      = require('../common/UIEvents');
const UICommand     = require('../common/Constants').UICommand;
const StoredChatMsg = require('./StoredChatMsg');

const DiagnosticProcessorSignals = require('../common/CDiagnosticProcessorSignals');
const VehicleModelSignals = require('../common/CVehicleModelSignals');


const EmbedSupervisionInterfaceSignals = require('../common/CEmbedSupervisionInterfaceSignals');



const MillaLogTraceObjectType = require('../common/CMillaLogTraceObjectType');
const { map } = require('mathjs');
  

class RemoteSupervisionInterface extends WebappBase{
    constructor(config)
    {
      super(config);
      this.Name = 'EMBEDSUPERVISION';
      this._page_login_success_redir = '/supervision'
      this.interface_session_key           = Math.random()
                                                  .toString(36)
                                                  .substring(2);
      this._app_config_source              = {};
      this._frontend = {
        cartographies : {
          list : []
          ,version : ""
          ,selection : ""
          ,source : {}
          ,raw : {}
        }
      }
      

      /**
       * an object to store the sockets that have make an asynchronous request.
       * the key of the object stores the CommandID obtained from the vehicle interface when
       * the command has been done.
       * The content of the object itself contains : 
       *    - socket : socket instance
       *    - cid : the same as the command ID
       *    - solved : a boolean to inform if the command has been solved or not, that will permit to free the instance
       */
      this.sockets_commands_waiting_queue = {};

      
      this.historic_chat_msgs = [];
      this._rtsp_source = '';


      this._handler_latency_control = null;
      
      // from WebappBase
      this.evt_on_websock_disconnects = this.on_websock_disconnects.bind(this);
      this.CONTROLLER = null;
    }
    


    ControllerInit(){
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_VEHICLE_STATUS,this.send_vehicle_status.bind(this),'embed-supervision');
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_VIDEOSTREAM_COMMAND_RESPONSE,this.on_videostream_sends_response.bind(this),'embed-supervision');
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_VIDEOSTREAM_VIDEOSTREAM_CHANNELS,this.videostream_send_channels_list.bind(this),'embed-supervision');
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_LOCALPATH_GEOJSON, this.on_emit_geojson_local_path.bind(this), 'embed-supervision');
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_GLOBALPATH_GEOJSON, this.on_emit_geojson_global_path.bind(this), 'embed-supervision');
      this.CONTROLLER.connect(VehicleModelSignals.VEHICLEMODEL_EMIT_GLOBALPATH_POINTS_GEOJSON, this.on_emit_geojson_global_path_points.bind(this), 'embed-supervision');
      this.CONTROLLER.connect("base-system-activity", this.broadcast_base_system_activity_factor.bind(this),"embed-supervision");



      this.CONTROLLER.connect('telecontrol_disconnect_client',this.on_telecontrol_disconnects_client.bind(this),'embed-supervision');
      
      this.CONTROLLER.connect(EmbedSupervisionInterfaceSignals.EVENT_SEND_LOG_DEBUG,this.on_module_sends_msg_debug.bind(this));
      this.CONTROLLER.connect(EmbedSupervisionInterfaceSignals.EVENT_SEND_LOG_NOTIFICATION,this.on_module_sends_msg_notification.bind(this));
      this.CONTROLLER.connect(EmbedSupervisionInterfaceSignals.EVENT_SEND_LOG_INFO,this.on_module_sends_msg_info.bind(this));
      this.CONTROLLER.connect(EmbedSupervisionInterfaceSignals.EVENT_SEND_LOG_WARN,this.on_module_sends_msg_warn.bind(this));
      this.CONTROLLER.connect(EmbedSupervisionInterfaceSignals.EVENT_SEND_LOG_ERROR,this.on_module_sends_msg_error.bind(this));
      
      this.CONTROLLER.connect(DiagnosticProcessorSignals.DIAGNOSTIC_EMISSION,this.on_diagnostics_processor_emits_data.bind(this),'supervision-interface');
      this.CONTROLLER.connect(DiagnosticProcessorSignals.DIAGNOSTICSAGG_RAW_DATA_BROADCAST,this.on_diagnostics_processor_broadcasts_raw_data.bind(this),'supervision-interface');

      this.CONTROLLER.connect("vehicle-service-context-identifier", this.on_vehicle_signals_its_service_context_id.bind(this),"supervision_interface")
      return true;
    }
    // TELECONTROL FUNCTIONNALITIES - END
    //overwite of keepalive control
    launch_keepalive_control()
    {
        let self = this;
        this._handler_keepalive = 
            setInterval(
                function(){
                    //Log.Debug(`MILLA WEBVISOR : keep alive control : session = [${self.interface_session_key}]`);
                    self._wsocket_server.sockets.emit("KEEP_ALIVE_CONTROL",self.interface_session_key);
                },
                1000
            )
    } 

    

    init_implement()
    {
      Log.Info(`embed-supervision : init-implement : initializing`);
      let res = true;
      res &= this.add_websocket_client_callback(UIEvents.EVENT_CLAIM_FOR_CARTOSOURCES
                              ,this.send_clients_cartographies_sources.bind(this)
                              ,'supervision-features');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_INTERFACE_CLAIMS_MSG_HISTORY,
                              this.on_interface_claims_msg_history.bind(this)
                              ,'supervision-features');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_BE_PERMISSION_TRANSFER_RES
                              ,this.on_ihm_sends_telecontrol_transfer_response.bind(this)
                              ,'supervision-feature');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_ADCONTROL_PERMISSION_REQ,
                              this.on_ihm_sends_telecontrol_adcontrol_permission_request.bind(this)
                              ,'supervision-feature')
      
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_DESTINATION_LIST_REQ,
                              this.on_ihm_sends_telecontrol_get_stops_request.bind(this)
                              ,'supervision-feature');
      
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_CALCULATE_AND_STANDBY_REQ,
                              this.on_ihm_sends_calculate_and_standby_request.bind(this)
                              ,'supervision-feature');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_STARTAD_REQ,
                              this.on_ihm_sends_start_ad_request.bind(this)
                              ,'supervision-feature');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_STOPAD_REQ,
                              this.on_ihm_sends_stop_ad_request.bind(this)
                              ,'supervision-feature');

      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_RESETAD_REQ,
                              this.on_ihm_sends_reset_ad_request.bind(this)
                              ,'supervision-feature');

      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_DROP_PERMISSION,
                              this.on_supervisor_drops_teleoperation_right.bind(this)
                              ,'supervision-feature');

      res &= this.add_websocket_client_callback(UIEvents.EVENT_VIDSTREAM_CHANNELS_REQUEST,
                              this.on_supervisor_claims_videostream_channels_list.bind(this)
                              ,'supervision-feature');

      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_VEHICLECOMPONENTS_PUSH_PASSENGERSDOORACTIONBUTTON
                              ,this.on_supervisor_claims_vehiclecomponent_passengerdoor_buttonpush.bind(this)
                              ,'supervision-feature');
      
      res &= this.add_websocket_client_callback(UIEvents.EVENT_MODSLOADER_CLAIMS_LIST_REQUEST
                              ,this.on_supervsion_claims_cytmods.bind(this)
                              ,'supervision-feature');
      
      res &= this.add_websocket_client_callback(UIEvents.EVENT_VIDSTREAM_ADD_MARK_TO_STREAM
                              ,this.on_supervisor_demands_videostream_image_mark.bind(this)
                              ,'supervision-feature');
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_VEHICLECOMPONENTS_PUSH_PASSENGERSDOORACTIONBUTTONOPEN
                              ,this.on_supervisor_demands_door_push_open.bind(this)
                              ,'supervision-feature');
      
      //EVENT_VIDSTREAM_SET_VIDEO_CHANNEL_REQUEST
      res &= this.add_websocket_client_callback(UIEvents.EVENT_VIDSTREAM_SET_VIDEO_CHANNEL_REQUEST
                              ,this.on_supervisor_demands_video_channel.bind(this)
                              ,'supervision-feature');
      
      res &= this.add_websocket_client_callback(UIEvents.EVENT_TELECONTROL_VEHICLECOMPONENTS_PUSH_PASSENGERSDOORACTIONBUTTONCLOSE
                              ,this.on_supervisor_demands_door_push_close.bind(this)
                              ,'supervision-feature');
      return res;

    }

    
    
    // mac 48:65:ee:12:68:2c
    // mac 3c:18:a0:d4:ec:a5
    _app_routes_module_helper(reqpath,targetFile)
    {
      this._app.get(reqpath,this._isLoggedIn.bind(this),(req,res) => {
        if(this.userAuth(req,res) == false){
            return;
        }
        let sourceIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        Log.Info(`WEBAPP V1 [${this._name}] : authenticated user from [${sourceIP}]`);
        Log.Warn(`WEBAPP V1 [${this._name}] : * * * ${req.query.apiKey}`);
        Log.Warn(`WEBAPP V1 [${this._name}] : * * * ${req.sessionID}`);
        // if(this._apikey_check_session(req.query.apikey,req.sessionID) == false)
        // {
        //   Log.Warn(`WEBAPP V1 [${self._name}] : route [sdifaceh2] : apikey session check error`);
        //   return res.sendFile(`${this._html_base_dir}/404.html`);
        // }
        return res.sendFile(path.join(`${this._html_base_dir}${targetFile}`));
    
        });
    }
    app_routes()
    {
        let self = this;
        this._app.get('/close',this._isLoggedIn.bind(this),(req,res) =>  {
          if(self.userAuth(req,res) == false){
            return res.sendFile(`${this._html_base_dir}/404.html`);
          }
          req.session.destroy();
          res.redirect('/');
        });
        this._app.get('/img/camera_snapshot.jpg',this._isLoggedIn.bind(this),(req,res) => {
          if(self.userAuth(req,res) == false){
            return res.sendFile(`${this._html_base_dir}/404.html`);
          }
          //Log.Debug(`WEBAPP V1 [${self._name}] : claimed camera shapshot`);
          let sourceIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          if(this._apikey_check_session(null,req.sessionID) == false)
          {
            Log.Warn(`[${self._name}] : user claiming camera front image but is not authenticated`);
            return res.sendFile(`${this._html_base_dir}/404.html`);
          }
          return res.sendFile(`${this._html_base_dir}/img/camera_snapshot.jpg`);
        });
        /*module_aru*/
        this._app_routes_module_helper('/supervision','/snav04.html');
        
        this._app.get('/mobile',this._isLoggedIn.bind(this),(req,res) => {
            if(self.userAuth(req,res) == false){
              Log.Warn(`[${self._name}] : user connecting is not authenticated`);
                return ;
            }
            return res.sendFile(path.join(`${this._html_base_dir}/supervision_mobile.html`));
        });
    }
    configure_client_websocket(socket)
    {
        let self = this;

        socket.on(UIEvents.EVENT_SEND_COMMAND,(command)=>{
            Log.Info(`MILLA SUPERVISION INTERFACE : client sends command [${JSON.stringify(command)}]`);
            self.on_safety_driver_sends_command(command);
        });
        socket.on(UIEvents.EVENT_CLAIM_PLANNING_BOOK,(data)=>{
            Log.Info(`MILLA SUPERVISION INTERFACE : client claims for planningb book`);
            //self.evt_client_claims_for_planning_book();
            this.send_vehicle_planning_book(
              this.CONTROLLER.method_bridge('VEHICLE','get_planning_book_reduced')
            );
        });




        // socket.on(UIEvents.EVENT_CLAIM_SMSTS_HISTORIC, () => {
        //   this.on_interface_claims_smsts_historic();
        // });
        socket.on(UIEvents.EVENT_CLAIM_VIDSTREAM_AVAILABILITY, () => {
          this.on_ihm_claims_videostream_availability(socket);
        });


        // socket.on(UIEvents.EVENT_LATENCY_CONTROL_PING_RES, (lp) => {
        //   this.on_ihm_sends_latency_control_response(socket,lp)
        // });

        //TELECONTROL
        socket.on(UIEvents.EVENT_TELECONTROL_STATUS_RES, (lo) => {
          this.on_ihm_sends_telecontrol_latency_response(socket,lo);
        });

        

        
        this.CONTROLLER.emit('embed_supervision_socket_connects',socket);
        //this.latency_control_initialize_socket(socket); 
        
    }
    on_websock_disconnects(socket)
    {
      this.CONTROLLER.emit('embed_supervision_socket_disconnects',socket);
    }
    /**
     * Integration of the automatic cartography load from the .osm at AD04.x
     *  as well as retro-compatibility functions
     */
    deduce_cartography_version(){
      let taskDone = false;
      switch(this._frontend.cartographies.source.version){
        case undefined:
        case "1":
          //the cartographies are already stored at the front-end workspace.
          // The list points to the file.
          taskDone = this._import_cartographies_version_1();
          break;
        case "2":
          //the cartography is not yet loaded at the front-end workspace.
          // it is needed to recover the file from the "server", and make a 
          // copy to the front-end workspace.
          taskDone = this._import_cartographies_version_2();
          if(taskDone == false){
            Log.Error(`deduce-cartography-version: error importing `
              `cartographies list version 2`);
            process.exit(1);
          }
        
        default:
          Log.Error(`deduce-cartographies-version : impossible to deduce version`)
      }
      if(taskDone !== true){
        Log.Error(`deduce-cartographies-version : error importing cartographies`);
        Log.Error(`NOW EXITING INSTANCE`);
        process.exit(1);
      }
    }
    _import_cartographies_version_1(){
      Log.Info(`-import-cartographies-version-1 : init : direct copy from configuration`)
      this._frontend.cartographies.list = [...this._frontend.cartographies.source.files];
      return true;
    }
    _import_cartographies_version_2(){
      Log.Info(`-import-cartogaphies-version-2 : init`);
      this._frontend.cartographies.list = [];
      //patch - cartographies-root 
      if(this._app_config_source.gui_presets.cartographies_destination_root === undefined)
      {
        Log.Debug(`-import-cartographies-version-2 : setting default root for `
          +`cartographies at [/js/data]`);
        this._app_config_source.gui_presets.cartographies_destination_root = '/js/data';
      }
      this._frontend.cartographies.source.ad_cartographies_locations.forEach(item => {
        let src = item.source;
        let ext = src.split('.')[src.split('.').length - 1];
        let dst_rel = `${item.name}.${ext}`;
        let dst = `${this._app_config_source.gui_presets.interface_root_public}${this._app_config_source.gui_presets.cartographies_destination_root}/${dst_rel}`
        Log.Info(`-import-cartographies-version-2 : copying    [${src}]=>[${dst}]`)
        Tools.copy_file(src,dst);
        Log.Info(`-import-cartographies-version-2 : copying OK [${src}]=>[${dst}]`);
        // - emulating - 
        this._frontend.cartographies.list.push(
          {
            path         : dst_rel,
            type         : "border",
            strokeWidth  : item.strokeWidth,
            strokeColour : item.strokeColour
          }
        );
        //
      });
      Log.Info(`-import-cartogaphies-version-2 : end`);
      return true;
    }
    _import_cartographies_version_3(map_name_path){
      let src = map_name_path;
      let map_name = src.split('/')[src.split('/').length - 2];
      let ext = src.split('.')[src.split('.').length - 1];
      let dst_rel = `${map_name}.${ext}`;
      let dst = `${this._app_config_source.gui_presets.interface_root_public}${this._app_config_source.gui_presets.cartographies_destination_root}/${dst_rel}`
      Log.Info(`-import-cartographies-version-2 : copying    [${src}]=>[${dst}]`)
      Tools.copy_file(src,dst);
      Log.Info(`-import-cartographies-version-2 : copying OK [${src}]=>[${dst}]`);
      this._frontend.cartographies.list.push(
        {
          path         : dst_rel,
          type         : "border",
          strokeWidth  : '2px',
          strokeColour : '#779'
        }
      );
      return true;
    }

    on_vehicle_signals_its_service_context_id(map_name_path){
      return this._import_cartographies_version_3(map_name_path + "/lanelet2_map.osm");
    }
    /**
     * @brief : deprecated
     * @param {*} config 
     */
    set_app_config_source(config)
    {
      this._app_config_source = {...config};
      return false;
      //current_module_location_root
      let found = false;
      
        

        let cartographies_location = this._app_config_source.gui_presets.cartographies_list_location;
        this._frontend.cartographies.raw = Tools.loadJsonContentFromFile(`${__dirname}/../../${cartographies_location}`);
        Log.Info(`set-app-config-source : cartogaphies location [${cartographies_location}]`);
        Log.Info(`set-app-config-source : ${JSON.stringify(this._frontend.cartographies.raw,null,'\t')}`);
        this._frontend.cartographies.selection = this._app_config_source.gui_presets.cartography_selection;
        this._frontend.cartographies.raw.cartographies.forEach( cp => {
          if(found==true)return;
          if(this._frontend.cartographies.selection == cp.set_name)
          {
            found = true;
            this._frontend.cartographies.source = {...cp};
            
          }
        });
        
        //CHECK GATHER CARTOGRAPHY FROM ENV-VARS : BEGIN
        //
        // if the environment preconfiguration exists, then the configuration 
        //  object is hacked to point to the current cartography selection.
        //
        let cartography_location_path = Tools.getEnvironmentVariable("MILLAWAD_VEHICLE_SERVICE_CONTEXT");
        if(cartography_location_path != undefined)
        if(cartography_location_path.length != 0){
          Log.Info(`set-app-config-source : cartography location obtained from environment variable [MILLAWAD_VEHICLE_SERVICE_CONTEXT] = [${cartography_location_path}]`)

          //check map existence with map default name
          if(Tools.fileExists(`${cartography_location_path}/lanelet2_map.osm`)== true){
            found = true;
            Log.Info(`set-app-config-source : cartography-location-path [${cartography_location_path}/lanelet2_map.osm] EXISTS. CREATING PRESET`)
            cartography_location_path = cartography_location_path+ "/lanelet2_map.osm";
            this._frontend.cartographies.selection = "from_environment";
            this._frontend.cartographies.source = {
              set_name : "from_environment",
              version : "2",
              ad_cartographies_locations : [
                {
                  name : "main",
                  source : cartography_location_path,
                  strokeWidth : "5px",
                  strokeColour : "blue"
                }
              ]
            }
          }else{
            Log.Warn(`set-app-config-source : cartography-location-path [${cartography_location_path}/lanelet2_map.osm] DOES NOT EXIST`)
          }

        }
        //CHECK GATHER CARTOGRAPHY FROM ENV-VARS : END

        if(found === false){
          Log.Error(` set-app-config-source : NOT FOUND THE `
            +`CARTOGRAPHY PRESET [${this._app_config_source.gui_presets.cartography_selection}]`);
          Log.Warn(` set-app-config-source : CHOOSING STRATEGY : AUTODETECTION.`)
          Log.Warn(` set-app-config-source : CHOOSING STRATEGY : AUTODETECTION.`)
          Log.Warn(` set-app-config-source : CHOOSING STRATEGY : AUTODETECTION.`)
          return ;
          //process.exit(1);
        }

        if(this.deduce_cartography_version() == false)
        {
          Log.Error(`set-app-config-source : ERROR loading cartographies after `
            +`trying to deduce current configuration's cartography source`);
          process.exit(1);
        }
    }




    on_videostream_sends_response(cid,respObject)
    {
      Log.Info(`MILLA SD WEBAPP : on videostream sends response : cid [${cid}]`);
      let scwq = this.sockets_commands_waiting_queue[cid.toString()];
      if(typeof(scwq) === 'undefined' )
      {
        Log.Warn(`MILLA SD WEBAPP : on videostream sends response : cid [${cid}] request was not found here.`);
        return false;
      }
      Log.Info(`MILLA SD WEBAPP : on videostream sends response : cid [${cid}] : command id found`);
      
      let packet2supiface = {
        rtsp_token : respObject.argument.toString()
      }
      Log.Info(`MILLA SD WEBAPP : on videostream sends response : cid [${cid}] : sending `+
        `response to web interface, with object (${JSON.stringify(packet2supiface)})`);
      try{
        scwq.socket.emit(UIEvents.EVENT_VIDSTREAM_AVAILABILITY_RESP,packet2supiface);
      }catch(err)
      {
        Log.ERROR(`MILLA SD WEBAPP : on videostream sends response : cid [${cid}] : error sending throw socket`)
      }
        scwq.solved = true;
    }

    on_ihm_claims_videostream_availability(socket)
    {
      Log.Info(`MILLA SD WEBAPP : on ihm claims videostream availability`);
      let cid = this.CONTROLLER.method_bridge('VEHICLE','on_supervision_claims_video_availability');
      Log.Info(`MILLA SD WEBAPP : waiting response for command ID [${cid}]`);
      
      this.sockets_commands_waiting_queue[cid.toString()] = {
                                                              socket : socket,
                                                              cid : cid,
                                                              solved : false
                                                            };
      setTimeout( () => {
        let w = this.sockets_commands_waiting_queue[cid.toString()];
        if(w.solved == false)
        {
          Log.Warn(`MILLA SD WEBAPP : on ihm claims videostream availability : command timeout for Command ID [${w.cid}]`);
        }
        else
        {
          Log.Info(`MILLA SD WEBAPP : on ihm claims videostream availability : command already responded`);
        }
        delete this.sockets_commands_waiting_queue[cid.toString()];
      }
      ,2000);
    }
    on_safety_driver_sends_command(packet)
    {
        Log.Info(`MILLA SUPERVISION INTERFACE : on client sends command . sending event`);
        
        switch(packet.action)
        {
            case UICommand.LAUNCH_AD:
                Log.Info(`MILLA SUPERVISION INTERFACE : on sd sends command : launch AD`);
                this.CONTROLLER.emit('embed_supervision_launch_ad',packet.argument);
                break;
            case UICommand.STOP_AD:
                Log.Info(`MILLA SUPERVISION INTERFACE : on sd sends command : stop AD`);
                this.CONTROLLER.emit('sdiface_stop_autonomous_driving');
                break;
            case UICommand.HARD_RESET:
                this.CONTROLLER.emit('embed_supervision_make_hard_reset');
                break;
            default:
                Log.Warn(`MILLA SUPERVISION INTERFACE : on client sends command. Command [${packet.action}] is not managed`);

        }
        return;
    }
    on_interface_claims_msg_history(socket)
    {
      let buffer = [];
      this.historic_chat_msgs.forEach( m => {
        buffer.push(m.toJson());
      });
      try{
        socket.emit(UIEvents.EVENT_SENDING_MSG_HISTORY,buffer);
      }catch(err){
        Log.Error(`MILLA SUPERVISION INTERFACE : on-interface-claims-msg-hist :`
        +` error sending history : ((${err.toString()}))`);
      }
      
    }
    broadcast_base_system_activity_factor(factor){
      this._wsocket_server.emit("base-system-activity",factor);
    }
    send_system_info_msg(msg)
    {
        Log.Info(`MILLA SUPERVISION INTERFACE : on system sends info : [${msg}]`)
        this._wsocket_server.emit(UIEvents.SYSTEM_SENDS_INFO,msg);
    }
    send_vehicle_status(status)
    {
        Log.Debug(`MILLA SUPERVISION INTERFACE : send vehicle status msg [${JSON.stringify(status)}]`,5);
        this._wsocket_server.sockets.emit(UIEvents.EVENT_VEHICLE_STATUS,status);
    }
    send_vehicle_planning_book(planningBook)
    {
        Log.Debug(`MILLA SUPERVISION INTERFACE : sending vehicle planning book ${JSON.stringify(planningBook)}`)
        this._wsocket_server.sockets.emit(UIEvents.EVENT_SERVING_PLANNING_BOOK,planningBook);
    }
    send_clients_cartographies_sources(socket,...args)
    {
        Log.Debug(`MILLA SUPERVISION INTERFACE : sending cartographie sources.${JSON.stringify(this._frontend.cartographies)} **`,2);
        try{
          let objts = {
            list : [...this._frontend.cartographies.list]
          }
          Log.Info(`**MILLA SUPERVISION INTERFACE : sending cartographie sources. [${UIEvents.EVENT_SERVING_CARTOSOURCES}] - ${JSON.stringify(objts)} **`,2);
          socket.emit(UIEvents.EVENT_SERVING_CARTOSOURCES,objts);
        }catch(err){
          Log.Error(`MILLA SUPERVISION INTERFACE : send-clients-cartography : `+
          `error sending cartography to client : ((${err.toString()}))`);
        }

    }
    /*
      TELECONTROL - BEGIN
    */
    on_supervisor_drops_teleoperation_right(socket,...args)
    {
      let val = args[0];
      this.CONTROLLER.emit('embed_supervision_telecontrol_drop_rights',socket,val);
    }
    telecontrol_send_link_control_object(socket,lObj)
    {
      
      try{
        //Log.Debug(`telecontrol send link control object : socket id [${lObj.socket_id}]`)
        socket.emit(UIEvents.EVENT_TELECONTROL_STATUS_REQ,lObj);
      }catch(err)
      {
        Log.Warn(`telecontrol send link control object : socket id [${lObj.socket_id}]`
          ` : error [${err}]`);
        return false;
      }
      return true;
    }
    on_ihm_sends_telecontrol_latency_response(socket,lObj)
    {
      this.CONTROLLER.emit('embed_supervision_telecontrol_latency_response',socket,lObj);
    }
    on_ihm_sends_telecontrol_adcontrol_permission_request(socket,...args)
    {
      let req = args[0];
      let res;
      res = this.CONTROLLER.method_bridge('TELEOP'
                              ,'supervisor_demands_adcontrol_permission'
                              ,socket,req);
      
      if(res == false)
      {
        Log.Debug(`on ihm sends telecontrol adcontrol permission request : request not valid`);
        socket.emit(UIEvents.EVENT_TELECONTROL_ADCONTROL_PERMISSION_RES,{response:false});
        return;
      }
      Log.Debug(`on ihm sends telecontrol adcontrol permission request : valid request`);
      socket.emit(UIEvents.EVENT_TELECONTROL_ADCONTROL_PERMISSION_RES,{response:true});
      return true;
    }
    send_telecontrol_notification(socket,type,msg)
    {
      if(socket === "all")
      {
        try{
          this._wsocket_server.sockets.emit(UIEvents.EVENT_TELECONTROL_NOTIFICATION,
            {
              notification_type : type,
              notification_msg : msg
            });
        }catch(err)
        {
          Log.Error(`send telecontrol notification : broadcast error : [${err}]`);
          return false;
        }
        return true;
      }
      try{
        Log.Debug(`send telecontrol notification : sending message [${type}]`
          +` [${msg}]`,3);
        socket.emit(UIEvents.EVENT_TELECONTROL_NOTIFICATION,{
          notification_type : type,
          notification_msg  : msg
        });
      }catch(err)
      {
        Log.Error(`send telecontrol notification : error sending message [${err}]`);
        return false;
      }
    }
    on_telecontrol_make_telecontrol_transfer_request(socket)
    {
      try{
        Log.Debug(`send telecontrol transfer request`,3);
        socket.emit(UIEvents.EVENT_TELECONTROL_BE_PERMISSION_TRANSFER_REQ,"");
      }catch(err)
      {
        Log.Error(`send telecontrol transfer request error. (${err})`);
        return false;
      }
      return true;
    }
    on_ihm_sends_telecontrol_transfer_response(socket,...args)
    {
      let res = args[0];
      Log.Debug(`ihm sends telecontrol transfer response [${JSON.stringify(res)}]`);
      this.CONTROLLER.emit('embed_supervision_telecontrol_transfer_response',socket,res);
    }
    on_ihm_sends_telecontrol_get_stops_request(socket,...args){
      Log.Debug(`ihm sends telecontrol get stops request`,3);
      this.CONTROLLER.emit('embed_supervision_telecontrol_get_stops',socket);
    }
    telecontrol_sends_stops_to_supervisor(socket,stops)
    {
      try{
        Log.Debug(`telecontrol sends stops to supervisor : `);
        socket.emit(UIEvents.EVENT_TELECONTROL_DESTINATION_LIST_RES,stops);
      }catch(err)
      {
        Log.Warn(`telecontrol sends stops to supervisor : error sending data [${err}]`);
        return false;
      }
      return true;
    }
    
    on_ihm_sends_calculate_and_standby_request(socket,...args)
    {
      let req = args[0];
      Log.Debug(`telecontrol sends calculate and standby request [${JSON.stringify(req)}]`,3);
      let result = this.CONTROLLER.method_bridge('TELEOP'
                                      ,'on_supervisor_claims_calculate_and_standby'
                                      ,socket,req);
      if(result == false)
      {
        Log.Warn(`telecontrol sends calculate and standby request : error managing the request`);
        //send an alert?
        this.send_telecontrol_notification(socket,'alert','UNABLE TO HANDLE THE COMMAND');
        return;
      }
    }
    on_ihm_sends_start_ad_request(socket,...args)
    {
      let data = args[0];
      Log.Debug(`on_ihm_sends_start_ad_request`,3);
      let result = this.CONTROLLER.method_bridge('TELEOP'
                                    ,'on_supervisor_sends_start_ad_request'
                                    ,socket,data);
      if(result == false)
      {
        Log.Warn(`on_ihm_sends_start_ad_request : error managing the request`);
        this.send_telecontrol_notification(socket,'alert','ERROR MANAGING REQUEST');
        return;
      }
    }
    on_ihm_sends_stop_ad_request(socket,data)
    {
      Log.Debug(`on_ihm_sends_stop_ad_request`,3);
      let result = this.CONTROLLER.method_bridge('TELEOP'
                                    ,'on_supervisor_sends_stop_ad_request'
                                    ,socket,data);
      if(result == false)
      {
        Log.Warn(`on_ihm_sends_stop_ad_request : error managing the request`);
        this.send_telecontrol_notification(socket,'alert','ERROR MANAGING REQUEST');
        return;
      }
    }

    on_ihm_sends_reset_ad_request(socket,...args)
    {
      let data = args[0];
      Log.Debug(`on_ihm_sends_reset_ad_request`,3);
      let result = this.CONTROLLER.method_bridge('TELEOP'
                                      ,'on_supervisor_sends_reset_ad_request'
                                      ,socket,data);
      if(result == false)
      {
        Log.Warn(`on_ihm_sends_reset_ad_request : error managing the request`);
        this.on_module_sends_msg_warn('ERROR MANAGING REQUEST','teleop');
        return;
      }

    }
    on_telecontrol_disconnects_client(s)
    {
      Log.Warn(`on telecontrol disconnects client : disconnecting socket`)
      try{
        s.disconnect();
      }catch(err){
        Log.Error(`on telecontrol disconnects client : error disconnecting client!`);
        return false;
      }
    }
    on_supervisor_claims_videostream_channels_list(socket,...args)
    {
      this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VIDEOSTREAM_CHANNELS_REQUEST);
    }
    on_supervisor_claims_videostream_channel_set(socket,...args)
    {
      let id = args[0];
      Log.Info(`on telecontrol sends request to set videostream channel id [${id}]`);
      this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VIDEOSTREAM_CHANNEL_SET_REQUEST,id);
    }

    videostream_send_channels_list(list)
    {
      Log.Debug(`videostream_send_channels_list : sending list (${JSON.stringify(list)})`,5);
      let obj = {
        list : []
      }
      obj.list = list;
      this._wsocket_server.sockets.emit(UIEvents.EVENT_VIDSTREAM_CHANNELS_RESPONSE,obj);

    }

     vehicle_system_evaluation_sends_message(msg)
     {
       Log.Debug(`MILLA SD APP : on vehicle system evaluation sends message`);
       this._wsocket_server.sockets.emit(UIEvents.EVENT_VEHICLE_SYSTEM_EVALUATION_MSG,msg);
     }


     //VEHICLE COMPONENTS
     on_supervisor_claims_vehiclecomponent_passengerdoor_buttonpush(socket, ...args){
      this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VCOMPS_PASSENGERDOORBUTTON_PUSH,socket, ...args);
     }
     on_supervisor_demands_door_push_open(socket,...args)
     {
      this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VCOMPS_PASSENGERDOORBUTTON_PUSH_OPEN,socket, ...args);
     }
     on_supervisor_demands_door_push_close(socket,...args)
     {
      this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VCOMPS_PASSENGERDOORBUTTON_PUSH_CLOSE,socket, ...args);
     }


     on_supervsion_claims_cytmods(socket){
      let mods;
      Log.Info(`on-supervisor-claims-cytmods`);
      mods = this.CONTROLLER.method_bridge("MODS_CONTROL_MANAGER","get_frontend_context");
      socket.emit(UIEvents.EVENT_MODSLOADER_CLAIMS_LIST_RESPONSE,mods);
     }



     on_module_sends_msg_debug(msg,mod,socket)
     {
      this._send_modlog_msg({
        timestamp : Tools.timestampToDateString(Tools.getCurrentTimestamp())
        ,type : MillaLogTraceObjectType.DEBUG
        ,module : mod
        ,description : msg
      },socket);
     }
     on_module_sends_msg_notification(msg,mod,socket)
     {
      this._send_modlog_msg({
        timestamp : Tools.timestampToDateString(Tools.getCurrentTimestamp())
        ,type : MillaLogTraceObjectType.NOTIFICATION
        ,module : mod
        ,description : msg
      },socket);
     }
     on_module_sends_msg_info(msg,mod,socket)
     {
      this._send_modlog_msg({
        timestamp : Tools.timestampToDateString(Tools.getCurrentTimestamp())
        ,type : MillaLogTraceObjectType.INFO
        ,module : mod
        ,description : msg
      },socket);
     }
     on_module_sends_msg_warn(msg,mod,socket)
     {
      this._send_modlog_msg({
        timestamp : Tools.timestampToDateString(Tools.getCurrentTimestamp())
        ,type : MillaLogTraceObjectType.WARN
        ,module : mod
        ,description : msg
      },socket);
     }
     on_module_sends_msg_error(msg,mod,socket)
     {
      this._send_modlog_msg({
        timestamp : Tools.timestampToDateString(Tools.getCurrentTimestamp())
        ,type : MillaLogTraceObjectType.ERROR
        ,module : mod
        ,description : msg
      },socket);
     }  
     
     _send_modlog_msg(packet,socket)
     {
      //Log.Info(`HOLA MUNDO!`);
      if(socket != undefined)
      {
        socket.emit(UIEvents.EVENT_MODLOGSNOTIF_ITEM,packet);
      }else{
        this._wsocket_server.sockets.emit(UIEvents.EVENT_MODLOGSNOTIF_ITEM,packet);
      }
     }



  broadcast_to_clients(type, ...args){
    this._wsocket_server.emit(type,...args);
  }
  on_diagnostics_processor_emits_data(data){
    this._wsocket_server.emit(UIEvents.EVENT_DIAGNOSTICPROC_REPORT,data);
  }
  on_diagnostics_processor_broadcasts_raw_data(data){
    this._wsocket_server.emit(UIEvents.EVENT_DIAGNOSTICPROC_REPORT_RAWDIAGSAGG,data);
  }

  
  on_supervisor_demands_videostream_image_mark(socket,mark)
  {
    Log.Info(`on-supervisor-demands-videostream-image-mark [${mark}]`);
    this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.VIDEOSTREAM_ADD_MARK,mark);
  }
  on_supervisor_demands_video_channel(socket,streamid){
    Log.Info(`on-supervisor-demands-videostream-image-mark [${streamid}]`);
    this.CONTROLLER.emit(EmbedSupervisionInterfaceSignals.EMBEDSUPERVISION_VIDEOSTREAM_CHANNEL_SET_REQUEST,streamid);
  }



  on_emit_geojson_local_path(geojson){

    this._wsocket_server.emit(UIEvents.EVENT_VEHICLE_LOCAL_PATH,geojson);
  }
  on_emit_geojson_global_path(geojson){
    this._wsocket_server.emit(UIEvents.EVENT_VEHICLE_GLOBAL_PATH,geojson);
  }
  on_emit_geojson_global_path_points(geojson){
    this._wsocket_server.emit(UIEvents.EVENT_VEHICLE_GLOBAL_PATH_POINTS,geojson);
  }

}




module.exports = RemoteSupervisionInterface;