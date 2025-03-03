export let Tools = {
  configure_external_host(proto,host,port){
    if(proto == undefined || proto == ""){
      proto = window.location.protocol;
    }
    if(host == undefined || host == ""){
      host = window.location.hostname;
    }
    if(port == undefined || port == 0){
      port = window.location.port;
    }
    window.document.CTARGET_CHAIN = `${proto}//${host}:${port}/`;
    console.log(`tools : setting target-chain to [${window.document.CTARGET_CHAIN}]`);
  }
  , timestampToDateString:function(ts)
  {
      //console.error(`####### timestamp to date string [${typeof(ts)}] : ${ts}`);
      if(typeof(ts)==='string')
      {
        if(/^\d+$/.test(ts))
        {
          ts = parseInt(ts);
        }
      }
      let tsDate = new Date(ts);
      let msec = ts%1000;
      if(typeof(ts) !== 'number')
      {
        return `Ts 2 input error (${typeof(ts)};${ts})`;
      }
      //if(/^\d+$/.test(ts) == false || typeof())
      let bufferString = `${tsDate.getFullYear()}/${((tsDate.getMonth() +1)<10?'0':'')}${tsDate.getMonth() +1}/${tsDate.getDate()}T`+
          `${tsDate.getHours()<10?'0':''}${tsDate.getHours()}`
          +`:${(tsDate.getMinutes()<10?'0':'')}${tsDate.getMinutes()}`
          +`:${(tsDate.getSeconds()<10?'0':'')}${tsDate.getSeconds()}`
          +`.${(msec<100?'0':'')}${(msec<10?'0':'')}${msec}`;
      return bufferString;
  }
  ,

  getCurrentTimestamp : function()
  {
    return Date.now();
  }
  ,getCurrentTimeString : function()
  {
    return Tools.timestampToDateString(Tools.getCurrentTimestamp());
  }
  ,getCircularReplacer : () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'function' ) return '' + value;
      else if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }
  ,json2cssstring(obj){
    let s = "";
    Object.keys(obj).forEach( k => {
      s+=`${k}: ${obj[k]};`
    });
    return s;
  }
  ,stringify(o){
    return JSON.stringify(o,Tools.getCircularReplacer());
  }
  
  ,stopMouseEventPropagation : function(selector)
  {
    $(selector).click(function(e){
      e.stopPropagation();
    })
  }
  ,onClickGoTop : function(selector)
  {
    $(selector).on('click',function(){
      var parent = $(this).parent();
      parent.append($(this).detach());
    });
    
  }
  ,LoadExternalCss : function(url,callback_on_loaded){
    var headI = document.head;
    if((window.document.CTARGET_CHAIN != "") && (url.startsWith('http')==false)){
      url = window.document.CTARGET_CHAIN + url;
    }
    var cssTag = document.createElement('link');
    cssTag.setAttribute('rel','stylesheet');
    cssTag.setAttribute('type','text/css');
    cssTag.setAttribute('href',url);
    
    
    cssTag.addEventListener("load", () => {
      if(callback_on_loaded)callback_on_loaded();
    });
    cssTag.addEventListener("error", (err) => {
      console.log(`tools error : `)
      if(callback_on_loaded)callback_on_loaded(err);
    });
    headI.appendChild(cssTag);
    return cssTag;
  }
  ,LoadExternalJsonContent : function(url,callbackfunc){
    let xhr= new XMLHttpRequest();
    if((window.document.CTARGET_CHAIN != "") && (url.startsWith('http')==false)){
      url = window.document.CTARGET_CHAIN + url;
    }
    xhr.open('GET', url, true);
    xhr.onreadystatechange= function() {
        let o = false;
        if (this.readyState!==4) {return;}
        else if (this.status!==200) {return;}
        else try{o = JSON.parse(this.responseText)}
             catch(err){o = false}
        callbackfunc(o);
    };
    xhr.send();
    console.log(`lo`)
  }
  ,CreateElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
  
    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
  }
  
  ,LoadExternalHtmlContentOrig : function(url,callback_on_loaded){
    let xhr= new XMLHttpRequest();
    if((window.document.CTARGET_CHAIN != "") && (url.startsWith('http')==false)){
      url = window.document.CTARGET_CHAIN + url;
    }

    xhr.open('GET', url, true);
    xhr.onreadystatechange= function() {
      //console.log(`LOADED!!`)
        if (this.readyState!==4) return callback_on_loaded("not ready state");
        if (this.status!==200) return callback_on_loaded("<b>error</b> <BR/>200 or whatever"); // or whatever error handling you want
        //console.log(` load-external-content : [${url}] = ${this.responseText}`)
        
        callback_on_loaded(Tools.CreateElementFromHTML(this.responseText));
    };
    xhr.send();
  }
  ,LoadExternalHtmlContent : function(url,callback_on_loaded){
    var instance = $('<span></span>').clone();
    if((window.document.CTARGET_CHAIN != "") && (url.startsWith('http')==false)){
      url = window.document.CTARGET_CHAIN + url;
    }
    instance.load(url
                  ,null
                  ,()=>{
                    console.log(`TOOLS : load-external-adress-content : loaded content from [${url}] launching callback`);
                    jQuery(function($){
                      callback_on_loaded(url,instance);
                    });
                  });
    return instance;
  }

  ,LoadExternalJs : function(url,callback_on_loaded){
    if(url == ""){
      console.error(`cyt-tools : load-external-js : invoking with no content!`);
      return null;
    }
    if((window.document.CTARGET_CHAIN != "") && (url.startsWith('http')==false)){
      url = window.document.CTARGET_CHAIN + url;
    }

    var newScriptItem = document.createElement("script");
    newScriptItem.setAttribute("src",url);
    newScriptItem.addEventListener("load", () => {
      callback_on_loaded();
    });
    newScriptItem.addEventListener("error", (err) => {
      console.log(`tools error : `)
      callback_on_loaded(err);
    });
    document.body.appendChild(newScriptItem);
  }
  ,bringOnTop : function(el){
    

    if(typeof(el) == 'object')
    {
      var parent = el.parent();
      parent.children().css('z-index','100');
      el.css('z-index','1000');
      //el.remove();
      //el.insertAfter(parent);
      //parent.append(el);
    }else if(typeof(el) == 'text'){
      var item = $(el);
      var parent = item.parent();
      parent.children().css('z-index','100');
      item.css('z-index','1000');
    }
  }
  ,dragheader : function(containerid,draggablezoneid)
  {
    var content = document.getElementById(containerid);
    var draggable = document.getElementById(draggablezoneid);
    draggable.onmousedown = dragMouseDown;
    var rect;
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function dragMouseDown(e) {
      //draggable = document.getElementById(elid);
      var parent = $(`#${containerid}`).parent(0);
      parent.append($(`#${containerid}`).detach());
      content.style.filter = 'invert(100%)';
      var rect = draggable.getBoundingClientRect();
      //console.log(`clientY = ${e.clientY} ; clientHeight = ${elmnt.clientHeight} top : ${rect.top}`);

      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      content.style.top = (content.offsetTop - pos2) + "px";
      content.style.left = (content.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      content.style.filter = '';

    }
  }
  ,jqresizable : function(container,resizeEndCallback)
  {
    var resizing = false;
    container.mousedown( (e) => {
      console.log(`coords : ${e.clientX}, ${e.clientY}`);
      container.mousemove( (ev) => {

      });

      container.mouseup( () => {
        
      })
    })
  }
  ,resizable : function(contentid,resizeEndCallback)
  {
    var elmnt = document.getElementById(contentid);
      elmnt.onmousedown = dragMouseDown;
    var resizing = false;
    elmnt.style.resize = 'both';
    elmnt.style.overflow = 'auto';
    function dragMouseDown(e) {
      elmnt = document.getElementById(contentid);
      var rect = elmnt.getBoundingClientRect();
      //console.log(`clientY = ${e.clientY} ; clientHeight = ${elmnt.clientHeight} top : ${rect.top}`);

      if( ((e.clientY-rect.top) > (elmnt.clientHeight*0.95))
          &&(e.clientX - rect.left) >(elmnt.clientWidth*0.95))
      {
        console.log('resizing');
        resizing = true;
        document.onmouseup = closeResizeElement;
        return;
      }
      
    }
  
    function closeResizeElement() {
      if(resizing == true)
      {
        console.log('end resize');
        if(typeof(resizeEndCallback) == 'function')
          resizeEndCallback();
        resizing = false;
        return;
      }
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  ,generateRandomString : function(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
  ,dragAndResize : function (elid,resizeEndCallback, type) {
    const Type = {
      ALL : 'ALL'
      ,DRAGGABLE : 'DRAGGABLE'
      ,RESIZABLE : 'RESIZABLE'
    }
    var draggable = false;
    var resizable = false;

    var elmnt = document.getElementById(elid);
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }
    if(type !== undefined)
    {
      switch(type)
      {
        case Type.DRAG:
          draggable = true;
          break;
        case Type.RESIZABLE:
          elmnt.style.resize = 'both';
          elmnt.style.overflow = 'auto';
          resizable = true;
          break;
        case Type.ALL:
          elmnt.style.resize = 'both';
          elmnt.style.overflow = 'auto';
          resizable = true;
          draggable = true;
          break;
        
      }
    }
    else{
      elmnt.style.resize = 'both';
      elmnt.style.overflow = 'auto';
      resizable = true;
      draggable = true;
    }
    var resizing = false;
    
    function dragMouseDown(e) {
      elmnt = document.getElementById(elid);
      var rect = elmnt.getBoundingClientRect();
      //console.log(`clientY = ${e.clientY} ; clientHeight = ${elmnt.clientHeight} top : ${rect.top}`);

      if( ((e.clientY-rect.top) > (elmnt.clientHeight*0.95))
          &&(e.clientX - rect.left) >(elmnt.clientWidth*0.95))
      {
        if(resizable == false)
        {
          return;
        }
        console.log('resizing');
        resizing = true;
        document.onmouseup = closeDragElement;

        return;
      }
      if(draggable == false)return;
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
      if(resizing == true)
      {
        console.log('end resize');
        resizeEndCallback();
        resizing = false;
        return;
      }
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  , SelectorItem : function(sourceInstance,choices){
    this.instance = null;
    
    this._id = sourceInstance.attr('id');
    this._html = "";
    this._choices = {};
    console.log(`Selector Item : initializing for [${this._id}]`);
  
    this.setValue = function(val){
      var valueSet = false;
      //console.log(`Selector Item : [${this._id}] : checking value [${val}]`);
      Object.keys(this._choices).forEach( k => {
        if(valueSet == true)return;
        //console.log(`Selector Item : [${this._id}] : checking value [${val}] : comparing with [${k}] = ${this._choices[k].value}`);

        if(val == this._choices[k].value)
        {
          //console.log(`Selector Item : [${this._id}] : setting option [${k}]`);
          this.instance.val(k);
          valueSet = true;

        }
      });
      return valueSet;
    }
    this.getSelected = function(){
      return this._choices[this.instance.val()];
    }
    this.addClass = function(c)
    {
      this.instance.addClass(c);
    }
    this.onChange = function(value,tag)
    {
      console.log(`Selector item [${this._id}] : change (${value},${tag})`);
    }
    this._reorg_choices = function(){
  
      Object.keys(choices).forEach( k => {
        console.log(`selector item [${this._id}] : adding choice [${k}]`)
        this._choices[k] = {
          text : k
          ,value : choices[k]
        };
      });
  
    }
  
    this._init = function(){
      this._html = `<select id="${this._id}" name="name">`;
      Object.keys(this._choices).forEach( c => {
        this._html+=`<option value="${this._choices[c].text}">${this._choices[c].text}</option>`;
      });
      this._html+= `</select>`;
    }
    
    this._take_place = function(){
      sourceInstance.after(this._html);
      sourceInstance.remove();
      
      this.instance = $(`#${this._id}`);
    }
  
    this._reorg_choices();
    this._init();
    this._take_place();
    this.instance.change( () => {
      this.onChange(this._choices[this.instance.val()].value,this.instance.val())
    });

  }
  , InputItem : function(sourceInstance){
    this.instance = null;
    this._html = "";
    this._id = sourceInstance.attr('id');
    this._init = function(){
      this._html = `<input id="${this._id}" value ="val"/>`;
    }
  
    this._take_place = function(){
      sourceInstance.after(this._html);
      sourceInstance.remove();
      this.instance = $(`#${this._id}`);
      this.instance.change(() => {
        this.onChange(this.instance.val());
      })
    }
    this._init();
    this._take_place();
    this.addClass = function(c){
      this.instance.addClass(c)
    }
    this.onChange = function(value){
      console.log(`Input Instance : [${this._id}] : change : value = ${value}`)
    }
    this.getValue = function(){
      return this.instance.val();
    }
    this.setValue = function(value){
      this.instance.val(value);
    }

  
  }
  , ButtonItem : function(sourceInstance,buttonText,imgSrc){
    
    this.instance = null;
    this.itext = null;
    this._html = "";
    this._id = sourceInstance.attr('id');
    this._active = true;
    this._image = null;
    this.vars = {
      text : '',
      is_text : true,
      image : ''
    }
    this._is_standalone = false;
    if(this._id === undefined || this._id.length == 0)
    {
      this._is_standalone = true;
    }
    this._init = function(){
      this._html = `<div id="${this._id}" style="position:relative;">
        <div id="_button_text" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
          ${buttonText}
        </div>
        <div id='_img_cnt' style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">
          <img id="_img_src" style="visibility:hidden;"/>
        </div>
      </div>`;
      if(this._is_standalone == false)
      {
        sourceInstance.after(this._html);
        sourceInstance.remove();

        this.instance = $(`#${this._id}`);
        this._image = this.instance.find('#_img_src');this._image.removeAttr('id');
        this._icnt = this.instance.find('#_img_cnt');this._icnt.removeAttr('id');
        sourceInstance = this.instance;

      }else{
        this.instance = $(this._html);
        this._image = this.instance.find('#_img_src');this._image.removeAttr('id');
        this._icnt = this.instance.find('#_img_cnt');this._icnt.removeAttr('id');
      }
      this.instance.click( () => {
        if(this._active == false)return;
        this.onClick();
      });
      this.itext = this.instance.find('#_button_text');
      this.itext.removeAttr('id');
    }
    this.Active = function(a){if(a != undefined)this._active = a;return this._active;}
    this.onClick = function(){
      console.log(`button item : ${this._id} : button clicked`);
    }
    this.addClass = function(c){
      this.instance.addClass(c);
    }
    this.setClass = function(c){
      this.instance.attr('class',c);
    }
    this.setText = function(txt)
    {
      if(this.vars.text == txt && this.vars.is_text == true)
      {
        return;
      }
      
      this.vars.text = txt;
      this.itext.text(txt);
      this.itext.css('visibility','visible');
      this._image.css('visibility','hidden');
      this.vars.is_text = true;
    }
    
    this.setImage = function(src){
      
      
      this.itext.css('visibility','hidden');
      this._image.css('visibility','visible');
      if(this.imgSrc == src)
      {
        return;
      }
      setTimeout( () => {

        if(this.instance.width() > this.instance.height())
        {
          this._icnt.css('height','100%');
          
          this._image.css('height','100%');
          this._image.css('width','auto');
          

        }else{
          
          this._icnt.css('width','100%');
          this._image.css('height','auto');
          this._image.css('width','100%');
        }
      },500);
      this.imgSrc = src;
      this._image.attr('src',src);

    }
    
    this.hide = function(time){this.instance.hide(time);}
    this.show = function(time){this.instance.show(time);}
    this.toggle = function(time){this.instance.toggle(time);}

    this._init();
    this.getInstance = function(){return this.instance;}
  }

  , SwitchItem : function(sourceInstance,switchClasses,width='60px',height='34px'){
    this.instance = null;
    this.inputInstance = null;
    this._html = "";
    this._id = sourceInstance.attr('id');
    this._init = function(){
      this._html = `<label id="${this._id} style="position: relative; display: inline-block; height: ${height}; width : ${width}">
        <input type="checkbox" style="opacity: 0;width 0; height: 0;">
        <span class="${switchClasses}"><span>
      </label>`;
      sourceInstance.after(this._html);
      sourceInstance.remove();
      this.instance = $(`#${this._id}`);
      this.inputInstance = this.instance.find('input');
      this.inputInstance.change( ()=>{
        console.log(' checkbox')
        if(this.prop('checked'))
        {
          console.log(`is checked`);
        }else{
          console.log(`is NOT checked`);
        }
      })
      sourceInstance = this.instance;
    }
    this.onActivate = function(){
      console.log(`activate`)
    }
    this.onDeactiate = function(){

    }
    this._init();

  }




}
