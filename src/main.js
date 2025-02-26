import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import  { Tools }  from './components/coyot3/tools/ctools.js';
window.document.CTARGET_CHAIN = "";
let app;

let sourceFile = "/coyot3/config/config-coyot3.json";

function on_json_config_load_response(conf)
{
  if(conf === false){
    this.vars.source_port_tests_index++;
    if(this.vars.source_port_tests_index>= this.config.source.controller.comms.test_ports.length){
      this.vars.source_port_tests_index = 0;
    }
    console.warn(`cdesktop-webapp : on-json-config-load-response : error loading file [${sourceFile}]. retrying in 2 seconds `);
    setTimeout( () => {Tools.LoadExternalJsonContent(sourceFile,this.on_json_config_load_response.bind(this))},2000);
    return;
  } 
  console.log(`config = ${JSON.stringify(conf)}`) 
  let config = {config : conf};
  app = createApp(App,  config);
  app.mount('#app' )
}




Tools.LoadExternalJsonContent(sourceFile,on_json_config_load_response)