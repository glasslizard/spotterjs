console.log('using mobile');

spotter.mobile =  (function(){
	var w = window,
		d = document,
		g = d.body||d.getElementsByTagName('BODY')[0],
		e = d.documentElement||g,
		x = w.innerWidth || e.clientWidth || g.clientWidth,
		head = document.getElementsByTagName('head')[0],
		st   = document.getElementById('mobile-style'),
		heqw = document.querySelectorAll('.heighteqwidth'),
		hl   = document.querySelectorAll('.heightlinked'),
		els,
		y=0,
		i=0,
		l,
		len,
		p,
		h,
		m,
		s,
		hlo={},
		addStyleCache=function(g){
			var x=0,l=g.length;
			for(x;x<l;x++){
				if(!g[x].cacheCSS){g[x].cacheCSS='';}
			}
		},
		developmentFontSize,
		developmentWidth,
		refElementId,
		resizeFunc//trigger resize. sent to spotter.onresize and triggered after document interactive
	;
	
	var __private = { is:false, fennec:false };
	
	(function(a,b){
		var is = spotter.cookie.getValue('isMobile').value;
		if(is === '1'){
			__private.is = true;
		}
		else if(is === '0'){
			__private.is = false;
		}
		else{
			var userAgents = navigator.userAgent||navigator.vendor||window.opera;
			if(__private.fennec = /fennec/i.test(userAgents.substr(0,4))){
				__private.is = true;
			}
			else{
				__private.is = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgents)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgents.substr(0,4));	
				if(__private.is){
					spotter.cookie.setValue({isMobile:{value:'1'}});
				}
				else{
					spotter.cookie.setValue({isMobile:{value:'0'}});
				}
			}
		}
	}(navigator.userAgent||navigator.vendor||window.opera));
	
	var hasTouchSupport = function() {
        var support = {}, events = ['touchstart', 'touchmove', 'touchend'],
            el = document.createElement('div'), touchSupport = true;
		
		events.forEach(function(evt){
			var eventName = 'on' + evt;
			var isSupport = (eventName in el);
			if(!isSupport){
				el.setAttribute(eventName, 'return;');
				isSupport = typeof el[eventName] == 'function';
			}
			if(!isSupport) touchSupport = false;
		});
		
		return touchSupport
     }();
	
	var __public = function(fontSize, elWidth, refElementId){//initialize with the font size this site was developed with and the reference element id to get the width from
		developmentFontSize = fontSize;
		developmentWidth 	= elWidth;
		
		var refElement;
		if(typeof refElementId === "string"){
			refElement = document.getElementById(refElementId);
			if(!refElement){
				console.warn("reference element id (",refElementId,") sent to spotter.mobile was not found");
				return false;
			}
		}
		else if(!refElementId.tagName){
			console.warn("reference element sent to spotter.mobile was undefined or null");
				return false;
		}
		else{
			refElement = refElementId;
		}
		
		resizeFunc = (function(developmentFont, developmentWidth, d, refElement){
			return function(){
				/*
				var windowWidth = spotter.getWidth(document.documentElement);
				if(windowWidth < 427) windowWidth = 304;
				document.body.style.width = windowWidth+'px';
				*/

				var newWidth = spotter.getWidth(refElement);
				//newWidth = windowWidth;
				if(Math.abs(newWidth - developmentWidth) > 2){
					d.documentElement.style.fontSize = parseInt((newWidth/developmentWidth) * developmentFont) + 'px';
					window.console.log('spotter.mobile font resize arguments:',' \n', 'new font size: '+d.documentElement.style.fontSize,' \n','development container width:'+developmentWidth,' \n','new container width:'+newWidth);
				}
				else{
					window.console.log('spotter.mobile font resize unchanged');
				}
				
				spotter.events.fire('fontresize');
			}; 
		}(developmentFontSize, developmentWidth, d, refElement))
		
		spotter.events('fontresize');
		spotter.onResize(resizeFunc);
		spotter.events('resize');
		spotter.events.fire('resize');
	};
	
	//analogous to spotter.onResize except occurs after font is resized - useful when a component needs to recalculate dimensions or offsets or min/max fonts etc.
	__public.onFontResize = (function(){
		var __private	= {onFontResize:[]};
		var __public	= function(func,args){
			if(!Array.isArray(args)) args = [args];
			__private.onFontResize.push({func:func,args:args});
		},
		fontResizeFuncs = function(){
			__private.onFontResize.forEach(function(obj,key){
				obj.func.apply(this,obj.args);
			});
		};
		window.addEventListener('fontresize',fontResizeFuncs);
		return __public;
	}());
	
	__public.is = function(){ return !!__private.is; }
	__public.is.fennec = function(){ return !!__private.fennec; }
	
	//EVENTS & RELATED
	if(hasTouchSupport && __private.is){
		spotter.events.eventTypes.mouse = {
			mousedown:	'touchstart',
			mousemove:	'touchmove', 
			mouseup:	'touchend', 
			mouseover:	'touchenter',
			mouseout: 	'touchleave'
		};
		
		//overwrites original for mobile
		spotter.getMousePos = function(evt){
			var coord;
			if(typeof evt.originalEvent !== 'undefined'){
				coord = evt.originalEvent.touches[0];
			}
			else if(typeof evt.targetTouches !== 'undefined'){
				coord = evt.targetTouches[0];
			}
			else{
				return false;
			}
			return [coord.clientX, coord.clientY];
		};
		
		//mutates the basic spotter event getters for mobile versions if present
		//function setMouseEventGetters()//{
			if(__private.is){
				spotter.events.eventTypes.mouse.get = {//includes touch events
					mousedown: function(e){
						if(e.touches){
							if(e.touches.length === 1){	
								return ["mousedown", e.touches[0]];
							}
							else{
								return ["multitouchstart", e.touches];
							}
						}
					},
					mouseup: function(e){
						if(e.changedTouches){
							if(e.changedTouches.length === 1){	
								return ["mouseup", e.changedTouches[0]];
							}
							else{
								return ["multitouchend", e.changedTouches];
							}
						}
					}
				}
			}
		//}
	}
	
	//__public.reSizeFont = {};
	
	//DEBUGGING
	if(!window.console /*|| __private.is*/){ 
		var console = {};
		window.console = console;
		console.log = function(){
			var args = Array.prototype.slice.call(arguments), str = '', prop;
			args.forEach(function(arg){
				if(typeof arg === 'object'){
					if(Array.isArray(arg)){
						str += '[\n  '+arg.join(',\n  ')+'\n]\n\n';
					}
					else{
						str += 'OBJECT{';
						for(prop in arg){
							str += '  '+prop+': '+arg[prop]+',\n';
						}
						str = str.slice(0,-1) + '}\n\n';
					}
				}
				else{
					str += String(arg)+'\n';
				}
			});
			var ajax = new XMLHttpRequest;
			ajax.open("POST", "/services/mobile");
			ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			ajax.send('requestType=consoleLog&message='+encodeURIComponent(str));
		};
		console.warn = console.log;
		console.info = console.log;
		console.error= console.log;
	}
	
	spotter.testLoaded( (function(__public){ 
		var func = function(){
			var w = window,
				d = document,
				g = d.body||d.getElementsByTagName('BODY')[0],
				e = d.documentElement||g,
				wid
			;
			__public.reSizeFont = function(m){			
				m 	= m||1;
				wid = Math.max(w.innerWidth, e.clientWidth, g.clientWidth);
				//console.log('w=',w,', window.width='+w.innerWidth,', e=',e,', e.clientWidth='+e.clientWidth,', e=',e,', g=',g,', g.clientWidth='+g.clientWidth);
				e.style.fontSize = parseInt((wid/100)*m) + 'px';
			};
		};
		return func;
	}(__public)), 'document');
	
	//TO CREATE SQUARE CONTAINERS
	__public.setWidthHeight=(function(g){//WHERE THE CONTAINER SHOULD BE SQUARE WHILE WIDTH IS SET TO AUTO
	 	var l=g.length,
	 	func=function(){
			var H,M,x=0;
			for(x;x<l;++x){
				M = g[x].getAttribute('data-multi') || 1;
				H=spotter.getWidth(g[x]);
				H=(H)*M;
				g[x].style.height=H+'px';
			}
		};
		return func;
	}(heqw));
	
	return __public;
}());