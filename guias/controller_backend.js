const Log = require('../tools/simple-logger')
                  .CreateInstance(`APP CONTROLLER`)
                  .setDebugLevel(0);
const { LOG2E } = require('mathjs');
const Tools = require('../tools/init-tools');




class AppController{
  constructor(config)
  {
      this.webapp  = undefined;
      this.vehicle = undefined;
      this.supapp  = undefined;
      this.im      = undefined;


      this.Modules                       = {};
      this.ModulesProperties             = {};
      this.ModuleMethodSubscriptions     = {};
      this.Signals                       = {};
      this.Vars                          = {};

      this._strict_init = false;
  }
  
  lock(){this.locked = true;}
  unlock(){this.locked = false;}

  add_module(module_object, macroActions)
  {
    var name = module_object.Name;
    if(typeof(name) !== 'string')
    {
      Log.Error(`add module : ERROR : THE INCLUDED MODULE OBJECT DOES NOT CONTAIN A NAME!`);
      process.exit(1);
    }
    if(this.Modules[name] !== undefined)
    {
      Log.Error;(`adding module : [${name}] : `
        +`module description already exists.`);
      process.exit(1);
    }
    Log.Info(`adding module : [${name}]`);
    this.Modules[name] = module_object;
    this.ModulesProperties[name] = {
      activate : (macroActions !== false ? true : false)
    }
    module_object.CONTROLLER = this;
    module_object.CONTROLLER_CONNECTIONS = [];
    return true;
   
  }



  get_module(module_name)
  {
    return this.Modules[module_name];
  }
  /**
   * 
   * @param {*} module_name : that makes reference of an object handled by the controller
   * @param {*} method_name  : that will be parsed from the referenced object
   * @param {*} subscription_func : the target method that will be invoked with the arguments given by the eval(Modules[module_name].${method_name}(...args)
   * @param {*} description 
   */
  module_function_subscription_multiple(module_name,method_name,subscription_func,description = "no-description")
  {
    if(this.Modules[module_name] == undefined)
    {
      Log.Error(`module_function_subscription_multiple : the module `
        +`[${module_name}] does not exist in controller`);
      if(this._strict_init == true)
      {
        Log.Error(`module_function_subscription_multiple : strict init`);
        process.exit(1);
      }
      return false;
    }
    var idx = `${module_name}_${method_name}`;
    if(this.ModuleMethodSubscriptions[idx] == undefined)
    {
      Log.Info(`module_function_subscription_multiple : defining slot for `
        +`[${idx}].`);
      this.ModuleMethodSubscriptions[idx] = {};
      this.ModuleMethodSubscriptions[idx].callback_functions = [];
      Log.Info(`module_function_subscription_multiple : defining slot for `
        +`[${idx}] : creating callback`);
      this.ModuleMethodSubscriptions[idx].callback = (...args) => {

        this.ModuleMethodSubscriptions[`${module_name}_${method_name}`].callback_functions.forEach( (cb_obj) => {
          Log.Debug(`event function upper scope : invoking [${cb_obj.description}]`);
          cb_obj.func(...args);
        });
      }
      Log.Info(`module_function_subscription_multiple : defining slot for `
        +`[${idx}] : linking target method [${module_name}.${method_name}]`);
      var targetFunc = eval(`this.Modules[module_name].${method_name};`);
      if(typeof(targetFunc) !== 'function')
      {
        Log.Error(`module_function_subscription_multiple : defining slot for `
          +`[${idx}] : target method does not exist!`);
        if(this._strict_init == true)
        {
          Log.Error(`module_function_subscription_multiple : strict init`);
          process.exit(1);
        }
        return false;
      }
      eval(`this.Modules[module_name].${method_name} 
        = this.ModuleMethodSubscriptions[idx].callback;`);
    }
    this.ModuleMethodSubscriptions[idx].callback_functions.push({
      func          : subscription_func
      ,description  : description
    });
    Log.Debug(`module_function_subscription_multiple : after joining method, `
      +`current slot for [${idx}] contains `
      +`[${this.ModuleMethodSubscriptions[idx].callback_functions.length}]`);
    return true;
  }
  
