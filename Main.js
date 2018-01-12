//this module loads the library and must be included first.
/*
var old = alert;

alert = function() {
  console.log(new Error().stack);
  old.apply(window, arguments);
};
*/
window.onloadFunctions	= [];

// *** PROTOYPES AND GLOBAL FUNCTIONS
(function(){
	//PROTOTYPAL ************************
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
	
	if(!Array.prototype.merge){//merge arrays
		Array.prototype.merge=function(){
			for(var x=0,l=arguments.length; x<l; x++){
				Array.prototype.push.apply(this,arguments[x]);
			}
			return this;
		}
	}
	
	if(!Array.prototype.mergeAll){//an array of arrays
		Array.prototype.mergeAll=function(){
			while(typeof this[1] !== 'undefined'){
				Array.prototype.push.apply(this[0],this[1]);
				this.splice(1,1);
			}
			Array.prototype.push.apply(this,this[0]);
			this.shift();
			return this;
		}
	}
	
	if(!Array.prototype.unique){
		Array.prototype.unique = (function(){
			var F = function(v, i, ar){
				return ar.indexOf(v) === i;
			};
			return function(){ return this.filter(F); }
		}());
	}
	
	
	Math.toPercent=function(p,n){//DECIMAL TO PERCENT W/ % SIGN
		return (Number(p)*100.0)+'%';
	}
	
	Math.fromPercent=function(p){//PERCENT TO DECIMAL(WITH OR WITHOUT % SIGN)
		return parseFloat(p)/100.0;
	}
	
	Number.prototype.toPrecision=function(){
		var t=String(this).match(/^\d*\.{0,1}\d{0,2}/);
		return Number(t);
	}
	
	window.offSetY=(function(){
		if(window.pageYOffset){var func=function(){return window.pageYOffset;};}
		else{
			var func=(function(t){
				var func;
				if(t.ScrollTop=='number'){
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
			value = String(value);
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
			value = String(value);
			if(!this.length || this === value){ return ""; }
			
			if(typeof delim ==='undefined'){ delim = ','; }
			var arr = this.split(delim);
			
			if((i = arr.indexOf(value)) === -1) return this;
			return arr.removeValues(value).join(delim);
		};
	}
	
	if(!String.prototype.addListValue){
		String.prototype.addListValue=function(value,delim){
			value = String(value);
			if(this.length === 0 || this === value){ return value; }
			
			if(typeof delim === 'undefined'){ delim = ','; }
			var arr = this.split(delim);
			
			if(arr.indexOf(value) !== -1) return this;
			arr.push(value);
			return arr.join(delim);
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
}());

//SPOTTER MAIN ************************
var spotter = {};

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
	
	// *** GENERAL USE METHODS ***
	spotter.makeId = (function(){
		//returns an unused random string 
		var self=[];
		return function(n){
			var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			do{	
				for( var i=0; i < n; i++ )	text += possible.charAt(Math.floor(Math.random() * possible.length));
			}while(self.indexOf(text)!==-1);
			self.push(text);
			return text;
		};
	}());
	
	spotter.events = (function(){
	//core.events(eventName) creates event by name. If event name already registered, will generate unique event name. Returns event name. 
	//Trigger event w/ core.events.fireEvent(eventName). Append object data to event with core.events.appendTo(obj, eventName), access with event.content = obj
		var __private={},
			__constructor=function(evtName){
				if(evtName in __private){evtName=evtName+spotter.makeId(5);}
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
			if(typeof __private[evtName] === 'undefined') console.log('The event '+evtName+' sent to core.events.fire is not a registered event');
			document.dispatchEvent(__private[evtName]);
		}
		
		//used to create an event using 'el' as the event initiator instead of document.
		//arguments(el to add eventTrigger, type: the event name)
		//call the event with el.eventTriggers[name]()
		//sending an existing trigger type (ie change,mouseover etc) will cause the existing trigger type to be triggerable (useful for change events for hidden inputs & similar cases)
		__constructor.setEventTrigger = (function(){
			if (document.createEvent && document.dispatchEvent) {
				return function(el,type){
					el.eventTriggers = el.eventTriggers || {};
					if(typeof el.eventTriggers[type] !== 'undefined') return false;
					var evt = document.createEvent("HTMLEvents");
					var subtype = (type.substring(0,2) === 'on' ? type.substring(2) : type);
					evt.initEvent(subtype, true, true);
					el.eventTriggers[type] = (function(el,evt){ return function(){ el.dispatchEvent(evt); }; }(el,evt));// for DOM-compliant browsers
				};
			} else if (document.fireEvent) {
				return function(el,type){
					type = (type.substring(0,2) !== 'on' ? 'on'+type : type);
					el.eventTriggers[type] = (function(el){ return function(){ el.fireEvent(type); }; }(el)); // for IE
				};
			}
			else{
				console.log("bweh that taint gonna werk");
			}
			return el;
		}());
			
		return __constructor;
	}());
	
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
	
	spotter.addScriptToHead = function(path, onload){
		//console.log('path',path);
		var script = document.createElement('script');
		script.src = path;
		if(typeof onload === 'function') script.onload = onload;
		document.getElementsByTagName('HEAD')[0].appendChild(script);
	};
	
	spotter.testLoaded =  function(func,typeOrModuleName){
		if(typeof func !== 'function'){ console.log('not a function',func); return; }
		
		var status, isModule;
		
		if(typeOrModuleName === 'document'){
			status = 'interactive,DOMContentLoaded,complete';
			isModule = false;
		}
		else if(typeof typeOrModuleName === 'undefined' || typeOrModuleName === 'window'){
			status = 'complete';
			isModule = false;
		}
		else{
			isModule = true;
		}
		
		if(!isModule){
			if(status.indexOf(document.readyState)!==-1){//IF ALREADY LOADED
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
		}
		else{
			if(spotter.require.isReady(typeOrModuleName)){
				func();
			}
			else{
				var functions = window.spotterModules.onModuleReady.functions;
				functions[status] = functions[status] || [];
				functions[status].push(func);
			}
		}
		
		var userAgents = navigator.userAgent||navigator.vendor||window.opera;
		if(/fennec/i.test(userAgents.substr(0,4))){
			document.cb_addEventListener('resize',window.onloadFunctions[window.onloadFunctions.length]);
		}
		else{
			document.cb_addEventListener('readystatechange',window.onloadFunctions[window.onloadFunctions.length]);
		}
	};

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
		__self.element = function(){ if(result===true || spotter.isType.element(arg)){ result = true; }else{ types.push('HTMLElement'); } return __self; };
		__self.result = function(){
			if(typeof arg === 'undefined') return function(){spotter.consoleError('when using requiredParam, the test argument must be set using spotter.requiredParam(argument)...');};
			if(result === false){
				return function(){spotter.consoleError('required arg must be type:['+types.join(',')+']', arg); return false;}
			}
			else if(result === true){
				return function(){return true;};
			}
			else{
				return function(){spotter.consoleError('result not boolean');};
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
	};
	
	spotter.isNumeric = function(o){
		return !Array.isArray(o) && (o - parseFloat(o) + 1) >= 0;
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
		var t;
		var el = document.createElement('fakeelement');
		var transitions = {
		'transition':'transitionend',
		'OTransition':'oTransitionEnd',
		'MozTransition':'transitionend',
		'WebkitTransition':'webkitTransitionEnd'
		}
	
		for(t in transitions){
			if( el.style[t] !== undefined ){
				return transitions[t];
			}
		}
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
		};
		window.addEventListener('resize',function(){__private.onResize.forEach(function(obj,key){
			obj.func.apply(this,obj.args);
		});},false);
		return __public;
	}());

	spotter.onPageOut =  (function(){
		var executeFuncs:[],
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
		spotter.getFirstTextNode(el).nodeValue = txt;
	};
	
	spotter.prependChild = function(par,child){
		par.insertBefore(child,par.firstChild);
	};

	spotter.insertAfter = function(elder,younger){
		elder.parentNode.insertBefore(younger, elder.nextSibling);
	};

	spotter.deleteElement = function(el){
		el.parentNode.removeChild(el);
	};

	spotter.replaceElement = function(el,replacement){
		var elder=el.parentNode,sibling=el.nextSibling;
		elder.removeChild(el);
		elder.insertBefore(replacement,sibling);
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

	spotter.addEventListener = (function(){
		var func;
		if(document.addEventListener){
			func=function(el,a,b,c){
				el.addEventListener(a,b,c);
			};
		}else{
			func=function(el,a,b,c){
				el.attachEvent('on'+a,b);
			};
		}
		return func;
	}());
	
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
		var arr=[],i;
		for(i=o.length;i--;arr.unshift(o[i]));
		return arr;
	};

	spotter.addElementAsParent = function(el,par) {
		if(typeof el === 'string') { el = document.getElementById(el); }
		
		var cur_par	= el.parentNode;
		var new_el 	= document.createElement(par);
		
		cur_par.replaceChild(new_el,el);
		new_el.appendChild(el);
		
			return new_el ;
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

	spotter.getHeight = function(el,e){//if e (true/false) return array with effective height and padding
		if(el && el.tagName){
			var b = el.getBoundingClientRect(),w;
			if(b){
				w = b.height || b.bottom-b.top;
				if(!w){
					//var p=this.unCloak(el);
					//b=el.getBoundingClientRect();w=b.bottom-b.top;
					//this.reCloak(p);
				}
				if(!w){
					console.log('Failed to get height for=',el,'height=',w); window.failedHeight = window.failedHeight||[]; window.failedHeight.push(el); return 0;
				}else if(e){
					return this.effectiveHeight(el,w);
				}else{
					return w;
				}
			}else{
				w=el.offsetWidth||el.clientWidth||el.scrollWidth;
				//if(!w){var p=this.unCloak(el);w=el.offsetWidth||el.clientWidth||el.scrollWidth;this.reCloak(p);}
				if(!w){console.log('Failed to get height for '+el.tagName+'.'+el.className); return 0;
				}else if(e){return this.effectiveHeight(el,w);
				}else{return w;}
			}
		}else{return 0;}
	};

	spotter.getWidth = function(el,e){//if e return array with effective width and padding
		if(el && el.tagName){
			var b=el.getBoundingClientRect(),w;
			if(b){
				w=b.right-b.left;
				if(!w){
					//var p=this.unCloak(el);
					//b=el.getBoundingClientRect();w=b.right-b.left;
					//this.reCloak(p);
				}
				if(!w){
					console.log('Failed to get width for=',el,'width=',w); window.failedWidth = window.failedWidth||[]; window.failedWidth.push(el); return 0;
				}else if(e){
					return this.effectiveWidth(el,w,b);
				}else{
					return w;
				}
			}else{
				w=el.offsetWidth||el.clientWidth||el.scrollWidth;
				//if(!w){var p=this.unCloak(el);w=el.offsetWidth||el.clientWidth||el.scrollWidth;this.reCloak(p);}
				if(!w){console.log('Failed to get width for '+el.tagName+'.'+el.className); return 0;
				}else if(e){return this.effectiveWidth(el,w);
				}else{return w;}
			}
		}else{return 0;}
	};
		
	spotter.dumpObject = function(o,a){
		for(var prop in o){
			console.log(a+'['+prop+']='+typeof o[prop]);
			if(typeof o[prop]==='object'){
				dumpObject(o[prop],prop);
			}
		}
	};
	
	spotter.findParent = function(c,id,byAttr){//USE BY ATTR TO FIND PARENT BY A PARTICULAR ATTRIBUTE (ex: 'tagName') - c: child, id: parent selector, byAttr: compare this attribute
		var p=c.parentNode,s=id.substr(0,1);
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
			while(p[byAttr]!==id){
				p=p.parentNode;
			}
		}else if(typeof id==="string"){
			while(p.byAttr!==id){
				p=p.parentNode;
			}
		}else{
			console.log(id+" is not a valid argument for find parent");
			return false;
		}
		return p;
	};
	
	// *** TOGGLE HELPERS ***
	spotter.toggle = (function(){		
		var fn=function(el){
			if( el.style.display === "none" ){ el.style.removeProperty('display'); }
			else{ el.style.display = "none"; }
		};
		fn.hide=function(el){
			el.style.display = "none";
		};
		fn.show=function(el){
			if(!el.style.display.length){ el.style.display = 'block'; }
			else{ el.style.removeProperty('display'); }
		};
		//class
			fn.class = (function(){
				var fn=function(el,className){
					if(typeof el === 'object' && el.length){
						var l = el.length;
						while(--l > -1){ el[l].className = el[l].className.toggleListValue(className,' '); }
					}
					else{
						if(el.className.indexOf(className)===-1){el.className+=' '+className;}
					}
				};
				fn.add=function(el,className){
					if(typeof el === 'object' && el.length){
						var l = el.length;
						while(--l > -1){ if(el[l].className.indexOf(className)===-1){el[l].className+=' '+className;} }
					}
					else{
						if(el.className.indexOf(className)===-1){el.className+=' '+className;}
					}
				};
				fn.remove=function(el,className){
					if(typeof el === 'object' && el.length){
						var l = el.length;
						while(--l > -1){ el[l].className=el[l].className.replace(className,'').replace('  ',' ').trim(); }
					}
					else{
						el.className=el.className.replace(className,'').replace('  ',' ').trim();
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
				return jQuery.ajax({
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
			closeFunctions.forEach(function(func){
				func(e);
			});
		}, false);
		spotter.addToCloseFunctions = function(func){
			if(typeof func === 'function'){ if(closeFunctions.indexOf(func) === -1) closeFunctions.push(func); }
		};
	});
	
	//**COOKIE**
	spotter.cookie = (function(){
		var cache = {};//cache does not 'set' the values but holds it into an object. cache works with data binding.
		//use spotter.cookie.commit(timeout) to set the cache values to cookie.
		
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
			console.log('cookie cache: ',cache);
		};
		
		__init.getNestedProperty = function(bindTo,propertyChain){
			//bindTo will be the element to bindTo and propertyChain will be an ARRAY containing (in order) the property chain 
			//that will be in cache terminating in the variable to be bound.
			var current = cache[propertyChain[0]];
			if(typeof current !== 'undefined'){ var current = current.value; }else{ return {}; }
			propertyChain.shift();
			console.log('getNestedProperty: before iteration: ',current);
			for(var i=0,l=propertyChain.length-1;i<l;i++){
				console.log('getNestedProperty',propertyChain[i],current);
				if(typeof current[propertyChain[i]] === 'undefined'){
					current[propertyChain[i]] = {};
				}
				var current = current[propertyChain[i]];
			}
			return current;
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
				if(typeof o[prop].value === 'undefined'){ console.log('set cookie value: object passed was wrong format'); continue; }
				if(typeof cache[prop] === 'undefined') cache[prop] = {value:{},seconds:3600};
				
				if(Array.isArray(o[prop].value) || typeof o[prop].value === 'string'){ cache[prop].value = o[prop].value; }	
				else if(typeof o[prop].value === 'object'){ spotter.setNestedProperties(cache[prop].value,o[prop].value); }
				else{ console.log('cookie setValue unnaccounted type: ',typeof o[prop].value); }
				
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
				console.log('commitValue',prop+'='+obj+'; Path=/;'+d);
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

	//*** NAVIGATION ***
	spotter.URL = (function(){	
		var result={}, __init={};			
		__init.getParams=function(){//get url parameters
			window.location.search.substring(1).split('&').forEach(function(item){
				var split=item.split('=');
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
			var regex=/(previousURL[A-Z])\=([^;\?]+)/g,result={};
			while(match=regex.exec(document.cookie)){
				result[match[1]]=match[2];
				//console.log('result['+match[1]+']='+match[2]);
			}
			if(result.length===0){//no results found 
				console.log('no result');
				document.cookie='previousURLA='+window.location.href+'; PATH=/;';
				document.cookie='previousURLB='+window.location.href+'; PATH=/;';
				return window.location.href;
			}else{
				if(result['previousURLA']===result['previousURLB']){//cookie was set at last page. This could be considered the starting point.
					console.log('cookie values equal');
					document.cookie="previousURLB="+window.location.href+'; PATH=/;';
					return result["previousURLA"];
				}
				else if(result['previousURLA']===window.location.href || result['previousURLB']===window.location.href){//current page is the same as the past page
					console.log('current page matches last page');
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
		
		__init.getParams();
		__init.params=result;
		return __init;
	}());

	spotter.forwardTo = (function(){//the core version uses cookies
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
					console.log(__init.caller,'forwardTo not set');
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
			if(typeof str !== 'string'){ console.log('forwardTo.set value not a string ('+str+')'); return false; }
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
				return String(value)+(queryString.length > 0 ? "?"+queryString : "");
			}
			else{
				console.log('forwardTo.set value saved not a string ('+value+')'); return false;
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
		
		//to use - run spotter.imports.__init() after the imports are declared. For each import add a custom attribute 'data-event-name'
		//each with a unique name. For each of these unique names, add an event listener to document for these events. The import
		//data will be included on the event object as event.content.
		var self={members:{},templates:{},eventName:{},complete:{},onComplete:{}},
		__init=function(importName){
			if(typeof importName !== 'undefined'){
				var imports = document.querySelector('link[data-import-name="'+importName+'"]');
				if(!imports){ console.log('import not found for '+importName); }
				else{ imports = [imports]; }
			}
			else{
				var imports = document.querySelectorAll('link[rel="import"]');
				if(!imports) console.log('no imports found');
			}
			if(imports === null) {console.log('import not found for '+importName);return;}
			var l=imports.length,current,name
			while(--l > -1){
				member = imports[l];
				name = member.getAttribute('data-import-name');
				self.members[name] = member;
				self.eventName[name] = spotter.events(name);
				self.complete[name] = 'in progress';
				if(factory.supported){//imports supported
					if(typeof member.import !== 'undefined' && member.import !== null){
						response = member.import.body.innerHTML;
						self.complete[name] = 'complete';
						self.templates[name] = response;
						spotter.events.appendTo({template:response},self.eventName[name]); 
						spotter.events.fire(self.eventName[name]);
					}
					else{
						member.addEventListener('load',function(e){
							response = this.import.body.innerHTML;
							self.complete[name] = 'complete';
							self.templates[name] = response;
							spotter.events.appendTo({template:response},self.eventName[name]); 
							spotter.events.fire(self.eventName[name]);
						},false);
					}
				}
				else{//imports not supported
					jQuery.ajax({
						url: member.getAttribute('href'),
						data: window.location.search.substring(1),
						dataType: 'HTML',
						cache: false,
						success:(function(name){
							return function(response){
								self.complete[name] = 'complete';
								self.templates[name] = response;
								spotter.events.appendTo({template:response},self.eventName[name]); 
								spotter.events.fire(self.eventName[name]);
							};
						}(name)),
						error: function(){
							console.log(arguments);
						}
					});
				}
			}
		};
			
		//USE THIS FUNCTION TO USE AN IMPORT TEMPLATE BY SENDING THE IMPORT NAME AND THE FUNCTION IT SHOULD SEND TO
		__init.useImport = function(importName,func){
			if(typeof self.complete[importName] === 'undefined'){ console.log('setting new import '+importName); spotter.imports(importName); }
			if(self.complete[importName] === 'complete'){ func({content:{template:self.templates[importName]}}); }
			else{ 
				document.addEventListener(self.eventName[importName],(function(func){
					var active = false;
					return function(e){
						if(active) return;
						func(e);
					};
				}(func)),false);
			}
		};
		
		__init.self = function(){
			return self;
		};
		
		__init();
		
		return __init;
	};
	
	//templates use variables in the form $[variable_name] and can support booleans 'OR' with the syntax $[var_a_name]OR$[var_b_name] where the first non-null variable will be inserted
	spotter.template = (function(){
		var __private = {
			progex: new RegExp('\\$\\[(\\w+)\\]'),//find the properties
			repgex: new RegExp('\\$REPEAT_(\\w+)(_\\d+){0,1}\\[(.+)\\]END_\\1'),//find interior repeating templates
			orgex: new RegExp('\\$\\[\\w+\\](OR\\[\w+\\])+'),//find 'or' conditionals
			ifgex: new RegExp('\\$IF\\[(.+?)\\]THEN\\[(.*?)\\](ELSE\\[(.*?)\\]){0,1}END')//'if/then' conditionals
		};
		var props = {
			//this function returns an array of objects that include the string part before each insert value so that a new string can be created by simply concatenating the parts with the new insert values
			//replacements is for recursion not calling the function initially
			//if a property doesnt exist in the jsonData then the property name will be used. This is useful for putting in defaults especially with OR statements
			parse: function(template,stor){	
				stor = stor||{replacements:[]};
				var x;
				
				template = __private.repeat(template, stor);
				template = __private.if(template, stor);
				template = __private.or(template, stor);
				template = __private.replacements(template, stor);
				
				stor.replacements.push({
					templatePart:template,
					props:'',
					conditional:'last'
				});
				
				//console.log('stor',stor);
				
				return stor.replacements;
			},
			append: function(template, jsonData, cont, replacements){
				//Create html in cont. 
				//Replacements(optional) = parsed template object (spotter.templates.parse(template)) 
				// *if replacements are sent then template not needed
				replacements = replacements || spotter.template.parse(template);
				var iter="", HTML='', prop, l;
				if(!(l = jsonData.length)){ jsonData = [jsonData]; l=1; }
				for(var x=0; x<l; x++){
					HTML += __private.join(replacements, jsonData[x]);
				}
				
				cont.innerHTML = HTML;
				return replacements;
			}
		};
		
		//'repeat' - repeat template using properties listed within $REPEAT_name_intlimit[template]END_name - 'name' should be a custom name. 'intlimit' will limit the number of repeats, if not set then the limit will be the 
		//number of items in the first property list referenced. template can be more repeats or whatever is needed
		__private.repeat = function(template, stor){
			var iter;
			while(iter = __private.repgex.exec(template)){
				//console.log('iter',iter);
				partA 			= template.substring(0,iter.index);
				partB 			= iter[3];
				
				if(partA.indexOf('$') !== -1) spotter.template.parse(partA, stor);
				
				if(iter[2] !== undefined){
					stor.replacements.push({repeat:spotter.template.parse(partB), limit: Number(iter[2].slice(1))});
				}
				else if(prop = __private.progex.exec(partB)){//the number of repeats will be based on the number of elements in the first interior property unless a limit is specified
					stor.replacements.push({repeat:spotter.template.parse(partB), prop: prop[0].slice(2,-1).toLowerCase()});
				}
				else{
					stor.replacements.push({repeat:spotter.template.parse(partB), limit: 1});
				}
				
				template 	= template.substring(iter.index+iter[0].length);
			}
			return template;
		};
		
		//'or' conditional - $['property name']OR['property name'] - leave the property name part in all lower case to use it as static text instead of a property name
		__private.or = function(template, stor){
			var iter;
			while(iter = __private.orgex.exec(template)){
				i = stor.replacements.push({templatePart:template.substring(0,iter.index),props:[],conditional:'or'}) - 1;
				prop = iter[0].match(/\w+/g);
				if(prop == (prop = prop.toLowerCase())){
					stor.replacements[i].props = 'static_'+prop;
				}
				else{
					stor.replacements[i].props = prop;
				}
				template = template.substr(iter.index+iter[0].length);
			}
			return template;
		};
		
		//replacements - $['property name']
		__private.replacements = function(template, stor){
			var iter;
			while(iter = __private.progex.exec(template)){
				i = stor.replacements.push({templatePart:template.substring(0,iter.index),props:[],conditional:false}) - 1;
				stor.replacements[i].props = iter[0].slice(2,-1).toLowerCase();
				template = template.substr(iter.index+iter[0].length);
			}
			return template;
		};
		
		//if - $IF[cond]THEN[template/prop](ELSE[template/prop])*END
		//cond must be one of the following formats exactly:
			//prop NOT compare(leave compare blank to just negate prop -> 'prop NOT')
			//prop GT compare
			//prop LT compare
			//prop EQ compare
			//prop NOT NULL
			//prop NOT EMPTY
		//leave compare lower case to use a static value, numeric values are assumed to be static
		//if THEN or ELSE is a single uppercase word it will be assumed to reference a property
		__private.if = function(template, stor){
			var iter;
			while(iter = __private.ifgex.exec(template)){
				//console.log('iter',iter);
				partA 		= template.substring(0,iter.index);
				condPart	= iter[1];
				thenPart	= iter[2];
				elsePart	= iter[4]||false;
				
				//setup condPart
					condPart = condPart.split(' ');
					if(!(condPart.length > 2)){ console.log('an IF conditional was found but the condition format is wrong',iter); continue; }
					prop 	 = condPart.shift().toLowerCase();
					cond 	 = condPart.shift();
					comp 	 = condPart.join(' ');
					if(comp === (comp = comp.toLowerCase())){
						comp = 'static_'+comp;
					}
					condPart = {prop:prop, cond:cond, comp:comp};
				
				if(partA.indexOf('$') !== -1) spotter.template.parse(partA, stor);
				
				if(elsePart) elsePart = spotter.template.parse(elsePart);
				stor.replacements.push({conditional: 'if',if: condPart, then: spotter.template.parse(thenPart), else: elsePart});
				
				template 	= template.substring(iter.index+iter[0].length);
			}
			return template;
		}
		
		//join replacements using json data, i is for recursion (jsonData is one row not multiple, for [obj1, obj2, obj3] call .join once for each obj)
		__private.join = function(replacements, jsonData, i){
			var value,r,i=i||0,HTML='',prop,arr;
			var blargh = 0;
			replacements.forEach(function(current){	
				if(typeof current.repeat !== 'undefined'){
					if(typeof current.limit !== 'undefined'){ r = current.limit; }
					else if(jsonData[current.prop] !== null){ d = jsonData[current.prop].split(','); r = d.length; }
					else{ r=0; }
					
					//sending x (as the i argument) tells the non-repeat substitutions to try to split the jsonData value and use the item located at index 'x' first (defaults to first value if index is empty)
					for(var x=0; x<r; x++){
						HTML += __private.join(current.repeat, jsonData, x);
					}
				}
				else if(current.conditional === 'if'){
					prop 	 = jsonData[current.if.prop.toLowerCase()];
					cond 	 = current.if.cond;
					comp 	 = (current.if.comp.substring(0,7) === 'static_' ? current.if.comp.substring(7) : jsonData[current.if.comp]);
					res		 = false;
					
					if(typeof comp === 'undefined') { console.log('if - compare undefined', current.if,current.if.comp.substring(0,7) === 'static_', current.if.comp.substring(7)); return; }
					
					switch(cond){
						case 'NOT':
							if(comp === 'null'){ res = (prop !== null); }
							else if(comp === 'empty'){ res = !!prop; }
							else{ res = (prop !== comp); }
							break;
						case 'GT':
							res = (prop > comp);
							break;
						case 'LT':
							res = (prop < comp);
							break;
						case 'EQ':
							if(comp === 'null'){ res = (prop === null || prop === 'null'); }
							else if(comp === 'empty'){ res = !prop; }
							else{ res = (prop === comp); }
							break;
						default:
							console.log('condition not recognized',cond,current);
							break;
					}
					
					if(res){	HTML += __private.join(current.then, jsonData);		}
					else if(current.else){   HTML += __private.join(current.else, jsonData);   }
				}
				else{
					HTML += current.templatePart;
					if(current.conditional === 'or'){
						count=-1;
						while(++count && typeof (prop = current.props[count]) !== 'undefined'){
							if(prop.indexOf('static_') === 0){
								value += prop.substring(6);
								break;
							}
							else if(jsonData[prop] != null){
								value += jsonData[prop];
								break;
							}
						}
						value = trim(value) || "";
						HTML += value;
					}
					else{
						prop = current.props;
						if(jsonData[prop] !== null && typeof jsonData[prop] !== 'undefined'){
							if(Array.isArray()){
								HTML += jsonData[prop].split(',')[i] || '';
							}
							else{
								HTML += jsonData[prop] || '';
							}
						}
					}
				}
			});
			return HTML;
		};
		
		return props;
	}());
	
	spotter.shade = (function(){
	
		factory = {shades:[],instances:[],openShades: []};
		
		spotter.onResize(function(){
			factory.shades.forEach(function(shade){
				shade.style.height = window.height+'px';
				if(factory.openShades.indexOf(shade) === -1) shade.style.bottom = window.height+'px';
			});
		});
	
		return function(name,type){//utilize shade by setting the action of the close button spotter.shade.onClose(func) then open with spotter.shade.open(). Type is optional [vertical|horizontal|explode] default: vertical
			type = type || "vertical";
			
			var animationEndVernacular;
			
			var self={
				open:false,
				onClose:function(){console.log('onClose not set');},
				onOpen:function(){console.log('onOpen not set');},
				hasBeenOpened: false,
				fill: {}//functions expand/shrink that cause he absolute positioning properties to fill the window (scroll open the shade)
			};
			
			//Build shade and closebutton
			var shade = document.createElement('div');
			factory.shades.push(shade);
			shade.id = 'shade-'+name;
			shade.className = 'shade force-open '+type;
			var 
				content = document.createElement('div'),
				closeButton = document.createElement('div')
			;
			content.className = 'content';
			closeButton.className = 'close-button';
			closeButton.innerHTML = '[X]';
			shade.appendChild(content);
			shade.appendChild(closeButton);
			
			content.className += ' core-hide-scroll';
			
			shade.style.visibility = 'hidden';
			shade.style.zIndex = 9998;
			if(type === 'vertical'){	
				shade.style.bottom = window.height+'px';
				shade.style.height = window.height+'px';
				self.fill.expand = function(){
					shade.style.bottom = 0;
				};
				self.fill.shrink = function(){
					shade.style.bottom = window.height+'px';
				};
				animationEndVernacular = spotter.whichTransitionEvent;
			}
			else if(type === 'horizontal'){
				shade.style.right = window.width+'px';
				shade.style.width = window.width+'px';
				shade.style.minWidth = '100%';
				shade.style.height= window.height+'px';
				self.fill.expand = function(){
					shade.style.right = 0;
				};
				self.fill.shrink = function(){
					//console.log(window.width+'px');
					shade.style.right = /*window.width+'px'*/'100%';
				};
				animationEndVernacular = spotter.whichTransitionEvent;
			}
			else if(type === 'animate'){
				spotter.toggle.class.add(content,'animated');
				self.fill.expand = function(){
					shade.style.visibility = 'visible';
					spotter.toggle.class.remove(content,'zoomOut');
					spotter.toggle.class.add(content,'zoomIn');
				};
				self.fill.shrink = function(){
					shade.style.backgroundColor = 'rgba(0,0,0';
					spotter.toggle.class.remove(content,'zoomIn');
					spotter.toggle.class.add(content,'zoomOut');
				};
				animationEndVernacular = spotter.whichAnimationEvent;
			}
			else{
				console.log('the type ('+type+') send to spotter.shade was not recognized');
			}
			
			document.body.appendChild(shade);
			
			//the methods
				//close and open are static
				//onClose/onOpen set extra functions activated by close/open
			var __init = {
				shade: shade,
				content: content,
				closeButton: closeButton,
				onClose: function(func){ self.onClose=func;},
				close: function(){
					factory.openShades.removeValues(shade);
					if(factory.openShades.length > 0) factory.openShades[factory.openShades.length - 1].style.zIndex = 9998;
					self.open=false;
					self.fill.shrink();
				},
				open: function(){
					console.log('shade open');
					if(!self.hasBeenOpened) __init.shade.className = __init.shade.className.replace(' force-open',' core-animated');
					factory.openShades.forEach(function(el){el.style.zIndex = 9998;});
					factory.openShades.push(shade);
					shade.style.visibility = 'visible';
					shade.style.zIndex = 9999;
					self.open = true;
					self.fill.expand();
				},
			};
			
			factory.instances.push(__init);
			
			shade.addEventListener(animationEndVernacular,function(){
				console.log('transitionend',self.open);
				if(self.open){//transition will be the opposite bc open state will have been changed before transition event is fired`
				}
				else{
					shade.style.visibility = 'hidden';
					self.onClose();
				}
			},false);
			
			closeButton.addEventListener('click',function(){
				console.log('close button clicked');
				if(self.open){
					__init.close();
				}
			},false);
			
			return __init;
		};
	}());
	
	spotter.popMenu = (function(){
		var factory={
				menus: {},
			},
			__parent=spotter
		;
	
		var __init = function(name,type){//container of menu, name is the index in factory referencing this instance, type[vertical|horizontal] dictates how the menu will open
			
			var shade = new spotter.shade(name,type);
			
			//add a custom container to shade
			var container = document.createElement('DIV');
			container.id = name;
			container.className = "pop-menu";
			shade.content.appendChild(container);//move container to shade
			
			var self={
					state: false,//false = not opened, true = is opened
					container: container,//container added to the shade instance
					shade: shade,//shade instance
					closeButton: shade.closeButton,
					beforeOpen: [function(){}],//array of functions to run before open
					onOpen: [function(){}],//array of functions to run after open
					beforeClose: [function(){}],//array of functions to run before closing
					onClose: [function(){console.log('close');}],//array of functions to run after closing
					onMenu: [],//array of functions to run after template is done loading. These run everytime the template is loaded.
					onResponse: [],//array of functions to run on dynamic template ajax response
					onScrollBottom: function(){},//function to run when shade container is scrolled to the bottom.
					pagination: {use:false,start:0,current:0},
					limit: {use:false,to:25},
					menus: [],//array of the spans created for dynamic data
					activationCount: 0,//used to count the number of activations, 0 of course being the first
					activateOnReady: 0//used to trigger activate again after asynchronous events
				},
				__init={
					shade: shade,
					container: self.container,
					closeButton: self.closeButton,
					beforeOpen: function(func){
						if(typeof func !== 'function'){ 
							console.log('argument (beforeOpen) must be a function'); return this;
						}
						self.beforeOpen.push(func);
						return this;
					},
					onOpen: function(func){
						if(typeof func !== 'function'){ 
							console.log('argument (onOpen) must be a function'); return this;
						}
						self.onOpen.push(func);
						return this;
					},
					beforeClose: function(func){
						if(typeof func !== 'function'){ 
							console.log('argument (beforeClose) must be a function'); return this;
						}
						self.beforeClose.push(func);
						return this;
					},
					onClose: function(func){
						if(typeof func !== 'function'){ 
							console.log('argument (onClose) must be a function'); return this;
						}
						self.onClose.push(func);
						return this;
					}
				}
			;
			
			self.enable = function(){//enable activation. If activated prior to download this will also run it
				self.template.suspended = false;
				self.template.loaded = true;
				if(self.activateOnReady === true){ __init.open(); self.activateOnReady = false; }
			};
			
			__init.deActivateProcess = (function(){//thsi is set to shade onClose. Use deActivate to trigger closing this popmenu bc this function doesnt handle closing the shade.
				return function(){
					self.beforeClose.forEach(function(func){ func(self); });
					spotter.scroll.reset();
					self.container.style.display = 'none';
					self.pagination.current = 0;
					document.removeEventListener(self.onScrollBottomEventName,self.onScrollBottom,false);
					self.onClose.forEach(function(func){ func(self); });
					self.activationCount = 0;
					self.state = false;
					self.template.suspended = false;
				};
			}());
			
			__init.deActivate = function(){ self.shade.closeButton.click(); }//close the shade from the popmenu object
			
			__init.forceOpen = function(){//this will remove the core-animated class and add on the force-open class which will open the shade up and push it under everything else. This is good when offsets or heights are needed.
				self.shade.shade.className = self.shade.shade.className.replace(' core-animated',' force-open');
			};
			
			__init.forceClose = function(){//use to undo forceOpen change
				self.shade.shade.className = self.shade.shade.className.replace(' force-open',' core-animated');
			};
			
			__init.open 	= function(reopen){//use activate or refreshCurrent to turn on pop menu, this is more the animation 
				var l = self.beforeOpen.length;
				while(--l > -1){
					if(self.beforeOpen[l](self) === false){
						return;
					}
				}
				self.shade.open();
				self.shade.onClose(__init.deActivateProcess);
				spotter.scroll.recordPosition();
				spotter.scroll.to(self.container);
				self.container.style.display = 'block';
				self.onOpen.forEach(function(func){ func(self); });
				self.state=true;
				self.template.suspended = false;
			};
			
			//================== on scroll bottom =======================
			self.onScrollBottomEventName = spotter.onScrollBottom(shade.content,'onScrollBottom');
			
			__init.onScrollBottom = function(func){
				if(typeof func === 'function') { self.onScrollBottom = (function(self){ return function(){func(self);}; }(self)); }
				else if(func === 'refresh') { self.onScrollBottom = (function(){
					return function(){
						if(self.template.suspended === true) return;
						__init.dynamicTemplate();
					}; 
				}()); }
				return this;
			};
			
			self.setupScrollBottom = function(){				
				document.removeEventListener(self.onScrollBottomEventName,self.onScrollBottom,false);
				document.addEventListener(self.onScrollBottomEventName,self.onScrollBottom,false);
			};
			//================= end scroll bottom =======================
			
			__init.refreshCurrent = function(){//call this method to refresh without running deactivate
				self.container.style.display = 'none';
				self.pagination.current = 0;
				document.removeEventListener(self.onScrollBottomEventName,self.onScrollBottom,false);
				self.activationCount = 0;
				self.state = false;
				self.template.suspended = false;
				this.activate();
			};
			
			__init.activate = function(){
				if(self.state === true) { console.log('menu already open'); return; }
				self.state = true;
				
				self.activateOnReady = true;
				
				if(typeof self.title !== 'undefined') self.titleBar.innerHTML = self.title;
				
				self.setupScrollBottom();
				
				if(self.template.enabled === true){
					if(self.template.suspended === false){
						if(self.template.loaded.status === false){
							console.log('template not loaded');
							__init.loadTemplate();
						}
						else if(self.template.refresh === true){
							console.log('refresh template');
							if(self.template.dynamic.params.url === 'static'){
								__init.dynamicTemplateStaticData();
							}
							else{
								__init.dynamicTemplate();
							}
						}
						else{
							__init.open();
						}
					}
				}
				else{
					self.enable();
				}
			};
			
			//------------------------------------------------------------------------------
			//template storage
			self.template 			= {};
			self.template.enabled 	= false;
			self.template.refresh	= 3;
			self.template.suspended	= false;
			self.template.refresh	= false;
			self.template.loaded	= {status:false};
			self.template.showEmpty	= false;//show the empty results div. Use .showEmpty(bool) method to set
			
			self.emptyResult = document.createElement("DIV");
			self.emptyResult.className = 'popmenu-empty-result';
			self.emptyResult.innerHTML = "No Results Found";
			
			__init.limitResult = function(lim){//lim is required
				self.limit.use = true;
				self.limit.to = Number(lim);
				return this;
			};
			
			__init.usePagination = function(start){//start is optional and will be the start page if called
				self.pagination.use = true;
				if(typeof start !== 'undefined') self.pagination.start = self.pagination.current = start;
				return this;
			};
			
			self.getParams = function(){
				if(self.pagination.use) self.template.dynamic.params.data['page'] = self.pagination.current;
				if(self.limit.use) self.template.dynamic.params.data['limit'] = self.limit.to;
				if(typeof self.form !== 'undefined'){
					var l = self.form.elements.length;
					while(--l > -1){
						input = self.form.elements[l];
						self.template.dynamic.params.data[input.name] = input.value;
					}
					if(typeof self.template.dynamic.params.url === 'undefined'){ self.template.dynamic.params.url = self.form.action; }
				}
				if(typeof self.dataSet !== 'undefined'){
					for(var prop in self.dataSet){
						if(prop !== 'url') self.template.dynamic.params.data[prop] = self.dataSet[prop];
					}
					if(typeof self.dataSet !== 'undefined'){ self.template.dynamic.params.url = self.dataSet.url; }
				}
				//console.log(self.template.dynamic);
				return self.template.dynamic.params.data;
			};
			
			__init.parseTemplateWithDynamicData = function(response){
				self.template.response = response;
				
				var replacements = spotter.template.parse(self.template.result);
				
				var span;
				var l = self.menus.push(span = document.createElement('SPAN')) - 1;
				
				self.template.replacements = spotter.template.append(self.template.result, response, span, self.template.replacements);
				
				self.container.appendChild(self.menus[l]);
				console.log('parseTemplateWithDynamicData before onMenu');
				self.onMenu.forEach(function(func){
					func.call(self.menus[l],self);
				});
				console.log('parseTemplateWithDynamicData after onMenu');
				
				self.pagination.current++;
				self.enable();
			};
			
			__init.dynamicTemplateStaticData = function(){//when url = static for second argument of setTemplate				
				self.template.suspended = true;
				if(self.pagination.current === 0) self.container.innerHTML = "";
				__init.parseTemplateWithDynamicData(self.template.dynamic.params.data);
			};
			
			__init.dynamicTemplate = function(){//for getting json data to replace data in the template				
				self.template.suspended = true;
				if(self.pagination.current === 0) self.container.innerHTML = "";
				var requestParams = self.getParams();
				jQuery.ajax({
					url: self.template.dynamic.params.url,
					data: requestParams,
					dataType: "JSON",
					type: "POST",
					cache: false,
					success: function(response){
						self.onResponse.forEach(function(func){
							func.call(response,self);
						});
						
						//if request failure
						if(response.status !== 'success'){
							if(self.template.showEmpty === true) self.container.appendChild(self.emptyResult);
							return;
						}
						
						__init.parseTemplateWithDynamicData(response.result);
					},
					error:function(requestObj,textStatus,errorThrown){
						console.log(arguments);
						self.enable();
					}
				});
			};
			
			self.parseTemplate = function(){//loads template into html, dynamicTemplate will skip this function				
				self.container.innerHTML = self.template.result;
				spotter.castToArray(self.container.querySelectorAll('script')).forEach(function(oldScript){
					var newScript = document.createElement('SCRIPT');
					newScript.text = oldScript.innerHTML;
					oldScript.parentNode.replaceChild(newScript, oldScript);
				});
				self.onMenu.forEach(function(func){
					func.call(self.container,self);
				});
				self.enable();
			};
			
			self.getTemplate = function(){//gets the static template
				spotter.imports.useImport(self.template.name,function(event){
					self.template.result = event.content.template;
					self.template.loaded.status = true;
					if(typeof self.template.dynamic !== 'undefined'){ spotter.events.fire(self.template.dynamic.event); }//calls dynamicTemplate
					else{ self.parseTemplate(); }
				});
			};
			
			__init.loadTemplate = function(){//called by first activation or call manually to preLoad. This template should not change
				self.template.suspended = true;
				spotter.events.fire(self.template.loaded.event);//activates getTemplate
				return this;
			};
			
			__init.setDynamicParams = function(params, saveParams){
				if(typeof self.template.dynamic === 'undefined'){//other methods may have set this up
					self.template.dynamic = {};
					self.template.dynamic.event = spotter.events('PopMenuDynamicTemplate');	
				}
				if(saveParams) self.template.dynamic.old = self.template.dynamic;//allow revert
				
				self.template.dynamic.params = params;
				self.template.dynamic.params.data = self.template.dynamic.params.data||{};//if data not needed/given
				if(params.url === 'static'){
					document.addEventListener(self.template.dynamic.event,__init.dynamicTemplateStaticData,false);
				}
				else{
					document.addEventListener(self.template.dynamic.event,__init.dynamicTemplate,false);
				}
			};
			
			__init.revertDynamicParams = function(){
				self.template.dynamic = self.template.dynamic.old;
			};
			
			__init.useTemplate = function(name,params){//setup to use a template by 'name'. Params is optional but will be sent to a dynamic template request along with any info from a bound form.
				self.template.name = name;
				self.template.enabled = true;
				self.template.loaded.event = spotter.events('loadTemplateEvent');
				document.addEventListener(self.template.loaded.event,self.getTemplate,false);
				if(typeof params !== 'undefined'){
					__init.setDynamicParams(params, true);
				}
				return this;
			};
			
			__init.enableRefresh = function(bool){
				if(!!bool){ self.template.refresh = true; }
				else{ self.template.refresh = false; }
				return this;
			};
			
			__init.showEmpty = function(bool){
				if(!!bool){ self.template.showEmpty = true; }
				else{ self.template.showEmpty = false; }
				return this;
			}
			//---------------------------------------------------------------
			
			__init.onMenu = function(func){
				if(self.template.suspended === false || self.template.loaded === false || self.template.refresh === true){ self.onMenu.push(func); }
				else{ func.call(self.menus[l],self); }
				return this;
			};
			
			__init.onResponse = function(func){
				if(self.template.suspended === false || self.template.loaded === false){ self.onResponse.push(func); }
				else{ func.call(self.template.response,self); }
				return this;
			};
			
			__init.attachTo = function(el){
				var func = (function(__init){ return function(e){ e.preventDefault(); __init.activate.call(__init); }; }(this));
				el.addEventListener('click',func,false);
				return this;
			};
			
			__init.bindForm = function(frm){
				if(frm.tagName !== 'FORM'){ console.log('argument one of bindForm must be a form element'); return; }
				if(typeof self.template.dynamic === 'undefined'){//other methods may have set this up
					self.template.dynamic = {};
					self.template.dynamic.params = {data:{}};
					self.template.dynamic.event = spotter.events('PopMenuDynamicTemplate');
					document.addEventListener(self.template.dynamic.event,__init.dynamicTemplate,false);
				}	
				self.form = frm;
				return this;
			};
			
			__init.bindData = function(data){//use thsi for a dynamic dataset
				if(typeof data !== 'object'){ console.log('argument one of bindData must be an object of params: value pairs'); return; }
				if(typeof self.template.dynamic === 'undefined'){//other methods may have set this up
					self.template.dynamic = {};
					self.template.dynamic.params = {data:data};
					self.template.dynamic.event = spotter.events('PopMenuDynamicTemplate');
					document.addEventListener(self.template.dynamic.event,__init.dynamicTemplate,false);
				}
				self.dataSet = data;
				return this;
			};
			
			__init.setTitle = function(str){
				self.title = str;
				self.titleBar = document.createElement('DIV');
				self.titleBar.className = 'title';
				spotter.prependChild(self.shade.content,self.titleBar);
				
				this.setTitle = function(str){ self.title = str; return this; }
				
				return this;
			};
			
			//call this to set all the functions and settings to blank arrays
			__init.resetFunctions = function(){
				self.onMenu = [];
				self.onResponse = [];
				self.onOpen = [];
				self.onclose = [];
				self.beforeClose = [];
				self.beforeOpen = [];
			}
	
			return __init;
		};
		
		return __init;
	}());
	
	spotter.confirmation = function(){
		//USE: spotter.confirmation().method()...
		
		var factory = {onAccept:function(){},onDeny:function(){}};
		
		//create a recurring pop menu
		factory.popMenu = new spotter.popMenu('confirmation-box','animate','zoom')
			.useTemplate('confirmation-box')
			.onMenu(function(popMenu){
				console.log('core confirmation');
				console.log(factory);
				factory.title = document.getElementById('core-confirmation-title');
				factory.msg = document.getElementById('core-confirmation-msg');
				factory.ok = document.getElementById('core-confirmation-ok');
				factory.cancel = document.getElementById('core-confirmation-cancel');
				console.log(popMenu);
				factory.cancel.addEventListener('click',function(){popMenu.shade.closeButton.click();},false);				
			})
			.loadTemplate()
		;
		
		var __init = function(){
			
			var self = {};
			
			console.log(factory);
			factory.ok.removeEventListener('click',factory.onAccept,false);
			factory.cancel.removeEventListener('click',factory.onDeny,false);
			
			__constructor = {};
			
			__constructor.setTitle = function(str){
				factory.title.innerHTML = String(str);
				return this;
			};
			
			__constructor.setMessage = function(str){
				factory.msg.innerHTML = String(str);
				return this;
			};
			
			__constructor.onAccept = function(func){
				self.onAccept = factory.onAccept = func;
				factory.ok.addEventListener('click',self.onAccept,false);
				return this;
			};
			
			__constructor.onDeny = function(func){
				self.onDeny = factory.onDeny = func;
				factory.cancel.addEventListener('click',self.onDeny,false);
				return this;
			};

			__constructor.activate = function(){
				factory.popMenu.activate();
				return this;
			};
			
			__constructor.deActivate = function(){
				factory.popMenu.shade.closeButton.click();
				return this;
			};
			
			return __constructor;
		};
		
		return __init;
	};

	/*
	spotter.onScrollBottom = function(){//Adds the onScrollBottom event to document
		var __init = {eventName: spotter.events('onScrollBottom')},
			fn=function(obj,eventName){
				if(typeof eventName==='undefined') eventName = 'onScrollBottom';
				eventName = spotter.events(eventName);
				var docHeight = document.body.offsetHeight | 0
					,winHeight = window.innerHeight | 0
					,scrollPoint = window.scrollY | 0
				;
				docHeight = typeof docHeight === 'undefined' ? window.document.documentElement.scrollHeight | 0 : docHeight;
				winHeight = typeof winHeight === 'undefined' ? document.documentElement.clientHeight | 0 : winHeight;
				scrollPoint = typeof scrollPoint === 'undefined' ? window.document.documentElement.scrollTop | 0 : scrollPoint;
				
				if((scrollPoint + winHeight + 1)>=docHeight){
					console.log("winHeight: "+winHeight+" scrollPoint: "+scrollPoint+" docHeight: "+docHeight+" "+scrollPoint+"+"+winHeight+">="+docHeight+" --- "+(scrollPoint+winHeight)+">="+docHeight+" evaluates to "+((scrollPoint + winHeight)>=docHeight));
					spotter.events.fire(eventName);
				}else{
					console.log("height something aint workin: winHeight: "+winHeight+" scrollPoint: "+scrollPoint+" docHeight: "+docHeight+" "+scrollPoint+"+"+winHeight+">="+docHeight+" --- "+(scrollPoint+winHeight)+">="+docHeight+" evaluates to "+((scrollPoint + winHeight)>=docHeight));
				}
			}
		;
		window.addEventListener('scroll',fn,false);
		__init.cancel=function(){window.removeEventListener("scroll",fn,false);}
		return __init;
	};
	*/
		
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
					
					document.body.appendChild(outer);
				
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
					members: [],
					evts: []
				};
				__self.observer = function(val,el,prop,eventType){
					var linkVar = val;
					var memId = __self.members.indexOf(el) || __self.members.push(el);
					__self.evts[memId] = __self.evts[memId] || [];
					__self.evts[memId].push(eventType);
					var l = __self.evts[memId].length;
					Object.defineProperty(el,prop,{
						get: function(){return linkVar;},
						set: function(newValue){
							var i = l;
							linkVar = newValue;
							while(--i > -1) this.eventTriggers[__self.evts[memId][i]]();//activates each event registered via setEventTrigger 'el'
						},
						configurable:true,
						enumerable:true
					});
				};

				return function(el,prop,eventType){	
					spotter.events.setEventTrigger(el,eventType);
					__self.observer(el[prop], el, prop, eventType);
				};
			}())
		};
		
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
		
		__public.bindElementToEvent = function(el,prop,eventType){
			//whenever the property is changed, the event (attached to the element) is triggered
			__private.createDOMElementObserver(el,prop,eventType);
		};
		
		__public.createBoundVariables = function(arrNames,arrValues){
			//variable bindings CANNOT be created from static single dimensional variables because the parent is unknown.
			//Use this function to create variables by name by sending in a var name or array of var names and their initial
			// values
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
		
		//when input value is changed the element textnode is changed - only handling 'text' and 'textarea' inputs...for now.
		//'filter' is optional and receives the value of the input
		//if the filter returns 'ignore' then nothing will change.
		__public.bindElementToInput = (function(){
			var previous = [];
			var inputTypes = ['text','email','tel','search','number','date','month','password'];
			
			return function(el,input,filter){
				filter = filter || function(content){return content;};
				var func,input_prime={value:''};
				
				if(inputTypes.indexOf(input.type) !== -1 || input.tagName === 'textarea'){//changing the value binding will stop user interaction working so this creates a clone that the user interacts with
					input_prime = input.cloneNode();
					input_prime.id = null;
					input_prime.name = null;
					input.style.display = 'none';
					input.parentNode.insertBefore(input_prime, input);
					input_prime.addEventListener('change', (function(input){ 
						return function(){ 
							input.value = this.value;
							//console.log('clone value='+this.value,' original value='+input.value,'clone is',this,'original is',input); 
						}; 
					}(input)), false);
				}
				
				if(previous.indexOf(input) === -1) {//avoid changing observer and ruining another one
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
						//console.log(val);
						if(val !== 'ignore'){ spotter.getFirstTextNode(el).nodeValue = val; }
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
		
		__public.setupBinding = (function(){
			__factory = {
				getSetter: function(el,attr,fallBack){
					return function(newValue) {
						if(typeof newValue === 'undefined' || newValue === 'undefined') newValue = fallBack;
						__private.setValue(el,newValue);
						value = newValue;
					};
				}
			};
			
			return function(el){
				//console.log('*** SETUPBINDING ***');
				var propertyChain = el.getAttribute('core-data-bind').split(':');
				var type = propertyChain.shift();
				var attr = propertyChain.last();
				var fallBack = el.getAttribute('core-data-bind-default') || "";
				//console.log('binding type: ',type);
				//console.log('property chain: ',propertyChain);
				//console.log('attr: ',attr)
				switch(type){
					case 'cookie':
						var n = 1;
						var result = spotter.cookie.getNestedProperty(el,propertyChain);
						var value = String(result[attr]);
						//console.log('result = ',result,' --string value of result[attr] = ',value);
						result = Object.defineProperty(result, attr, {
							get: function() { return value; },
							set: __factory.getSetter(el,attr,fallBack),
							enumerable: true,
							configurable: true
						});
						result[attr] = value;
						break;
					case 'element'://core-data-bind="element:[element id]:[property name]"
						var targ;
						if(targ = document.getElementById(propertyChain[0]) && propertyChain.length == 2){
							var value = targ[attr];
							var result = Object.defineProperty(targ, attr, {
								get: function(){ return value; },
								set: __factory.getSetter(el,attr,fallBack),
								enumerable: true,
								configurable: true
							});
							result[attr] = value;
						}
						break;
					default:
						el.binding = el.binding||{};
						Object.defineProperty(el.binding, type, {
							get: function() { return this.value; },
							set: function(newValue) {
								// a certain property is being changed
								//alert('is changed');
								this.value = newValue;
							}
						});
						break;
				}
				//console.log('*** END SETUPBINDING ***');
			};
		}());
		
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
		
		return __public;
	}());
	/*
	date - format date objects with $[var] convention. d - numeric day, m|M - numeric month (M is word), y|Y as year (Y is 4 digit)
	formatUnix(integer as unix_time,str as format) - changes a unix timestamp into a formatted date
	formatDate(date object,str as format) - changes a date into a formatted date
	*/
	spotter.date = (function(){
		__public = {};
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
			var y = String(Y).slice(-2);
			
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
}());

//INITIALIZE ENTANGLED FUNCTIONS (METHODS REQUIRING USE OF MULTIPLE SPOTTER METHODS IN ENTANGLED ORDER)
spotter.imports = spotter.imports();

spotter.testLoaded(function(){
	var d=document, b=document.getElementsByTagName('BODY')[0], c=b.childNodes, l=b.length;
	while(l){
		l--;
		if(typeof c[l].style!=='undefined'){alert(c[l].tagName+' width= '+c[l].style.width);}
	}
	
	spotter.sharedShade = new spotter.shade('shared');
	
	spotter.confirmation = spotter.confirmation();
	
	var developerMachineViewPortWidth = 1280;
	//set font-size for other machines:
	var multiplyBy = spotter.getWidth(document.body) / 1280;
	var fontDiv = document.createElement('DIV');
	document.body.appendChild(fontDiv);
	fontDiv.style.width = '1rem';
	var html = document.getElementsByTagName('HTML')[0];
	//html.style.fontSize = Number(multiplyBy * 100) + '%';
	
	//hide scrollbars
	//document.getElementById('content').className += ' core-hide-scroll';
	
	document.createElement('STYLE');
	/* --/
		css - creates a stylesheet and adds to head
			addRule(string as css) - add rule to factory styleSheet
	/-- */
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
	
	spotter.scrollBarWidth.onReady(function(get){
		spotter.css.addRule('.vertical .core-hide-scroll { width: calc(100% + '+get+'px) !important; overflow-y:scroll; overflow-x: hidden; }');
		spotter.css.addRule('.horizontal .core-hide-scroll { overflow-x:scroll; height:calc(100% + '+get+'px); }');
		spotter.css.addRule('.shade.horizontal .content{ width:calc(85% + '+get+'px); }');
	});
	
	//alert(spotter.isEventSupported('scroll'));
});

document.write('<link rel="stylesheet" href="' + window.spotterModules.modules.require.homeURL +  '/css/main.css' + '"/>');