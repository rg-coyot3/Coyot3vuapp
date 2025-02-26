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
        connectorType : "CWIoLikeWrapper | socketio"
      }
    }
  }

*/
const CONF_MODEL = {
  controller : {
    comms : {
      host : "",
      test_ports : [0],
      protocol : "",
      connectorType : "CWIoLikeWrapper",
      
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
      source : config,
      config_file_path : `/coyot3/config/config-coyot3.json`
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
    this.instances.environmentmanager.set_configuration(this.config.source);
    this.instances.environmentmanager.setViewport(this.config.source.d3sktop.viewport);
    
    //this port is ok... (this is a patch for the dev environment of this packet)
    //this.instances.appcontroller.setServerWebsocketPort(this.config.source.controller.comms.test_ports[this.vars.source_port_tests_index]);
    
  }

  setToolbar(t){
    this.instances.toolbarmanager = t;
    this.instances.toolbarmanager.appcontroller(this.instances.appcontroller);
    this.instances.toolbarmanager.Init();
    this.instances.toolbarmanager.Start();
    this.construction_bis(this.config.source);
  }

  construction_bis(cenvironmentConfig){
    //console.log(`cdesktop-webapp : continuing constructor`)
    this.instances.appcontroller.connect();

    //setTimeout(() => {
      //config:
      this.instances.environmentmanager.configure_workspace_context(cenvironmentConfig);
      this.instances.environmentmanager.Init();
      this.instances.environmentmanager.Start();
      
      this.instances.appcontroller.Init();
      this.instances.appcontroller.Start();
    //},2000);
    
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
