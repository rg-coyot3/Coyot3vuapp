import { AppControll3r } from '../app_controller/AppControll3r.js';
import { CEnvironmentManager } from '../cenvironmentmanager/CEnvironmentManager.js';
import { Tools } from '../tools/ctools.js'
/*
  config : {
    controller : {
      comms : {
        host : "",
        port : 0,
        protocol : "".
        connectorType : "cwebsocketiowrapper | socketio"
      }
    }
  }

*/
const CONF_MODEL = {
  controller : {
    comms : {
      host : "",
      test_ports : [0, 8080],
      protocol : "",
      connectorType : "cwebsocketiowrapper",
      
    }
  }
}

export default class CDesktopWebapp{

  appcontroller(){return this.instances.appcontroller;}
  toolbarmanager(){return this.instances.toolbarmanager;}
  environmentmanager(){return this.instances.environmentmanager;}


  constructor(config){
    console.log(`creating instance of cdesktop-webapp`)
    this.config = {
      source : Object.assign(CONF_MODEL,config),
      config_file_path : `/config/config-coyot3.json`
    }
    this.instances = {
      appcontroller : null,
      toolbarmanager : null,
      environmentmanager : null,
    }
    this.vars = {
      source_port_tests_index : 0
    }

    this.instances.appcontroller      = new AppControll3r(this.config.source.controller);
    this.instances.environmentmanager = new CEnvironmentManager(this.instances.appcontroller);
    this.instances.environmentmanager.setViewport(this.config.source.viewport);
    Tools.LoadExternalJsonContent(this.config.config_file_path,this.on_json_config_load_response.bind(this))

  }


  setToolbar(t){
    this.instances.toolbarmanager = t;
    this.instances.toolbarmanager.appcontroller(this.instances.appcontroller);
    
  }

  on_json_config_load_response(conf){
    
    if(conf === false){
      this.vars.source_port_tests_index++;
      if(this.vars.source_port_tests_index>= this.config.source.controller.comms.test_ports.length){
        this.vars.source_port_tests_index = 0;
      }
      console.warn(`cdesktop-webapp : on-json-config-load-response : error loading file [${this.config.config_file_path}]. retrying in 2 seconds `);
      Tools.configure_external_host("","",this.config.source.controller.comms.test_ports[this.vars.source_port_tests_index]);
      setTimeout( () => {Tools.LoadExternalJsonContent(this.config.config_file_path,this.on_json_config_load_response.bind(this))},2000);
      return;
    }
    //this port is ok... (this is a patch for the dev environment of this packet)
    this.instances.appcontroller.setServerWebsocketPort(this.config.source.controller.comms.test_ports[this.vars.source_port_tests_index]);
    this.construction_bis(conf);
  }
  construction_bis(cenvironmentConfig){
    //console.log(`cdesktop-webapp : continuing constructor`)
    this.instances.appcontroller.connect();
    this.instances.appcontroller.Init();
    this.instances.appcontroller.Start();

    //config:
    this.instances.environmentmanager.askModsToServer(cenvironmentConfig.config.ask_mods_to_server);
    this.instances.environmentmanager.Init();
    this.instances.environmentmanager.Start();
    this.instances.environmentmanager.configure_workspace_context(cenvironmentConfig);
    
  }



  add_module(m){

  }
  Init(){
    this.instances.toolbarmanager.Init();
    this.instances.toolbarmanager.Start();
    
  }
  Start(){
    

    

    this.instances.appcontroller.Init();
    this.instances.appcontroller.Start();
  }
};
