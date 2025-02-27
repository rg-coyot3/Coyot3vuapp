import { AppControll3r } from '../app_controller/AppControll3r.js';
import { CEnvironmentManager } from '../cenvironmentmanager/CEnvironmentManager.js';

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
      widgetIcons : []
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

  }

  add_widget_icon(widgetIcon,id){
    widgetIcon.onclick = this.on_widget_icon_clicked.bind(this,`${id}`);
    this.instances.widgetIcons.push({instance: widgetIcon, id : id});
  }
  on_widget_icon_clicked(widgetId){
    console.log(`cdesktopvuapp : on-widget-clicked : ${widgetId}`);
  }
  add_module(m){

  }
  Init(){
    console.log(`cdesktop-webapp : init`)
    this.instances.appcontroller.connect();
    this.instances.appcontroller.Init();
    this.instances.appcontroller.Start();

    this.instances.toolbarmanager.Init();
    this.instances.toolbarmanager.Start();


    
  }
  Start(){
    
    console.log(`cdesktop-webapp : init`)
    this.instances.environmentmanager.configure_workspace_context(this.config.source);
    this.instances.environmentmanager.Init();
    this.instances.environmentmanager.Start();


    this.instances.appcontroller.Init();
    this.instances.appcontroller.Start();

    this.instances.widgetIcons.forEach( i => {
      this.instances.toolbarmanager.add_toolbar_widget(i.instance,i.id,this.on_widget_icon_clicked.bind(this));
    });
  }
};
