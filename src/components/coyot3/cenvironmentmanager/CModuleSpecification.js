export class ModuleSpecification{
  constructor(n){
    this.data = {
      id : "",
      name : n,
      active : true,
      content : {
        html : {
          id : "",
          title : "",
          src : "",
          icon : "",
          alias : "",
          format : {
            maximized : false,
            minimized : false,
            x : "0",
            y : "0",
            w : "0",
            h : "0",
            classes : [""]
          },
          
        },
        css : [""],
        css_night : [""],
        js : [
          {
            script  : "",
            init : ""
          }
        ],
        data : [""]
      }
    }

    this.vars = {
      there_is_html : false,
      there_is_css : false,
      there_is_css_night : false,
      there_is_js : false,
      there_is_data : false,
    }
  }
  Id(i){if(i !== undefined){this.data.id = i}return this.data.id;}
  Name(n){if(n !== undefined)this.data.name = n; return this.data.name;}
  Active(a){if(a !== undefined){this.data.active = a;}return this.data.active;}
  Title(t){if(t !== undefined)this.data.content.html.title = t;return this.data.content.html.title;}
  Icon(i){if( i !== undefined)this.data.content.html.icon = i;return this.data.content.html.icon;}
  setFormat(x,y,w,h){
    this.data.content.html.format.x = x;
    this.data.content.html.format.y = y;
    this.data.content.html.format.w = w;
    this.data.content.html.format.h = h;
    return true;
  }
  X(){return this.data.content.html.format.x}
  Y(){return this.data.content.html.format.y}
  W(){return this.data.content.html.format.w}
  H(){return this.data.content.html.format.h}
  minimized(m){if(m != undefined){this.data.content.html.format.minimized = m}return (this.data.content.html.format.minimized === true);}
  maximized(m){if(m != undefined){this.data.content.html.format.maximized = m}return (this.data.content.html.format.maximized === true);}
  hasPosition(){
    return ((this.data.content.html.format.x != undefined) 
            && (this.data.content.html.format.y != undefined));
  }
  hasDimensions(){
    return ((this.data.content.html.format.w != undefined) 
          && (this.data.content.html.format.h != undefined));
  }
  fromRaw(r){
    this.data.content.js = [];
    this.data.content.css = [];
    this.data.content.html.format = {};
    this.data.content.html.src = "";
    this.data.content.html.alias = "";
    this.data.content.html.title = "";

    if( !("name" in r)){
      console.log("cyt-module-specification : error : no name specified");return false;
    }
    
    
    this.data.name = r.name;
    if( !("id" in r))
    {
      this.data.id = this.data.name;
    }else{
      this.data.id = r.id;
    }

    if( !("active" in r))
    {
      this.data.active = true;
    }else{
      this.data.active = r.active;
    }
    
    if( !("content" in r)){
      console.log("cyt-module-specification : error : no content object");return false;
    }
    let c = r.content;
    if(!("css" in c)){this.vars.there_is_css = false;}
    else{
      this.data.content.css = c.css;
      this.data.content.css_night = c.css_night;
      if(this.data.content.css.length == 1 && this.data.content.css[0].length == 0)
      {
        this.vars.there_is_css = false;
      }else{
        this.vars.there_is_css = true;
      }
    }
    if(!("css_night" in c)){this.vars.there_is_css_night = false;}
    else{
      this.data.content.css_night = c.css_night;
      if(this.data.content.css_night.length == 1 && this.data.content.css_night[0].length == 0)
      {
        this.vars.there_is_css_night = false;
      }else{
        this.vars.there_is_css_night = true;
      }
    }
    if(!("data" in c)){this.vars.there_is_data = false;}
    else{this.data.content.data = c.data;this.vars.there_is_data = true;}
    if(!("js" in c)){this.vars.there_is_js = false;}
    else{
      try{
        this.data.content.js = [];
        this.vars.there_is_js = false;
        c.js.forEach( jm => {
          if( !("script" in jm)
            ||!("init" in jm)){console.log("cyt-module-specification : ERROR : js module specification incomplete because does not have required targets ('src', 'init')");}
          else{
            this.vars.there_is_js = true;
            this.data.content.js.push(jm);
          }
        });
        
      }catch(err){
        console.log("cyt-module-specification : error : loading js-data");
      }
    }
    if(!("html" in c)){delete this.data.content.html; this.vars.there_is_html = false;}
    else{
      let hs = c.html;
      if(  !("source" in hs)
         &&!("alias" in hs)){
          this.vars.there_is_html = false;
        console.log("cyt-module-specification : error : no alias or source has been specified!");
        return false;
      }
      this.data.content.html.source = hs.source;
      this.data.content.html.alias = hs.alias;
      if(this.data.content.html.icon!== undefined)this.data.content.html.icon = hs.icon;
      if( !("title" in hs)){
        console.log("cyt-module-specification : error : no title specified");return false;
      }
      if( !("id" in hs)){
        hs.id = hs.title;
      }
      this.data.content.html.title = hs.title;
      if("format" in hs){
        let hsf = hs.format;
        this.data.content.html.format.minimized = hsf.minimized;
        this.data.content.html.format.maximized = hsf.maximized;
        this.data.content.html.format.x = hsf.x;
        this.data.content.html.format.y = hsf.y;
        this.data.content.html.format.w = hsf.w;
        this.data.content.html.format.h = hsf.h;
        if("classes" in hsf){
          this.data.content.html.format.classes = hsf.classes;
        }
      }
      this.vars.there_is_html = true;
    }
    return true;
  }

  toJson(){return this.data;}
  toJsonExport(){
    //hides to the front-end the real route to the html source
    let j=this.toJson();try{delete (j.content.html.source);}catch(err){};return j;
  };

  thereIsHtml(){return this.vars.there_is_html;}
  htmlSource(s){if(s !== undefined)this.data.content.html.source = s; return this.data.content.html.source;}
  htmlAlias(a){if(a !== undefined)this.data.content.html.alias = a; return this.data.content.html.alias;}

  thereIsCss(){return this.vars.there_is_css;}
  getCssList(){return this.data.content.css;}
  thereIsCssNight(){return this.vars.there_is_css_night;}
  getCssNightList(){return this.data.content.css_night;}
  
  thereIsJs(){return this.vars.there_is_js;}
  getJsItems(){return this.data.content.js;}

  thereIsData(){return this.vars.there_is_data;}
  getDataContent(){return this.data.content.data;}
  
  isEmpty(){
    return (this.thereIsCss() || this.thereIsData() || this.thereIsHtml() ||  this.thereIsJs());
  }

};
