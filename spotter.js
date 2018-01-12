'use strict';

//this module loads the library and must be included first.
/*
var old = alert;

alert = function() {
  console.log(new Error().stack);
  old.apply(window, arguments);
};
*/
window.onloadFunctions	= [];

// *** STATIC
	var spotter = {isReady:false};
	spotter.static = {
		classes: {
			placeholder: "placeholder-active"
		}
	}

// *** PROTOYPES AND GLOBAL FUNCTIONS	
	//* SORTS *//{
		function baseSort(a,b){
			var a = (""+a).toLowerCase(),
				b = (""+b).toLowerCase();
			
			return (a === b) ? 0 : (a < b) ? -1 : 1;
		}
		
		// *** MERGE SORT ***
		function merge(func, arr, aux, lo, mid, hi) {
		  var i = lo;
		  var j = mid + 1;
		  var k = lo;
		  while(true){
		    if(func(arr[i],arr[j]) <= 0/*arr[i] <= arr[j]*/){
		      aux[k++] = arr[i++];
		      if(i > mid){
		        do
		          aux[k++] = arr[j++];
		        while(j <= hi);
		        break;
		      }
		    } else {
		      aux[k++] = arr[j++];
		      if(j > hi){
		        do
		          aux[k++] = arr[i++];
		        while(i <= mid);
		        break;
		      }
		    }
		  }
		}
		function sortarrtoaux(func, arr, aux, lo, hi) {
		  if (hi < lo) return;
		  if (hi == lo){
		      aux[lo] = arr[lo];
		      return;
		  }
		  var mid = Math.floor(lo + (hi - lo) / 2);
		  sortarrtoarr(func, arr, aux, lo, mid);
		  sortarrtoarr(func, arr, aux, mid + 1, hi);
		  merge(func, arr, aux, lo, mid, hi);
		}
		function sortarrtoarr(func, arr, aux, lo, hi) {
		  if (hi <= lo) return;
		  var mid = Math.floor(lo + (hi - lo) / 2);
		  sortarrtoaux(func, arr, aux, lo, mid);
		  sortarrtoaux(func, arr, aux, mid + 1, hi);
		  merge(func, aux, arr, lo, mid, hi);
		}
		Array.prototype.mergeSort = function(func){
			func = func || baseSort;
			var l = this.length, aux;
			
			if(l === 0) return;
			if(l < 3) this.sort(func);
			
			aux = this.slice(0);
			sortarrtoarr(func, this, aux, 0, this.length - 1);
			
			return this;
		};

		// *** INDEX SORT ***
		Array.prototype.indexSort = function(sortFunc){
	    	sortFunc = sortFunc || baseSort;
			var indexed = {},
				values = [],
				l = this.length,
				I,
				i,
				isComplex = false,
				inserts = [],
				v,
				x=0;
	    	while(--l > -1){
	            v = this[l];
				if(v.length === 0){ i = ""; }
				else{ i = (""+v)[0].toLowerCase(); }
	    		I = indexed[i];
	    		if(typeof I === 'undefined'){
					indexed[i] = [v];
					values.insertSort([i], sortFunc);
				}
				else{
					isComplex = true;
					I.push(v);
				}
	    	}
			this.splice(0);
	    	
	    	l = values.length;
			if(isComplex){				
				for(x;x<l;x++){
					Array.prototype.push.apply(this, indexed[values[x]].mergeSort(sortFunc));
				}
			}
			else{
				for(x;x<l;x++){
					Array.prototype.push.apply(this, indexed[values[x]]);
				}
			}
	    };
		
		// *** INSERT SORT ***
		Array.prototype.insertSort = function(newData, func){
			func = func || baseSort;
			if(newData.length > 1) newData.sort(func);
			if(this.length === 0){ Array.prototype.push.apply(this, newData); return; }
			
			var b, a = newData.pop(), d = 0, l = this.length - 1, m = l;
			
			/*
			if(l > 20){//initially sort values to be 'high' or 'low'
				d = Math.ceil((l - m)/2);
				m = m - d;
				b = this[m];
				if(func(a,b) <= 0){
					l = m; 
					while(d > 10){
						d = Math.ceil(m/2);
						b = this[d];
						if(func(a,b)<=0) l=d;
					}
				}
				else{ 
					while(d > 10){
						d = Math.ceil((l-d)/2);
						m = m + d;
						b = this[m];
						if(func(a,b)<=0) l=m;
					}					
				}
			}
			*/
			
			while(l > -1 && a !== undefined){
				b = this[l];
				//console.log('insertSort:', 'a:',a,'b:',b,'result:',func(a,b));
				if(func(a,b)>=0){
					this.splice(l+1,0,a);
					a = newData.pop();
				}
				else{
					--l;
				}
			}
			if(l === -1){
				newData.push(a);
				Array.prototype.unshift.apply(this, newData);
			}
			return this;
		};
	// ****** //}
	
	//* GLOBAL FUNCTIONS *//{
		function getVector(mouse){
			//mouse=={start:{x:int,y:int}, end:{x:int,y:int}}
			var chgX = mouse.end.x - mouse.start.x,
				chgY = mouse.end.y - mouse.start.y,
				chgV = Math.sqrt((chgX*chgX) + (chgY*chgY)),
				dir;
			
			/* dir:
			(-X,-Y)----------6-----------(X,-Y)
				   |         |          |
				   |   0     |     1    |
				   |         |          |
				   4--------------------5
				   |         |          |
				   |    2    |      3   |
				   |         |          |
			 (-X,Y)----------7-----------(X,Y)
			*/
			
			if(chgX < 0){
				if(chgY < 0){ dir='0'; }
				else if(chgY > 0){ dir='2'; }
				else{ dir='4'; }
			}
			else if(chgX > 0){
				if(chgY < 0){ dir='1'; }
				else if(chgY > 0){ dir='3'; }
				else{ dir='5'; }
			}
			else{
				if(chgY < 0){ dir='6'; }
				else if(chgY > 0){ dir='7'; }
				else{ dir='no change'; }
			}
			
			return {chgX:chgX, chgY:chgY, L:chgV, quadrant:dir};
		}
		
		function canvasToBlob(canvas, mimeType, quality){
			var dataurl = canvas.toDataURL(mimeType, quality);
			var bstr = atob(dataurl.split(',')[1]), n = bstr.length, u8arr = new Uint8Array(n);
			while(n--){
				u8arr[n] = bstr.charCodeAt(n);
			}
			var blob = new Blob([u8arr], {type: mimeType});
			console.log('the blob size:',blob.size/1000);
			console.log('canvas size:',canvas.width);
			return blob;
		};
		
		function getScrollPos(type){
			//jQuery mod
			var doc = document.documentElement;
			var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
			var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
			if(type === 'top') return top;
			if(type === 'left') return left;
			return [top,left];
		};
	
		//STANDARDIZING FUNCTIONS ************************
		document.cb_addEventListener=(function(){
			if(document.addEventListener){
				var func=function(a,b,c){
					this.addEventListener(a,b,c);
				};
			}else{
				var func=function(a,b,c){
					this.attachEvent('on'+a,b);
				};
			}
			return func;
		}());
	
		document.cb_removeEventListener=(function(){
			if(document.removeEventListener){
				var func=function(a,b,c){
					this.removeEventListener(a,b,c);
				};
			}else{
				var func=function(a,b,c){
					this.detachEvent('on'+a,b);
				};
			}
			return func;
		}());
	
		if(!document.querySelectorAll){
			if(!jQuery){
				document.querySelectorAll=function(str){
					var p,m,l,_l,__l,c,i,j;
					if(str.indexOf('#')!==-1){
						m=str.split('#'),m=m.last().split(' '),p;
						if(m.length===1){return document.getElementById(m[0].match(/^([^#\.]+)/)[1]);}else{p=[document.getElementById(m[0])];}
					}else{
						m=str.split(' '),l=m.length;
					}
					for(i=0;i<l;i++){//recurse through css blocks starting from left-most
						_l=p.length;
						while(_l){
							_l--;
							c=document.getElementsByTagName(m[i].match(/^([^.]+)/)[1])||p.children||p.childNodes;__l=c.length;
							while(__l){//check all children for matches, pop each child off as checked and add on any matches.
								__l--;
								if(!p[_l][c[__l]].className.split(' ').hasList(m[i].replace('.',','))){c.splice(__l,1);}
							}
						}
						p=c;
					}
					return c;
				}
			}else{
				document.querySelector=function(str){
					return jQuery(str)[0];
				}
			}
		}
	
		function removeChildren(node){
			var c = 0;
			while (node.firstChild) {
				node.removeChild(node.firstChild);
				c++;
			}
			return c;
		}
	// ****** //}
	
	//* PROTOTYPAL * //{
		if(!RegExp.escape){
			RegExp.escape= function(s) {
				return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			};
		}
		
		if(!Array.prototype.last){//get last element in array.	
			Array.prototype.last=function(){
				return this[this.length-1];
			}
		}
		
		if(!Array.prototype.indexOf){//
			Array.prototype.indexOf=function(s){
				var l=this.length;
				while(l){
					l--;
					if(this[l]==s){return l;}
				}
				return -1;
			}
		}
		
		Array.prototype.hasList=function(list,o){//l(list: delimited list),o={ordermatters(order matters: true/false),delimiter(delimiter: default ',')}
			if(!o.delimiter){o.delimiter=',';}
			if(!o.ordermatters){o.ordermatters=false;}
			var l=this.length,a=list.split(o.delimiter),_l=a.length;
			if(!o.ordermatters){	
				while(_l){
					_l--;
					if(!this.indexOf(a[_l])){return false;}
				}
			}else{
				while(_l){
					if(!this[_l]==a[_l]){return false;}
				}
			}
			return true;	
		}
		
		if(!Array.prototype.removeValues){//takes any number of arguments and removes them from the array
			Array.prototype.removeValues = function() {
				var what, a = arguments, L = a.length, ax;
				while (L && this.length) {
					what = a[--L];
					while ((ax = this.indexOf(what)) !== -1) {
						this.splice(ax, 1);
					}
				}
				return this;
			};
		}
		
		if(!Array.prototype.changeCSS){	
			Array.prototype.changeCSS=function(p,v){
				var x=this.length;
				while(--x > l){this[x].style[p]=v;}
			};
		}
		
		if(!Array.prototype.arrayWalk){	
			Array.prototype.arrayWalk=function(f){
				var l=this.length,i=0;
				for(i;i<l;i++){
					this[l]=f(this[l]);
				}
			};
		}
		
		if(!Array.prototype.clone){
			Array.prototype.clone = function(){
				return this.slice(0);
			}
		}
		
		if(!Array.prototype.merge){//merge arrays - takes unlimited arguments as (arr)arg1,(arr)arg2...
			Array.prototype.merge=function(){
				var x=0,args=arguments,l=args.length;
				for(x; x<l; x++){
					Array.prototype.push.apply(this,args[x]);
				}
				return this;
			}
		}
		
		//adds only unique values - (does not check against existing values) - takes unlimited arguments as (arr)arg1,(arr)arg2...
		if(!Array.prototype.mergeDistinct){
			Array.prototype.mergeDistinct = (function(){
				var F = function(v){
					return t.indexOf(v) === -1;
				},t;
				return function(){
					//console.log('mergeDistinct: \n','this:',this,' \n','arguments:',arguments);
					
					t = this;
					var x=0,args=arguments,l=args.length;
					
					for(x; x<l; x++){
						Array.prototype.push.apply(this, args[x].filter(F));
					}
					return this;
				};
			}());
		}
		
		if(!Array.prototype.xProd){//remove all non-common values
			Array.prototype.xProd = function(){
				var x, args = arguments, l = args.length, arr = args[0];
				for(x=1;x<l;x++){
					Array.prototype.push.apply(arr, args[x]);
				}
				l=this.length;
				while(--l > -1){
					if(!~arr.indexOf(this[l])) this.splice(l, 1);
				}
				return this;
			};
		}
		
		if(!Array.prototype.mergeAll){//an array of arrays
			Array.prototype.mergeAll=function(){
				if(!Array.isArray(this[0])) this[0] = [this[0]];
				while(typeof this[1] !== 'undefined'){
					Array.prototype.push.apply(this[0],this[1]);
					this.splice(1,1);
				}
				Array.prototype.push.apply(this,this[0]);
				this.shift();
				return this;
			}
		}
		
		Array.prototype.unique = function(){
			var l = this.length;
			while(--l > -1){
				if(this.indexOf(this[l]) !== l){
					this.splice(l,1);
				}
			}
			return this;
		};
		
		/*
		//filter rows for uniqueness based on field - array must contain only objects
		Array.prototype.distinctRows = function(field){
			var l=this.length,x=0,indexed={},results=[],val,obj;
			for(x;x<l;x++){
				obj = this[x];
				val = ("" + obj[field])[0];
				if(typeof indexed[val] === 'undefined'){
					results.push(obj);
					indexed[val] = [obj]; 
				}else{ 
					if(!~indexed[val].indexOf(obj)){
						results.push(obj);
						indexed[val].push(obj); 
					}
				}
			}
			indexed = undefined;
			return results;
		};
		*/
	
		Array.prototype.cloneRows = function(){
			var keys = Object.keys(this[0]), l = this.length, k = keys.length, result = [], i, m, newRow;
			for(m=0; m<l; m++){
				row = this[m];
				newRow = {};
				for(i=0; i<k; i++){
					newRow[keys[i]] = row[keys[i]];
				}
				result.push(newRow);
			}
			return result;
		};	
		
		Array.empty = function(arr){
			if(!arr || arr.length === 0 || !Array.isArray(arr)) return true;
			return false;
		};
		
		Array.getRowFieldValues = (function(){
			var cField, filterFunc = function(obj){ return obj[cField]; };
			return function(arr, field){
				cField = field;
				return arr.map(filterFunc);
			};
		}());
		
		Math.toPercent=function(p,n){//DECIMAL TO PERCENT W/ % SIGN
			return (Number(p)*100.0)+'%';
		}
		
		Math.fromPercent=function(p){//PERCENT TO DECIMAL(WITH OR WITHOUT % SIGN)
			return parseFloat(p)/100.0;
		}
		
		Number.prototype.toPrecision=function(){
			var t=this.toString().match(/^\d*\.{0,1}\d{0,2}/);
			return Number(t);
		}
		
		window.offSetY=(function(){
			if(window.pageYOffset){var func=function(){return window.pageYOffset;};}
			else{
				var func=(function(t){
					var func;
					if(t.scrollTop=='number'){
						func=function(){return t.scrollTop;};}
					else{
						func=function(){return  document.body.scrollTop;};
					}
					return func;
				}(document.documentElement||document.body.parentNode));
			}
			return func;
		}());
		
		String.prototype.stringDifference=function(strB){
			var l=this.length-1;
			for(var x=0;x<l;x++){
				if(strB.charAt(x)!==this.charAt(x)){
					return strB.substr(x);
				}
			}
			return strB.substr(x);
		};
		
		if(!String.prototype.replaceAll){
			String.prototype.replaceAll=function(reg,rep){
				return this.replace(new RegExp(reg,'g'),rep);
			};
		}
		
		if(!String.prototype.replaceAllNoCase){
			String.prototype.replaceAllNoCase=function(reg,rep){
				return this.replace(new RegExp(reg,'ig'),rep);
			};
		}
		
		if(!String.prototype.replaceNoCase){
			String.prototype.replaceNoCase=function(reg,rep){
				return this.replace(new RegExp(reg,'i'),rep);
			};
		}
		
		if(!String.prototype.replaceAllUsing){
			String.prototype.replaceAllUsing=(function(){
				var obj;
				var dynamicReplace = function(match,$1){
					return obj[$1.toLowerCase()];
				};
				return function(reg,repObj){
					obj = repObj;
					return this.replace(new RegExp(reg,'g'),dynamicReplace);
				};
			}())
		}
		
		if(!String.prototype.toggleListValue){
			String.prototype.toggleListValue=function(value,delim){
				value = value.toString();
				if(!this.length){ return value; }
				if(this === value){ return ""; }
				
				if(typeof delim ==='undefined'){ delim = ','; }
				var arr = this.split(delim);
				
				if((i = arr.indexOf(value)) === -1) return arr.join(delim) + delim + value;
				return arr.removeValues(value).join(delim);
			};
		}
		
		if(!String.prototype.removeListValue){
			String.prototype.removeListValue=function(value,delim){
				if(!this.length || this === value){ return ""; }
				
				if(typeof delim ==='undefined'){ delim = ','; }
				var arr = this.split(delim);
				
				if(!Array.isArray(value)){
					value = ""+value;
					return arr.removeValues(value).join(delim);
				}
				else{
					return Array.prototype.removeValues.apply(arr, value).join(',');
				}
			};
		}
		
		if(!String.prototype.addListValue){
			String.prototype.addListValue=function(value,delim){
				if(!Array.isArray(value)){
					value = ""+value;
					if(this.length === 0 || this === value){ return value; }
					
					if(typeof delim === 'undefined'){ delim = ','; }
					var arr = this.split(delim);
					
					if(arr.indexOf(value) !== -1) return this;
					arr.push(value);
					return arr.join(delim);
				}
				else{
					if(this.length === 0 || this === value){ return value.join(' '); }
				
					if(typeof delim === 'undefined'){ delim = ','; }
					var arr = this.split(delim).merge(value);

					return arr.unique().join(delim);
				}
			};
		}
		
		String.prototype.forEach = function(func){
			var l = this.length,x=0;
			while (x < l) {
				func(this[x],x,this);
				x++;
			}
		};
		
		if(!String.prototype.decodeHTML){
			String.prototype.decodeHTML=function(){
				return decodeURI(this.replaceAll('[\\r\\t\\n]',' ').replaceAll('&lt;','<').replaceAll('&gt;','>'));
			};
		}
	
		if(!String.prototype.forEach){
			String.prototype.forEach = function(func){
				var l = this.length,x=0;
				while (x < l) {
					func(this[x],x,this);
					x++;
				}
			};
		}
		
		String.prototype.encodeURLParam = function(){
			return encodeURIComponent(this).replace(/[!'()*]/g, function(c) {
				return '%' + c.charCodeAt(0).toString(16);
			}).replace('%20', '+');
		};
		
		if(typeof Element.prototype.matches === "undefined"){
			Element.prototype.matches = 
				Element.prototype.matchesSelector || 
				Element.prototype.mozMatchesSelector ||
				Element.prototype.msMatchesSelector || 
				Element.prototype.oMatchesSelector || 
				Element.prototype.webkitMatchesSelector ||
				function(selector){
					var parent = this.parentNode
						,matches = parent.querySelectorAll(selector)
						,l = matches.length;
					
					while(--l > -1 && matches[l] !== this){}
					return l > -1;
				};
		}
		
		if (XMLHttpRequest.prototype.sendAsBinary === undefined) {
			XMLHttpRequest.prototype.sendAsBinary = function(string) {
				var bytes = Array.prototype.map.call(string, function(c) {
					return c.charCodeAt(0) & 0xff;
				});
				this.send(new Uint8Array(bytes).buffer);
			};
		}
		
		//WEB STORAGE PROTOTYPE - localStorage and sessionStorage - sessionStorage is non persistent
		
		Storage.prototype.registry = {};
		
		Storage.prototype.setObject = function(key, value){
			if(typeof value !== 'object'){
				console.warn('store object failed bc value is not an object', value, new Error().stack);
				return false;
			}
			this.setItem(key, JSON.stringify(value));
		}
	
		Storage.prototype.getObject = function(key){
			var value = this.getItem(key);
			if(value == '[object Object]'){ console.warn('for some reason a non object is being saved for registry'); return {}; }
			return value && JSON.parse(value);
		}
	
		Storage.prototype.register = function(key, expiration, overwrite){
			var record, now;
			if(overwrite || !(record = this.registry[key])){
				now = Date.now();
				expiration = (expiration ? expiration + now : null);
				this.registry[key] = {date:now, expires: expiration};
			}
		}
		
		Storage.prototype.getRegisteredObject = function(key){
			var registration = this.registry[key], value;
			if(registration !== undefined){
				if(registration['expiration'] !== null && Date.now() > registration['expiration']){
					delete this.registry[key]
					return false;
				}
				else{
					return (value = this.getItem(key)) && value && JSON.parse(value);
				}
			}
			return false;
		}
		
		Storage.prototype.getRegistry = function(key){
			if(!key) return this.registry;
			return this.registry[key];
		}
		
		Storage.prototype.removeExpired = function(key){
			var prop, now = Date.now(), record = [], register;
			if(key){ register = this.registry[key]; register[key] = register; }
			else{ register = this.registry; }
			for(prop in register){
				if(now > register[prop].expires){ 
					this.removeItem('prop');
					record.push(prop);
				}
			}
			return record;
		}
		
		localStorage.removeExpired();
		sessionStorage.removeExpired();
		try{		
			localStorage.registry = localStorage.getObject('registry') || {};
			sessionStorage.registry = sessionStorage.getObject('registry') || {};
		}
		catch(err){
			console.warn('An error occurred using local storage \n', 'error: \n', err);
		}
		
		//thankyou http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
		if(!HTMLCanvasElement.prototype.toBlob){
			HTMLCanvasElement.prototype.toBlob = function(callback, mimeType, quality){
				var dataurl = this.toDataURL(mimeType, quality);
				var bstr = atob(dataurl.split(',')[1]), n = bstr.length, u8arr = new Uint8Array(n);
				while(n--){
					u8arr[n] = bstr.charCodeAt(n);
				}
				var blob = new Blob([u8arr], {type: mimeType});
				callback.call(this, blob);
			};
		}
	// ****** //}

	//* CUSTOM EVENTS PROTOTYPE *//{
		function CustomEvents(customProps, evtName){
			var prop;
			for(prop in customProps){
				if(customProps.hasOwnProperty(prop)) this[prop] = customProps[prop];
			}
			this.timeStamp = Date.now();
			this.type = "CustomEvent";
			this.listenerName = evtName;
			this.cancelled = false;
		};
		
		CustomEvent.prototype.stopImmediatePropagation = function(){
			this.cancelled = true;
		};
		
		function CustomEventsDispatcher(source){
			this.__registeredListeners = {};
			this.__source = source;
		};
		
		CustomEventsDispatcher.prototype.__evtFunctions = function(evtName){
			if(this.__registeredListeners[evtName] === undefined) return (this.__registeredListeners[evtName] = []);
			return this.__registeredListeners[evtName];
		};
		
		CustomEventsDispatcher.prototype.__addEventListener = function(evtName, func){
			if(typeof func !== "function"){ console.warn("add event listener can only attach functions"); return false; }
			var registeredFuncs = this.__evtFunctions(evtName);
			if(!~registeredFuncs.indexOf(func)) registeredFuncs.push(func);
		};
		
		CustomEventsDispatcher.prototype.__removeEventListener = function(evtName, func){
			var registeredFuncs = this.__registeredListeners[evtName], i;
			if(registeredFuncs === undefined) { console.warn('cannot remove func from event listener because func does not exist for listener', this, evtName, func); return false; }
			if(~(i = registeredFuncs.indexOf(func))){
				registeredFuncs.splice(i, 1);
			}
		};
		
		CustomEventsDispatcher.prototype.__dispatchEvent = function(evtObject){
			var registeredFuncs = this.__registeredListeners[evtObject.listenerName], l = registeredFuncs.length, x = -1, func;
			if(Array.isArray(registeredFuncs)){	
				while(++x < l && !evtObject.cancelled && (func = registeredFuncs[x])){
					registeredFuncs[x].call(this.__source, evtObject);
				}
			}
			return !evtObject.defaultPrevented;
		};
	// ****** //}
	
	//* EXPANDED DATA TYPES *//{
		function fastArray(size){
			this.pointer = 0;
			this.length = 0;
			this.size = size;
			this.values = new Array(size);
			this.searchVal = null;//last value searched for in indexOf functions
			this.namedSets = {};//arrays of arrays - name => [ [start, end], [start, end] ] where collectively all the 
		}
		fastArray.prototype.next = function(){//get value in fastArray at higher index from pointer position - progress the pointer
			var l = this.values.length;
			while(this.values[++this.pointer] === undefined && this.pointer < l){}
			return this.values[this.pointer] || null;
		};
		fastArray.prototype.prev = function(){//get value in fastArray at lower index from pointer position - regress the pointer
			var l = this.values.length;
			while(this.values[--this.pointer] === undefined && this.pointer > -1){}
			return this.values[this.pointer] || null;
		};
		fastArray.prototype.current = function(){//get value in fastArray at pointer position
			return this.values[this.pointer] || null;
		};
		fastArray.prototype.first = function(){//get first value in fastArray - advances pointer to zeroth position
			this.pointer = 0;
			return this.values[0];
		};
		fastArray.prototype.last = function(){//get last value in fastArray - advances pointer to last position
			this.pointer = this.length;
			return this.values[this.length];
		};
		fastArray.prototype.getAt = function(i){//get value at index i - advance pointer to i
			this.pointer = i;
			return this.values[i];
		};
		fastArray.prototype.setAt = function(i, val){//set value at index i to val
			if(i > (this.length - 1)){ console.error('cannot set value ('+val+') in fast array - index ('+i+') exceeds length'); return this; }
			this.values[i] = val;
			return this;
		};
		fastArray.prototype.push = function(val){//add val onto end of fastArray
			if(this.values.length < (this.length + 1)) this.values.concat(Math.floor(new Array(this.size/2)));
			this.values[this.length++] = val;
			return this.length;
		};
		fastArray.prototype.concat = function(arr){//push all values from array onto end of fastArray
			if(this.values.length < (this.length + arr.length)) this.values.concat(Math.floor(new Array(Math.max(this.size/2, this.length + (2 * arr.length)))));
			var i = 0, end = arr.length;
			for(i;i<end;i++){
				this.values[this.length++] = arr[i];
			}
			return this.length;
		};
		fastArray.prototype.unique = function(){
			return Array.prototype.unique.call(this);
		};
		fastArray.prototype.mergeDistinct = function(arr){
			if(this.values.length < (this.length + arr.length)) this.values.concat(Math.floor(new Array(Math.max(this.size/2, this.length + (2 * arr.length)))));
			var i = 0, end = arr.length, value;
			for(i;i<end;i++){
				value = arr[i];
				if(!~this.indexOf(value)) this.values[this.length++] = value;
			}
			return this.length;
		};
		fastArray.prototype.pop = function(val){//remove last value from fastArray and return that value
			return this.values[this.length--] || null;
		};
		fastArray.prototype.slice = function(start, end){//get section of fastArray - if start is negative, it start that many places from the end, if end is also included it will be the length of results returned
			end = end || this.length;
			if(start < 0){ 
				start = this.length + start;
			}
			else if(end > this.length){ end = this.length; }
	
			var res = new Array(end - start), p = 0;
			for(start;start<end;start++){
				res[p++] = this.values[start];
			}
			return res;
		};
		fastArray.prototype.splice = function(start, end, array){//replace section of fastArray with array values - if array.length < end - start the difference will be set to undefined
			var i = 0;
			if(this.values.length < (end + 1)) this.values.concat(Math.floor(new Array(Math.max(this.size/2, 4 * (end - this.values.length)))));
			while(start<end){
				this.values[start++] = array[i++] || undefined;
			}
			return this;
		};
		fastArray.prototype.spliceAt = function(start, array){//same as splice but only replaces the same length as array
			var end = start + array.length, i = 0;
			if(end > this.values.length) this.values.concat(Math.floor(new Array(Math.max(this.size/2, (end - this.values.length) * 4))));
			for(start;start<end;start++){
				this.values[start] = array[i++] || undefined;
			}
			return this;
		};
		fastArray.prototype.insert = function(start, array){//insert array values starting at start into fastArray - pushes all existing values array.length ahead
			var newLength = this.length + array.length
				,oldLength = --this.length
				,end = this.length;
		
			if(newLength > this.values.length) this.values.concat(Math.floor(new Array(Math.max(this.size/2, (newLength - this.values.length) * 4))));
		
			this.length = newLength;
			
			while(--newLength > start){
				this.values[newLength] = this.values[end--];
			}
			
			var l = array.length, i = 0;
			while(i < l){
				this.values[++start] = array[i++];
			}
			return this;
		};
		fastArray.prototype.indexOf = function(val){//get first index where value is euqal to val
			this.searchVal = val;
			this.pointer = 0;
			for(this.pointer;this.pointer<this.length;this.pointer++){
				if(this.values[this.pointer] === val) return this.pointer;
			}
			this.pointer = 0;
			return -1;
		};
		fastArray.prototype.lastIndexOf = function(val){//get last index where value is euqal to val
			if(typeof val !== 'undefined'){ this.searchVal = val; }else{ val = this.searchVal; }
			this.pointer = this.length;
			while(--this.pointer){
				if(this.values[this.pointer] === val) return this.pointer;
			}
			return -1;
		};
		fastArray.prototype.indexOfNext = function(val){//get first index after the last indexOf result where value is equal to val - if val isnt passed, the last indexOf val will be used
			if(typeof val !== 'undefined'){ this.searchVal = val; }else{ val = this.searchVal; }
			this.pointer++;
			for(this.pointer;this.pointer<this.length;this.pointer++){
				if(this.values[this.pointer] === val) return this.pointer;
			}
			return -1;	
		};
		fastArray.prototype.indexOfPrev = function(val){//get first previous index before the last indexOf result where value is equal to val - if val isnt passed, the last indexOf val will be used
			if(typeof val !== 'undefined'){ this.searchVal = val; }else{ val = this.searchVal; }
			if(this.pointer === 0) return -1;
			while(--this.pointer > -1){
				if(this.values[this.pointer] === val) return this.pointer;
			}
			this.pointer = 0;
			return -1;
		};
		fastArray.prototype.forEach = function(func){//iterate array and apply func - function(value, index, fastArray) - return false to not progress the pointer (for example if removing a value)
			var x = 0, l = this.length, values = this.values;
			for(x;x<l;x++){
				if(typeof values[x] === "undefined") continue;
				if(func(values[x], x, this) === false) x--;
			}
			return this;
		};
		fastArray.prototype.clean = function(func){//remove undefined array vaues - applies a function to the undefined values - array value will be set instead to the return value of func if a function is given
			//ex: function(row, x, i){ row._index_ = x; return row; } 
			var x = 0, l = this.length, values = this.values, u = 0, p = this.pointer;
			if(typeof func !== "function"){
				for(x;x<l;x++){
					value = values[x];
					if(value === undefined){ u++; }
					else{
						if(u > 0) values[x - u] = value;
						if(p === x) this.pointer -= u;
					}
				}
			}
			else{
				for(x;x<l;x++){
					value = values[x];
					if(value === undefined){ u++; }
					else{
						if(u > 0) values[x - u] = func(value, x, x-u, this);
						if(p === x) this.pointer -= u;
					}
				}
			}
	    
			this.length -= u;
			return this;
		};
		fastArray.prototype.clear = function(){//set values to blank
			this.length = 0;
			this.pointer = 0;
		};
		fastArray.prototype.mergeSort = function(func){
			func = func || baseSort;
			var l = this.length, aux;
			
			if(l === 0) return;
			if(l < 3) this.sort(func);
			
			aux = this.slice(0);
			sortarrtoarr(func, this.values, aux, 0, this.length - 1);
			
			return this;
		};
		fastArray.prototype.insertSort = function(newData, func){
			//console.log('fastArray@insertSort: \n', 'newData:', newData, ' \n', 'func:', func); 
			if(Array.isArray(newData)) newData.mergeSort(func);
			//console.log('fastArray@insertSort: \n', 'newData after initial sort:', newData);
			var i = 0, x = 0, l = this.length, v, inserts = [], n;

			for(x; x<l; x++){
				v = this.values[x];
				while((n = newData[i]) && func(n,v) < 1){
					inserts.push(n);
					i++;
				}
				if(inserts.length > 0){ this.insert(x, inserts); inserts = []; }
			}
			if(i < newData.length) this.concat(newData.slice(i));
			//console.log('fastArray@insertSort: \n', 'i:', i, 'values:', this.values, ' \n', 'length:', this.length);
		};
		fastArray.prototype.namedSet = function(name, start, end){//name a set of values for future reference, recall with getNamedSet - allows 
		
		};
		
		/*fast array test
			var arr = new fastArray(15);
			///////////////0,1,2,3,4,5,6,7,8,9
			arr.pushArray([1,9,3,4,5,6,7,8,9,10]);
			console.log('values: ', arr.values);
			console.log('5: ', arr.indexOf(6));
			console.log('7: ', arr.next());
			console.log('6: ', arr.prev());
			console.log('10: ', arr.push(11));
			arr.splice(3, [4,9,6]);
			console.log('4,9,6: ', arr.slice(3,6));
			console.log('8: ', arr.lastIndexOf(9));
			console.log('4: ', arr.indexOfNext(9));
			console.log('1: ', arr.indexOfPrev());
			console.log('11: ', arr.length);
			arr.insert(3, [1,2,3]);
			console.log('1,9,3,4,1,2,3,5,6,7,8,9,10: ', arr.values);
		*/
	// ****** //}
	
//*** SPOTTER MAIN *//
	(function(){
		var 
			d 			= document||documentElement,
			self		= {},
			__private 	= {}
		;
		
		window.height = window.innerHeight || d.clientHeight || d.getElementsByTagName('BODY')[0].clientHeight;
		window.width = window.innerWidth || d.clientWidth || d.getElementsByTagName('BODY')[0].clientWidth;
		
		window.addEventListener('resize',function(){
			window.height = window.innerHeight || d.clientHeight || d.getElementsByTagName('BODY')[0].clientHeight;
		},false);
		
		spotter.preLoaded = [];
		//temp function to load testLoaded once it is instantiated
		spotter.testLoaded = function(func,typeOrModuleName){
			spotter.preLoaded.push([func, typeOrModuleName]);
		};
		
		// *** GENERAL USE METHODS ***
		spotter.makeId = (function(){
			//returns an unused random string 
			var self=[];
			return function(n){
				var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = n || 5;
				do{	
					for( var i=0; i < n; i++ )	text += possible.charAt(Math.floor(Math.random() * possible.length));
				}while(self.indexOf(text)!==-1);
				self.push(text);
				return text;
			};
		}());
		
		spotter.events = (function(){
		//spotter.events(eventName) creates event by name. If event name already registered, will generate unique event name. Returns event name. 
		//Trigger event w/ spotter.events.fireEvent(eventName). Append object data to event with spotter.events.appendTo(obj, eventName), access with event.content = obj
			var __private={},
				__constructor=function(evtName, noOverWrite){
					if(evtName in __private){
						if(noOverWrite === true) return evtName;
						evtName=evtName+spotter.makeId(5);
					}
					__private[evtName] = document.createEvent('HTMLEvents');
					__private[evtName].initEvent(evtName, true, true);
					return evtName;
				}
			;
			
			__constructor.appendTo=function(o,evtName){
				__private[evtName].content=__private[evtName].content||{};
				for(var prop in o){
					__private[evtName].content[prop]=o[prop];
				}
			};
				
			__constructor.fire=function(evtName){
				if(typeof __private[evtName] === 'undefined') console.log('The event '+evtName+' sent to spotter.events.fire is not a registered event');
				//console.info('EVENT:',evtName);
				document.dispatchEvent(__private[evtName]);
			}
			
			//used to create an event using 'el' as the event initiator instead of document.
			//arguments(el to add eventTrigger, type: the event name)
			//call the event with el.eventTriggers[name]()
			//usseful with 'standard' event types (ie change, mouseover, etc) by allowing them to be triggerable on non-standard elements (useful for change events for hidden inputs & similar cases)
			if (document.createEvent && document.dispatchEvent) {
				__constructor.setEventTrigger = function(el,type){
					if(!spotter.isType.element(el)){
						setupEventTriggerForObject(el, type);
					}
					else{
						el.eventTriggers = el.eventTriggers || {};
						if(typeof el.eventTriggers[type] !== 'undefined') return false;
						var evt = document.createEvent("HTMLEvents");
						var subtype = (type.substring(0,2) === 'on' ? type.substring(2) : type);
						evt.initEvent(subtype, true, true);
						el.eventTriggers[type] = (function(el,evt){
							return function(e, args){ 
								//console.log('custom event dispatch: \n', 'arguments:', arguments, " \n", 'evt type:', type," \n", new Error().stack);
								if(typeof args!=='undefined') evt.arguments = args;
								if(typeof e!=='undefined') el.originalEvent = e;
								if(e) evt.spotterTarget = e.target || e.srcElement || e.originalTarget
								el.dispatchEvent(evt);
							}; 
						}(el,evt));// for DOM-compliant browsers
					}
					return type;
				};
			} else if (document.fireEvent) {
				__constructor.setEventTrigger = function(el,type){
					type = (type.substring(0,2) !== 'on' ? 'on'+type : type);
					el.eventTriggers[type] = (function(el){ 
						return function(){ 
							el.fireEvent(type); 
						}; 
					}(el)); // for IE
					return type;
				};
			}
			else{
				console.warn('custom events are not supported either by fireEvent or createEvent');
				return false;
			}
				
			var setupEventTriggerForObject = (function(){
				/*
				setupEventTriggerForObject(obj, 'someEvent');
				obj.addEventListener('someEvent', function(e){console.log(e);}, false);
				obj.eventTriggers['someEvent']({customProps:'custom values'});
				*/
				var registeredTargs = [], registeredEvtDispatchers = [];
				return function(targ, evtName){
					var rti = registeredTargs.indexOf(targ), evtDispatcher;
					if(!~rti){//create a new dispatcher for the target object
						evtDispatcher = new CustomEventsDispatcher(targ);
						
						targ.eventTriggers = {};
						evtDispatcher.__evtFunctions(evtName);
						(function(evtDispatcher, evtName){ 
							targ.addEventListener = function(evtName, handler){ evtDispatcher.__addEventListener.call(evtDispatcher, evtName, handler); }; 
							targ.removeEventListener = function(evtName, handler){ evtDispatcher.__removeEventListener.call(evtDispatcher, evtName, handler); };
							targ.eventTriggers[evtName] = function(addParams){
								var evt = new CustomEvents(addParams, evtName);
								evtDispatcher.__dispatchEvent.call(evtDispatcher, evt);
							};
						}(evtDispatcher, evtName));
						
						rti = registeredTargs.push(targ) - 1;
						registeredEvtDispatchers[rti] = evtDispatcher;
					}
					else{
						if(targ.eventTriggers[evtName] === undefined){
							evtDispatcher = registeredEvtDispatchers[rti];
							evtDispatcher.__evtFunctions(evtName);
							(function(evtDispatcher, evtName){ 
								targ.eventTriggers[evtName] = function(addParams){
									var evt = new CustomEvents(addParams, evtName);
									evtDispatcher.__dispatchEvent.call(evtDispatcher, evt);
								};
							}(evtDispatcher, evtName));
						}
					}
				};
			}());
			
			// -------- DEFAULT EVENTS --------
				//use these as event types
				__constructor.eventTypes = {
					mouse: {
						mousedown:	'mousedown', 
						mousemove:	'mousemove', 
						mouseup:	'mouseup', 
						mouseover:	'mouseover',
						mouseout: 	'mouseout',
						get: {
							mousedown: function(e){ return ["mousedown",e]; },
							mouseup: function(e){ return ["mouseup",e]; },
							mousemove: function(e){ return ["mousemove",e]; },
							mouseover: function(e){ return ["mouseover",e]; },
							mouseout: function(e){ return ["mouseout",e]; }
						}
					}
				};
			
			//this function is analogous to addEventListener EXCEPT that a target selector is used as the event source and the event is only fired if the original event target meets the targSelector criteria
			//eventType - name of event to trigger (must be setup separately with spotter.setEventTrigger(parent, eventType)
			//parent - the element that will trigger the function (func) if...
			//targSelector - ...the target of the initial user action meets this string (defaults to only the direct children of parent it this argument is empty)
			//func - the function to trigger which will work like a normal event listener functin call (this is the target not parent, and the first argument will be the evt object)
			__constructor.setDelegatedEvent = function(eventType, parent, func, targSelector, overload){
				if(typeof targSelector === 'string'){
					parent.addEventListener(eventType, function(evt){
						var target = evt.spotterTarget || evt.target || evt.srcElement || evt.originalTarget;
						if(!target.matches){ console.log('setDelegatedEvent Error - target does not have a matches method - ',target,' \n', 'source element:', this); return false; }
						//console.log('initial target:', target, ' \n', spotter.getSelector(target), ' \n', 'event:', evt);
						do{
							//console.log('target matches: \n', 'target:', target, ' \n', spotter.getSelector(target), ' \n', 'result:', target.matches(targSelector));
							if(target.matches(targSelector)){
								func.call(target, evt);
								return false;
							}
							target = target.parentNode;
						}
						while(target && target !== this);
					}, (overload?overload["capture"]:undefined), overload);
				}
				else{
					parent.addEventListener(eventType, function(evt){
						var target = evt.spotterTarget || evt.target || evt.srcElement || evt.originalTarget;
						//console.log('initial target:', target, ' \n', spotter.getSelector(target), ' \n', 'event:', evt);
						do{
							//console.log('target matches: \n', 'target:', target, ' \n', spotter.getSelector(target), ' \n', 'result:', target.matches(targSelector));
							if(target.parentNode === this){
								func.call(target, evt);
								return false;
							}
							target = target.parentNode;
						}
						while(target !== this);
					}, (overload?overload["capture"]:undefined), overload);		
				}
			};
			
			__constructor.swipeEvents=function(box, minDist, maxTime, dirAllowed){
				//pass in an element (box) and then use swipe events like box.addEventListener([swiperight|swipeleft|swipeup|swipedown]...
				//if minDist is a percentage (ex: '40%') the distance will be calculated by the height of box
				//maxTime is in ms
				//dirAllowed is optional but will only check for particular directions dirAllowed = [vertical||horizontal]
				maxTime=maxTime||500;//ms
				minDist=minDist||150;//px
				dirAllowed=dirAllowed||['horizontal','vertical'];
				var vertical=~dirAllowed.indexOf('vertical')
					, horizontal=~dirAllowed.indexOf('horizontal')
					, minDistH=minDist
					, minDistW=minDist
					, active=false
					, originalEvent
					, startTime, endTime, startX, startY, endX, endY
					, errors=[]
					, vertical=~dirAllowed.indexOf('vertical')
					, horizontal=~dirAllowed.indexOf('horizontal')
					, originalEvent;
				
				if(box.hasAttribute('max-swipe-time')) maxTime = box.getAttribute('max-swipe-time');
				if(box.hasAttribute('min-swipe-distance')){
					minDist = box.getAttribute('min-swipe-distance');
					minDistH=minDist;
					minDistW=minDist;
				}
				if(~minDist.toString().indexOf('%')){
					if(vertical){	
						var height=spotter.getHeight(box);
						minDistH=(minDist.slice(0,-1) / 100) * height;
					}
					if(horizontal){
						var width=spotter.getWidth(box);
						minDistW=(minDist.slice(0,-1) / 100) * width;
						console.warn('swipe distance horizontal', 'width:', width,' \n', 'minDistW:', minDistW, 'percentage:', minDist.slice(0,-1) / 100);
					}
				}
				
				if(typeof spotter.events.eventTypes === "undefined") console.log(new Error().stack);
				box.addEventListener(spotter.events.eventTypes.mouse.mousedown, function(e){
					originalEvent = e;
					active=true;
					startTime=new Date().getTime();
					startX=e.clientX;
					startY=e.clientY;
				}, false);
				
				var fireEvent=function(e){
					//console.debug('MOUSEUP/OUT',e.type,active,'originalEvent:\n',originalEvent);
					if(active===false) return;
					active=false;
					endTime=new Date().getTime();
					endX=e.clientX;
					endY=e.clientY;
					if(endTime - startTime <= maxTime){
						var result=swipeDirection();
						if(result){
							box.eventTriggers['swipe'+result](originalEvent, {target: originalEvent.originalTarget || originalEvent.target});
						}
						else{
							console.debug(errors);
						}
					}
					else{
						console.debug('time too long '+(endTime - startTime).toString()); 
					}
					errors=[];
				};
				
				box.addEventListener(spotter.events.eventTypes.mouse.mouseup, fireEvent, false);
				box.addEventListener(spotter.events.eventTypes.mouse.mouseout, fireEvent, false);
				
				/*
				box.addEventListener('mousemove', function(e){
					e.preventDefault();
				}, false);
				*/
	
				var swipeDirection=function(){
					var chgX = endX - startX;
					var chgY = endY - startY;
					var chgXABS=Math.abs(chgX);
					var chgYABS=Math.abs(chgY);
					if(chgX > 0){
						if(horizontal && chgXABS > chgYABS){
							if(chgXABS < minDistW){ errors.push('distance too short X:'+chgXABS+' Xmin:'+minDistW); return false; }
							return 'right';
						}
						else if(vertical){ 
							if(chgYABS < minDistH){ errors.push('distance too short Y:'+chgYABS+' Ymin:'+minDistH); return false; }
							if(chgY > 0){
								return 'down';
							}
							else{
								return 'up';
							}
						}
					}else{
						if(horizontal && chgXABS > chgYABS){
							if(chgXABS < minDistW){ errors.push('distance too short X:'+chgXABS+' Xmin:'+minDistW); return false; }
							return 'left';
						}
						else if(vertical){
							if(chgYABS < minDistH){ errors.push('distance too short Y:'+chgYABS+' Ymin:'+minDistH); return false; }
							if(chgY > 0){
								return 'down';
							}
							else{
								return 'up';
							}
						}
					}
				};
			
				if(horizontal){	
					spotter.events.setEventTrigger(box, 'swiperight');
					spotter.events.setEventTrigger(box, 'swipeleft');
				}
				if(vertical){
					spotter.events.setEventTrigger(box, 'swipeup');
					spotter.events.setEventTrigger(box, 'swipedown');
				}
			};
			__constructor.swipeEvents.minSwipeDistance = '40%';
			
			//setup the 'scrollEnd' event on scrollBox - scrollBox.addEventListener('scrollEnd'...
			__constructor.scrollEndEvent=function(scrollBox, minInterval){
				//scrollBox = element to monitor scroll
				//minInterval is the minimum time difference that must have occurred.
				var __private = {
					minInterval: minInterval||800,
					start: new Date().getTime(),
					now: null,
					timer: null,
					scrollBox: scrollBox
				};
				
			   __private.process = function(e){
					__private.timer = function(e){ 
						scrollBox.eventTriggers['scrollEnd'](e);
						return null;
					}(e);
					__private.start = new Date().getTime();
				};
			   
				var __initial = function(e){
					__private.now = new Date().getTime();
					if(__private.timer === null){//if timer expired
						if( __private.now - __private.start > __private.minInterval){
							__private.process(e);
						}
						__private.timer = window.setTimeout(function(){
							__private.process(e);
						},__private.minInterval);
					}
				};
				
				spotter.events.setEventTrigger(scrollBox, 'scrollEnd');
				scrollBox.addEventListener('scroll',__initial,false);
				scrollBox.disableScrollEnd=function(){
					scrollBox.removeEventListener('scroll',__initial,false);
					clearTimeout(__private.timer);
				};
				scrollBox.enableScrollEnd=function(){
					scrollBox.addEventListener('scroll',__initial,false);
				};
			};
			
			__constructor.scrollEndEventv2=function(scrollBox, minInterval){
				var timer;
				spotter.events.setEventTrigger(scrollBox, 'scrollEnd');
				var func=function(e){
					timer && clearTimeout(timer);
					timer=setTimeout(function(){scrollBox.eventTriggers['scrollEnd'](e)}, minInterval);
				};
				scrollBox.addEventListener('scroll', func, false);
				scrollBox.disableScrollEnd=function(){
					timer && clearTimeout(timer);
					scrollBox.removeEventListener('scroll',func,false);
				};
				scrollBox.enableScrollEnd=function(){
					scrollBox.addEventListener('scroll',func,false);
				};
			};
			
			//setup the 'scrollBot' event on scrollBox - scrollBox.addEventListener('scrollBot'...
			__constructor.onScrollBottom = function(scrollBox,eventName){
				spotter.events.setEventTrigger(scrollBox, 'scrollBot');
			
				var onScroll = (function(){
					var scrollDirection = 0;
					var constant = 0;
					return function(e){
						//var height = spotter.getHeight(this);
						var scrollHeight = this.scrollHeight;
						var scrollTop = this.scrollTop;
						var offsetHeight = this.offsetHeight;
						var clientHeight = this.clientHeight;
						
						/*
						console.log('height: '+height);
						console.log('scrollTop: '+this.scrollTop);
						console.log('scrollHeight: '+this.scrollHeight);
						console.log('scrollPoint: '+this.scrollPoint);
						console.log('offsetHeight',this.offsetHeight);
						console.log('innerHeight',this.innerHeight);
						console.log('proximity', scrollTop >= scrollHeight - clientHeight);
						*/
		
						if(scrollTop >= scrollHeight - clientHeight && scrollDirection - scrollTop < 0){
							//console.log('onScroll: this: '+this.id+' - scrollHeight & offsetHeight: '+scrollHeight+'&'+offsetHeight+' - height: '+height+' - scrollTop: '+scrollTop+' - scrollDirection: '+scrollDirection);
							//console.log('onScroll: this: '+this.id+' - offsetHeight + scrollTop: '+(offsetHeight+scrollTop)+' - scrollHeight: '+scrollHeight);
							this.eventTriggers['scrollBot'](e);
						}
						scrollDirection = scrollTop;
					};
				}());
				
				scrollBox.addEventListener('scroll',onScroll,false);
				
				return eventName;
			};
			
			__constructor.pressandhold = (function(){
				var registry = [];
				return function(targ, func){
					if(~registry.indexOf(targ)) return true;
					registry.push(targ);
					
					if(typeof targ.eventTriggers === 'undefined' || !targ.eventTriggers['pressandhold']) spotter.events.setEventTrigger(targ, 'pressandhold');
	
					var timer, clear, clickAttr = "return false;",
						mousedown = (function(targ, par){
							clear = function(){
								clearTimeout(timer);
								return false;
							};
	
							return function(e){
								clearTimeout(timer);
								targ.pressandhold = false;
								targ.setAttribute('onclick', clickAttr);
								timer = setTimeout(function(){
									targ.pressandhold = true;
									clickAttr = targ.getAttribute('onclick');
									targ.removeAttribute('onclick');
									targ.eventTriggers['pressandhold']();
								}, spotter.events.pressandhold.timeout);
							}; 
						}(targ, targ.parentNode));
	
					targ.addEventListener(spotter.events.eventTypes.mouse.mousedown, mousedown, false);
	
					targ.addEventListener(spotter.events.eventTypes.mouse.mouseup, clear, false);
				};
			}());
			__constructor.pressandhold.timeout = 700;
			
			//modifies the 'addEventListener' method on 'elem' to capture certain events to prevent overlap (like a swipe event also triggering a click event)
			//event types: click, swipehorizontal, swipevertical, pressandhold, click
			//cast addEventListener method to expanded version which will delegate which event called avoiding stacking events (swipe takes presedence over pressandhold takes presedence over click): spotter.events.expandedMouseEvents(elem);
			//then attach events as normal: elem.addEventListener('click'...
			__constructor.expandedMouseEvents = function(elem){
			
				if(typeof elem.spotterExpandedMouseEvents === 'undefined'){	
					//modify addEventListener to capture calls to conflicting events
					elem.addEventListener = function(evtType, func, capture, overload){
						if(evtType === 'click') evtType = 'spotterclick';
						var expandedEvtType = evtType;
						
						if(~['pressandhold', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'spotterclick'].indexOf(evtType)){
							if(evtType === 'swipeleft' || evtType === 'swiperight') expandedEvtType = 'swipehorizontal';
							if(evtType === 'swipeup' || evtType === 'swipedown') expandedEvtType = 'swipevertical';
							
							var _self = spotter.events.expandedMouseEvents
								,_event = this.spotterExpandedMouseEvents
								,setup = true;
							
							//overload takes arguments to set specific requirements for custom events
							if(typeof overload === 'object'){
								if(typeof overload.minSwipeDist !== 'undefined'){
									if(expandedEvtType === 'swipehorizontal'){ _event.minDistH = spotter.events.expandedMouseEvents.getMinSwipeDistance(overload.minSwipeDist, this, 'horizontal'); }
									else if(expandedEvtType === 'swipevertical'){ _event.minDistV = spotter.events.expandedMouseEvents.getMinSwipeDistance(overload.minSwipeDist, this, 'vertical'); }
								}
								_event.swipeMaxTime = overload.swipeMaxTime || 500;
								_event.holdMinTime = overload.holdMinTime || 750;
							}
							//console.log('current event params:', _event, ' \n', 'targ elem:', this);
	
							if(expandedEvtType === 'swipehorizontal'){ 
								if(_event.horizontal === true){
									setup = false;
								}
								else{
									_event.horizontal = true;
								}
							}
							else if(expandedEvtType === 'swipevertical'){ 
								if(_event.vertical === true){
									setup = false;
								}
								else{
									_event.vertical = true;
								}
							}
							else if(expandedEvtType === 'pressandhold'){
								if(_event.hold === true){
									setup = false;
								}
								else{
									_event.hold = true;
								}
							}
	
							if(setup === true){//add the default listeners for each mouse/touch event - ultimate event type will be determined by the action of these listeners
								_self.setupEventTrigger(this, expandedEvtType);
								_self.addMouseDownListener(this, expandedEvtType);
								_self.addMouseUpListener(this, expandedEvtType);
								_self.addMouseOutListener(this, expandedEvtType);
							}
						}
						EventTarget.prototype.addEventListener.call(this, evtType, func, capture);
					};
					
					elem.spotterExpandedMouseEvents = {mouseX:0, mouseY:0, startTime:0, horizontal:false, vertical:false, hold:false, minDistV:50, minDistH:50, swipeMaxTime:750, holdMinTime:750};
				}
			};
			
			__constructor.expandedMouseEvents.getMinSwipeDistance = function(num, elem, dir){
				if(~num.toString().indexOf('%')){
					var dim;
					if(dir === 'vertical'){	
						dim = spotter.getHeight(elem);
					}
					else if(dir === 'horizontal'){
						dim = spotter.getWidth(elem);
					}
					return (num.slice(0,-1) / 100) * dim;
				}
			}
			
			//custom events are used to trigger an event instead of native - so click only occurs if swipe and hold do not
			__constructor.expandedMouseEvents.setupEventTrigger = function(elem, type){
				switch(type){
					case 'swipehorizontal':
						spotter.events.setEventTrigger(elem, 'swipeleft');
						spotter.events.setEventTrigger(elem, 'swiperight');
						break;
					case 'swipevertical':
						spotter.events.setEventTrigger(elem, 'swipeup');
						spotter.events.setEventTrigger(elem, 'swipedown');
						break;
					case 'pressandhold':
						spotter.events.setEventTrigger(elem, 'pressandhold');
						break;
					case 'spotterclick':
						spotter.events.setEventTrigger(elem, 'spotterclick');
						break;
				}
			};
			
			// ------- MOUSE DOWN ------- save necessary information for event and enable mouseup/mouseout event to trigger complex event
				__constructor.expandedMouseEvents.addMouseDownListener = function(elem, evtType){
					var _event = elem.spotterExpandedMouseEvents, funcName = 'mousedownFunc';
			
					if(_event.vertical || _event.horizontal) funcName+='Swipe';
					if(_event.hold) funcName+='Hold';
	
					elem.addEventListener(spotter.events.eventTypes.mouse.mousedown, spotter.events.expandedMouseEvents[funcName]);
				};
				__constructor.expandedMouseEvents.mousedownFuncSwipe = function(e){
					e = spotter.events.eventTypes.mouse.get.mousedown(e);
					if(e[0] !== "mousedown"){ return; }else{e = e[1];}
					
					console.log('touchdown');
					console.log('event touchstart:',e);
					var _event = this.spotterExpandedMouseEvents;
					_event.active = true;
					_event.mouseX = e.clientX;
					_event.mouseY = e.clientY;
					_event.startTime = new Date().getTime();
					_event.initiatingEvent = e;				
				};
				__constructor.expandedMouseEvents.mousedownFuncSwipeHold = __constructor.expandedMouseEvents.mousedownFuncSwipe;
				__constructor.expandedMouseEvents.mousedownFuncHold = function(e){
					e = spotter.events.eventTypes.mouse.get.mousedown(e);
					if(e[0] !== "mousedown"){ return; }else{e = e[1];}
					var _event = this.spotterExpandedMouseEvents;
					_event.active = true;
					_event.startTime = new Date().getTime();
					_event.initiatingEvent = e;
				};
				__constructor.expandedMouseEvents.mousedownFunc = function(e){
					e = spotter.events.eventTypes.mouse.get.mousedown(e);
					if(e[0] !== "mousedown"){ return; }else{e = e[1];}
					var _event = this.spotterExpandedMouseEvents;
					_event.active = true;
					_event.initiatingEvent = e;
				};
			// -------- END MOUSE DOWN
			
			// -------- MOUSE UP -------- mouseup only trigger if mousedown was activated - delegate firing to correct event type - order of importance => swipe vertical, swipe horizontal, press and hold, click
				__constructor.expandedMouseEvents.addMouseUpListener = function(elem){
					var _event = elem.spotterExpandedMouseEvents
						,funcName = 'mouseUp';

					elem.removeEventListener(spotter.events.eventTypes.mouse.mouseup, _event.mouseupfunc);
					
					if(_event.vertical || _event.horizontal) funcName += 'Swipe';
					if(_event.hold) funcName += 'Hold';
					
					_event.mouseupfunc = spotter.events.expandedMouseEvents[funcName];

					elem.addEventListener(spotter.events.eventTypes.mouse.mouseup, _event.mouseupfunc);
				};
				//helper - return keyword for direction of swipe
				__constructor.expandedMouseEvents.swipeDirection = function(store, endX, endY){
					var chgX = endX - store.mouseX
						,chgY = endY - store.mouseY
						,chgXABS=Math.abs(chgX)
						,chgYABS=Math.abs(chgY);
			
					if(chgYABS < store.minDistH && chgXABS < store.minDistV){
						console.log('distance too short X:'+chgXABS+' Xmin:'+store.minDistV+' Y:'+chgYABS+' Ymin:'+store.minDistH);
						return false;
					}
					
					if(chgX > 0){
						if(store.horizontal && chgXABS > chgYABS){
							return 'right';
						}
						else if(store.vertical){
							if(chgY > 0){
								return 'down';
							}
							else{
								return 'up';
							}
						}
					}
					else{
						if(store.horizontal && chgXABS > chgYABS){
							return 'left';
						}
						else if(store.vertical){
							if(chgY > 0){
								return 'down';
							}
							else{
								return 'up';
							}
						}
					}
					return false;
				};
				// ---- mouse up standard funcs ----
				__constructor.expandedMouseEvents.mouseUpSwipe = function(e){
					e = spotter.events.eventTypes.mouse.get.mouseup(e)[1];

					var _event = this.spotterExpandedMouseEvents;
					
					if(_event.active === false) return;
					_event.active = false;

					var initiatingEvent = _event.initiatingEvent
						,endTime = new Date().getTime()
						,endX = e.clientX
						,endY = e.clientY
						,chgTime = endTime - _event.startTime
						,direction;
						console.log('swipe result:\n', 'time:', chgTime <= _event.swipeMaxTime, ' \n', 'direction:', spotter.events.expandedMouseEvents.swipeDirection(_event, endX, endY), ' \n', 'endX:', endX, 'endY:', endY);
	
					if(chgTime <= _event.swipeMaxTime && (direction = spotter.events.expandedMouseEvents.swipeDirection(_event, endX, endY))){
						this.eventTriggers['swipe'+direction](initiatingEvent);
					}
					else if(typeof this.eventTriggers['spotterclick'] !== "undefined"){
						this.eventTriggers['spotterclick'](initiatingEvent);
					}
				};
				__constructor.expandedMouseEvents.mouseUpSwipeHold = function(e){
					e = spotter.events.eventTypes.mouse.get.mouseup(e)[1];
					var _event = this.spotterExpandedMouseEvents;
					
					if(_event.active === false) return;
					_event.active = false;
					
					var initiatingEvent = _event.initiatingEvent
						,endTime = new Date().getTime()
						,endX = e.clientX
						,endY = e.clientY
						,chgTime = endTime - _event.startTime
						,direction;
					
					if(chgTime <= _event.swipeMaxTime && (dir = swipeDirection(_event, endX, endY))){
						this.eventTriggers['swipe'+direction](initiatingEvent);
					}
					else if(chgTime > _event.holdMinTime){
						this.eventTriggers['pressandhold'](initiatingEvent);
					}
					else if(typeof this.eventTriggers['spotterclick'] !== "undefined"){
						this.eventTriggers['spotterclick'](initiatingEvent);
					}
				};
				__constructor.expandedMouseEvents.mouseUpHold = function(e){
					e = spotter.events.eventTypes.mouse.get.mouseup(e)[1];
					var _event = this.spotterExpandedMouseEvents;
					
					if(_event.active === false) return;
					_event.active = false;
					
					var initiatingEvent = _event.initiatingEvent
						,endTime = new Date().getTime()
						,chgTime = endTime - _event.startTime
						,direction;
					
					if(chgTime > _event.holdMinTime){
						this.eventTriggers['pressandhold'](initiatingEvent);
					}
					else if(typeof this.eventTriggers['spotterclick'] !== "undefined"){
						this.eventTriggers['spotterclick'](initiatingEvent);
					}
				};
				__constructor.expandedMouseEvents.mouseUp = function(e){
					e = spotter.events.eventTypes.mouse.get.mouseup(e)[1];
					var _event = this.spotterExpandedMouseEvents;
					if(_event.active === false) return;
					_event.active = false;
					
					var initiatingEvent = _event.initiatingEvent;
					
					if(typeof this.eventTriggers['spotterclick'] !== "undefined"){
						this.eventTriggers['spotterclick'](initiatingEvent);
					}
				};
			// ------- END MOUSE UP
			
			// -------- MOUSE OUT -------- mouseout will trigger swipe but not pressandhold or click
				__constructor.expandedMouseEvents.addMouseOutListener = function(elem, evtType){
					var _event = elem.spotterExpandedMouseEvents;
					elem.removeEventListener(spotter.events.eventTypes.mouse.mouseout, spotter.events.expandedMouseEvents.mouseoutfunc);
					if(_event.vertical || _event.horizontal){
						elem.addEventListener(spotter.events.eventTypes.mouse.mouseout, spotter.events.expandedMouseEvents.mouseoutfunc);
					};
				}
				//copy of mouseupswipe except does not trigger click event
				__constructor.expandedMouseEvents.mouseoutfunc = function(e){
					e = spotter.events.eventTypes.mouse.get.mouseout(e)[1];
					var _event = this.spotterExpandedMouseEvents;
					
					if(_event.active === false) return;
					_event.active = false;
					
					var initiatingEvent = _event.initiatingEvent
						,endTime = new Date().getTime()
						,endX = e.clientX
						,endY = e.clientY
						,chgTime = endTime - _event.startTime
						,direction;
					
					if(chgTime <= _event.swipeMaxTime && (direction = spotter.events.expandedMouseEvents.swipeDirection(_event, endX, endY))){
						this.eventTriggers['swipe'+direction](initiatingEvent);
					}
				};
			// ------- END MOUSE OUT
			
			return __constructor;
		}());
		
		spotter.getMousePos = function(evt){
			var x,y;
			if(typeof evt.clientX !== 'undefined'){
				x = evt.clientX;
				y = evt.clientY;
			}
			else if(typeof evt.pageX !== 'undefined'){
				x = evt.pageX;
				y = evt.pageY;
			}
			else{
				return false;
			}
			return [x,y];
		};
		
		spotter.getRelativeMousePos = function(elem, evt){	
			var rect = elem.getBoundingClientRect(),
				coord = spotter.getMousePos(evt);
				
			if(!coord){
				console.warn('event passed to get relative mouse position does not have the necessary data',evt);
				return false;
			}
			return {	
				x: Math.round((coord[0]-rect.left)/(rect.right-rect.left)*(elem.width||spotter.getWidth(elem))),
				y: Math.round((coord[1]-rect.top)/(rect.bottom-rect.top)*(elem.height||spotter.getHeight(elem)))
			};
		}
		
		spotter.observeSetter = function(obj, propertyName, evtName){
			Object.defineProperty(obj, propertyName, {
				set: function(newValue){ 
					delete obj[propertyName];
					this[propertyName] = newValue;
					spotter.events.fire(evtName);
				},
				configurable: true
			});
		};
		
		spotter.empty = function(test){
			return typeof test === 'undefined' || test === null || test.length === 0 || test === 0;
		};
		
		//(obj)opts - func: (str)name of function, msg: (str)prints out, vars: (obj){ (str)name: value }
		var parseErrorStackRegex = new RegExp('(.*?)@(.+)\\/([a-zA-Z0-9]+\\.js):([0-9]+):([0-9]+)$');
		spotter.log = function(type, opts){
			var args = [], funcCSS, msgCSS, varCSS, prop;
			
			funcCSS = 'font-weight:bold;font-size:1.1rem;';
			msgCSS = 'font-size:1.0rem;';
			varCSS = 'font-size:1.0rem;';
			
			switch(type){
				case 'log':
					funcCSS += 'color:#5E5045;'
					msgCSS += 'color:#AA9586;'
					varCSS += 'color:#8E5F3D;'
					break;
				case 'debug':
					funcCSS += 'color:#001266;'
					msgCSS += 'color:#808BBF;'
					varCSS += 'color:#8E5F3D;'
					break;
				case 'error':
					funcCSS += 'color:red;'
					msgCSS += 'color:#922;'
					varCSS += 'color:#8E5F3D;'
					break;
			}
			
			var lineInfo = (new Error().stack).split('\n')[1];
			lineInfo = parseErrorStackRegex.exec(lineInfo);
			if(lineInfo !== null && lineInfo.length > 1) console.log('%c'+lineInfo[1]+' - '+lineInfo[3]+':'+lineInfo[4]+': \n', funcCSS);
			
			if(opts['msg'] !== undefined){ console.log('>%c  '+opts['msg']+' \n', msgCSS); }
			if(opts['vars']){
				console.log('>%c    variables: \n', varCSS);
				for(prop in opts['vars']){
					args.push('>        '+prop+': ');
					args.push(String(opts['vars'][prop]));
					args.push(' \n');
				}
			}
			console.log.apply(console, args);
			console.log('--------------------------------------------------------------------');
		};
		
		spotter.log.stackDump = function(stack){
			var lineInfo = stack.split('\n');
			var trace = [];
			var c = 0;
			var parseErrorStackRegex = new RegExp('(.*?)@(.+?)([a-zA-Z0-9\\-_\\.]+)\\/?:([0-9]+):([0-9]+)$');
			lineInfo.forEach(function(line){	
				if(++c < 10 && line.length > 0){
					line = parseErrorStackRegex.exec(line);
					line !== null && trace.push(line[1]+'@'+line[3]+':'+line[4]);
				}
			});
			return ' \n '+trace.join(' <= ');
		};
		
		(function(head){
			var scripts = head.getElementsByTagName('SCRIPT'), l = scripts.length, registeredScripts = [];
			while(--l > -1){
				console.log('intial src for base spotter script:',scripts[l].getAttribute('src'));
				registeredScripts.push(scripts[l].getAttribute('src'))
			}
			spotter.addScriptToHead = function(path, onload){
				if(~registeredScripts.indexOf(path)){ console.warn('script was already added',path); return false; }
				else{ registeredScripts.push(path); }
				var script = document.createElement('script');
				if(typeof onload === 'function') script.onload = onload;
				script.src = path;
				head.appendChild(script);
			};
			
			var links = head.getElementsByTagName('LINK'), l = links.length, registeredLinks = [];
			while(--l > -1){
				registeredLinks.push(links[l].href+'-'+links[l].rel)
			}
			spotter.addCSSToHead = function(path){	
				if(~registeredLinks.indexOf(path+'-stylesheet')){ console.warn('stylesheet was already added',path); return false; }
				else{ registeredLinks.push(path+'-stylesheet'); }
				var link = document.createElement('link');
				link.href = path;
				link.rel = "stylesheet";
				document.getElementsByTagName('HEAD')[0].appendChild(link);
			};
			spotter.addLinkToHead = function(obj){
				if(!obj.href || !obj.rel){ console.warn('adding a link requires both an href and rel attribute',obj); return false; }
				else if(~registeredLinks.indexOf(obj.href+'-'+obj.rel)){ console.warn('link was already added',obj); return false; }
				else{ registeredLinks.push(obj.href+'-'+obj.rel); }
				var link = document.createElement('link');
				for(var prop in obj){
					link.setAttribute(prop, obj[prop]);
				}
				document.getElementsByTagName('HEAD')[0].appendChild(link);
			};
		}(document.getElementsByTagName('HEAD')[0]));
		
		//typeOrModuleName: 
			//complete|window|undefined - execute when window is ALL loaded
			//document 					- execute when the document is available
			//module name				- execute when module/file calls spotter.require.scriptComplete(module name)
		spotter.testLoaded =  function(func,typeOrModuleName){
			if(typeof func !== 'function'){ console.warn("argument 'func' for spotter testLoaded must be a function",func); return; }
	
			var status, isModule;
			
			if(typeOrModuleName === 'document'){
				status = 'interactive,DOMContentLoaded,complete';
				isModule = false;
			}
			else if(typeof typeOrModuleName === 'undefined' || typeOrModuleName === 'window' || typeOrModuleName === 'complete'){
				status = 'complete';
				isModule = false;
			}
			else{
				isModule = true;
			}
			
			if(!isModule){
				if(status.indexOf(document.readyState) > -1){//IF ALREADY LOADED
					func();
				}
				else{
					window.onloadFunctions.push((function(func,t,status){
						var f=function(){
							if(status.indexOf(document.readyState)!==-1){
								document.cb_removeEventListener('readystatechange',window.onloadFunctions[t]);
								func();
							}
						};
						return f;
					}(func, window.onloadFunctions.length, status)));
				}
				var userAgents = navigator.userAgent||navigator.vendor||window.opera;
				if(/fennec/i.test(userAgents.substr(0,4))){
					document.addEventListener('resize',window.onloadFunctions[window.onloadFunctions.length-1],false);
				}
				else{
					document.addEventListener('readystatechange',window.onloadFunctions[window.onloadFunctions.length-1],false);
				}
			}
			else{
				//console.log(' -- \n', 'testLoaded', ' \n', 'module name:', typeOrModuleName, ' \n', 'is module ready:', spotter.require.isReady(typeOrModuleName));
				if(spotter.require.isReady(typeOrModuleName)){
					func();
				}
				else{
					var functions = window.spotter.onModuleReady.functions;
					functions[typeOrModuleName] = functions[typeOrModuleName] || [];
					functions[typeOrModuleName].push(func);
				}
			}
		};
	
		if(spotter.preLoaded.length){
			spotter.preLoaded.forEach(function(args){
				spotter.testLoaded(args[0], args[1]);
			});
		}
		
		//Returns true if it is a DOM element 
		//http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object   
		spotter.isElement = function(o){
			return !!(
				typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
				o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
			);
		};
		
		//requiredParam
		Object.defineProperty(spotter, 'requiredParam', (function(){
			var result= false;
			var types= [];
			var arg= undefined;
			var __self= function(testArg){if(typeof testArg === 'undefined'){spotter.consoleError('requred argument is undefined',arg);}else{arg = testArg; return __self;}};
			__self.array = function(){ if(result===true || Array.isArray(arg)){ result = true; }else{ types.push('Array'); result = false; } return __self; };
			__self.integer = function(){ if(result===true || Number.isInteger(arg) === true){ result = true; }else{ types.push('Integer'); } return __self; };
			__self.DOMList = function(){ 
				if(result===true || spotter.isType.DOMList(arg)){ result = true; }else{ types.push('HTMLCollection'); types.push('NodeList'); } return __self; 
			};
			__self.string = function(){ if(result===true || typeof arg === 'string'){ result = true; }else{ types.push('String'); } return __self; };
			__self.element = function(tagName){ if(result===true || spotter.isType.element(arg) && (typeof tagName==='undefined' || arg.tagName===tagName.toUpperCase())){ result = true; }else{ types.push('HTMLElement'); } return __self; };
			__self.result = function(){
				if(typeof arg === 'undefined') return function(){console.warn('when using required param, the test argument must be set using spotter.requiredParam(argument)...');};
				if(result === false){
					return function(showStack){console.warn('required arg must be type:['+types.join(',')+']', arg, (showStack ? new Error().stack : '')); return false;}
				}
				else if(result === true){
					return function(){return true;};
				}
				else{
					return function(){console.warn('result not boolean');};
				}
			};
			return {
				get: function(){arg= undefined; result= false; types= []; return __self},//ensure that arg is undefined if result is called and has not been set
				enumerable: true,
				configurable: false
			};
		}()));
		
		spotter.isType = {
			array: function(arg){return Array.isArray(arg);},
			integer: function(arg){return Number.isInteger(arg) === true;},
			DOMList: function(arg){return typeof arg !== 'undefined' && ((arg instanceof NodeList || arg instanceof HTMLCollection));},
			string: function(arg){return typeof arg === 'string';},
			element: function(arg){return !!(arg && (arg.nodeName || (arg.prop && arg.attr && arg.find)));},
			rows: function(arg){ var result = true; if(Array.isArray(arg)){ arg.forEach(function(item){ if(typeof item !== 'object') result = false; }); return result; }else{return false;} },
			numeric: function(arg){ return typeof o !== 'undefined' && !Array.isArray(o) && (o - parseFloat(o) + 1) >= 0; },
			arrayLike: function(test){ return test && typeof test === "object" && typeof test.length !== "undefined"; }
		};
	
		spotter.hexToRgb = function(hex){
			if(hex.charAt(0)==='#'){hex=hex.substr(1);}
			if(hex.length===3){hex=hex.replace(/^(.)(.)(.)$/,function(m,r,g,b){return r+r+g+g+b+b;});}
			var bigint = parseInt(hex, 16),
				r = (bigint >> 16) & 255,
				g = (bigint >> 8) & 255,
				b = bigint & 255
			;
		
			return r + "," + g + "," + b;
		};
	
		spotter.consoleError = function(msg,data,threatLevel,functionName){
			//threatLevel = [major|minor] major errors 'throw new error' while minor will just issue a console message
			//if a functionName is give than the function itself will not display
			threatLevel = threatLevel || 'minor';
			msg = typeof functionName == 'undefined' ? "ERROR: "+arguments.callee.caller.toString()+": "+msg : "ERROR: "+functionName+": "+msg;
			if(threatLevel === 'minor'){
				console.log(msg);
				if(!data){console.log("---DATA EMPTY---");}
				else{console.log(data);}
				console.log("/ERROR END");
			}
			else if(threatLevel === 'major'){
				throw new Error(msg + "/ERROR END");
			}
		};
		
		// *** ANIMATION HELPERS ***
		__private.whichTransitionEvent = function(){
			var t
				,el = document.createElement('fakeelement')
				,transitions = {
					'transition':'transitionend',
					'OTransition':'oTransitionEnd',
					'MozTransition':'transitionend',
					'WebkitTransition':'webkitTransitionEnd'
				};
		
			for(t in transitions){
				if( el.style[t] !== undefined ){
					return transitions[t];
				}
			}
			console.log("no transition end event was discovered, defaulting to 'transitionend'");
			return 'transitionend';
		};
		
		spotter.whichTransitionEvent = __private.whichTransitionEvent();
		
		__private.whichAnimationEvent = function(){
			var t,
			el = document.createElement("fakeelement");
			var animations = {
				"animation"      : "animationend",
				"OAnimation"     : "oAnimationEnd",
				"MozAnimation"   : "animationend",
				"WebkitAnimation": "webkitAnimationEnd"
			}
			for (t in animations){
				if (el.style[t] !== undefined){
					return animations[t];
				}
			}
		};
		
		spotter.whichAnimationEvent = __private.whichAnimationEvent();
	
		spotter.onTransformEnd = (function(){
			var transitionVernacular = __private.whichTransitionEvent();
			return function(el,func){
				func = function(e){ func(e); this.removeEventListener(transitionVernacular,func,false); };
				el.addEventListener(transitionVernacular,func,false);
			};
		}());
		
		spotter.onResize = (function(){
			var __private	= {onResize:[]};
			var __public	= function(func,args){
				if(!Array.isArray(args)) args = [args];
				__private.onResize.push({func:func,args:args});
			},
			resizeId,
			resizeFuncs = function(){
				__private.onResize.forEach(function(obj,key){
					obj.func.apply(this,obj.args);
				});
			};
			window.addEventListener('resize',function(){
				clearTimeout(resizeId);
				resizeId = setTimeout(resizeFuncs, 500);
			});
			return __public;
		}());
	
		spotter.onPageOut =  (function(){
			var executeFuncs=[],
				__self=function(func){executeFuncs.push(func);}
			;
			__self.getFuncs=executeFuncs;
			
			window.addEventListener('beforeunload',function(e){
				var funcs=spotter.onPageOut.getFuncs;
				var l=funcs.length;
				funcs.forEach(function(val,index,array){val();});					
			},false);
			
			return __self;
		}());
	
		// *** NODE HELPERS ***
		spotter.getFirstTextNode = function(el){
			for(var i=0,l=el.childNodes.length; i<l && el.childNodes[i].nodeName !== "#text"; i++){}
			return el.childNodes[i]||(el = el.insertBefore(document.createTextNode(''), el.firstChild)||el.firstChild);
		};
		
		spotter.setFirstTextNode = function(el,txt){
			var node = spotter.getFirstTextNode(el);
			node.nodeValue = txt;
			return node;
		};
		
		spotter.toggleFirstTextNodeValue = function(el,txt){
			var node=spotter.getFirstTextNode(el);
			node.nodeValue=node.nodeValue.toggleListValue(txt);
			return node;
		};
		
		spotter.firstTextNodeRemoveValue = function(el,txt){
			var node=spotter.getFirstTextNode(el);
			node.nodeValue=node.nodeValue.removeListValue(txt);
			return node;
		};
		
		spotter.firstTextNodeAddValue = function(el,txt){
			var node=spotter.getFirstTextNode(el);
			node.nodeValue=node.nodeValue.addListValue(txt);
		};
		
		spotter.placeholder = {
			add: function(textNode,string){
				//console.log('arguments: ', arguments, ' \n', 'parentNode: ', textNode.parentNode, ' \n', '!textNode.nodeValue: ', !textNode.nodeValue);
				if(!textNode.nodeValue){
					textNode.nodeValue = string;
					spotter.toggle.class.add(textNode.parentNode, spotter.static.classes.placeholder);
				}
				else{
					spotter.toggle.class.remove(textNode.parentNode, spotter.static.classes.placeholder);
				}
			}
		}
		
		spotter.prependChild = function(par,child){
			par.insertBefore(child,par.firstChild);
		};
	
		spotter.insertAfter = function(elder,younger){
			elder.parentNode.insertBefore(younger, elder.nextSibling);
		};
	
		spotter.deleteElement = function(el){
			var p = el.parentNode;
			if(!p){ 
				/*console.warn("'el' sent to delete element does not have a parent"," \n","el:",el," \n","stack:",new Error().stack);*/
				return false;
			}
			el.parentNode.removeChild(el);
		};
	
		spotter.replaceElement = function(el,replacement){
			var par=el.parentNode,sibling=el.nextSibling;
			par.removeChild(el);
			par.insertBefore(replacement,sibling);
		};
	
		spotter.replaceByHTML = function(el,HTMLStringReplacement){
			var sibling=el.previousSibling,command='afterend',whereSibling="nextSibling";
			if(!sibling){command='beforebegin';sibling=el.nextSibling,whereSibling="previousSibling";}
			spotter.deleteElement(el);
			sibling.insertAdjacentHTML(command, HTMLStringReplacement);
			return sibling[whereSibling];
		};
		
		spotter.moveTo = function(moveElem,toElem){
			var bodyRect = document.body.getBoundingClientRect(),
			targRect = toElem.getBoundingClientRect(),
			offsetTop   = targRect.top - bodyRect.top;
			offsetLeft  = targRect.left - bodyRect.left;
			
			var width = spotter.getWidth(moveElem);
			
			var left = offsetLeft + width > bodyRect.width ? bodyRect.width - width : offsetLeft;
			
			moveElem.style.top = offsetTop+'px';
			moveElem.style.left = left+'px';
		};
		
		spotter.concatNodeLists = function(a){//array of nodelists
			var arr=[];
			for(var x=0,l=a.length;x<l;x++){
				arr=arr.concat(Array.prototype.slice.call(a[x]));
			}
			return arr;
		};
		
		spotter.DOMObject = (function(){
			var __public = function(){};
			
			__public.getRelativeWidth = function(el){
				var w = spotter.getWidth(el);
				if(w > 0){
					var p = el.parentNode,count=0;
					while(!((wP = spotter.getWidth(p)) > 0) && count < 5){ p = p.parentNode; count++; }
					return Number((w/wP)*100) + '%';
				}
				else{
					return w;
				}
			};
			
			return __public;
		}());
		
		/*
		spotter.verticallyCenter = (function(){
			//This js based version works but the new css classes are better
			var _verticalCentered = [],
				func = function(){
					var _vc = _verticalCentered, l = _vc.l, el, h;
					while(--l > -1){
						el = _vc[l];
						h = Math.floor(spotter.getHeight(el) / 2);
						el.style.top = "calc(50% - " + h + ")";
					}
				};
		
			spotter.testLoaded(function(){
				var _vc = _verticalCentered, els = document.querySelectorAll('.center-vertical'), l;
				if(els !== null) _vc.merge(els);
				l = _vc.length;
				while(--l > -1){
					_vc[l].style.position = "fixed";
				}
				func();
				spotter.onResize(func);
			});
			
			return function(el){
				_verticalCentered.push(el);
				el.style.position = "fixed";
				el.style.top = "calc(50% - " + Math.floor(spotter.getHeight(el) / 2) + "px)";
			};
			
		}());
		*/
		
		spotter.verticallyCenter = function(el){
			spotter.toggle.class.add(el, 'centered-content');
			spotter.toggle.class.add(el.parentNode, 'content-centered');
		};
		
		spotter.getSelector = function(el){
			var selector = el.tagName;
			//if(typeof selector === 'undefined'){ console.log('el must be an html element',new Error().stack); return; }
			selector = selector.toLowerCase();
			
			if(el.id) selector += '#'+el.id;
			if(el.className) selector += '.'+el.className.replace(' ', '.');
			
			return selector;
		};
	
		// *** AJAX ***
		spotter.ajax = (function(){		
			var timeout = 8000;
			if(1===0 && window.hasOwnProperty('fetch')){
				/*
				var init = {
					method: obj.method,
					headers: obj.headers,
					mode: obj.mode,
					cache: obj.cache,
					body: obj.data
				}
	
				fetch(url, init).then(complete).catch(function(){console.log(arguments);});
				*/
			}
			else if(1===1){
				function remoteRequest(){
					this.onComplete=[];
					this.onSuccess=[];
					this.onProgress=[];
					this.onError=[];
					this.onAbort=[];
					this.failed=false;
					this.succeeded=false;
					this.isComplete=false;
				};
				
				// ** prototype **
				remoteRequest.prototype.complete = function(func){
					if(this.isComplete){func(this.ajax.response);}
					else{this.onComplete.push(func);}
					return this;
				};
				remoteRequest.prototype.success  = function(func){
					if(this.isComplete && this.succeeded){func(this.ajax.response);}
					else{this.onSuccess.push(func);}
					return this;
				};
				remoteRequest.prototype.progress = function(){this.onProgress.push(func);return this;};
				remoteRequest.prototype.error	 = function(func){
					if(this.failed){func();}
					else{this.onError.push(func);}
					return this;
				};
				remoteRequest.prototype.abort	 = function(func){
					if(this.aborted){func();}
					else{this.onAbort.push(func);}
					return this;
				};
				remoteRequest.prototype.kill	 = function(){
					if(this.request){
						this.request.active=false;
						if(this.request.readyState != 4) this.request.abort();
						delete this.request;
					}
				};
				remoteRequest.prototype.timeout = function(func){};
				
				// ** static **
				remoteRequest.registeredInstances = {};
				remoteRequest.registerNamedRequest = function(name, instance, opts){
					this.registeredInstances[name] = {request:instance, opts:opts};
				};
				remoteRequest.getNamedRequest = function(name){
					if(this.registeredInstances[name] !== undefined) return this.registeredInstances[name];
					return false;
				};
				
				return function(obj){
	
					var __class = new remoteRequest(),
						__old,
						ajax = {},
						value,
						queryString,
						data = null,
						cache = obj.cache,
						params,
						prop;
	
					//stop old requests with same name
					if(obj.requestor !== undefined){
						if((__old = remoteRequest.getNamedRequest(obj.requestor)) && obj.onNewRequest !== undefined){
							//if(obj.onNewRequest === 'overwrite') __old.request.kill();
						}
						remoteRequest.registerNamedRequest(obj.requestor, __class, obj);
					}
					
					obj.url = obj.url || "";
					obj.method = obj.method || obj.type || 'POST';
					obj.async = obj.async || true;
					obj.headers = obj.headers || [];
					
					obj.headers['X-Requested-With'] = 'XMLHttpRequest';
					if(!('Content-type' in obj.headers)) obj.headers['Content-type'] = 'application/x-www-form-urlencoded';
					if(!('Accept' in obj.headers)) obj.headers['Accept'] = ['application/json', 'text/plain', '*/*']
	
					if(typeof obj.data === 'object'){						
						if(obj.data.tagName === "FORM"){
							obj.method = "POST";
							obj.headers['Content-type'] = '';
							data = spotter.getFormData(obj.data);
							
							if(obj.cache===false){
								data.append('nocache', spotter.makeId());
							}
							
							if(~obj.url.indexOf('?')){
								var urlParams = obj.url.split('?');
								obj.url = urlParams[0];
								urlParams = urlParams[1].split('&');
								urlParams.forEach(function(param){
									param = param.split('=');
									data.append(param[0], param[1]);
								});
							}
						}
						else{
							if(~obj.url.indexOf('?')){
								params = obj.url.split('?');
								params[1].split('&').forEach(function(param){
									param = param.split('=');
									obj.data[param[0]] = param[1];
								});
								obj.url = params[0];
							}
							data = spotter.serialize(obj.data, true);
						}

						//spotter.logFormData(data);
						if(obj.method.toUpperCase() === 'GET'){
							queryString = data;
							if(queryString.length){
								if(~obj.url.indexOf('?')){ obj.url+=queryString; }
								else{ obj.url+='?'+queryString.slice(1); }
							}
							if(obj.cache===false){
								obj.url+=(~obj.url.indexOf('?')?'&':'?')+'nocache='+spotter.makeId();
							}
						}
					}
					//spotter.log('debug', {func:'spotter ajax', msg:'data result', vars:{url:obj.url, string:data, vars:obj}});
					if(typeof obj.success === 'function') __class.success(obj.success);
					if(typeof obj.error === 'function') __class.error(obj.error);
					if(typeof obj.complete === 'function') __class.complete(obj.complete);
					if(typeof obj.timeout === 'function') __class.timeout(obj.timeout);
	
					if(cache){
						if(typeof cache !== 'object'){ console.warn('the value for cache sent to spotter ajax must be an object like {name:name, type(opt):local|session, expiration(opt):integer(s)', new Error().stack); }
						//RESPONSE IS CACHED
						if(cache.name === undefined && obj.requestor !== undefined) cache.name = obj.requestor;
						if(ajax.response = spotter.ajax.getSavedResponse(cache.name, cache.type)){
							__class.isComplete 	= true;
							__class.succeeded  	= true;
							__class.active		= false;
							console.log('CACHED: ', obj.method, ' XHR ', obj.url, ' \n', 'params:', data);
							__class.onSuccess.forEach(function(func){func.call({ajax:ajax}, ajax.response, data);});
							__class.onComplete.forEach(function(func){func.call({ajax:ajax}, ajax.response, data);});
							return __class;
						}
						//RESPONSE SUCCESS WILL BE CACHED
						else{
							__class.success(function(response, data){
								spotter.ajax.saveResponse(response, cache.name, cache.type, cache.expiration);
							});
						}
					}
					
					//RESPONSE IS NOT CACHED
					__class.request = ajax = new XMLHttpRequest();
					
					obj.timeout = obj.timeout || timeout;
					if(obj.timeout){
						ajax.timeout = obj.timeout;
						
						ajax.ontimeout = function(ajaxEvent){
							__class.isComplete=true;
							__class.failed=true;
							console.warn('request timed out \n', 'this:', this);
							__class.timeout.forEach(function(func){func.call(ajaxEvent, ajax.response, data);});
							__class.active = false;
						};
					}
					ajax.createdWith = obj;
					
					ajax.addEventListener("progress", function(evt){ __class.onProgress.forEach(function(func){ func(evt); }); });//obj.complete = function(evt){ if(evt.lengthComputable) var percentComplete = evt.loaded/evt.total;....
					ajax.addEventListener("abort", function(){ __class.aborted=true; __class.onAbort.forEach(function(func){ func(); }); });
					ajax.addEventListener("error", function(){ __class.failed=true; __class.onError.forEach(function(func){ func(); }); });
	
					ajax.open(obj.method, obj.url, obj.async);
					
					//HEADERS
					if(typeof obj.headers !== 'undefined'){
						for(var prop in obj.headers){
							if(obj.headers.hasOwnProperty(prop)){
								value = obj.headers[prop];
								if(Array.isArray(value)){
									value.forEach(function(val){if(val) ajax.setRequestHeader(prop, val);});
								}
								else{
									if(obj.headers[prop]) ajax.setRequestHeader(prop, obj.headers[prop]);
								}
							}
						}
					}
					
					ajax.onload = function(ajaxEvent){
						//console.log('ajaxEvent: \n', 'url:', obj.url, ' \n', 'data:', data, 'onSuccess.length:', __class.onSuccess.length, ' \n', 'ajax:', ajax, ' \n', '__class.active:', __class.active);
						if(ajax.readyState === 4){	
							__class.isComplete=true;
							if (ajax.status >= 200 && ajax.status <= 299){
								__class.succeeded=true;
								if(__class.active) __class.onSuccess.forEach(function(func){func.call(ajaxEvent, ajax.response, data);});
							} else {
								__class.failed=true;
								if(__class.active){
									if(ajax.status == 404){console.warn('ajax error '+obj.url+' returned 404');}	
									else{
										console.warn("Error " + ajax.status + " occurred uploading form.");
									}
									__class.onError.forEach(function(func){func.call(ajaxEvent, ajax.response, data);});
								}
							}
							__class.onComplete.forEach(function(func){func.call(ajaxEvent, ajax.response, data);});
							__class.active = false;
						}
					};
	
					//console.log(new Error().stack);
					ajax.send(data);
					__class.active = true;
					return __class;
				};
			}
			else if(jQuery){
				return jQuery.ajax;
			}
			else{
				console.warn('no source found for ajax calls');
			}
		}());
		
		spotter.ajax.saveResponse = function(response, name, type, expiration){
			if(!name){ console.warn('name is required for save ajax response'); return false; }
			type = (type || 'session')+'Storage';//type = [local||session]
			window[type].setItem('A'+name, response);
			window[type].register('A'+name, expiration*1000, true);
		};
		
		spotter.ajax.getSavedResponse = function(name, type){
			if(!name){ console.warn('name is required for save ajax response'); return false; }
			var response;
			
			type = (type || 'session') + 'Storage';//type = [local||session]
			name = 'A' + name;
			response = window[type].getRegisteredObject(name);
			if(response !== false){
				return response;
			}
			else{
				return false;
			}
		};
			
		//extends prototype of (function)childClass[0] by childClass[n] - (array)childClass - childClass[0] inherits all of (in order) childClass[1], childClass[n]
		//childClass[n-1] methods/props take precedence over childClass[n] methods/props
		spotter.extend = function(childClass){
			var parentClasses = spotter.castToArray(arguments).slice(1)
				, parentClass
				, l = parentClasses.length
				, prop;
				while(--l > -1){
				parentClass = parentClasses[l];
				for(prop in parentClass.prototype){
					if(childClass.prototype[prop] === undefined) childClass.prototype[prop] = parentClass.prototype[prop];
				}
			}
		};
		
		// *** OBJECT HELPERS ***
		//set the values of obj by sending in comparisonObj (will add the properties (of comparisonObj) to obj if not exists)
		spotter.setNestedProperties = function(obj,comparisonObj){
			for(var prop in comparisonObj){
				if(typeof obj[prop] === 'undefined') obj[prop] = {};
				if(typeof comparisonObj[prop] === 'object' && comparisonObj[prop] !== null){
					if(Array.isArray(comparisonObj[prop])){
						if(!Array.isArray(obj[prop])) obj[prop] = [];
							comparisonObj[prop].forEach(function(value,index){
							obj[prop][index] = value;
						});
					}
					else{
						if(typeof obj[prop] === 'undefined'){ obj[prop] = comparisonObj[prop]; }
						else{ spotter.setNestedProperties(obj[prop],comparisonObj[prop]); }
					}
				}
				else{ 
					delete obj[prop];
					obj[prop] = comparisonObj[prop];
				}
			}
		};
		
		//delete the values of obj by sending in comparisonObj
		spotter.deleteNestedProperties = function(obj,comparisonObj){
			//console.log('deleteNestedProperties',obj,comparisonObj);
			for(var prop in comparisonObj){
				if(typeof obj[prop] === 'undefined') continue;
				if(typeof comparisonObj[prop] === 'object' && comparisonObj[prop] !== null){ spotter.deleteNestedProperties(obj[prop],comparisonObj[prop]); }
				else{ delete obj[prop]; }
			}
		};
	
		spotter.castToArray = function(o){
			var arr=[],i=0,l=o.length;
			for(i;i<l;i++){arr.push(o[i]);}
			return arr;
		};
	
		spotter.addElementAsParent = function(el,par) {
			if(typeof el === 'string') { el = document.getElementById(el); }
			
			var cur_par	= el.parentNode;
			var new_par = document.createElement(par);
			
			cur_par.replaceChild(new_par,el);
			new_par.appendChild(el);
			
			return new_par ;
		};
			
		spotter.unpackParent = function(p) {//can pass true or 1 as argument[1] to allow recursion and unpacking or entire container
			var g=p.parentNode,c=p.childNodes,i=0,len=c.length;
			for(i;i<len;i++){
				g.appendChild(c[i]);
					if(arguments[1]){unpackparent(c[i]);}
			}
		};
			
		spotter.unpackChild = function(c) {
			var g=c.parentNode.parentNode;
			g.appendChild(c);
		};
	
		spotter.reCloak = function(a){
			var l=a[0].length-1;
			while(l){
				l--;
				//a[0][l].style.cssText=a[0][l].cacheStyle.pop();
				a[0][l].className=a[0][l].className.replace(' uncloak','');
			}
		};
	
		spotter.unCloak = function(el,i){//el is element to uncloak, i the number of parents to test, returns array of the uncloaked elements
			var a=[[]];
			i=i||999;
			while(el.tagName!='BODY' && i){
				i--;
				a[0].push(el);	
				//if(!el.cacheStyle){el.cacheStyle=[];}else{el.cacheStyle.push(el.style.cssText);}
				el.className=el.className+' uncloak';
				el=el.parentNode;
			};
			return a;
		};
	
		spotter.effectiveWidth = function(el,W){//0:total width, 1:width-(minus)padding, 2:left padding 3:right padding, 4:left margin, 5:right margin
			var st=el.style.cssText,S=el.currentStyle || window.getComputedStyle(el),pL=S.paddingLeft.match(/[0-9\.]+/),pR=S.paddingRight.match(/[0-9\.]+/),mL=S.marginLeft.match(/[0-9\.]+/),mR=S.marginRight.match(/[0-9\.]+/);
			//console.log('effectiveWidth: '+el.tagName+'.'+el.className+': -> '+([W,W-pL-pR,pL,pR,mL,mR]).toString());
			return [W,W-pL-pR,pL,pR,mL,mR];	
		};
	
		spotter.effectiveHeight = function(el,H){//0:total width, 1:width-padding, 2:left padding 3:right padding, 4:left margin, 5:right margin
			var st=el.style.cssText,S=el.currentStyle || window.getComputedStyle(el),pT=S.paddingTop.match(/[0-9\.]+/),pB=S.paddingBottom.match(/[0-9\.]+/),mT=S.marginTop.match(/[0-9\.]+/),mB=S.marginBottom.match(/[0-9\.]+/);
			return [H,H-pT-pB,pT,pB,mT,mB];	
		};
	
		spotter.getHeight = function(el, e, log){//if e (true/false) return array with effective height and padding
			if(el && el.tagName){
				var b=el.getBoundingClientRect(),h;
				if(log) console.log('get height for ',el,b);
				if(b){
					h = (typeof b.height !== 'undefined' ? b.height : b.bottom - b.top)
					if(e){
						return this.effectiveHeight(el,h,b);
					}else{
						return h;
					}
				}
				else{
					h=el.offsetHeight||el.clientHeight||el.scrollHeight;
					if(e){return this.effectiveHeight(el,h);}
					else{return h;}
				}
			}else{ console.warn('an element is required for getHeight',new Error().stack); return 0; }
		};
	
		spotter.getWidth = function(el, e, log){//if e return array with effective width and padding
			if(el && el.tagName){
				var b=el.getBoundingClientRect(),w;
				//if(log) console.log('get width for ',el,b);
				if(b){
					w = (typeof b.width !== 'undefined' ? b.width : b.right - b.left)
					if(e){
						return this.effectiveWidth(el,w,b);
					}else{
						return w;
					}
				}
				else{
					w=el.offsetWidth||el.clientWidth||el.scrollWidth;
					if(e){return this.effectiveWidth(el,w);}
					else{return w;}
				}
			}else{ console.warn('an element is required for getWidth',new Error().stack); return 0; }
		};
		
		spotter.testLoaded(function(){	
			spotter.getRemUnitValue = (function(){
				var cont = document.createElement('DIV'), unitWidth;
				cont.style.width = "1rem";
				cont.id = "spotter-1-rem";
				spotter.appendToBody(cont);
				unitWidth = spotter.getWidth(cont);
				spotter.onResize(function(){unitWidth=spotter.getWidth(cont);});
				return function(){
					return unitWidth;
				};
			}());
		});
			
		spotter.dumpObject = function(o,a){
			for(var prop in o){
				console.log(a+'['+prop+']='+typeof o[prop]);
				if(typeof o[prop]==='object'){
					dumpObject(o[prop],prop);
				}
			}
		};
		
		spotter.findParent = function(c,id,byAttr){//USE BY ATTR TO FIND PARENT BY A PARTICULAR ATTRIBUTE (ex: 'tagName') - c: child, id: parent selector, byAttr: compare this attribute
			var p=c,s=(id||'').substr(0,1);
			if(s==="#"){
				id=id.substr(1);
				while(p.id!==id){
					p=p.parentNode;
				}
			}else if(s==="."){
				id=id.substr(1);
				while(p.className.indexOf(id) === -1){
					p=p.parentNode;
				}
			}else if(byAttr){
				if(id === null){
					while(p.hasAttribute && !p.hasAttribute(byAttr)){
						p=p.parentNode;
					}
				}
				else if(~['name','tagName'].indexOf(byAttr)){
					while(p[byAttr]!==id){
						p=p.parentNode;
					}
				}
				else{
					while(p.getAttribute(byAttr)!==id){
						p=p.parentNode;
					}
				}
			}else if(typeof id==="string"){
				while(p.byAttr!==id){
					p=p.parentNode;
				}
			}else{
				console.log(id+" is not a valid argument for find parent");
				return false;
			}
			if(p === document) p = null;
			return p;
		};
		
		// -- prototype --
			spotter.Rows = function(rows){
				this.arr = [];			
				if(rows !== undefined && rows.length > 0) this.push(rows);
			};
			//add array values that are not already occurring
			spotter.Rows.prototype.mergeDistinct = function(){
				var args		= arguments
					, m			= args.length
					, results	= []
					, l			= this.length
					, newRow
					, newRows
					, n
					, arr
					, x;
				
				for(n=1;n<m;n++){//combine arguments
					Array.prototype.push.apply(args[0], args[n]);
				}
				while(--l > -1){//remove duplicates
					if(~args[0].indexOf(this[l])) args[0].splice(l,1);
				}
				Array.prototype.push.apply(this, args[0]);
				return this;
			};
			spotter.Rows.prototype.push = function(rows){
				if(!Array.isArray(rows) && typeof rows === 'object') rows = [rows];
				
				var l = rows.length, x = 0, row;
				for(x;x<l;x++){
					row = rows[x];
					if(typeof row !== "object"){ console.debug("rows push argument must be an array of objects"); }
					else{ this.arr.push(row); }
				}
				return this;
			};
			//remove rows at indexes
			spotter.Rows.prototype.cut = function(indexes){
				if(!Array.isArray(indexes)) indexes = [indexes];
				
				var l = indexes.length, x = 0, i;
				for(x;x<l;x++){
					this.arr.splice(indexes[x], 1);
				}
				return this;
			};
			//find index of first occurrence of row with value for field
			spotter.Rows.prototype.find = function(field, value){
				var x = 0, l = this.length;
				for(x;x<l;x++){
					if(this[x][field] === value) return x;
				}
			};
			
		// *** TOGGLE HELPERS ***
		spotter.toggle = (function(){		
			var fn=function(el){
				if( el.style.display === "none" ){ el.style.removeProperty('display'); }
				else{ el.style.display = "none"; }
			};
			fn.hide=function(el){
				if(typeof el.className === 'undefined'){ console.warn('toggle hide argument must be a valid element \n', 'el:', el, ' \n', new Error().stack); return false; }
				el.className = el.className.addListValue('hide',' ');
			};
			fn.show=function(el){
				el.className = el.className.removeListValue('hide',' ');
			};
			//class
				fn.class = (function(){
					var fn=function(el,className){
						if(spotter.isType.arrayLike(el)){
							var l = el.length, E;
							while(--l > -1){ E = el[l]; E.className = E.className.toggleListValue(className,' '); }
						}
						else{
							el.className = el.className.toggleListValue(className,' ');
						}
					};
					fn.add=function(el,className){
						if(!el){ console.log('element sent to toggle class was not node or node array \n', 'el:', el, ' \n', new Error().stack); return; }
						if(spotter.isType.arrayLike(el)){
							var l = el.length, E;
							while(--l > -1){
								E = el[l];
								if(!E){ console.log('stupid thing:',el); }
								E.className=E.className.addListValue(className, ' ');
							}
						}
						else{
							el.className=el.className.addListValue(className, ' ');
						}
					};
					fn.remove=function(el,className){
						if(!el){ console.log('element sent to toggle class was not node or node array \n', 'el:', el, ' \n', new Error().stack); return; }
						//console.log('spotter.isType.arrayLike(el):', spotter.isType.arrayLike(el), ' \n', el);
						if(spotter.isType.arrayLike(el)){
							var l = el.length, E;
							while(--l > -1){
								E = el[l];
								E.className=E.className.removeListValue(className, ' ');
							}
						}
						else{
							el.className=el.className.removeListValue(className, ' '); 
						}
					};
					fn.swap=function(el,classRemove,classAdd){
						if(!el || typeof el.className === 'undefined'){ console.log(new Error().stack); return; }
						if(spotter.isType.arrayLike(el)){
							var l = el.length, E;
							while(--l > -1){
								E = el[l];
								E.className=E.className.removeListValue(classRemove, ' '); 
								E.className=E.className.addListValue(classAdd, ' '); 
							}
						}
						else{
							el.className=el.className.removeListValue(classRemove, ' '); 
							el.className=el.className.addListValue(classAdd, ' '); 
						}
					};
					return fn;
				}());
			//value
				fn.value = (function(){
					var fn=function(el,text){
						if(el.value.trim() === ""){el.value=text;}
						else{el.value="";}
					};
					fn.toDefault=function(el,text){
						if(el.value.trim() === "") el.value=text;
					};
					fn.removeDefault=function(el,text){
						if(el.value.trim()===text) el.value="";
					};
					return fn;
				}());
			//content
				fn.content = function(par,char1,char2){
					if(par.innerHTML === char1){
						par.innerHTML = char2;
					}
					else{
						par.innerHTML = char1;
					}
				};
			//css
				fn.CSS = (function(){//calling toggleCSS returns a function that will handle the toggle.
					var clubs= {},
						__init=function(el,prop,val){
							el.coreToggleCSS=el.coreToggleCSS||{};
							if(typeof el.coreToggleCSS[prop]==='undefined') el.coreToggleCSS[prop]=el.style[prop];
							return function(){
								if(el.style[prop]===el.coreToggleCSS[prop]){ el.style[prop]=val; }
								else{ el.style[prop]=el.coreToggleCSS[prop]; }
							};
						}
					;
					
					__init.createGroup=function(arr,prop,val,groupName){
						if(!Array.isArray(arr)) arr=spotter.castToArray(arr);
						arr.forEach(function(el){
							__init.addToGroup(el,prop,val,groupName);
						});
					};
					
					__init.toggleGroup=function(groupName){
						if(typeof clubs[groupName]!=='undefined'){
							var func=clubs[groupName].memberFuncs,l=func.length;
							while(--l > -1){
								func[l]();
							}
						}
					};
					
					__init.memberActive=function(el,groupName){//Use toggleMember() over toggleCSS() 
						var funcs=clubs[groupName].memberFuncs;
						clubs[groupName].active.forEach(function(el){
							funcs[el.coreToggleCSS[groupName].memberNum]();
						});
						clubs[groupName].active=[el];
						funcs[el.coreToggleCSS[groupName].memberNum]();
					};
					
					__init.memberReset=function(el,groupName){//use this to 'close' an element in a group
						clubs[groupName].active.removeValues(el);
						clubs[groupName].memberFuncs[el.coreToggleCSS[groupName].memberNum]();
					};
					
					__init.addToGroup=function(el,prop,val,groupName){
						if(typeof clubs[groupName]==='undefined'){
							clubs[groupName]={memberFuncs:[],active:[]};
						}
						el.coreToggleCSS=el.coreToggleCSS||{};
						el.coreToggleCSS[groupName]={};
						el.coreToggleCSS[groupName].memberNum=clubs[groupName].memberFuncs.push(__init(el,prop,val))-1;
					};
					
					return __init;
				}());
			return fn;
		}());
	
		spotter.activateAjaxButton = {
			setup:function(button){
				var setup = JSON.parse(button.getAttribute('data-ajax-button'));
				button.activateAjaxButton={};
				button.activateAjaxButton.setup=setup;
				return function(){
					return spotter.ajax({
						url: setup.url,
						data: setup.argumentString,
						type: setup.method,
						dataType: setup.returnType,
						cache: setup.cache||true
					});
				};
			}
		};
	
		// *** EVENTS HELPERS ***
		spotter.preventDefault = function(e){
			var evt = e||window.event;
			if (evt.preventDefault) evt.preventDefault();
			evt.returnValue = false;
		};
	
		spotter.resetCursor = function(txtElement){
			if (txtElement.setSelectionRange) {
				txtElement.focus(); 
				txtElement.setSelectionRange(0, 0); 
			} else if (txtElement.createTextRange) { 
				var range = txtElement.createTextRange();  
				range.moveStart('character', 0); 
				range.select(); 
			} 
		};
		
		spotter.fancySelect = function(par,evtName){
			//for parent container this appends to each .fancy-option element contained within an onclick event that will toggle the class 'selected', change the element '.fancy-value' innerhtml to the text value of the clicked element, and set par.selectedValue to that same value, then fire off the event name with the value attached by event.content. Returns the event name to use when change occurs.
			
			//This is setup to use onmouseover on the parent element for initial setup but can be assigned directly as well.
			par.removeAttribute('onmouseover');
			var opts=par.querySelectorAll('.fancy-option'),l=opts.length,val=par.querySelector('.fancy-value'),func,removeClass=(function(){
				return function(){
					var x=opts.length;
					while(x){
						x--;
						spotter.toggleClass.remove(opts[x],'selected');
					}
				};
			}());
			par.selectedValue=(function(){return function(){return val.innerHTML;};}());//call par.selectedValue() to get the current value
			var evt=spotter.events(evtName);
			while(--l > -1){
				func=(function(opt){
					return function(e){
						val.innerHTML=opt.innerHTML;
						removeClass();
						spotter.toggleClass.add(opt,'selected');
						spotter.events.appendTo(opt.innerHTML,evt);
						spotter.events.fireEvent(evt);
					};
				}(opts[l]));
				opts[l].addEventListener('click',func,false);
			}
			return evt;
		};
	
		spotter.isEventSupported = (function(){
			var TAGNAMES = {
				'select':'input','change':'input',
				'submit':'form','reset':'form',
				'error':'img','load':'img','abort':'img'
			}
			function isEventSupported(eventName) {
				var el = document.createElement(TAGNAMES[eventName] || 'div');
				eventName = 'on' + eventName;
				var isSupported = (eventName in el);
				if (!isSupported) {
				el.setAttribute(eventName, 'return;');
				isSupported = typeof el[eventName] == 'function';
				}
				el = null;
				return isSupported;
			}
			return isEventSupported;
		})();
		
		window.previousposition = 0;
		spotter.scroll = {
			to:function(el){
				var b=el.parentNode.getBoundingClientRect();
				var yoffset=window.offSetY();
				window.scrollTo(0,(yoffset+b.top)*.98);
			},
			reset:function(){
				window.scrollTo(0,window.previousposition||0);
				window.previousposition = 0;
			},
			recordPosition:function(){
				if(window.previousposition = 0)	window.previousposition=document.documentElement.scrollTop||document.body.scrollTop;
			}
		};
		
		spotter.onScrollBottom = function(container,eventName){//returns eventName.
			if(typeof container === 'undefined') container = window;
		
			if(typeof eventName === 'undefined') eventName = 'onScrollBottom';
			eventName = spotter.events(eventName);
			
			var onScroll = (function(container,eventName){
				var scrollDirection = 0;
				var constant = 0;
				return function(e){
					//var height = spotter.getHeight(container);
					var scrollHeight = container.scrollHeight;
					var scrollTop = container.scrollTop;
					var offsetHeight = container.offsetHeight;
					var clientHeight = container.clientHeight;
					
					/*
					console.log('height: '+height);
					console.log('scrollTop: '+container.scrollTop);
					console.log('scrollHeight: '+container.scrollHeight);
					console.log('scrollPoint: '+container.scrollPoint);
					console.log('offsetHeight',container.offsetHeight);
					console.log('innerHeight',container.innerHeight);
					console.log('proximity', scrollTop >= scrollHeight - clientHeight);
					*/
	
					if(scrollTop >= scrollHeight - clientHeight && scrollDirection - scrollTop < 0){
						//console.log('onScroll: container: '+container.id+' - scrollHeight & offsetHeight: '+scrollHeight+'&'+offsetHeight+' - height: '+height+' - scrollTop: '+scrollTop+' - scrollDirection: '+scrollDirection);
						//console.log('onScroll: container: '+container.id+' - offsetHeight + scrollTop: '+(offsetHeight+scrollTop)+' - scrollHeight: '+scrollHeight);
						spotter.events.fire(eventName);
					}
					scrollDirection = scrollTop;
				};
			}(container,eventName));
			
			container.addEventListener('scroll',onScroll,false);
			
			return eventName;
		};
		
		spotter.keyboard = {
			textInput: (spotter.isEventSupported('textInput') ? 'textInput' : 'keypress'),
			keyCodes: [],
			getChar: function getChar(e){//take keyboard event as argument and return the character the keyboard event represents
				e = e || window.event;
				var charCode = e.which || e.keyCode;
				var charStr = String.fromCharCode(charCode);
				return charStr;
			}
		};
		spotter.keyboard.keyCodes[8] = 'backspace';spotter.keyboard.keyCodes[9] = 'tab';spotter.keyboard.keyCodes[13] = 'enter';spotter.keyboard.keyCodes[16] = 'shift';spotter.keyboard.keyCodes[17] = 'ctrl';spotter.keyboard.keyCodes[18] = 'alt';spotter.keyboard.keyCodes[19] = 'pause/break';spotter.keyboard.keyCodes[20] = 'caps lock';spotter.keyboard.keyCodes[27] = 'escape';spotter.keyboard.keyCodes[33] = 'page up';spotter.keyboard.keyCodes[34] = 'page down';spotter.keyboard.keyCodes[35] = 'end';spotter.keyboard.keyCodes[36] = 'home';spotter.keyboard.keyCodes[37] = 'left arrow';spotter.keyboard.keyCodes[38] = 'up arrow';spotter.keyboard.keyCodes[39] = 'right arrow';spotter.keyboard.keyCodes[40] = 'down arrow';spotter.keyboard.keyCodes[45] = 'insert';spotter.keyboard.keyCodes[46] = 'delete';spotter.keyboard.keyCodes[48] = '0';spotter.keyboard.keyCodes[49] = '1';spotter.keyboard.keyCodes[50] = '2';spotter.keyboard.keyCodes[51] = '3';spotter.keyboard.keyCodes[52] = '4';spotter.keyboard.keyCodes[53] = '5';spotter.keyboard.keyCodes[54] = '6';spotter.keyboard.keyCodes[55] = '7';spotter.keyboard.keyCodes[56] = '8';spotter.keyboard.keyCodes[57] = '9';spotter.keyboard.keyCodes[65] = 'a';spotter.keyboard.keyCodes[66] = 'b';spotter.keyboard.keyCodes[67] = 'c';spotter.keyboard.keyCodes[68] = 'd';spotter.keyboard.keyCodes[69] = 'e';spotter.keyboard.keyCodes[70] = 'f';spotter.keyboard.keyCodes[71] = 'g';spotter.keyboard.keyCodes[72] = 'h';spotter.keyboard.keyCodes[73] = 'i';spotter.keyboard.keyCodes[74] = 'j';spotter.keyboard.keyCodes[75] = 'k';spotter.keyboard.keyCodes[76] = 'l';spotter.keyboard.keyCodes[77] = 'm';spotter.keyboard.keyCodes[78] = 'n';spotter.keyboard.keyCodes[79] = 'o';spotter.keyboard.keyCodes[80] = 'p';spotter.keyboard.keyCodes[81] = 'q';spotter.keyboard.keyCodes[82] = 'r';spotter.keyboard.keyCodes[83] = 's';spotter.keyboard.keyCodes[84] = 't';spotter.keyboard.keyCodes[85] = 'u';spotter.keyboard.keyCodes[86] = 'v';spotter.keyboard.keyCodes[87] = 'w';spotter.keyboard.keyCodes[88] = 'x';spotter.keyboard.keyCodes[89] = 'y';spotter.keyboard.keyCodes[90] = 'z';spotter.keyboard.keyCodes[91] = 'left window key';spotter.keyboard.keyCodes[92] = 'right window key';spotter.keyboard.keyCodes[93] = 'select key';spotter.keyboard.keyCodes[96] = 'numpad 0';spotter.keyboard.keyCodes[97] = 'numpad 1';	spotter.keyboard.keyCodes[98] = 'numpad 2';	spotter.keyboard.keyCodes[99] = 'numpad 3';	spotter.keyboard.keyCodes[100] = 'numpad 4';	spotter.keyboard.keyCodes[101] = 'numpad 5';	spotter.keyboard.keyCodes[102] = 'numpad 6';	spotter.keyboard.keyCodes[103] = 'numpad 7';	spotter.keyboard.keyCodes[104] = 'numpad 8';	spotter.keyboard.keyCodes[105] = 'numpad 9';	spotter.keyboard.keyCodes[106] = 'multiply';spotter.keyboard.keyCodes[107] = 'add';spotter.keyboard.keyCodes[109] = 'subtract';spotter.keyboard.keyCodes[110] = 'decimal point';spotter.keyboard.keyCodes[111] = 'divide';spotter.keyboard.keyCodes[112] = 'f1';spotter.keyboard.keyCodes[113] = 'f2';spotter.keyboard.keyCodes[114] = 'f3';spotter.keyboard.keyCodes[115] = 'f4';spotter.keyboard.keyCodes[116] = 'f5';spotter.keyboard.keyCodes[117] = 'f6';spotter.keyboard.keyCodes[118] = 'f7';spotter.keyboard.keyCodes[119] = 'f8';spotter.keyboard.keyCodes[120] = 'f9';spotter.keyboard.keyCodes[121] = 'f10';spotter.keyboard.keyCodes[122] = 'f11';spotter.keyboard.keyCodes[123] = 'f12';spotter.keyboard.keyCodes[144] = 'num lock';spotter.keyboard.keyCodes[145] = 'scroll lock';spotter.keyboard.keyCodes[186] = 'semi-colon';spotter.keyboard.keyCodes[187] = 'equal sign';spotter.keyboard.keyCodes[188] = 'comma';spotter.keyboard.keyCodes[189] = 'dash';spotter.keyboard.keyCodes[190] = 'period';spotter.keyboard.keyCodes[191] = 'forward slash';spotter.keyboard.keyCodes[192] = 'grave accent';spotter.keyboard.keyCodes[219] = 'open bracket';spotter.keyboard.keyCodes[220] = 'back slash';spotter.keyboard.keyCodes[221] = 'close braket';spotter.keyboard.keyCodes[222] = 'single quote';
	
		//use spotter.addToCloseFunctions(function...) to add a close function when body is clicked.
		var closeFunctions = [];
		spotter.testLoaded(function(){
			document.body.addEventListener('click',function(e){
				//spotter.log('debug', {func:'spotter close functions', vars:{funcs:closeFunctions}});
				closeFunctions.forEach(function(func){
					//console.log('activating function:',func,' \n','event:',e);
					func(e);
				});
			}, false);
		});
		spotter.addToCloseFunctions = function(func){
			if(typeof func === 'function'){ if(closeFunctions.indexOf(func) === -1) closeFunctions.push(func); }
		};
		
		// *** COOKIE ***
		spotter.cookie = (function(){
			var cache = {};//cache does not 'set' the values but holds it into an object. cache works with data binding while cookie does not.
			//use spotter.cookie.commit() to set the cache values to cookie.
			
			var __init={};
			
			__init.refresh = function(){//repopulate cache with values from cookie. Use commit to set cache values to cookie
				var arr=document.cookie.split('; '),temp;
				for(var x=0,l=arr.length;x<l;x++){
					//console.log('before split', arr[x]);
					temp=arr[x].split('=');
					temp[1] = unescape(temp[1]);
					//console.log('after split', temp[1]);
					if(temp[1].substr(0,1)==='{' || temp[1].substr(0,1)==='[') temp[1] = JSON.parse(temp[1]);
					cache[temp[0].trim()]={value:temp[1],seconds:3600};
				}
				//console.log('cookie cache: ',cache);
			};
			
			//DOES NOT WORK - PASS BY REFERENCE IS OVERWRITING CACHE
			__init.bindElementToCache = function(el, propertyChain, defaultValue){
				var l = propertyChain.length;
				if(!Array.isArray(propertyChain) || !l){ console.warn('propertyChain must be an array with at least one value',arguments); return false; }
				
				var initialValue, references = [cache], attribute, parentObj;
				
				if(l>1){//nested property
					parentObj 	  = cache[propertyChain[0]].value;
					initialValue  = parentObj[attribute];
					attribute	  = propertyChain[1];
				}
				else{
					parentObj 	  = cache[attribute];
					initialValue  = cache[attribute].value;
					attribute 	  = 'value';
				}
				
				if(initialValue === undefined) initialValue = defaultValue;
				
				console.debug('cache',cache);
				console.debug('arguments:', arguments);
				console.debug('parentObj: ',parentObj);
				console.debug('initialValue: ',initialValue);
				console.debug('attribute: ',attribute);
				
				Object.defineProperty(parentObj, attribute, {
					get: function(){ initialValue; },
					set: function(newValue){ initialValue=newValue; spotter.setFirstTextNode(el, initialValue); },
					enumerable: true,
					configurable: true
				});
				spotter.setFirstTextNode(el, initialValue);
			};
			
			__init.getValue=function(name){
				if(typeof name !== 'undefined' && typeof name === 'string' && name.length){	
					if(typeof cache[name] === 'undefined') cache[name] = {value:{},seconds:3600};
					return cache[name];
				}
				else{ return cache; }
			};
			
			__init.setValue = function(o){//o of the form {key:{value:value,seconds:seconds_till_expiration},...}
				//Use this during the use of a page
				console.log('setValue',o);
				for(var prop in o){
					if(typeof o[prop].value === 'undefined'){ console.warn('set cookie value: object passed was wrong format'); continue; }
					if(typeof cache[prop] === 'undefined') cache[prop] = {value:{},seconds:3600};
					
					if(Array.isArray(o[prop].value) || typeof o[prop].value === 'string'){ cache[prop].value = o[prop].value; }	
					else if(typeof o[prop].value === 'object'){ spotter.setNestedProperties(cache[prop].value,o[prop].value); }
					else{ console.errpr('cookie setValue unnaccounted type: ',typeof o[prop].value); }
					
					if(typeof o[prop].seconds !== 'undefined' && o[prop].seconds > 0) cache[prop].seconds = o[prop].seconds;
				}
			}
			
			__init.commitValue=function(o){//o of the form {key:{value:value,seconds:seconds_till_expiration},...}
				//setValue DOES NOT change the cache value
				console.log('commitValue:',o);
				for(var prop in o){
					if(typeof o[prop]==='undefined'){console.log('commitValue property undefined',prop+' undefined');continue;}
					if(typeof o[prop].seconds!=='undefined' && o[prop].seconds > 0){
						var d=new Date();
						d=new Date(d.getTime() + (1000 * o[prop].seconds));
						d=' expires='+d.toUTCString();
					}
					else{
						d='';
					}
					if(typeof o[prop].ignoreEmpty === 'undefined'){
						o[prop].ignoreEmpty = false;
					}
					var obj = o[prop].value;
	
					if(typeof obj === 'object') obj = escape(JSON.stringify(obj));
					//console.log('commitValue',prop+'='+obj+'; Path=/;'+d);
					document.cookie=prop+'='+obj+'; Path=/;'+d;
				}
			};
			
			__init.removeValue=function(a){
				if(typeof a === 'string'){ a = [a]; }
				if(Array.isArray(a)){
					var l=a.length;
					while(l){
						l--;
						document.cookie=a[l]+"=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';";
						delete(cache[a[l]]);
					}
				}
				else if(typeof a === 'object'){
					for(var prop in a){
						if(typeof a[prop].value !== 'undefined'){	
							spotter.deleteNestedProperties(cache[prop].value,a[prop].value);
						}
						else{
							document.cookie=prop+"=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';";
							delete(cache[prop]);
						}
					}
				}
			};
			
			__init.unset = function(objMap){
				var cookieObj;
				var removeKey = function (objMap,objDelete){//objMap is the object whos keys will be recursively deleted, objDelete is the actual cookie obj
					for(var prop in objMap){
						if(typeof objDelete[prop] !== 'undefined'){
							if(typeof objMap[prop]==='object'){
								objDelete[prop] = removeKey(objMap[prop],objDelete[prop]);
							}
							else{
								delete(objDelete[prop]);
							}
						}
					}
					return objDelete;
				};
				for(var prop in objMap){//objName equivalent to the cookie name/key
					if(cookieObj = spotter.cookie.getValue(prop)){
						cookieObj = removeKey(objMap,cookieObj);//perform recursion to remove nested keys
						newObj = {};
						newObj[prop]=cookieObj;
						spotter.cookie.setValue(newObj);
					}
					else{
						console.log('cookie key '+prop+' was not found in document.cookie');
					}
				}
			};
			
			__init.JSON = {
				save:function(key,jsonString){
					__init.setValue({key:JSON.stringify(jsonString)});
				},
				load:function(key){
					return JSON.parse(__init.getValue(key));
				}
			};
			
			__init.commit = function(){
				__init.commitValue(cache);
			};
			
			__init.finalCommit = function(e){
				e = e || window.event;
				e.preventDefault = true;
				e.cancelBubble = true;
				__init.commitValue(cache);
			};
			
			__init.dump=function(){
				console.log(cache);
			};
			
			__init.refresh();
			
			window.addEventListener('beforeunload',__init.finalCommit,false);
			
			return __init;
		}());
		
		// *** REGIONAL SETTINGS ***
		spotter.getLocalePreferences = (function(){
			var info=spotter.cookie.getValue('regionalPreferences');
			
			if(!info || typeof info.value.language === 'undefined'){
				info={};
				info.language = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
				
				if(typeof info.currency === 'undefined') info.currency={};
				
				if(typeof info.currency.abbr === 'undefined'){
					var abbr;
					var lang=info.language.split('-');
					switch(lang[0]){
						case 'en':
							if(lang[1]==='US') abbr = 'USD';
							if(lang[1]==='UK') abbr ='GBP';
							break;
						case 'de':
							abbr = 'EUR';
							break;
					}
					info.currency.abbr=abbr
				};
				
				spotter.cookie.setValue({regionalPreferences:{value:info}});
			}
			else{
				info = info.value;
			}
			
			return function(){
				return info;
			};
		}());
	
		// *** NAVIGATION ***
		spotter.URL = (function(){	
			var result={}, __init={};			
			__init.getParams=function(){//get url parameters
				window.location.search.substring(1).split('&').forEach(function(item){
					var split=item.split('=');
					if(split.length !== 2) return;
					result[split[0]]=decodeURIComponent(split[1]);
				});
				return result;
			};
			__init.forwardParams=function(){//attach current parameters to every anchor tag
				var els=document.getElementsByTagName('A'),l=els.length,regex=new RegExp("\.[0-9a-zA-Z]{2,}\?"),href;
				while(l){
					l--;
					href=els[l].href;
					if(regex.test(href)){
						els[l].href=els[l].href+window.location.search.substring(1);
					}
					else{
						els[l].href=els[l].href+window.location.search.substring(1);
					}
				}
			};
			__init.previousURL=(function(){
				//console.log('previousURL:');
				var regex=/(previousURL[A-Z])\=([^;\?]+)/g,result={},match;
				while(match=regex.exec(document.cookie)){
					result[match[1]]=match[2];
					//console.log('result['+match[1]+']='+match[2]);
				}
				if(result.length===0){//no results found 
					//console.log('no result');
					document.cookie='previousURLA='+window.location.href+'; PATH=/;';
					document.cookie='previousURLB='+window.location.href+'; PATH=/;';
					return window.location.href;
				}else{
					if(result['previousURLA']===result['previousURLB']){//cookie was set at last page. This could be considered the starting point.
						//console.log('cookie values equal');
						document.cookie="previousURLB="+window.location.href+'; PATH=/;';
						return result["previousURLA"];
					}
					else if(result['previousURLA']===window.location.href || result['previousURLB']===window.location.href){//current page is the same as the past page
						//console.log('current page matches last page');
						return result["previousURLB"];
					}
					else{//set urlA to the old page and urlB to the current page
						//console.log('moving old url out, setting A to current page and B to the last page.');
						document.cookie="previousURLA="+result["previousURLB"]+'; PATH=/;';
						document.cookie="previousURLB="+window.location.href+'; PATH=/;';
						return result["previousURLA"];
					}
					console.log('/previousURL');
				}
			}());
			__init.previousDomain=function(){
				return spotter.URL.previousURL.match(/^[^\?]+/)[0];
			};
			__init.currentPage = function(){
				var match = /([^\/]+)(\.[a-zA-Z0-9]+)?(\?|$)/.exec(window.location.href);
				return match[1];
			};
			
			__init.getParams();
			__init.params=result;
			return __init;
		}());
	
		spotter.forwardTo = (function(){//the spotter version uses cookies
			var 
				goTo,
				params=""
			;
			
			var __init=function(){
				goTo = spotter.forwardTo.get();
				if(typeof goTo === 'string'){
					if(goTo.substring(0,5) !== 'false'){
						window.location.href = goTo;
					}
					else{
						console.warn(__init.caller,'forwardTo not set');
					}
				}
				else{
					console.log('forwardTo.goTo value is not set or not a string');
					return false;
				}
			};
	
			__init.set=function(str){
				str = str||123;
				//var regex=new RegExp('(http)s?://(www\.)?([^\?$]+)');
				//if(regex.test(str)){spotter.cookie.setValue({forwardTo:{value:str}});}
				if(typeof str !== 'string'){ console.warn('forwardTo.set value not a string ('+str+')'); return false; }
				spotter.cookie.setValue({forwardTo:{value:str}});
			};
			
			__init.appendParams=function(o){
				for(var prop in o){
					params += "&"+prop+"="+o[prop];
				}
			};
			
			__init.get=function(){
				var queryString = params.substring(1);
				var value = spotter.cookie.getValue('forwardTo').value;
				if(typeof value === 'string'){
					return value.toString()+(queryString.length > 0 ? "?"+queryString : "");
				}
				else{
					console.warn('forwardTo.set value saved not a string ('+value+')'); return false;
				}
			};
			
			__init.unset=function(){spotter.cookie.removeValue('forwardTo');};
			
			return __init;
		}());
	
		// *** SHIMS ***
		spotter.imports = function(){
			var factory = {
				supported: ('import' in document.createElement('link'))
			}
			
			var setImportReady = function(importName, importTemplate){
				self.complete[importName] = 'complete';
				self.templates[importName] = importTemplate;
				spotter.events.appendTo({template:importTemplate},self.eventName[importName]); 
				spotter.events.fire(self.eventName[importName]);
			};
			
			//to use - run spotter.imports.__init() after the imports are declared. For each import add a custom attribute 'data-event-name'
			//each with a unique name. For each of these unique names, add an event listener to document for these events. The import
			//data will be included on the event object as event.content.
			var self={
					members:{},//named templates - keys come from 'data-import-name' for links and 'name' for spotter-templates and the values are the source of the template
					templates:{},//keys are the names of members - values are the template for those members
					eventName:{},//'key name': 'template ready event name'
					complete:{},
					onComplete:{}
				}
				,__init=function(importName){
					var response, imports = null, template;
					if(typeof importName !== 'undefined'){
						imports = document.querySelector('link[data-import-name="'+importName+'"]');
						if(imports === null){
							if((template=document.getElementsByName(importName)).length){ __init.registerTemplate(template[0]); return; }
							var imports = document.createElement('LINK');
							imports.rel = 'import';
							imports.href = spotter.require.homeURL + 'templates/' + importName + '.html';
							imports.setAttribute('data-import-name', importName);
							document.getElementsByTagName('HEAD')[0].appendChild(imports);
							console.info('import not found for '+importName+'. import was created.'); 
						}
						imports = [imports];
					}
					else{
						imports = document.querySelectorAll('link[rel="import"]');
						if(!imports) console.log('no imports found');
					}
					if(imports === null) {console.log('import not found for '+importName);return;}
					var l = imports.length, current, name, member, cache;
					while(--l > -1){
						member = imports[l];
						name = member.getAttribute('data-import-name');
						self.members[name] = member;
						if(typeof self.eventName[name] === 'undefined') self.eventName[name] = spotter.events(name);
						self.complete[name] = 'in progress';
						if(factory.supported){//imports supported
							if(typeof member.import !== 'undefined' && member.import !== null){
								response = member.import.body.innerHTML;
								setImportReady(name, response);
							}
							else{
								member.addEventListener('load',function(e){
									response = this.import.body.innerHTML;
									setImportReady(name, response);
								},false);
							}
						}
						else{//imports not supported
							cache = (member.hasAttribute('cache') ? {name:name, type:member.getAttribute('cache-type')||'local', expiration:member.getAttribute('cache-time')||3 * 24 * 3600} : null);
							//console.log('imports cache:',cache);
							spotter.ajax({
								url: member.getAttribute('href'),
								data: window.location.search.substring(1),
								dataType: 'HTML',
								method: "GET",
								cache: cache,
								success:(function(name){
									return function(response){
										setImportReady(name, response);
									};
								}(name)),
								error: function(){
									console.warn(arguments);
								}
							});
						}
					}
				};
				
			/*Object.defineProperty(self, 'members', (function(){
				var obj = {};
				return {
					get: function(){
						console.warn('members accessed',' \n',new Error().stack,' \n',Object.keys(obj));
						return obj;
					}
				};
			}()));*/
				
			//USE THIS FUNCTION TO USE AN IMPORT TEMPLATE BY SENDING THE IMPORT NAME AND THE FUNCTION IT SHOULD SEND TO
			__init.useImport = function(importName,func){
				if(typeof self.complete[importName] === 'undefined'){
					spotter.imports(importName);
				}
				if(self.complete[importName] === 'complete'){
					func({content:{template:self.templates[importName]}});
				}
				else{
					if(typeof self.eventName[importName] === 'undefined') self.eventName[importName] = spotter.events(importName);
					document.addEventListener(self.eventName[importName],(function(func){
						var active = false;
						return function(e){
							if(active) return;
							func(e);
						};
					}(func)),false);
				}
			};
			
			__init.registerTemplate = function(elem){
				if(typeof elem === 'undefined'){ 
					console.warn('elem sent to register template must be a valid element', new Error().stack);
				}
				
				var name = elem.getAttribute('name');
				
				if(!name || name.length === 0){
					console.warn("spotter templates must have a name attribute", " \n", "elem:", elem);
					return false;
				}
				
				if(typeof self.members[name] !== "undefined"){
					//console.warn("template with name '"+name+"' has already been registered"," \n",new Error().stack);
					return false;
				}
				
				if(typeof self.eventName[name] === 'undefined') self.eventName[name] = spotter.events(name);
				
				setImportReady(name, elem.innerHTML);
				self.members[name] = elem;
				spotter.deleteElement(elem);
			};
			
			__init();
			
			return __init;
		};
		
		var templateConstructor = function(template, name){
			if(typeof name === 'string'){	
				var saved = this.getTemplate(name);
				if(saved !== null) return saved;
			}
			
			this.closedStatements = [];
			this.openComplexStatements = [];
			
			template = template.replaceAll('data-src', 'src');
			
			var originalTemplate = template
				, openComplexStatements = this.openComplexStatements//top level statements that are waiting to be closed. statements within are not parsed yet.
				, closedStatements = this.closedStatements//complex statements that have been completed
				, type
				, countIf = 0
				, countRepeat = 0
				, absoluteIndex = 0//the length of the template as it has been removed so that indexes in the map represent indexes in the original template NOT the template fragment
				, parent
				, iter;
			while(iter = templateConstructor.patterns.master.exec(template)){
				type = iter[0].slice(0, 3);
				//console.log('pop menu template setup:', type, ' \n', iter);
				switch(type){
					case 'IF[':
						if(openComplexStatements.length){ this.registerComplex(); countIf++; break; }//this statement is contained within another so dont parse it but tell the parent parser to treat the parent as complex
						else{
							openComplexStatements.push({type:'if', start:absoluteIndex + iter.index, condition:iter[2], then: {start:absoluteIndex + iter.index + iter[0].length, isComplex:false}, else:null, leadingFrag: template.slice(0, iter.index)});
							break;
						}
					case ']EL':
						if(countIf > 0){ break; }
						else{
							parent = openComplexStatements.last();
							parent.then.end = absoluteIndex + iter.index;
							parent.then.template = originalTemplate.slice(parent.then.start, parent.then.end);
							parent.else = {start:absoluteIndex + iter.index + iter[0].length, isComplex:false};
							break;
						}
					case ']EN':
						if(countIf > 0){ countIf--; break; }
						else{
							parent = openComplexStatements.pop();
							if(parent.else !== null){
								parent.else.end = absoluteIndex + iter.index;
								parent.else.template = originalTemplate.slice(parent.else.start, parent.else.end);
							}
							else{
								parent.then.end = absoluteIndex + iter.index;
								parent.then.template = originalTemplate.slice(parent.then.start, parent.then.end);
							}
							parent.end = absoluteIndex + iter.index + iter[0].length;
							parent.parse = templateConstructor.if(parent.condition, parent.then, parent.else);
							closedStatements.push(parent);
							break;
						}
					case 'REP':
						if(openComplexStatements.length){ this.registerComplex(); countRepeat++; break; }//this statement is contained in another so dont parse it but tell its parser to treat the parent as complex
						else{ 
							openComplexStatements.push({type:'repeat', start:absoluteIndex + iter.index + iter[0].length, isComplex:false, leadingFrag: template.slice(0, iter.index)});
							break;
						}
					case ']US':
						if(countRepeat > 0){ countRepeat--; break; }
						else{
							parent = openComplexStatements.pop();
							parent.template = originalTemplate.slice(parent.start, absoluteIndex + iter.index);
							parent.end = absoluteIndex + iter.index + iter[0].length;
							parent.use = iter[8];
							parent.limit = iter[10] || -1;
							parent.parse = templateConstructor.repeat(parent.template, parent.use, parent.limit, parent.isComplex);
							closedStatements.push(parent);
							break;
						}
						break;
					default: //plain substitution '{{'
						if(iter[14]){ 
							if(openComplexStatements.length){ this.registerComplex(); break; }
							else{
								parent = {leadingFrag: template.slice(0, iter.index)};
								parent.parse = templateConstructor.or(iter[0]);
								closedStatements.push(parent);
							}
						}
						else{
							if(openComplexStatements.length){ break; }
							else{
								parent = {leadingFrag: template.slice(0, iter.index)};
								parent.parse = templateConstructor.replacement(iter[12]); 
								closedStatements.push(parent);
							}
						}
				}
				absoluteIndex += iter.index + iter[0].length;
				template = template.slice(iter.index + iter[0].length);
			}
			if(template.length) closedStatements.push({leadingFrag: template});
			if(openComplexStatements.length > 0) console.warn('a statement within template '+name+' was not completed eg ENDIF');
		
			if(typeof name === 'string') templateConstructor.registerTemplate(name, this);
		};
		templateConstructor.prototype.parse = function(rows, debug){
			if(!Array.isArray(rows)) rows = [rows];
			var HTML = '', l = rows.length, row, x, result = [];
			for(x=0;x<l;x++){
				row = rows[x];
				HTML = '';
				if(typeof this.closedStatements === 'undefined') console.warn('this.closedStatements undefined:\n',this);
				this.closedStatements.forEach(function(frag){
					HTML += frag.leadingFrag;
					if(frag.parse) HTML += frag.parse(row);
				});
				result.push(HTML);
			}
		  return result;
		};
		templateConstructor.prototype.registerComplex = function(){
			var parent = this.openComplexStatements.last();
			if(parent.type === 'repeat'){ parent.isComplex = true; }
			else if(parent.type === 'if'){
				if(parent.else !== null){ parent.else.isComplex = true; }
				else{ parent.then.isComplex = true; }
			}
		};
		templateConstructor.prototype.getTemplate = function(name){
			if(name && templateConstructor.registeredTemplates[name] !== undefined){
				return templateConstructor.registeredTemplates[name];
			}
			else{ return null; }
		};
		//really a filler function to just return a value from row
		templateConstructor.replacement = function(prop){
		  prop = prop.toLowerCase();
		  return function(row){
			return row[prop] || "";
		  };
		};
		//use this when making multiple replacements
		templateConstructor.replaceMultiple = function(template){
		  var repgex = new RegExp(templateConstructor.patterns.replacement), map = [], l, finalFragment, iter;
			
			while(iter = repgex.exec(template)){
				map.push({leadingFrag: template.slice(0, iter.index), prop: iter[1].toLowerCase()});
				template = template.slice(iter.index + iter[0].length);
			}
			finalFragment = template;
	
		  return function(row){
			var HTML = '';
			map.forEach(function(coord){
				HTML += coord.leadingFrag + row[coord.prop];
			});
			HTML += finalFragment;
			return HTML;
		  };
		};
		//or - {{prop}}OR{{prop2}}... if prop is empty, use prop2, if prop2 is empty....
		templateConstructor.or = function(template){
			var props = [];
			template = template.split('OR');
			template.forEach(function(prop){	
				props.push(prop.slice(2,-2).toLowerCase());
			});
			return function(row){
				for(var x=0, l=props.length; x<l; x++){
					if(row[props[x]]) return row[props[x]];
					return '';
				}
			};
		};
		//if - IF[cond]THEN[template](ELSE[template])ENDIF
				//cond must be one of the following formats exactly:
					//prop NOT compare(leave compare blank to just negate prop -> 'prop NOT')
					//prop GT compare
					//prop LT compare
					//prop EQ compare
					//prop NOT null
					//prop NOT empty
				//put compare in mustaches to use a dynamic value otherwise it will be treated as a static value
		templateConstructor.if = function(condition, then, otherwise, isComplex){
			otherwise = otherwise || null;
			
			condition = condition.split(' ');
			if(condition.length < 2){ console.warn('an IF conditional was found ('+condition+') but the condition format is wrong'); return; }
			var prop1 	 	= condition.shift().toLowerCase()
				, operator 	= condition.shift()
				, prop2  	= condition.join(' ').toLowerCase()
				, useStatic	= prop2.slice(0,2) !== '{{';
			
			switch(operator){
				case 'NOT':
					if(prop2 === 'null'){ 
						condition = function(row){ return row[prop1] !== null; }; 
					}
					else if(prop2 === 'empty'){ 
						condition = function(row){ return (row[prop1] || (row[prop1] === '0')); }; 
					}
					else{ 
						if(useStatic){
							condition = function(row){ return row[prop1] !== prop2; };
						}
						else{
							prop2 = prop2.slice(2, -2);
							condition = function(row){ return row[prop1] !== row[prop2]; }; 
						}
					}
					break;
				case 'GT':
					if(useStatic){		
						condition = function(row){return row[prop1] > prop2;};
					}
					else{
						prop2 = prop2.slice(2, -2);
						condition = function(row){return row[prop1] > row[prop2];};
					}
					break;
				case 'LT':
					if(useStatic){
						condition = function(row){return row[prop1] < prop2;};
					}
					else{
						prop2 = prop2.slice(2, -2);
						condition = function(row){return row[prop1] < row[prop2];};
					}
					break;
				case 'EQ':
					if(prop2 === 'null'){ 
						condition = function(row){ return row[prop1] === null; }; 
					}
					else if(prop2 === 'empty'){ 
						condition = function(row){ return (!row[prop1] || (row[prop1].length === '0')); }; 
					}
					else{
						if(useStatic){
							condition = function(row){return row[prop1] == prop2;};
						}
						else{
							prop2 = prop2.slice(2, -2);
							condition = function(row){return row[prop1] == row[prop2];};
						}
					}
					break;
				default:
					console.warn("the 'if' condition sent could not be parsed.");
			}
			
			//THEN
			if(then.isComplex === false){
				then.parse = templateConstructor.replaceMultiple(then.template);
			}
			else{
				then = new templateConstructor(then.template);
			}
			
			//ELSE (otherwise)
			if(otherwise){
				if(otherwise.isComplex === false){
					otherwise.parse = templateConstructor.replaceMultiple(otherwise.template);
				}
				else{
					otherwise = new templateConstructor(otherwise.template);
				}
			}
			
			return function(row){
				//console.debug('parse if condition: \n', !!condition(row), ' \n', then.parse, " \n", then.template);
				if(condition(row)){
					return then.parse(row);
				}
				else{
					if(otherwise){ return otherwise.parse(row); }
					else{ return ''; }
				}
			};
		};
		//'repeat' - repeat template using properties listed within REPEAT[template]USE[prop](LIMIT[int]) - If not LIMIT the number of repeats will be the 
			//number of items in the property list for USE.
		templateConstructor.repeat = function(template, use, limit, isComplex){
			//generate a list of replacements properties to use in splitting up the lists for those properties to repeatedly parse the template
			var repgex = new RegExp(templateConstructor.patterns.replacement), props = [], replace = (isComplex ? new templateConstructor(template) : {parse:templateConstructor.replaceMultiple(template)});
			
			while(iter = repgex.exec(template)){
				props.push(iter[1]);
				template = template.slice(iter.index + iter[0].length);
			}
			
			return function(row){
				var useList 		= row[use].split(',')
					, explodedRow 	= []
					, HTML 			= ''
					, l 			= (l == -1 ? useList.length : Math.min(limit, useList.length))
					, x 			= 0;
				//build a temporary set of rows from the various lists used in the replacements
				props.forEach(function(prop){
					arr = row[prop].split(',');
					for(x=0; x<l; x++){	
						if(typeof explodedRow[x] === 'undefined') explodedRow[x] = {};
						explodedRow[x][prop] = arr[x] || 'undefined';
					}
				});
				for(x=0; x<l; x++){
					HTML += replace.parse(explodedRow[x]);
				}
				return HTML;
			};
		};
		/*
		(function(){
			var templates = {};
			
			templateConstructor.registerTemplate = function(name, map){
				if(templates[name] !== undefined){ console.warn('a template is already registered by name ('+name+')'); }
				else if(!map){ console.warn('a map must be provided to register for name ('+name+')'); }
				else{
					templates[name] = map;
				}
			};
			
			templateConstructor.prototype.getTemplate = function(name){
				if(name && templates[name] !== undefined){
					return templates[name];
				}
				else{ return null; }
			};
		}());
		*/
		// *** STATIC ***
		templateConstructor.registeredTemplates = {};	
		templateConstructor.registerTemplate = function(name, map){
			if(this.registeredTemplates[name] !== undefined){ console.warn('a template is already registered by name ('+name+')'); }
			else if(!map){ console.warn('a map must be provided to register for name ('+name+')'); }
			else{
				this.registeredTemplates[name] = map;
			}
		};
		//static patterns
		templateConstructor.patterns = {
			replacement: '{{(.+?)}}',
			repeat: 'REPEAT\\[(.+?)',
			use: '\\]USE\\[(.+?)\\](LIMIT\\[([0-9]+)\\]){0,1}',
			if: 'IF\\[(.+?)\\]THEN\\[',
			else: '\\]ELSE\\[',
			end: '\\]ENDIF'
		};
		templateConstructor.patterns.or = templateConstructor.patterns.replacement + '(OR{{(.+?)}})*';
		templateConstructor.patterns.master = new RegExp('(' + templateConstructor.patterns.if + ')|(' + templateConstructor.patterns.else + ')|(' + templateConstructor.patterns.end + ')|(' + templateConstructor.patterns.repeat + ')|(' + templateConstructor.patterns.use + ')|(' + templateConstructor.patterns.or + ')');
		
		//spotter.templates methods
			//get: return registered template object
			//setup: check if named template is registered and create a new template constructor if not. returns the template constructor
			//append: parse named template object for each data row sent and add each iteration as a child to cont
			//parse: parse named template object for each data row and return the children
		(function(){
			var registered = {}, span = document.createElement('SPAN');
			spotter.templates = {
				get: function(name){
					return templateConstructor.registeredTemplates[name];
				},
				setup: function(template, name){
					if(!name){ console.warn('a name must be sent when setting up a template.\n', new Error().stack); return false; }
					if(!templateConstructor.registeredTemplates[name]) new templateConstructor(template, name);
					return templateConstructor.registeredTemplates[name];
				},
				append: function(name, rows, cont, debug){
					var replacements=templateConstructor.registeredTemplates[name]
						,iter=""
						,HTML
						,prop
						,x
						,l
						,i
						,m
						,c
						,createdElems = []
						,createdElemsFrag;
	
					if(typeof replacements === 'undefined'){
						console.warn('templates must first be setup (spotter.templates.setup(template)) before they can be used\n', new Error().stack);
						return;
					}
	
					if(typeof rows === 'undefined' || rows === null){
						rows = [{}];
						l=1;
					}
					else if(!(l = rows.length)){
						rows = [rows];
						l=1;
					}
					else{
						l = rows.length;
					}
	
					HTML = replacements.parse(rows, debug);
					HTML.forEach(function(str, i){
						span.innerHTML = str;
						createdElemsFrag = Array.prototype.slice.call(span.children);
						createdElemsFrag.forEach(function(el){
							el.parseData = rows[i];
							cont.appendChild(el);
						});
						createdElems.merge(createdElemsFrag);
					});
					
					return createdElems;
				},
				parse: function(name, rows){
					var replacements=templateConstructor.registeredTemplates[name];
					if(typeof replacements === 'undefined'){ console.warn('templates must first be setup (spotter.templates.setup(template)) before they can be used\n', new Error().stack); return; }
					if(typeof rows === 'undefined' || rows === null){ rows = [{}]; l=1; }
					else if(!(l = rows.length)){ rows = [rows]; l=1; }
					else{ l = rows.length; }
					
					return replacements.parse(rows, debug).join();
				}
			};
		}());
		
		//(class)shade = new spotter.shade((string)name, (string)type, (string)animateIn, (string)animateOut)//{
			//arguments:
				//(required)(string)name - the classname of the shade will be 'shade-{{name}}'
				//(required)(string)[vertical|horizontal|animate]type - the type of animation used to open the shade - set to animate if not vertical or horizontal
				//(string)animateIn - classname selected from animate.css
				//(string)animateOut - does not have to be the opposite of animateIn otherwise is the analog to it
			//private properties
				//open: boolean - is the shade currently open
				//onCloseAction: function - triggers when shade is closed
				//onOpenAction: function - triggers when shade is opened
				//hasBeenOpened: boolean - has shade ever been opened
				//fill: object - holds the functions that determine how the shade opens and closes visually
			//methods:
				//afterClose(function) - set private property 'onCloseAction'
				//open() - open the shade
				//close() - close the shade
				//isOpen() - getter for property 'open'
			//properties
				//shade: element - the top level shade element
				//content: element - container designated for custom content
				//closeButton: element - element designated as the close button - (UI)onclick=>close()
		//}
		spotter.shade = (function(){
			var __factory = {shades:[],instances:[],openShades: []};
			
			spotter.onResize(function(){
				__factory.shades.forEach(function(shade){
					shade.style.height = window.height+'px';
					if(__factory.openShades.indexOf(shade) === -1) shade.style.bottom = window.height+'px';
				});
			});
		
			return function(name, type, animateIn, animateOut){//utilize shade by setting the action of the close button spotter.shade.afterClose(func) then open with spotter.shade.open(). Type is optional [vertical|horizontal|explode] default: vertical
				if(typeof name === 'undefined' || !name.length){ console.warn('Spotter shade must be given a non-empty name \n', new Error().stack); return false; }
				
				type = type || "vertical";
				
				var animationEndVernacular, transitionEndVernacular, zIndexLower = 9900, zIndexHigher = 9910, zIndexCurrent = 8800;
				
				var __self={
					open:false,
					onCloseAction:function(){console.log('afterClose not set');},//triggers when shade is closed
					onOpenAction:function(){console.log('afterOpen not set');},//triggers when shade is opened
					hasBeenOpened: false,
					fill: {}//functions expand/shrink that cause he absolute positioning properties to fill the window (scroll open the shade)
				};
				
				// ** Build shade and closebutton ** //{
					var shade = document.createElement('div');
					__factory.shades.push(shade);
					shade.id = 'shade-'+name;
					shade.className = 'shade force-open '+type;
					
					var content = document.createElement('div')
						,closeButton = document.createElement('div');
						
					content.className = 'content';
					closeButton.className = 'close-button';
					shade.appendChild(closeButton);
					shade.appendChild(content);
					
					content.className += ' spotter-hide-scroll';
					
					shade.style.visibility = 'hidden';
					shade.style.zIndex = 9900;
				//}
				
				// ** MATH FOR PROPER ANIMATION
					animationEndVernacular = spotter.whichAnimationEvent;
					transitionEndVernacular = spotter.whichTransitionEvent;
					if(type === 'vertical'){	
						shade.style.bottom = window.height+'px';
						shade.style.height = window.height+'px';
						__self.fill.expand = function(){
							shade.style.bottom = 0;
						};
						__self.fill.shrink = function(){
							shade.style.bottom = window.height+'px';
						};
						closeButton.innerHTML = '[X]';
					}
					else if(type === 'horizontal'){
						shade.style.right = window.width+'px';
						shade.style.width = window.width+'px';
						shade.style.minWidth = '100%';
						shade.style.height= window.height+'px';
						__self.fill.expand = function(){
							shade.style.right = 0;
						};
						__self.fill.shrink = function(){
							//console.log(window.width+'px');
							shade.style.right = /*window.width+'px'*/'100%';
						};
						closeButton.innerHTML = '<div class="vertical-align"><</div>';
					}
					else if(type === 'animate'){
						animateIn = animateIn || 'zoomIn';
						animateOut = animateOut || 'zoomOut';
						spotter.toggle.class.add(content,'animated');
						__self.fill.expand = function(){
							shade.style.visibility = 'visible';
							spotter.toggle.class.swap(content,animateOut,animateIn);
						};
						__self.fill.shrink = function(){
							//shade.style.backgroundColor = 'rgba(0,0,0';
							spotter.toggle.class.swap(content,animateIn,animateOut);							
						};
					}
					else{
						console.warn('the type ('+type+') send to spotter.shade was not recognized', new Error().stack);
					}
					
				if(!document.body) console.warn('document body not yet loaded', new Error().stack);
				spotter.appendToBody(shade);
				
				// ** METHODS **
					//close and open are static
					//afterClose/afterOpen set extra functions activated by close/open
					var __constructor = {
						shade: shade,
						content: content,
						closeButton: closeButton,
						//afterClose: function(func){ __self.onCloseAction=func; return this; },//set (single) function to trigger when shade is closed
						close: function(){
							//console.log('shade close');
							__constructor.eventTriggers['beforeClose']();
							__factory.openShades.removeValues(shade);
							__self.open = false;
							__self.fill.shrink();
						},
						open: function(){
							if(!__self.hasBeenOpened) __constructor.shade.className = __constructor.shade.className.replace(' force-open',' spotter-animated');
							__constructor.eventTriggers['beforeOpen']();
							__factory.openShades.push(shade);
							zIndexCurrent = zIndexLower + __factory.openShades.length;
							//console.log('open shades length:', __factory.openShades.length, ' \n', 'setting shade to zIndex:', zIndexCurrent);
							shade.style.zIndex = zIndexCurrent;
							//__factory.openShades.forEach(function(el){ el.style.zIndex = ++zIndexCurrent; });
							shade.style.visibility = 'visible';
							__self.open = true;
							__self.fill.expand();
						},
						isOpen: function(){return !!__self.open;}
					},
					_se = spotter.events;
					
				// ** EVENTS **
					_se.setEventTrigger(__constructor, 'beforeOpen');
					_se.setEventTrigger(__constructor, 'afterOpen');
					_se.setEventTrigger(__constructor, 'beforeClose');
					_se.setEventTrigger(__constructor, 'afterClose');
				
				__factory.instances.push(__constructor);
				
				// ** ANIMATION EVENTS **
					if(type === 'horizontal' || type === 'vertical'){
						shade.addEventListener(transitionEndVernacular,function(){
							if(!__self.open){//transition will be the opposite bc open state will have been changed before transition event is fired`
								shade.style.zIndex = zIndexLower;
								//if(__factory.openShades.length > 0) __factory.openShades[__factory.openShades.length - 1].style.zIndex = --zIndexCurrent;
								shade.style.visibility = 'hidden';
								__constructor.eventTriggers['afterClose']();
							}
							else{
								__constructor.eventTriggers['afterOpen']();
							}
						},false);
						
						if(type === 'horizontal'){
							spotter.events.swipeEvents(shade, '40%', 750, 'horizontal');
							shade.addEventListener('swipeleft', __constructor.close);
						
							spotter.toggle.hide(closeButton);
						}
					}
					else if(type === 'animate'){
						content.addEventListener(animationEndVernacular, function(){
							if(!__self.open){//shade closed
								shade.style.zIndex = zIndexLower;
								shade.style.visibility = 'hidden';
								__constructor.eventTriggers['afterClose']();
							}
							else{
								__constructor.eventTriggers['afterOpen']();
							}
						});
					}
					
					closeButton.addEventListener('click',function(e){
						var targ = e.srcElement || e.originalTarget;
		
						if(typeof targ !== 'undefined' && (targ === this || targ.parentNode === this && __self.open)){
							__constructor.close();
						}
						else{
							console.warn('popMenu is not open',e,e.originalTarget===this,__self.open);
						}	
					},false);
				
				return __constructor;
			};
		}());
		
		spotter.popMenu = (function(){
			var factory={
					menus: {},
				},
				__parent=spotter;
			
			//name = index in factory referencing this instance, type[vertical|horizontal|animate] = how menu opens/closes
			var __constructor = function(name, type, animateIn, animateOut){
				
				var shade = new spotter.shade(name, type, animateIn, animateOut);
				if(typeof shade.content === 'undefined') console.log('shade arguments:',arguments, ' \n', 'stack: \n', spotter.log.stackDump(new Error().stack));
				
				//add a custom container to shade
				var container = document.createElement('DIV');
				container.id = name;
				container.className = "pop-menu";
				shade.content.appendChild(container);//move container to shade
				
				var __private= {
						state: false,//false = not opened, true = is opened
						container: container,//container added to the shade instance
						shade: shade,//shade instance
						closeButton: shade.closeButton,
						//beforeOpen: [function(){}],//array of functions to run before open
						//afterOpen: [function(){}],//array of functions to run after open
						//beforeClose: [function(){}],//array of functions to run before closing
						//afterClose: [],//array of functions to run after closing
						onMenu: [],//array of functions to run after template is done loading. These run everytime the template is loaded.
						onResponse: [],//array of functions to run on dynamic template ajax response
						onScrollBottom: function(){},//function to run when shade container is scrolled to the bottom.
						pagination: {use:false,start:0,current:0},
						limit: {use:false,to:25},
						menus: [],//array of the spans created for dynamic data
						activationCount: 0,//used to count the number of activations, 0 of course being the first
						activateOnReady: 0,//used to trigger activate again after asynchronous events
						menuReady: false //data received, template ready and parsed into shade
					},
					__self={
						shade: shade,
						container: __private.container,
						closeButton: __private.closeButton,
						/*
						beforeOpen: function(func){
							if(typeof func !== 'function'){ 
								console.warn('argument (beforeOpen) must be a function'); return this;
							}
							__private.beforeOpen.push(func);
							return this;
						},
						afterOpen: function(func){
							if(typeof func !== 'function'){ 
								console.warn('argument (afterOpen) must be a function'); return this;
							}
							__private.afterOpen.push(func);
							return this;
						},
						beforeClose: function(func){
							if(typeof func !== 'function'){ 
								console.warn('argument (beforeClose) must be a function'); return this;
							}
							__private.beforeClose.push(func);
							return this;
						},
						afterClose: function(func){
							if(typeof func !== 'function'){ 
								console.warn('argument (afterClose) must be a function'); return this;
							}
							__private.afterClose.push(func);
							return this;
						},
						resetOnOpen: function(func){
							if(func){
								if(typeof func !== 'function'){ 
									console.warn('argument (resetOnOpen) must be a function'); return this;
								}
								else{
									__private.afterOpen=[func];
								}
							}
							else{
								__private.afterOpen=[];
							}
							return this;
						},
						resetOnClose: function(func){
							if(func){
								if(typeof func !== 'function'){ 
									console.warn('argument (resetOnClose) must be a function'); return this;
								}
								else{
									__private.afterClose=[__private.menuDeactivationProcess, func];
								}
							}
							else{
								__private.afterClose=[__private.menuDeactivationProcess];
							}
							return this;
						}
						*/
					};
					
				//=======utilize the event listeners enabled on the shade===============
					spotter.events.setEventTrigger(__self, 'beforeOpen');
					spotter.events.setEventTrigger(__self, 'afterOpen');
					spotter.events.setEventTrigger(__self, 'beforeClose');
					spotter.events.setEventTrigger(__self, 'afterClose');

					shade.addEventListener('afterOpen', __self.eventTriggers['afterOpen']);
					shade.addEventListener('afterClose', __self.eventTriggers['afterClose']);
				//================== on scroll bottom =======================
				__private.onScrollBottomEventName= spotter.onScrollBottom(shade.content,'onScrollBottom');
				
				__self.onScrollBottom = function(func){
					if(typeof func === 'function') { __private.onScrollBottom = (function(__private){ return function(){func(__private);}; }(__private)); }
					else if(func === 'refresh') { __private.onScrollBottom = (function(){
						return function(){
							if(__private.template.suspended === true) return;
							__private.buildMenuWithRemoteData();
						}; 
					}()); }
					return this;
				};
				
				__private.setupScrollBottom = function(){				
					document.removeEventListener(__private.onScrollBottomEventName,__private.onScrollBottom,false);
					document.addEventListener(__private.onScrollBottomEventName,__private.onScrollBottom,false);
				};
				//================= end scroll bottom =======================
				
				//------------------------------------------------------------------------------
				//template storage
					//src - where the data is originating from to parse the template
						//url is the src url or null. If form is specified then this will be set to form.action
						//type is 'form' if the params come from a bound form or 'remote' if the params come from a bound object
						//params is the object of actual request params
					//rows - the actual data used to parse the template
				__private.template = {
					data:{
						src:{//the source to GET the data to parse template if data is to be set and is not static
							url:null,//for remote queries
							type:null,//static, form, or remote
							params:null,//parameters to send with a remote request
							form:null//form element to get params^
						},
						rows:null,//the data used to parse the template
						ready:false,//signal that data is ready (mostly for asynchronous)
						events:{
							ready:spotter.events('ready')//data ready event
						},
						enabled:false//true if template is to be parsed, false if template is static
					},
					ready:false,//signal template is ready
					events:{
						ready:spotter.events('ready')//template ready event
					},
					enabled: false,//is template source set
					refresh: false,//should the menu change when the data changes, otherwise the first iteration is the final iteration.
					suspended: false,//is template process ongoing (waiting on a response) 
					showEmpty: false//show the empty results div. Use .showEmpty(bool) method to set
				};
				
				__private.emptyResult = document.createElement("DIV");
				__private.emptyResult.className = 'popmenu-empty-result';
				__private.emptyResult.innerHTML = "No Results Found";
	
	
				// *** PRIVATE METHODS ***
				
				//use activate or refreshCurrentState to turn on pop menu, this is more the animation
				__private.menuActivationProcess = function(){ 
					var _p = __private;
					/*
					var l = __private.beforeOpen.length;
					while(--l > -1){
						if(__private.beforeOpen[l](__private) === false){
							return;
						}
					}
					*/
					__self.eventTriggers['beforeOpen']();
					_p.shade.open();
					spotter.scroll.recordPosition();
					spotter.scroll.to(_p.container);
					_p.container.style.display = 'block';
					_p.state = true;
					_p.template.suspended = false;
				};
				
				//set to shade afterClose. Use deActivate to trigger closing this popmenu, this does not close the shade.
				__private.menuDeactivationProcess = function(_s){
					spotter.scroll.reset();
					this.container.style.display= 'none';
					this.pagination.current= 0;
					document.removeEventListener(this.onScrollBottomEventName, this.onScrollBottom, false);
					//this.afterClose.forEach(function(func){ func(this); });
					this.activationCount= 0;
					this.state= false;
					this.template.suspended= false;
					_s.eventTriggers['afterClose']();
				}.bind(__private, __self);
				shade.addEventListener('afterClose', __private.menuDeactivationProcess);//menu deactivation must run each time the menu is closed.
				
				//enable activation. If activated prior to template download this will also run it
				__private.enableActivation = function(){
					__private.template.suspended = false;
					__private.template.ready = true;
					if(__private.activateOnReady === true){ __private.menuActivationProcess(); __private.activateOnReady = false; }
				};		
				var c = 0;
				__private.parseTemplate = function(){
					var templateInfo = __private.template
						,templateData = templateInfo.data;
	
					if(templateData.enabled === true && templateData.ready === false){ console.debug('popMenu.parseTemplate - data not ready for popmenu '+name);  /*console.log(new Error().stack);*/ return; }
					if(templateInfo.ready === false){ console.debug('popMenu.parseTemplate - template not ready for popmenu '+name); /*console.log(new Error().stack);*/ return; }
					
					//console.log('spotter popmenu parse template '+name);
					
					var span
						,l = __private.menus.push(span = document.createElement('SPAN')) - 1;
					
					__private.container.appendChild(span);
	
					if(templateData.enabled){//using a parsed template
						if(templateData.type === 'form') templateData.rows = [spotter.getDataFromForm(templateData.form)];
					
						spotter.templates.setup(templateInfo.result, templateInfo.name);
						//console.log('pop menu template setup: \n', 'name: ', templateInfo.name, ' \n', spotter.templates.setup(templateInfo.result, templateInfo.name));//set template parse object
	
						spotter.templates.append(templateInfo.name, templateData.rows, span);
					}
					else{
						span.innerHTML = templateInfo.result;
					}
	
					//run scripts by replacing the template script with a 'created' script
					var scripts = span.querySelectorAll('script'), scriptText = '', script;
					if(scripts !== null){
						var l = scripts.length, x = 0, scriptName;
						for(x;x<l;x++){
							script = scripts[x];
							scriptText += script.innerHTML+((scriptName=script.getAttribute('data-name'))?'//# sourceURL=inline: '+scriptName:'');
							spotter.deleteElement(script);
						}
						var newScript = document.createElement('SCRIPT');
						newScript.text = scriptText;
						span.appendChild(newScript);
					}
	
					__private.onMenu.forEach(function(func){
						func.call(span, __private);
					});
	
					__private.pagination.current++;
					__private.enableActivation();
	
					//set data ready to false so that a second call to this function using the same data for parsing will fail
					templateData.ready = false;
				};
				
				//Call this method to retrieve data to parse a template.
				//once this is called, the data set in __private.template.data is considered to be the data to be used for parsing (or static if no data is specifed). 
				//This means methods like loadTemplate & activate must be called after the appropriate data is set (bindDataToParseTemplate or bindDataToRemoteRequest) 
				//else this method will assume that the template is static and non-parsed.
				__private.readyDataToParseTemplate = (function(){
					var previouslyActivated = false;
					return function(){
						if(__private.template.data.enabled !== true){ console.warn('Data not enabled. Ready data to parse template call useless.'); return; }//if data not enabled, template does not need to be parsed
						
						var templateSrc = __private.template.data;
	
						if(__private.pagination.current === 0) __private.container.innerHTML = "";
						
						if(templateSrc.type !== 'static' && templateSrc.type !== null){	
							if(templateSrc.type === 'form') templateSrc.params = spotter.getDataFromForm(templateSrc.form);
							
							if(previouslyActivated === false){ document.addEventListener(__private.template.data.events.ready, __private.parseTemplate, false); previouslyActivated = true; }
							__private.getRemoteData();
						}
						else{
							__private.parseTemplate();
						}
					};
				}());
				
				__private.getRemoteData = (function(){
					var isActive = false;
					return function(){
						if(isActive){ console.warn('popMenu.getRemoteData is already active and awaiting a request'); return false; }
						isActive = true;
						
						//var stack = new Error().stack;
	
						//console.log('__private.template',__private.template,'params:',__private.template.data.src.params);
						
						spotter.ajax({
							url: __private.template.data.src.url,
							data: __private.template.data.src.params,
							dataType: "JSON",
							type: "GET",
							cache: __private.template.data.src.cache,
							success: function(response){
								response = JSON.parse(response);
								__private.onResponse.forEach(function(func){
									func.call(response, __private);
								});
								
								//if request failure
								if(response.status !== 'success' || response.result.length === 0){
									if(__private.template.showEmpty === true) __private.container.appendChild(__private.emptyResult);
									return;
								}
								__private.template.data.rows = response.result;
								__private.template.data.ready = true;
								spotter.events.fire(__private.template.data.events.ready);
							},
							error:function(){
								console.warn(arguments);
								console.log(stack);
								__private.enableActivation();
							},
							complete:function(){isActive = false;}
						});
						
						return false;
					};
				}());
	
				//helper
				__private.revertDynamicParams = function(){
					__private.template.data = __private.template.data.old;
				};
				
				// *** PUBLIC METHODS ***
				
				//use to open/activate the menu. loads template if not loaded, refreshes the parse data and reparses it if specified
				__self.activate = function(){
					console.log('spotter popMenu activate');
					var pri = __private
						,tem = pri.template;

					if(pri.state === true) { console.debug('menu is still set as active'); return; }
					pri.state = true;

					pri.activateOnReady = true;
					
					if(typeof pri.title !== 'undefined') pri.titleBar.innerHTML = pri.title;
					
					pri.setupScrollBottom();
					
					if(tem.enabled === true){
						if(tem.suspended === false){//menu not suspended
							if(tem.ready === false){
								console.log('template not yet loaded. now loading.');
								__self.loadTemplate();
							}
							else{
								pri.menuActivationProcess();
							}
						}
						else{ console.log('popMenu ('+name+') is currently suspended'); }
					}
					else{
						pri.enableActivation();
					}
				};
				
				//alias - close shade
				__self.deActivate = function(){
					console.log(__private.shade.closeButton);
					__private.shade.closeButton.click();
				};
	
				//add onclick listener to 'el' to open this popMenu
				__self.attachTo = function(el){
					spotter.requiredParam(el).element().result()();
					var func = (function(__self){ return function(e){ if(this.pressandhold) return; e.preventDefault(); __self.activate.call(__self); }; }(this));
					__private.goButton = el;
					el.addEventListener('click',func,false);
					return this;
				};
				
				//Sets up the parse data to be queried from a remote location. Binds a form or object as params to requests for remote data
				//If a form is used the request URL will be set to form.action. 
				//If only URL is sent no params will be sent.
				//Call this before loadTemplate/activate if it is to be used.
				__self.bindDataToRemoteRequest = function(frmOrObj, URL, cache){
					__private.template.data.enabled = true;
					__private.template.data.ready = false;
					if(frmOrObj.tagName === 'FORM'){
						__private.template.data.src.form = frmOrObj;
						__private.template.data.src.type = 'form';
						__private.template.data.src.url = frmOrObj.action;
					}
					else if(typeof frmOrObj === 'object'){
						__private.template.data.src.params = frmOrObj;
						__private.template.data.src.type = 'remote';
						if(typeof URL === 'string') __private.template.data.src.url = URL;
					}
					else if(typeof URL === 'string'){
						__private.template.data.src.url = URL;
					}
					else{
						console.warn("the argument for 'bindDataToRemoteRequest' must be a form element or array of objects (rows) or a URL must be specified");
						return;
					}
					__private.template.data.src.cache = cache || false;
					return this;
				};
				
				//bind a form or rows to use to parse the template. Acts as static data. Call this before loadTemplate/activate if it is to be used.
				__self.bindDataToParseTemplate = function(frmOrRows){
					__private.template.data.enabled = true;
					if(frmOrRows.tagName === 'FORM'){
						__private.template.data.type = 'form';
						__private.template.data.form = frmOrRows;
					}
					else if(spotter.isType.rows(frmOrRows)){
						__private.template.data.rows = frmOrRows;
						__private.template.data.type = 'static';
					}
					else{
						console.warn("the argument for 'bindDataToRemoteRequest' must be a form element or array of objects (rows)", spotter.log.stackDump(new Error().stack));
						return;
					}
					__private.template.data.ready = true;
					__private.readyDataToParseTemplate();
					return this;
				};
	
				//use template by 'name'
				__self.useTemplate = function(name){
					__private.template.name = name;
					__private.template.enabled = true;
					return this;
				};
				
				//call manually to preload template otherwise the template will be loaded by 'activate'.
				//useful for not loading rarely used resources or delaying other resources from loading.
				//if no parse data is set before calling this, the template is assumed to be static/non-parsed.
				//if no template is set when this is called, the menu will be created empty
				__self.loadTemplate = (function(){
					var previouslyActivated = false;
					return function(){
						//console.debug('spotter templates: \n', 'load template:',__private.template.name,' \n', 'previouslyActivated:',previouslyActivated,' \n','!__private.template.enabled:', !__private.template.enabled, ' \n', 'onMenu function:', __private.onMenu);
						if(previouslyActivated === false){ 
							document.addEventListener(__private.template.events.ready, __private.parseTemplate);
							previouslyActivated = true;
						}
						
						if(!__private.template.enabled){
							__private.onMenu.forEach(function(func){
								func.call(container, __private);
							});
							return this;
						}
						
						spotter.imports.useImport(__private.template.name, function(event){
							var template = __private.template;
							//console.debug('template has loaded:', template.name);
							template.result = event.content.template;
							template.ready = true;
							spotter.events.fire(template.events.ready);
						});
						if(__private.template.data.enabled) __private.readyDataToParseTemplate();
						return this;
					};
				}());
				
				__self.setTitle = function(str){
					__private.title = str;
					__private.titleBar = document.createElement('DIV');
					__private.titleBar.className = 'title';
					spotter.prependChild(__private.shade.content,__private.titleBar);
	
					this.setTitle = function(str){ __private.title = str; return this; }
					
					return this;
				};
	
				__self.enableRefresh = function(bool){
					if(!!bool){ __private.template.refresh = true; }
					else{ __private.template.refresh = false; }
					return this;
				};
				
				__self.showEmpty = function(bool){
					if(!!bool){ __private.template.showEmpty = true; }
					else{ __private.template.showEmpty = false; }
					return this;
				}
				
				//funcs run when menu is parsed.'container' is this, __private is first argument.
				__self.onMenu = function(func){
					//console.debug(' __private.template.suspended ', __private.template.suspended, ' __private.template.ready  ', __private.template.ready, ' __private.template.refresh ', __private.template.refresh);
					if(__private.template.suspended === false || __private.template.ready === false || __private.template.refresh === false){ __private.onMenu.push(func); }
					else{ func.call(__private.menus.last(),__private); }
					return this;
				};
				
				//trigger function func where first argument is the last remote response - the response IS NOT set to the result of this function so just modify it inline in the function
				__self.onResponse = function(func){
					if(__private.template.ready === false){ __private.onResponse.push(func); }
					else{ func.call(__private.template.data.rows, __private); }
					return this;
				};
	
				//call this to set all the functions and settings to blank arrays
				__self.resetFunctions = function(){
					__private.onMenu = [];
					__private.onResponse = [];
					__private.afterOpen = [];
					__private.afterClose = [];
					__private.beforeClose = [];
					__private.beforeOpen = [];
				}
	
				__self.forceOpen = function(){//remove 'spotter-animated' class, add 'force-open' class to open shade and push it under everything else. Good when offsets/heights needed.
					__private.shade.shade.className = __private.shade.shade.className.replace(' spotter-animated',' force-open');
				};
				
				__self.forceClose = function(){//use to undo forceOpen change
					__private.shade.shade.className = __private.shade.shade.className.replace(' force-open',' spotter-animated');
				};
				
				//refresh without running deactivate
				__self.refreshCurrentState = function(){
					__private.container.style.display = 'none';
					__private.pagination.current = 0;
					document.removeEventListener(__private.onScrollBottomEventName,__private.onScrollBottom,false);
					__private.activationCount = 0;
					__private.state = false;
					__private.template.suspended = false;
					this.activate();
				};
	
				__self.limitResult = function(lim){//lim is required
					__private.limit.use = true;
					__private.limit.to = Number(lim);
					return this;
				};
				
				__self.usePagination = function(start){//start is optional and will be the start page if called
					__private.pagination.use = true;
					if(typeof start !== 'undefined') __private.pagination.start = __private.pagination.current = start;
					return this;
				};
				
				__self.isActive = function(){
					return __private.state;
				};
				
				return __self;
			};
			
			return __constructor;
		}());
		
		spotter.appendToBody = (function(){
			var children = [], loadChildren = function(){var d = document.body; children.forEach(function(child){d.appendChild(child);});};
			spotter.testLoaded(loadChildren);
			return function(child){
				if(document.body){ document.body.appendChild(child); }
				else{ children.push(child); }
			};
		}());
		
		//spotter.confirmation().setTitle(string).onAccept(function).activate()
		spotter.confirmation = function(){
			//USE: spotter.confirmation().method()...
			
			var fireUserAcceptedFuncs = function(){
					console.log('fireUserAcceptedFuncs');
					__factory.acceptFuncs.forEach(function(func){ func(); });
				},
				fireUserDeniedFuncs = function(){
					console.log('fireUserDeniedFuncs');
					__factory.denyFuncs.forEach(function(func){ func(); });
				},
				fireModalClosedFuncs = function(){
					__factory.onCloseFuncs.forEach(function(func){ func(); });
				};
			
			var __factory = {acceptFuncs:[], denyFuncs:[], onCloseFuncs:[]}
				,userAccepted = function(){
					var popMenu = __factory.popMenu;
					console.log('user accepted');
					__factory.popMenu.removeEventListener('afterClose', fireUserDeniedFuncs);
					__factory.popMenu.addEventListener('afterClose', fireUserAcceptedFuncs);
					//popMenu.shade.afterClose(fireUserAcceptedFuncs);
					popMenu.deActivate();
				}
				,userDenied = function(){
					var popMenu = __factory.popMenu;
					console.log('user denied');
					__factory.popMenu.removeEventListener('afterClose', fireUserAcceptedFuncs);
					__factory.popMenu.addEventListener('afterClose', fireUserDeniedFuncs);
					//popMenu.shade.afterClose(fireUserDeniedFuncs);
					popMenu.deActivate();
				};
			
			//create a recurring pop menu
			__factory.popMenu = new spotter.popMenu('confirmation-box','animate','zoomIn','zoomOut')
				.useTemplate('confirmation-box')
				.onMenu(function(popMenu){
					__factory.title	= document.getElementById('spotter-confirmation-title');
					__factory.msg	= document.getElementById('spotter-confirmation-msg');
					__factory.qBox	= document.getElementById('spotter-confirmation-question');
					__factory.ok	= document.getElementById('spotter-confirmation-ok');
					__factory.cancel= document.getElementById('spotter-confirmation-cancel');

					__factory.ok.addEventListener('click', userAccepted);
					__factory.cancel.addEventListener('click', userDenied);
					
					spotter.verticallyCenter(document.getElementById('spotter-confirmation'));
				})
				//.afterClose(fireModalClosedFuncs)
				.loadTemplate();
			__factory.popMenu.addEventListener('afterClose', fireModalClosedFuncs);
			
			//resets confirmation window
			var __recycle = function(){				
				__factory.acceptFuncs = [];
				__factory.denyFuncs = [];
				__factory.onCloseFuncs = [];
				
				return __recycle;
			};
			
			__recycle.setTitle = function(str){
				__factory.title.innerHTML = str.toString();
				return spotter.confirmation;
			};
				
			__recycle.setMessage = function(str){
				__factory.msg.innerHTML = str.toString();
				return spotter.confirmation;
			};
			
			__recycle.setQuestion = function(str){
				__factory.qBox.innerHTML = str.toString();
				return spotter.confirmation;
			};
			
			//add a function to activate if confirmation is accepted
			__recycle.onAccept = function(func){
				__factory.acceptFuncs.push(func);
				return __recycle;
			};
			
			//add a function to activate if confirmation is denied
			__recycle.onDeny = function(func){
				__factory.denyFuncs.push(func);
				return __recycle;
			};
			
			//open confirmation window programmatically
			__recycle.activate = function(){
				__factory.popMenu.activate();
				return __recycle;
			};
			
			//close confirmation window	programmatically	
			__recycle.deActivate = function(func){
				if(typeof func === "function") __factory.onCloseFuncs.push(func);
				console.log('__factory.popMenu.shade.closeButton', __factory.popMenu.shade.closeButton);
				__factory.popMenu.shade.closeButton.click();
				return __recycle;
			};
			
			return __recycle;
		};
		
		spotter.confirmationMessage = function(){
			//USE: spotter.confirmationMessage().method()...
			
			var __factory = {closeFuncs:[]}
				, afterClose = function(){
					__factory.closeFuncs.forEach(function(func){ func(); });
					__recycle.deActivate();
				};
			
			//create a recurring pop menu
			__factory.popMenu = new spotter.popMenu('confirmation-message-box','animate','zoomIn','zoomOut')
				.useTemplate('confirmation-message-box')
				.onMenu(function(popMenu){				
					__factory.title	= document.getElementById('spotter-confirmation-message-title');
					__factory.msg	= document.getElementById('spotter-confirmation-message-msg');
					__factory.ok	= document.getElementById('spotter-confirmation-message-ok');
					
					__factory.ok.addEventListener('click', afterClose);
	
					spotter.verticallyCenter(document.getElementById('spotter-confirmation-message'));
				})
				.loadTemplate();
			
			var __recycle = function(){
				__factory.ok.removeEventListener('click',__factory.onAccept,false);
				
				__factory.closeFuncs = [];
				
				return spotter.confirmationMessage;
			};
			
			__recycle.setTitle = function(str){
				__factory.title.innerHTML = str.toString();
				return spotter.confirmationMessage;
			};
				
			__recycle.setMessage = function(str){
				__factory.msg.innerHTML = str.toString();
				return spotter.confirmationMessage;
			};
			
			__recycle.afterClose = function(func){
				__factory.closeFuncs.push(func);
				return spotter.confirmationMessage;
			};
	
			__recycle.activate = function(){
				__factory.popMenu.activate();
				return spotter.confirmationMessage;
			};
				
			__recycle.deActivate = function(){
				console.log('confirmation message deactivate');
				__factory.popMenu.shade.closeButton.click();
				return spotter.confirmationMessage;
			};
	
			return __recycle;
		};
		
		spotter.createWorker = function(str){
			// URL.createObjectURL
			window.URL = window.URL || window.webkitURL;
			
			// "Server response", used in all examples
			var response = str,blob;
			//var response = "self.onmessage=function(e){setInterval(function(){postMessage('Worker: '+e.data);self.close();},1000);};";
			try {
				blob = new Blob([response], {type: 'application/javascript'});
			}
			catch(e){ // Backwards-compatibility
				window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
				blob = new BlobBuilder();
				blob.append(response);
				blob = blob.getBlob();
			}
			return new Worker(URL.createObjectURL(blob));
		};
		
		spotter.scrollBarWidth = (function() {
			var __self = {calculatedValue:-1,onReady:[],isReady:false};
			__self.runOnReady = function(){
				if(__self.calculatedValue !== -1){
					__self.onReady.forEach(function(func){	
						func(__self.calculatedValue);
					});
					__self.onReady = [];
				}
			};
			var __init = {	
				calc: function(){
					if(document.body){
						var outer = document.createElement("div");
						outer.style.visibility = "hidden";
						outer.style.width = "100px";
						outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
						
						spotter.appendToBody(outer);
					
						var widthNoScroll = outer.offsetWidth;
						// force scrollbars
						outer.style.overflow = "scroll";
					
						// add innerdiv
						var inner = document.createElement("div");
						inner.style.width = "100%";
						outer.appendChild(inner);        
					
						var widthWithScroll = inner.offsetWidth;
					
						// remove divs
						outer.parentNode.removeChild(outer);
					
						__self.calculatedValue = (widthNoScroll - widthWithScroll);
						__self.isReady = true;
						__self.runOnReady();
					}
					else{ console.log('spotter.scrollBarWidth document.body is not ready'); }
				},
				get: function(){ 
					if(__self.calculatedValue === -1){ 
						__init.calc(); 
						if(__self.calculatedValue === -1) console.log('getScrollBarWidth is not functioning. Make sure page has loaded before calling');
					}
					return __self.calculatedValue;
				} ,
				onReady: function(func){
					if(typeof func === 'function') {
						if(__self.isReady === true){ func(__self.calculatedValue); }
						else{ __self.onReady.push(func); }
					}
				}
			}
			spotter.testLoaded(function(){ spotter.scrollBarWidth.calc(); });
			return __init;
		}());
		
		//FROM MODERNIZER
		spotter.transitionEndEventName = (function() {
			var i,
				undefined,
				el = document.createElement('div'),
				transitions = {
					'transition':'transitionend',
					'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
					'MozTransition':'transitionend',
					'WebkitTransition':'webkitTransitionEnd'
				};
		
			for (i in transitions) {
				if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
					return transitions[i];
				}
			}
		
			//TODO: throw 'TransitionEnd event is not supported in this browser'; 
		}());
		
		spotter.data = (function(){
			var __public = {variables:{}};
			var __private = {
				createDOMElementObserver:(function(){
					var __self = {
						members: [], //members[i] => evts[i]
						evts: [] //array-of-arrays holding the events that trigger when prop is set
					};
					__self.observer = function(val,obj,prop,eventType){
						var linkVar = val;
						var memId = __self.members.indexOf(obj) || __self.members.push(obj) - 1;
						__self.evts[memId] = __self.evts[memId] || [];
						__self.evts[memId].push(eventType);
						var l = __self.evts[memId].length;
						Object.defineProperty(obj,prop,{
							get: function(){return linkVar;},
							set: function(newValue){
								var i = l;
								linkVar = newValue;
								while(--i > -1) this.eventTriggers[__self.evts[memId][i]](undefined, {value:newValue});//activates each event registered via setEventTrigger 'obj'
							},
							configurable:true,
							enumerable:true
						});
					};
					
					//setting object[prop] will trigger event (eventType)
					return function(obj,prop,eventType){	
						spotter.events.setEventTrigger(obj,eventType);
						__self.observer(obj[prop], obj, prop, eventType);
					};
				}())
			};
			
			//element (el) and attribute name (attr) to bind like element.getAttribute(attribute) <=> object[attribute]
			__public.bindAttributeOnCustomElement = function(el, attr){
				Object.defineProperty(el,attr,{
					get: function(){return el.getAttribute(attr);},
					set: function(newValue){
						el.setAttribute(attr,newValue);
					},
					configurable:true,
					enumerable:true
				});
			};	
			
			//setting object[prop] will trigger event (eventType)
			__public.triggerEventOnPropertySetter = function(obj,prop,eventType){
				__private.createDOMElementObserver(obj,prop,eventType);
			};
			
			__public.createBoundVariables = function(arrNames,arrValues){
				//variable bindings CANNOT be created from static single dimensional variables because the parent is unknown.
				//Use this function to create variables by name by sending in a var name or array of var names and their initial values
				//Returns an array with references to the created variables. Some might be false if the variable already existed.
				var returnSingle = false;
				if(typeof arrNames === 'string'){ arrNames = arrNames.split(','); returnSingle = true; }
				if(typeof arrValues === 'string'){ arrValues = arrValues.split(','); }
				var l = arrNames.length;
				while(--l > -1){
					if(typeof __public.variables[arrNames[l]] === 'undefined'){ 
						__public.variables[arrNames[1]] = arrValues[l];
						arrNames[l] = __public.variables[arrNames[1]];
					}
					else{ arrNames[l] = false; }
				}
				return (returnSingle === true ? arrNames[0] : arrNames);
			};
			
			//when input value is changed the element is changed - only handling 'text' and 'textarea' inputs for now.
			//'filter' is optional and receives the value of the input
			//if the filter returns 'ignore' then nothing will change.
			__public.bindElementToInput = (function(){
				var previous = [];
				var inputTypes = ['text','email','tel','search','number','date','month','password'];
				
				return function(el,input,filter){
					if(!el || !input) console.warn('element and input must both be valid to bind input to element \n', new Error().stack);
					filter = filter || function(content){return content;};
					var func
						,input_prime={value:''};
					
					if(~inputTypes.indexOf(input.type) || input.tagName === 'textarea'){//changing the value binding will stop user interaction working so this creates a clone that the user interacts with
						input_prime = input.cloneNode();
						input_prime.id = null;
						input_prime.name = null;
						input.style.display = 'none';
						input.parentNode.insertBefore(input_prime, input);
						input_prime.linkedInput = input;
						input_prime.handleEvent = function(evt){
							this.linkedInput.value = this.value;
						};
						input_prime.addEventListener('change', this);
					}
					
					if(!~previous.indexOf(input)) {//avoid changing observer and ruining another one
						__private.createDOMElementObserver(input,'value','change');
						previous.push(input);
					}
					
					if((el.tagName == 'input' && el.type == 'text') || el.tagName == 'textarea'){
						func = function(){
							input_prime.value = this.value;
							var val = filter(this.value); 
							if(val !== 'ignore'){ el.value = val; }
						};
					}
					else if(el.tagName == 'IMG'){
						func = function(){
							input_prime.value = this.value;
							var val = filter(this.value);
							if(val !== 'ignore'){ el.src = val; }
						};
					}
					else{
						func = function(){
							input_prime.value = this.value;
							var val = filter(this.value);
							//setTimeout(1);
							//console.log('testing value observer');
							if(val !== 'ignore'){ spotter.setFirstTextNode(el,val); }
						}; /*console.log('filter result: '+filter(this.value));*/
					}
					input.addEventListener('change',func,false);
				};
			}());
			
			__public.bindElementToElement = (function(){
				var previous = [];
				return function(targEl,sourceEl,attribute,filter){
					filter = filter || function(content){return content;};
					var func;
					if(previous.indexOf(sourceEl) === -1) {
						__private.createDOMElementObserver(sourceEl,attribute,'change');
						previous.push(sourceEl);
					}
					if((targEl.tagName == 'input' && targEl.type == 'text') || targEl.tagName == 'textarea'){
						func = function(){targEl[attribute] = filter(this[attribute]);};
					}
					else{
						func = function(){ spotter.getFirstTextNode(targEl).nodeValue = filter(this[attribute]); };
					}
					sourceEl.addEventListener('change',func,false);
				};
			}());
			
			//send an unlimited number of arguments in the order of obj1,prop1...objN,propN...where obj1[prop1] will be bound to obj2[prop2] bound to obj3[prop3] and so on
			__public.twowayBind = function(/*obj1,prop1...objN,propN*/){
				var value = undefined, args = arguments, obj, prop, l = args.length + 2;
				while((l-=2) > 0){
					obj  = args[l-2];
					prop = args[l-1];
					if(!!obj[prop]){value = obj[prop];}
					Object.defineProperty(obj, prop, {
						get: function(){return value;},
						set: function(newValue){value = newValue;}
					});
				}
				
				args = undefined;
			};
			
			__private.setValue = (function(){
				var inputTypes = ['text','email','tel','search','number','date','month','password','hidden'];
				return function(el,val){
					if((el.tagName.toLowerCase() === 'input' && inputTypes.indexOf(el.type) > -1) || el.tagName == 'textarea'){
						el.value = val;
					}
					else{
						spotter.getFirstTextNode(el).nodeValue = val;
					}
				};
			}());
			
			/*
			__public.formToData= function(frm){
				spotter.requiredParam(frm).element().result()();
				
				var formData	= new FormData(),
				l 				= frm.elements.length,
				input,//storage
				checkboxes={};//storage
				
				while(--l > -1){
					input= frm.elements[l];
					if(!input.name) continue; //skip nameless inputs as is standard
					if(input.type !== 'file'){
						if(input.type === 'checkbox'){
							checkboxes[input.name]= checkboxes[input.name]||[];
							if(input.checked === true) checkboxes[input.name].push(input.value);
						}
						else if(input.type !== 'submit'){
							formData.append(input.name,input.value.toString());
						}
					}
					else{
						if(input.value.length){
							if(!input.getAttribute('data-file-target')){ console.log('a file target was not found for file input '+input.name); return false; }
							if(!(targ = document.getElementById(input.getAttribute('data-file-target')))){ console.log('a file target was not found for target id '+input.getAttribute('data-file-target')); return false; }
							formData.append(input.name,targ.toDataURL('image/jpeg'));
						}
					}
				}
				
				for(var prop in checkboxes){
					if(checkboxes.hasOwnProperty(prop)) formData.append(prop,checkboxes[prop].join(','));
				}
				
				if(typeof data !== 'undefined'){
					for(var prop in data){
						formData.append(prop,data[prop]);
					}
				}
				
				return formData;
			};
			*/
			return __public;
		}());
		/*
		date - format date objects with $[var] convention. d - numeric day, m|M - numeric month (M is word), y|Y as year (Y is 4 digit)
		formatUnix(integer as unix_time,str as format) - changes a unix timestamp into a formatted date
		formatDate(date object,str as format) - changes a date into a formatted date
		*/
		spotter.date = (function(){
			var __public = {};
			__private.today = new Date();
			
			__private.format = function(a,f){
				//format in string form with $[d] as day, $[m|M] as month (M is word), $[y|Y] as year (Y is 4 digit)
				var d = a.getDate();
				var D = ("0" + d).slice(-2);
				  
				var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
				var m = a.getMonth();
				var M = months[m];
				m = ("0" + (Number(m)+1)).slice(-2);
				
				var Y = a.getFullYear();
				var y = Y.toString().slice(-2);
				
				var hour = a.getHours();
				var min = a.getMinutes();
				var sec = a.getSeconds();
				
				time = f.replace('$[d]', d);
				time = time.replace('$[D]', D);
				time = time.replace('$[m]', m);
				time = time.replace('$[M]', m);
				time = time.replace('$[Y]', Y);
				time = time.replace('$[y]', y);
				return time;
			};
			
			__public.formatUnix = function(UNIX_timestamp,format){
				//format in string form with $[d] as day, $[m|M] as month (M is word), $[y|Y] as year (Y is 4 digit)
				var a = new Date(UNIX_timestamp * 1000);
				return __private.format(a,format); 
			};
			
			__public.formatDate = function(date,format){
				if(Object.prototype.toString.call(date) !== '[object Date]'){
					if(date === 'today'){ date = __private.today; }
					else{ date = new Date(date); }
				}
				return __private.format(date,format);
			};
			
			return __public;
		}());
	
		spotter.primes = {
			values: [2,3,5,7,11,13,17,19,23,31,37,43,53,59,61,67,71,73,79,83,89,95,101,103,107,109],
			alphaPositionReference: {a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18,t:19,u:20,v:21,w:22,x:23,y:24,z:25},
			alphaPrimeReference: {a:2,b:3,c:5,d:7,e:11,f:13,g:17,h:19,i:23,j:31,k:37,l:43,m:53,n:59,o:61,p:67,q:71,r:73,s:79,t:83,u:89,v:95,w:101,x:103,y:107,z:109}
		};
		
		//obj argument -> { required: array[must-have properties], types: obj{propName: array[allowed types]}, values: obj{propName: array[allowed values]}, default: obj{propName:value} }
		spotter.parameterize = function(obj, arg){
			/*
			var failed= [[],[]], prop; //failed[[props]->[errors]]
			obj.default= obj.default || {};
			obj.types= obj.types || {};
			obj.values= obj.values || {};
			
			//required
			if(obj.required) obj.required.forEach(function(prop){
				if(!arg.hasOwnProperty(prop)) failed[0][failed[1].push('required')-1]= prop;
			});
			
			//types
			if(obj.types) for(prop in obj.types){ 
				if(typeof arg[prop] !== 'undefined'){
					var arrOfTypes= obj.types[prop];
					if(arrOfTypes.indexOf(typeof arg[prop]) === -1){
						var result= false, types= obj.types[prop], l= types.length;
						while(--l > -1){
							if(types[l] in spotter.isType){
								if(spotter.isType[types[l]](arg[prop])){ result= true; break; }
							}
						}
						if(result === false) failed[0][failed[1].push('must be of one type '+arrOfTypes.join(','))-1]= prop;
					}
				}
			}
			
			//values allowed
			if(obj.values) for(prop in obj.values){ 
				if(typeof arg[prop] !== 'undefined'){
					var arrOfValues= obj.values[prop];
					if(arrOfValues.indexOf(typeof arg[prop]) === -1) failed[0][failed[1].push('value ('+arg[prop]+') must be one of '+arrOfValues.join(','))-1]= prop;
				}
			}
			
			if(failed[0].length > 0){
				return { 
					result:false, 
					errorFunc:(function(failed){ 
						return function(){ 
							failed[0].forEach(function(prop, i){
								console.log('- property: ',prop,' - msg: ',failed[1][i]);
							}); 
						}; 
					}(failed))
				};
			}
			
			//defaults
			if(obj.defaults) for(prop in obj.defaults){
				arg[prop]= arg[prop] || obj.defaults[prop];
			}
			
			return true;
			*/
		};
	
		//**FORM HELPERS**
		//return a formData object - useful when file inputs are used
		spotter.getFormData = function(frm){
			spotter.requiredParam(frm).element('FORM').result()(true);
			var formData	= new FormData(frm)
				, files		= frm.querySelectorAll('input[type="file"]') || []
				, l			= files.length
				, input
				, targ
				, mimeType
				, quality;
	
			while(--l > -1){
				input = files[l];
				targ = input.fileTarget;
				if(typeof targ === 'undefined' || input.value === null || input.value.length === 0) continue;
				else if(targ.tagName !== "CANVAS"){ console.warn('file target for a file input must be a canvas', targ, input, frm); return false; }
				mimeType = targ.getAttribute('mimeType') || 'image/jpeg';
				quality = targ.getAttribute('quality') || 1;
				if(quality > 1) quality /= 100;
				var blob = canvasToBlob(targ, mimeType, quality);
				formData.append(input.name, blob);
				/*
				targ.toBlob(function(blob){
					console.log(blob);
					formData.append(input.name+'X', blob, input.name+'.file');
					formData.delete(input.name);
				}, mimeType, quality);
				*/
			}
			formData.processData = false;
			formData.contentType = false;
			return formData;
		};
		
		/*
		spotter.logFormData = function(formData){
			if(!formData.entries){ console.warn('logFormData failure. formData (',formData,') is not a formdata object'); return false; }
			for (var [key, value] of formData.entries()){ 
				console.log(key, value);
			}
		}
		*/
		
		//returns a key/value object representing the form values (ignores file inputs)
		spotter.getFormObj = function(frm){
			spotter.requiredParam(frm).element('FORM').result()(true);
			var els = frm.elements, l = els.length, data = {}, el, type, tagName, name, o, arr, opt;
			while(--l > -1){
				el = frm.elements[l], type = (el.hasAttribute('type') ? el.getAttribute('type') : el.type), tagName = el.tagName.toUpperCase();
				if(!el.disabled && ((name = el.getAttribute('name')) || (name = el.name))){
					if(tagName === 'SELECT'){
						if(type === 'select-multiple'){
							o = el.options.length, arr = [];
							while(--o > -1){
								opt = el.options[o];
								if(opt.selected) v.push(opt.value);
							}
							data[name] = arr;
						}
						else{
							data[name] = el.value; 
						}
					}
					else if(tagName === 'TEXTAREA'){ data[name] = el.value; }
					else if(tagName === 'INPUT'){ 
						if((type.toLowerCase() === 'radio' || type.toLowerCase() === 'checkbox')){ 
							if(el.checked) data[name] = data[name] || []; data[name].push(el.value);
						}
						else if(type.toLowerCase() !== 'file'){ data[name] = el.value; }
					}
				}
			}
			return data;
		};
		
		//returns a query string for a form object or a form
		spotter.serialize = function(frmOrObj, encode){
			var str='', value, prop;
			if(frmOrObj.tagName && frmOrObj.tagName === "FORM"){
				frmOrObj = spotter.getFormObj(frmOrObj);
			}
			if(typeof frmOrObj === "object"){
				for(prop in frmOrObj){
					value = frmOrObj[prop];
					if(value !== undefined && value !== ''){
						if(Array.isArray(value)){
							value.forEach(function(value){	
								str += '&' + (encode ? encodeURIComponent(prop) : prop) + '[]=' + (encode ? encodeURIComponent(value) : value);
							});
						}
						str += '&' + (encode ? encodeURIComponent(prop) : prop) + '=' + (encode ? encodeURIComponent(value) : value);
					}
				}
			}
			return str;
		};
		
		spotter.deSerialize = function(queryString, unencode){
			if(queryString[0] === '?' || queryString[0] === '&'){ queryString = queryString.slice(1); }
	
			var data = {}, split = queryString.split('&'), x = 0, l = split.length, parts, field, value;
			for(x;x<l;x++){
				parts = split[x].split('=');
				field = (unencode === true ? decodeURIComponent(parts[0]) : parts[0]);
				value = (unencode === true ? decodeURIComponent(parts[1]) : parts[1]);
				if(typeof data[field] !== 'undefined'){
					if(!Array.isArray(data[field])){ data[field] = [data[field],value]; }
					else{ data[field].push(value); }
				}
				else{
					data[field] = value;
				}
			}
			return data;
		};
	
		spotter.storeForm = function(frm, customName){
			console.debug('** STORE FORM **');
			var data = spotter.getFormObj(frm), storageId = frm.storageId;
			console.debug(data);
			
			if(typeof storageId !== 'string'){
				storageId = 'F'+(customName || frm.name || frm.id)+'P'+spotter.URL.currentPage();
				frm.storageId = storageId;
			}
			
			localStorage.setObject(storageId, data);//signify the form has been stored
		};
		/*
		spotter.restoreForm = function(frm, customName){
			console.log('event change 4');
			spotter.requiredParam(frm).element('FORM').result()(true);
			var storageId = frm.storageId, data;
			
			if(!storageId){
				storageId = 'F'+(customName || frm.name || frm.id)+'P'+spotter.URL.currentPage();
			}
			if(!(data = localStorage.getObject(storageId))){ console.debug('no data found for frm',frm); return false; }
			
			setForm(frm, data);
			frm.lastRestore = data;
		};
		
		spotter.setForm = function(frm, data){
			console.log('event change 5');
			var l=frm.elements.length, value, targ, type, o;
			while(--l > -1){
				targ = frm.elements[l];
				if(!(value = data[targ.name])) continue;
				type = targ.type.toLowerCase();
				switch(targ.tagName.toUpperCase()){
					case 'TEXTAREA':
						targ.value = value;
						break;
					case 'SELECT':
						if(!Array.isArray(value)) value = [value]; 
						o = targ.options.length;
						while(--o > -1 && value.length){
							opt = targ.options[o];
							if(~(i = value.indexOf(opt.value))){ opt.selected = true; value.splice(i,1); }
							else{ opt.selected = false; }
						}
						break;					
					case 'INPUT':
						if((type === 'radio' || type === 'checkbox')){ 
							if(~value.indexOf(targ.value)){ targ.checked = true; }
							else{ targ.checked = false; }
						}
						else if(type !== 'file'){ targ.value = value; }
						break;
					default:
						console.warn('an element showed up in form elements that is unnaccounted for',targ);
				}
			}
		};
		*/
	}());

	
// *** INITIALIZE ENTANGLED FUNCTIONS (METHODS REQUIRING USE OF MULTIPLE SPOTTER METHODS IN ENTANGLED ORDER)
	spotter.imports = spotter.imports();
	
	spotter.testLoaded(function(){		
		spotter.sharedShade = new spotter.shade('shared');
		
		spotter.confirmation = spotter.confirmation();
		spotter.confirmationMessage = spotter.confirmationMessage();
		
		var developerMachineViewPortWidth = 1280;
		//set font-size for other machines:
		var multiplyBy = spotter.getWidth(document.body) / 1280;
		var fontDiv = document.createElement('DIV');
		spotter.appendToBody(fontDiv);
		fontDiv.style.width = '1rem';
		
		// inline editable style - use spotter.css.addRule((string)rule)
		document.createElement('STYLE');
		spotter.css = (function(){
			var __private	= {};
			var __public	= {};
			
			__private.createStyleSheet = function(){
				__private.styleSheet = document.createElement('STYLE');
				__private.styleSheet.type = 'text/css';
				spotter.testLoaded(function(){	
					var head = document.head || document.getElementsByTagName('head')[0]
					head.appendChild(__private.styleSheet);
				});
			};
			
			__public.addRule = function(rule){
				if(typeof __private.styleSheet === 'undefined') __private.createStyleSheet();
				if (__private.styleSheet.styleSheet){
					__public.addRule = function(rule){	
						__private.styleSheet.styleSheet.cssText += rule;
					};
				} else {
					__public.addRule = function(rule){
						__private.styleSheet.appendChild(document.createTextNode(rule));
					};
				}
				__public.addRule(rule);
			};
			
			return __public;
		}());
		
		// hide scrollbars css
		spotter.scrollBarWidth.onReady(function(get){
			spotter.css.addRule('.vertical { overflow-x: hidden; }');
			spotter.css.addRule('.vertical .spotter-hide-scroll { width: calc(100% + '+get+'px) !important; overflow-y:scroll; overflow-x: hidden; }');
			spotter.css.addRule('.horizontal .spotter-hide-scroll { overflow:scroll; height:calc(100% + '+get+'px); }');
			spotter.css.addRule('.shade.horizontal .content{ width:calc(100% + '+get+'px); }');
		});
		
		// when leaving page save memory objects
		spotter.onPageOut(function(){
			localStorage.setObject('registry', localStorage.registry);
			sessionStorage.setObject('registry', sessionStorage.registry);
		});
	});
	
// ************** REQUIRE MODULE *******************
//All modules including the main module must be loaded to the window.spotter object. Modules is observed. When a module is created on window.spotter an event is triggered
//that will check all the modules currently registered for the readiness of their dependencies, and if the dependencies are all ready, the module will then be readied. 
//Modules should be included with spotter.require(moduleName) or by using the 'data-modules=[list of modules]' attribute on the main spotter script element. 

	//Modules can be checked for readiness with spotter.require.isReady(moduleName). Once a module is readied, fire all the functions added to that module ready state through testLoaded.
	window.spotter.onModuleReady={
		eventName:'', 
		functions:{}
	};
	
	window.spotter.require = (function(){
		//add attribute 'data-dependents=[list]' to the spotter script tag for spotter.js in order to load those modules immediately. Otherwise call this afterwards with 
		//...require([*path]) Modules will not be reloaded if they were previously loaded - *path is the path within the spotter directory and should not have the file extension
		//Monitors spotter class for the addition of modules to determine readiness.
		var evtName = spotter.events('moduleCreated');//event triggered when a module is created by setter observer on window.spotter
		var __private = {
			name:'spotter.js',
			registered:[],//modules registered but not necessarily loaded
			dependencies: [],
			isReadyFuncs: [], //dependentParents[i]=>registered[i] - the parent to look for existence of module - if null the script is just assumed to have been created
			ready:[],//completed modules
			testModuleReady: function(){//triggered by evtName using observer for a property being set on spotter by module name OR by calling 'spotter.require.scriptComplete(moduleName, parent)'
				var registered = __private.registered
					,l = registered.length - 1
					,moduleName
					,dependencies
					,i;

				modules:
					while(l > -1 && registered.length){//run through registered modules
						var moduleName = registered[l]
							,dependencies = __private.dependencies[l]
							,testReadyFunc = __private.isReadyFuncs[l];
	
						if(!moduleName){ --l; continue modules; }
						//console.info('--- \n', 'testModuleReady', '---- Trying to ready '+moduleName+' \n', 'testFunc: ', testReadyFunc.toString());
						if(testReadyFunc() === false){ --l; continue modules; }
						if(dependencies && (i = dependencies.length)){//test if dependencies are ready
							while(--i > -1){
								//console.log(' - checking if '+dependencies[i]+' is ready\n');
								if(__private.ready.indexOf(dependencies[i]) === -1){
									//console.info(' - - dependency ('+dependencies[i]+') is not ready');
									--l;
									continue modules;//if dependency not ready, 
								}
							}
						}
						__private.ready.push(moduleName);
						registered.splice(l, 1, null);
						__private.dependencies.splice(l, 1, null);
						//console.log('--- \n', 'testModuleReady: module name '+moduleName, ' \n', ' registered: ',registered);
						window.spotter.onModuleReady.functions[moduleName].forEach(function(func){func();});
						//console.log('--- \n', 'testModuleReady: module ('+moduleName.toUpperCase()+') is ready');
					}
				//end modules
			}
		};
		
		//require a js file - set its dependencies - use 'spotter.require.scriptComplete' at the end of other scripts to register them and trigger their dependent functions
		//module: (string) name of module - pathToJSFile: (string) not used for spotter modules - dependencies: (array) modules that must be loaded first - readyTestFunc: (function)(optional) returns false to fail ready check
		var __self = function(module, pathToJSFile, dependencies, readyTestFunc){
			module = module.toLowerCase();
			dependencies = dependencies || [];
			//console.log('--- \n', 'spotter.require(',module,')');
			var isSpotterModule = false
				,getStyleSheets = [];
	
			switch(module){
				case 'template':
					readyTestFunc = function(){ return(typeof window.spotter['template'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Template.js';
					isSpotterModule = true;
					break;
				case 'datamanager':
					readyTestFunc = function(){ return(typeof window.spotter['DataManager'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'DataManager.js';
					isSpotterModule = true;
					break;
				case 'mobile':
					readyTestFunc = function(){ return(typeof window.spotter['mobile'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Mobile.js';
					isSpotterModule = true;
					break;
				case 'image':
					dependencies[0] = 'exif';
					readyTestFunc = function(){ return(typeof window.spotter['image'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Image.js';
					isSpotterModule = true;
					break;
				case 'fader':
					readyTestFunc = function(){ return(typeof window.spotter['fader'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Fader.js';
					isSpotterModule = true;
					break;
				case 'error':
					readyTestFunc = function(){ return(typeof window.spotter['error'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Error.js';
					isSpotterModule = true;
					break;
				case 'components':
					dependencies[0] = 'datamanager';
					readyTestFunc = function(){ return(typeof window.spotter['components'] !== 'undefined'); };
					pathToJSFile = __self.homeURL + 'Components.js';
					//getStyleSheets[0] = __self.homeURL + "/css/components.css";
					isSpotterModule = true;
					break;
				case 'form':
					pathToJSFile = __self.homeURL + 'Form.js';
					readyTestFunc = function(){ return(typeof window.spotter['form'] !== 'undefined'); };
					isSpotterModule = true;
					break;
			}
			
			if(isSpotterModule === true){
				spotter.observeSetter(window.spotter, module, evtName);
			}
			else if(typeof pathToJSFile !== "string"){ 
				console.warn('for non-spotter require ('+module+') you must specify the download path');
				return false; 
			}	
			
			if(!__self.register(module, dependencies, readyTestFunc)){ 
				console.warn('script/module '+module+' already registered');
				return null;
			}
			
			spotter.addScriptToHead(pathToJSFile);
			getStyleSheets.forEach(function(path){
				spotter.addCSSToHead(path);
			});
	
			return true;
		};
	
		var thisScript;
		if(document.currentScript && document.currentScript.src){
			thisScript = document.currentScript;
		}
		else{
			thisScript = document.querySelector('script[src*="'+ __private.name + '"]');
		}
		__self.getThisScript = function(){return thisScript;};
		
		//homeURL is the path to spotter.js
		__self.homeURL = (function(){ 
			var homeURL;
			if(document.currentScript && document.currentScript.src){
				homeURL = thisScript.src;
				homeURL = homeURL.slice(0, homeURL.indexOf(__private.name));
			}
			else{
				var src = thisScript.getAttribute('src');
				var homeURL = window.location.href.split('/');
					homeURL = homeURL[0] + '//' + homeURL[2] + src.slice(0, src.indexOf(__private.name));
				}
			return homeURL
		}());
		
		//spotter.require() will add the module as a script to head - this does not - call this directly if NOT adding the script at a different point
		__self.register = function(module, dependencies, readyFunc){
			//console.log('---', ' \n', 'spotter.require.register(',module,', ',dependencies,', ',readyFunc,')', ' \n', 'registered:', __private.registered);
			dependencies = dependencies || [];
			var l = dependencies.length, i, functions = window.spotter.onModuleReady.functions;
			if(!~__private.registered.indexOf(module)){
				i = __private.registered.push(module) - 1;
				__private.dependencies[i] = dependencies;
				__private.isReadyFuncs[i] = readyFunc || function(){};
				functions[module] = functions[module] || [];
				console.log("module or script '"+module+"' registered");
				return true;
			}
			else{
				return false;
			}
		};
		
		__self.isReady = function(moduleName){
			return !!~__private.ready.indexOf(moduleName.toLowerCase());
		};
		
		//register this module and main
		spotter.observeSetter(window.spotter, 'require', evtName);
		__self.register('require');
		
		//the moduleReady event - testModuleReady tries to ready all registered modules everytime it is called
		document.addEventListener(evtName, __private.testModuleReady, false);
		
		//use this method to have a third party module set itself as ready
		__self.scriptComplete = function(name){
			console.log('module ('+name+') complete');
			__private.testModuleReady();
		};
	
		return __self;	
	}());
		
	//load modules from the spotter script tag using 'data-modules' attribute
		var onLoadModules = spotter.require.getThisScript().getAttribute('data-modules');
		if(onLoadModules){ 
			onLoadModules = onLoadModules.split(',');
			onLoadModules.forEach(function(moduleName){
				if(!spotter.require(moduleName)){
					spotter.log('error', {func:'onLoadModules', msg:'the module was not recognized', vars:{module:moduleName, stack:new Error().stack}});
				} 
			}); 
		}
	
	document.write('<link rel="stylesheet" href="' + spotter.require.homeURL +  'css/main.css' + '"/>');
	document.write('<link rel="stylesheet" href="' + spotter.require.homeURL +  'css/animate/animate.min.css' + '"/>');

// *** READY EVENTS
spotter.isReady = true;
spotter.events('spotterReady');
spotter.events.fire('spotterReady');

//*** STYLES FOR BROWSER CONSOLE
window.consoleStyles = [];
window.consoleStyles.components = [
    , 'border-top: 1px solid #3E0E02'
    , 'color: white'
    , 'display: block'
    , 'font-weight: bold'
].join(';');