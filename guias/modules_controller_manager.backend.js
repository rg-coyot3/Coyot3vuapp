const Log           = require('../tools/simple-logger')
                            .CreateInstance(`mods-controller-manager`)
                            .setDebugLevel(5);
const Tools         = require('../tools/init-tools');

const ModulesControllerManagerSignals = require('../common/CModulesControllerManagerSignals');

const ModuleSpecification = require('./cyt_module_specification.js');
const LayoutComponent = require('./cyt_layout_specification.js').LayoutComponent;
const Layout = require(`./cyt_layout_specification`);


class ModulesControllerManager{
  constructor(config){
    this.config = {
      source : config
      , buffer : {
        modules : [],
        default_layout_config : []
      }
    }
    this.Name = "MODS_CONTROL_MANAGER";
    this.CONTROLLER = null;


    this.instances = {
      modules : [],
      layouts : []
    }

  }
  add_module_descriptor(moduleDescritor,layoutsConfiguration){
    Log.Info(`add-module-descriptor : adding external module descriptor`)
    this.config.buffer.modules.push(
      {
        config : moduleDescritor,
        layouts : layoutsConfiguration
      }
    )
  }
  ControllerInit(){
    this.CONTROLLER.connect(ModulesControllerManagerSignals.MODULES_REQUEST,this.on_external_claims_for_modules.bind(this),'mods-mng');
    return true;
  }

  Init(){
    this.load_modules_configuration_();

    //adding basic routes to webapp server
    var numRoutesAdded = 0;
    this.instances.modules.forEach( (m,i) => {
      if(m.thereIsHtml() == false){
        //ignoring
        return;
      }
      if((m.htmlSource() == undefined) || (m.htmlAlias() == undefined)){
        Log.Warn(`init : include html route for item [${i}] results in error `
        +`because the alias or target is not defined!`);
        return;
      }
      this.CONTROLLER.method_bridge("EMBEDSUPERVISION"
                                    ,"add_basic_route"
                                    ,m.htmlAlias()
                                    ,m.htmlSource());
    });
    
    return true;
  }
  Start(){
    return true;
  }

  create_dummy_module(){

  }

  load_modules_configuration_(){
    var loc = __dirname 
    + "/../../config/" 
    + this.config.source.gui_presets.modules_model_location;

    Log.Info(`load-modules-configuration : loading model from [${loc}]`);
    var defaultMods = Tools.loadJsonContentFromFile(loc);

    if( !("mods" in defaultMods)){
      Log.Error("`load-modules-configuration : model does not contain the required object 'mods'(Array). Please, check the configuration file.");
      Log.Error("`load-modules-configuration : THIS INSTANCE WILL NOW STOP");
      process.exit(1);
    }
    if( !("layouts" in defaultMods)){
      Log.Error("`load-modules-configuration : model does not contain the required object 'layouts'(Array). Please, check the configuration file.");
      Log.Error("`load-modules-configuration : THIS INSTANCE WILL NOW STOP");
      process.exit(1);
    }

    // add buffered modules:
    if(this.config.buffer.modules.length > 0){
      this.config.buffer.modules.forEach( mod => {
        if (!("config" in mod)){
          Log.Error(`load-modules-configuration : for externally added module, `
            +`the object "config" does NOT exist. FATAL-ERROR. NOW EXITING`)
          process.exit(1);
        }
        if (!("layouts" in mod)){
          Log.Error(`load-modules-configuration : for externally added module, `
            +`the object "layouts" does NOT exist. FATAL-ERROR. NOW EXITTING`)
          process.exit(1);
        }
        Log.Info(`load-modules-configuration : adding module configuration `
          +`[${mod.config.name}]`)
        defaultMods.mods.push(mod.config);
        mod.layouts.forEach(lo => {
          if(!("layout_id" in lo) ){
            Log.Error(`load-modules-configuration : for externally added module, `
              + `the string property "layout_id", DOES NOT EXIST. FATAL-ERROR. `
              + `NOW EXITTING`);
            process.exit(1);
          }

          defaultMods.layouts.forEach( modlayout => {
            if((!("id" in modlayout)) || (!("components" in modlayout))){
              Log.Error(`load-modules-configuration : while adding external module, `
                + `the source configuration static data has a layout descriptor `
                + `that does NOT contain the property tag "id" OR "components", `
                + ` that needs to be an array. check the configuration`
                + ` file. FATAL-ERROR. NOW EXITTING`);
              process.exit(1);
            }
            Log.Info(`load-modules-configuration : adding to layout [${lo.layout_id}], `
              + `the configuration for module [${lo.content_id}]`)
            modlayout.components.push(lo);
          })
        });
      })
    }
    // ----------
    Log.Info(`load-modules-configuration : charghing modules`);
    defaultMods.mods.forEach( (mod,i) => {
      var newMod = new ModuleSpecification(mod.name);
      if(!newMod.fromRaw(mod)){
        Log.Error(`load-modules-configuration : error loading module described at position [${i}]`);
        Log.Error(`load-modules-configuration : THIS INSTANCE WILL STOP NOW`);
        process.exit(1);
      }
      if(newMod.Active() !== true){
        Log.Info(`load-modules-configuration : charghing modules : is not active. Ignoring`);
        return;
      }
      Log.Info(`load-modules-configuration : charghing modules : loaded [${newMod.Id()}]`);
      this.instances.modules.push(newMod);
    });
    Log.Info(`load-modules-configuration : charghing layouts`);
    defaultMods.layouts.forEach( (lo,i) => {
      var newLayout = new Layout();
      if(newLayout.fromJson(lo) == false)
      {
        Log.Error(`load-modules-configuration : error loading layout described at position [${i}]`);
        Log.Error(`load-modules-configuration : THIS INSTANCE WILL STOP NOW`);
        process.exit(1);
      }

      Log.Info(`load-modules-configuration : charghing layouts : charged [${newLayout.id()}]`);
      Log.Info(`load-modules-configuration : recovered layout configuration [${newLayout.id()}, ${newLayout.name()}]`);
      this.instances.layouts.push(newLayout);
    });

    return true;
  }
  on_external_claims_for_modules(){
    var layouts = [];
    var mods = [];
    this.instances.layouts.forEach(m => {
      layouts.push(m.toJson());
    });
    this.instances.modules.forEach(m => {
      mods.push(m.toJsonExport());
    })
    this.CONTROLLER.emit(ModulesControllerManagerSignal.MODULES_SERVE,{
      mods : mods,
      layouts : layouts
    });
  }
  get_frontend_context(){
    var layouts = [];
    var mods = [];
    this.instances.layouts.forEach(m => {
      layouts.push(m.toJson());
    });
    this.instances.modules.forEach(m => {
      mods.push(m.toJsonExport());
    });
    return {
      mods : mods,
      layouts : layouts
    };
  }


};

module.exports = ModulesControllerManager;