  /**
   * @brief Synchone method.
   * @param {*} module_name : 
   * @param {*} method_name 
   * @param  {...any} args 
   * @returns 
   */
   method_bridge(module_name,method_name,...args)
  {
    Log.Debug(`APP CONTROLLER : method bridge [${module_name}.${method_name}](num arguments(${args.length}))`);
    if(this.Modules[module_name] == undefined)
    {
      Log.Error(`claim external method : the module [${module_name}] `
        `does not exist in controller`);
      if(this._strict_init == true)
      {
        Log.Error(`claim external method : strict init`);
        process.exit(1);
      }
      return false;
    }
    var targetFunc = this.Modules[module_name][method_name].bind(this.Modules[module_name]);
    if(typeof(targetFunc) !== 'function')
    {
      Log.Error(`claim external method : defining slot for `
        +`[${module_name}] : target method does not exist!`);
      if(this._strict_init == true)
      {
        Log.Error(`claim external method : strict init`);
        process.exit(1);
      }
      return false;
    }
    Log.Debug(`claim external method : invoking`);
    return targetFunc(...args);
  }
  
  /**
   * @bridge : Creates a connection at the desired module name.
   * @param {*} module_name : name of the module given when attached to the controller
   * @param {*} signal_name : 
   * @param {*} target_func_name : as string, will be evaluated
   * @param {*} target_desc :attached description for logging purposes
   */
  connect_bridge(module_name,signal_name,target_func_name,target_desc = "no-description")
  {
    if(this.Modules[module_name] === undefined)
    {
      Log.Error(`connect bridge : no attached module was found with name [${module_name}]`);
      if(this._strict_init === true)
      {
        Log.Error(`connect bridge : strict init = true : exiting!`);
        process.exit(1);
      }
      return false;
    }
    Log.Info(`connect bridge : to module [${module_name}] : attaching `
      +`connection to signal [${signal_name}] to local function `
      +`[${target_func_name}] with description [${target_desc}]`);
    this.Modules[module_name].CONTROLLER_CONNECTIONS.push({
       sgnl : signal_name
      ,func : this.Modules[module_name][target_func_name]
                  .bind(this.Modules[module_name])
      ,desc : target_desc
    });
  }


  /**
   * @brief inspired by the Qt notation, links one event (signal) to one method
   * @param {*} signal_name 
   * @param {*} target_func 
   */
  connect(signal_name,target_func,target_desc = "no-description")
  {
    if(this.Signals[signal_name] === undefined)
    {
      Log.Info(`connect : creating concentrator slot for event [${signal_name}]`);  
      this.Signals[signal_name] = [];
    }
    
    Log.Info(`connect : connecting event [${signal_name}] to function [${target_desc}]`);
    this.Signals[signal_name].push({
      func : target_func
      ,description : target_desc
    });
  }

  /**
   * @brief inspired by the Qt notation , signals an event
   * @param {*} signal_name 
   * @param  {...any} args 
   * @returns 
   */
  emit(signal_name,...args)
  {
    Log.Debug(`emit signal [${signal_name}] `,3);
    if(signal_name === undefined)
    {
      console.error(`CONTROLLER : emission of undefined signal.`);
      process.exit(1);
    }
    if(this.Signals[signal_name] === undefined)
    {
      return false;
    }
    Log.Debug(`emit signal [${signal_name}] - num slots [${this.Signals[signal_name].length}]`);
    this.Signals[signal_name].forEach( s => {
      Log.Debug(`signal [${signal_name}] , invoking "slot" for [${s.description}]`);
      s.func(...args);
    });
    return true;
  }

  /**
   * @brief simple method to make exchanges of a global variable
   * @param {*} var_name 
   * @param {*} o 
   */
  set_var(var_name,o)
  {
    this.Vars[var_name] = o;
  }

  /**
   * 
   * @param {*} var_name 
   * @returns 
   */
  get_var(var_name)
  {
    return this.Vars[var_name];
  }

  /**
   * 
   */
  add_prototype(module_target,method_name,func)
  {
    if(this.Modules[module_target] === undefined)
    {
      Log.Error(`add prototype : [${module_target}] : error : no module with this tag`);
      if(this._strict_init === true)
      {
        Log.Error(`add prototype : strict init ON. EXITING`);
        process.exit(1);
      }
      return false;
    }
    try{
      Log.Info(`add prototype : [${module_target}] : adding prototype [${method_name}]`); 
      eval(`this.Modules[module_target].${method_name} = func.bind(this.Modules[module_target]);`);
    }catch(err)
    {
      Log.Error(`add prototype : [${module_target}] : error adding prototype [${method_name}]`);
      if(this._strict_init === true)
      {
        Log.Error(`add prototype : [${module_target}.${method_name}] : ERROR : strict init ON. EXITING`);
        process.exit(1);
      }
      return false;
    }
    return true;
  }

