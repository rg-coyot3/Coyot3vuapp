export class LayoutComponent{
  constructor(){
    this.data = {
      content_id : ""
      ,format : {
        maximized : false,
        minimized : false,
        x : "0",
        y : "0",
        w : "0",
        h : "0",
        classes : [""]
      }
    
    }
  }

  toJson(){
    return this.data;
  }
  fromJson(j){
    
    if(
        !("content_id" in j)
      ||!("format" in j)
    ){
      console.error(`-cyt-mod-spec : layout-component : not all required parameters in component (content_id,format)`);
      return false;
    }
    if(
        !("maximized" in j.format)
      ||!("minimized" in j.format)
      ||!("x" in j.format)
      ||!("y" in j.format)
      ||!("w" in j.format)
      ||!("h" in j.format)
    ){
      console.error(`-cyt-mod-spec : layout-component : not all required parameters in component.format (maximized,minimized,x,y,w,h,classes)`);
      return false;
    }
    
      
    this.data.content_id       = j.content_id;
    this.data.format.maximized = j.format.maximized;
    this.data.format.minimized = j.format.minimized;
    this.data.format.x         = j.format.x;
    this.data.format.y         = j.format.y;
    this.data.format.w         = j.format.w;
    this.data.format.h         = j.format.h;
    this.data.format.classes = j.format.classes;
  
    return true;
  }
  id(v){if(v!==undefined){this.data.content_id = v};return this.data.content_id}
  X(){return this.data.format.x}
  Y(){return this.data.format.y}
  W(){return this.data.format.w}
  H(){return this.data.format.h}
  minimized(m){if(m != undefined){this.data.format.minimized = m}return (this.data.format.minimized === true);}
  maximized(m){if(m != undefined){this.data.format.maximized = m}return (this.data.format.maximized === true);}
  hasPosition(){
    return ((this.data.format.x != undefined) 
            && (this.data.format.y != undefined));
  }
  hasDimensions(){
    return ((this.data.format.w != undefined) 
          && (this.data.format.h != undefined));
  }

  
}


export class Layout{
  constructor(){
    this.data = {
      id : ""
      ,name : ""
      ,active: true
      ,toolbar_fastaccess : true
      ,components : {}
    }
  }

  id(i){if(i!== undefined){this.data.id = i}return this.data.id}
  name(v){if(v!==undefined){this.data.name = v}return this.data.name;}
  active(a){if(a !== undefined){this.data.active = a;}return this.data.active;}
  toolbar_fastaccess(tf){if(tf !== undefined){this.data.toolbar_fastaccess = tf;}return this.data.toolbar_fastaccess;}
  component(c){if(c===undefined){return this.data.components}return this.data.components[c];}
  toJson(){
    let cs = [];
    Object.keys(this.data.components).forEach(k=>{
      cs.push(this.data.components[k].toJson());
    });
    return {
      id : this.data.id,
      name : this.data.name,
      active : this.data.active,
      toolbar_fastaccess : this.data.toolbar_fastaccess,
      components : cs
    };
  }
  fromJson(j)
  {
    console.log(`------`);
    this.data.id   = j.id;
    this.data.name = j.name;
    this.data.active = j.active;
    this.data.toolbar_fastaccess = j.toolbar_fastaccess;
    j.components.forEach(k => {
      let lc = new LayoutComponent();
      if(lc.fromJson(k) !== true){
        console.error(`-cyt-mod-spec : layout : fromjson : error parsing input`
        +` for [${this.data.id}]`);
        return;
      }
      console.log(`-cyt-mod-spec : layout : fromjson : adding component [${lc.id()}]`);
      this.data.components[lc.id()] = lc;
    });
    return true;
  }
};