  Init()
  {
    var module_object;
    /**
     * intialize controller,
     *  will include external connections in others.CONTROLLER_CONNECTIONS
     */
    Object.keys(this.Modules).forEach( m => {
      module_object = this.Modules[m];
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'controller-init' launch of module [${m}]`)
        return;
      }
      if(typeof(module_object.ControllerInit) === 'function')
      {
        Log.Info(`init : [${m}] is `
          +`compatible with this controller version. Invoking.`);
        if(module_object.ControllerInit() ==  false)
        {
          Log.Warn(`controller-init : for [${m}] not OK `
            + `when invoking ControllerInit callback`);
          console.trace();
          Log.Error(`controller-init : WILL NOW STOP THIS PROCESS`);
          process.exit(1);
        }
      }
      else{
        Log.Warn(`init : module [${m}] seems not to be compatible with this controller`);
      }
    });

    /**
     * initialize the external connections created by others module.ControllerInit()
     */
    Object.keys(this.Modules).forEach( m => {
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'external-connections' of module [${m}]`)
        return;
      }
      module_object = this.Modules[m];
      if(Array.isArray(module_object.CONTROLLER_CONNECTIONS)==false)
      {
        return;
      }
      module_object.CONTROLLER_CONNECTIONS.forEach( c => {

        this.connect(c.sgnl,c.func,c.desc);
        if(typeof(c.func) !== 'function')
        {
          Log.Warn(`init : for module [${m}] connecting to signal [${c.sgnl}] `
            +`method does not exist. Creating default method`);
          c.func = eval(`function(){
            Log.Error("init signal connections : default error method `
              +`connecting [${m}] to signal [${c.sgnl}]");
          }`);
        }
      });
    });

    /**
     * Initializes the module.
     */
    Object.keys(this.Modules).forEach( m => {
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'initialization' of module [${m}]`)
        return;
      }
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'controller-init' launch of module [${m}]`)
        return;
      }
      module_object = this.Modules[m];
      try{
        Log.Info(`init : initializing module [${m}]`);
        var res = this.Modules[m].Init();
        if(res == false){
          Log.Error(`init - module [${m}] launched with not positive result [! true]`);
          Log.Error(`init - THIS INSTANCE WILL STOP : `)
          process.exit(1);
        }else{
          Log.Info(`init : initializing module [${m}] : OK`);
        }
      }catch(err)
      {
        Log.Warn(`init : Init error : ${err}`);
        Log.Error(`init - module [${m}] threwed exception [${err.stack}]`);
        console.trace();
        Log.Error(`init - THIS INSTANCE WILL NOW STOP`);
        process.exit(1);
      }
    });
  }

  Start()
  {
    Object.keys(this.Modules).forEach( m => {
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'start' of module [${m}]`)
        return;
      }
      try{
        Log.Info(`start : [${m}]`);
        var res = this.Modules[m].Start();
        if(res == false){
          Log.Error(`start - module [${m}] launched with not positive result [! true]`);
          Log.Error(`start - THIS INSTANCE WILL STOP : `)
          process.exit(1);
        }else{
          Log.Info(`start : [${m}] : OK`);
        }
      }catch(err)
      {
        Log.Warn(`start : error starting module [${m}] `
          +`: [${err}]`);
        console.trace();
        Log.Error(`start : WILL NOT STOP THIS PROCESS BECAUSE MODULE DIDN'T SUCCESFULLY LAUNCH`);
        process.exit(1);
      }
      
    });
    this.unlock();
  }

  Stop()
  {
    Object.keys(this.Modules).forEach( m => {
      if(this.ModulesProperties[m].activate !== true){
        Log.Info(`init : ignoring 'stop' of module [${m}]`)
        return;
      }
      try{
        Log.Info(`stop : [${m}]`);
        this.Modules[m].Stop();
      }catch(err)
      {
        Log.Warn(`stop : error stopping module [${m}] `
          +`: [${err}]`);
        console.trace();
      }

    });
    this.unlock();
  }


};



module.exports = AppController;