console.log('using components');

spotter.components = (function(){
	spotter.addCSSToHead(spotter.require.homeURL +  '/css/components.css');
	
	//load polyfill (this option's easier and better supported than custom rolling)
	//spotter.addScriptToHead("/js/webcomponentsjs/src/CustomElements/CustomElements.js");
	spotter.addScriptToHead("/js/register-components.js");
	
	var __components = {};
	//var polyfillLoadedReady = false;
	
	//registeredNodes[i] -> readyNodes[i] -> onReadyFuncs[i]=array(funcs)
	var readyNodes 			= []
		,registeredNodes 	= []//to be used by constructors/preconstructors
		,onReadyFuncs		= []
		,onReadyNodesTemp	= []
		,componentRegistrationIsReady = false//set web component script as downloaded - script fires the event 'registerComponentsReady' to signal it as downloaded
		,onComponentsReady = [];//tags and their constructors to be registered as web components

	var componentFuncs 	= {}// {'custom tag name':'setup function',...} - stores list of the custom tag names as properties whose values are in turn the constructor functions }
		__private = {//must be on object to maintain living reference
			elemConstructorFuncs:[],
			readyComponents:{}
		};
	
	// *** OPERATIONAL/HELPERS ***
		
		function isPartOfTemplate(elem){
			if(!elem){ /*console.error(new Error().stack);*/ return false; };
			var p=elem.parentNode;
			while(p && p!=='body' && p!=='document'){
				if(p.tagName === 'SPOTTER-TEMPLATE'){
					console.debug('custom element is part of a template',elem);
					return true;
				}
				p = p.parentNode;
			}
			return false;
		}
	
		function registerElem(elem){
			//prevents components from being 'constructed' multiple times while the initial component is finishing
			if(~registeredNodes.indexOf(elem)){
				console.debug('custom element already registered:','<'+elem.tagName+' '+'id="'+elem.id+' class="'+elem.className+'"');
				return false;
			}
			else{
				//if onready has record of the node, use that index instead of creating a new one and on ready functions should already have a value
				var i = onReadyNodesTemp.indexOf(elem);
				//console.debug('registering component:', elem, 'i:', i);
				if(i === -1){
					i = registeredNodes.push(elem) - 1;
					onReadyFuncs[i] = []; 
				}
				else{
					registeredNodes[i] = elem;
				}
				return true; 
			}
		};
		
		function getElemByIdOrBuildIfFail(id, template){
			var el;
			if(typeof id === "string"){
				if(el = document.getElementById(id)){
					return el;
				}
				else{
					console.warn("attempt to retrieve element by id "+id+" failed \n", "stack:", new Error().stack);
					return false;
				}
			}
			else{
				el = document.createElement('SPAN');
				el.innerHTML = template;
				return el.children[0];
			}
		};
		
		//when web components registration polyfill downloaded register components
		document.addEventListener('registerComponentsReady', function(){
			componentRegistrationIsReady = true;
	
			for(var x=0,l=onComponentsReady.length,params=onComponentsReady[0]; x<l; params=onComponentsReady[++x]){
				document.registerElement(params.tagName, params.initParams);
				__components.registerComponent(params.tagName);
			}
		});
		
		//record the constructor for component as having been registered with web components
		__components.registerComponent = function(tagName){
			__private.readyComponents[tagName] = true;
		};
		
		//check if component has been registered as a web component
		__components.isComponentRegistered = function(tagName){
			return __private.readyComponents[tagName] === true;
		};
		
		//register component with web components
		var registerSpotterComponent = function(tagName, initParams, require){
			if(componentRegistrationIsReady === true){
				var registration = document.registerElement(tagName, initParams);
				/* -- arguments format --
				//	'tagName', 
				//	initParams=>{
				//		prototype: Object.create(
				//			HTMLElement.prototype,
				//			{
				//				createdCallback: {value: (constructor) function() {}}
				//				,attachedCallback: {value: function() {}}
				//			}
				//		)
				//	}
				//-- end comment --*/
				spotter.components.registerComponent(tagName);
			}
			else{
				onComponentsReady.push({tagName:tagName, initParams:initParams});
			}
		}
		
		__components.onReady = function(node, func){
			var i = readyNodes.indexOf(node);
			if(~i){//node previously readied
				func.call(node);
			}
			else{
				if(~(i = registeredNodes.indexOf(node))){//node was registered but not readied
					onReadyNodesTemp[i] = '';
					onReadyFuncs[i].push(func);
					console.debug('registered: index:', i, 'readyFuncs.length:', onReadyFuncs[i].length);
				}
				else{
					i = onReadyNodesTemp.push(node) - 1;
					onReadyFuncs[i] = [func];
					console.debug('unregistered: index:', i, 'readyFuncs.length:', onReadyFuncs[i].length);
				}
			}
		};
	
		//'this' within functions registered by 'onReady' will refer to the custom tags 
		__components.isReady = function(node){
			var i = registeredNodes.indexOf(node);
			//spotter.log('debug', {func:'components > isReady', vars:{wasRegistered:!!~i, node:node}});
			if(~i){
				readyNodes[i] = node;
				if(typeof onReadyFuncs[i] !== 'undefined') onReadyFuncs[i].forEach(function(func){func.call(node);});
				//console.debug('onReadyFuncs[i].length:', onReadyFuncs[i].length);
				return true;
			}
			else{
				i = registeredNodes.push(node) - 1;
				readyNodes[i] = node;
				//console.debug('onReadyFuncs[i].length:', onReadyFuncs[i].length);
				return false;
			}
		};
		
		//*** POLYFILL ***
		__components.afterPolyFillLoaded = (function(__private){return function(func){
			//http://webcomponents.org/polyfills/custom-elements/
			if(polyfillLoadedReady) func();
			__private.elemConstructorFuncs.push(func);
		};}(__private));
		document.addEventListener('WebComponentsReady', (function(__private){
			return function(){
				polyfillLoadedReady = true;
				__private.elemConstructorFuncs.forEach(function(func){ 
					func(); 
				}); 
			};
		}(__private)),false);
	
	// *** COMPONENTS ***
		
		// -- SLOTS --
			/*
			__components.spotterSlots = (function(placeholderFunc, parentFunc, dragFunc, startY){
				//THIS VERSION WORKS BUT MIGHT BE SLOWER
				//form: <spotter-slots><div class="reel"><div class="step"></div>...</div>(end of reel 1)<div class="reel">...</div>(end of reel 2)...</spotter-slots>
				//monitor changes in a reel using reel.addEventListener('change'...
				
				placeholderFunc = function(){console.debug('test');};
				dragFunc = placeholderFunc;
				parentFunc = function(e){dragFunc(e)};
				window.addEventListener('mousemove', parentFunc, 0);
				window.addEventListener('mouseup', function(){dragFunc=placeholderFunc;}, 0);
				var setupDragScroll = function(scrollBox){
					//scroll drag
					scrollBox.dragTo = function(e){
						scrollBox.scrollTop -= (- startY + (startY=e.clientY));
					};
					scrollBox.addEventListener('mousedown', function(e){
						dragFunc = this.dragTo;
						startY = e.pageY;
					}, false);
				};
				
				var setupReelSteps = function(reel,type){
					console.debug('setupReelSteps');
					var openTag='<div class="step">';
					var closeTag='</div>';
					var HTML="";
					if(type.indexOf(' to ')){
						type=type.split(' to ');
						var start = Number(type[0]);
						var end = Number(type[1]);
						
						if(start < end){ increment=1; }
						else{ increment=-1;	}
						
						end += end < 0 ? -1 : 1;//end is inclusive
						while(start !== end){
							HTML+=openTag+("0" + start).slice(-2)+closeTag;
							start+=increment;					
						}
						reel.innerHTML=HTML;
						return true;
					}
					
					switch(type){
						case 'months':
							break;
						case 'minutes':
							break;
						case 'hours':
							break;
					}
				};
				
				var getSnapToFunc = function(scrollBox){
					var previousFrame,ignore=false;
					scrollBox.snapTo = function(){
						if(ignore) return;
						ignore = true;
						scrollBox.scrollTop = scrollBox.currentFrame.offsetTop;
						scrollBox.parentNode.eventTriggers['change']();
						ignore = false;
					};
					return scrollBox.snapTo;
				};
				
				//a generic scroll detection function //takes a func to execute after a minInterval scroll distance change
				var timerScroll = function(scrollBox, doFunc){
					//scrollBox = element to monitor scroll, 
					//doFunc is the function to perform after interval and scroll. 'this' will be the scroll element (scrollBox)
					//minInterval is the minimum difference that must have occurred.
					var __private = {
						minInterval: 6 * scrollBox.frameHeight,
						start: new Date().getTime(),
						now: null,
						timer: null,
						changeTime: 0,
						doFunc: (!Array.isArray(doFunc) ? [doFunc] : doFunc)
					};
					
				   __private.process = function(e){
						__private.timer = function(e){ 
							__private.doFunc.forEach(function(func){
								func.call(__private.scrollBox,e);
							});
							return null; 
						}(e);
						__private.start = new Date().getTime();
					};
				   
					var __constructor = function(e){
						__private.scrollBox = this;
						__private.now = new Date().getTime();
						if(__private.timer === null){
							__private.changeTime = __private.now - __private.start;
							if( __private.changeTime > __private.minInterval){
								__private.process(e);
							}
							__private.timer = setTimeout(function(){
								__private.process(e);
							},__private.minInterval);
						}
					};
					
					scrollBox.addEventListener('scroll',__constructor,false);
					
					return __constructor;
				};
			
				var __constructor = function(slotsCont){			
					if(isPartOfTemplate(slotsCont)) return;
					if(!registerElem(slotsCont)) return;			
					
					//frameHeightPortion - positive decimal less than or equal to one. Determines what portion of unselected steps are shown.			
					var frameHeightPortion = slotsCont.hasAttribute('frame-portion') ? slotsCont.getAttribute('frame-portion') : 1;
					
					var reel = slotsCont.querySelector('.reel'), scrollBox, type;
					
					spotter.events.setEventTrigger(slotsCont, 'change');
					
					if(type = reel.getAttribute('type')){
						setupReelSteps(reel,type);
					}
			
					scrollBox = document.createElement('DIV');
					scrollBox.className = "spotter-hide-scroll";
					scrollBox.appendChild(reel);
					slotsCont.appendChild(scrollBox);
					slotsCont.className = slotsCont.className.addListValue('vertical', ' ');
					scrollBox.frameHeight = spotter.getHeight(reel.children[0]);
					setupDragScroll(scrollBox);
					
					Object.defineProperty(scrollBox, 'currentFrame', {
						get: (function(){
							var offsetDifference,previousValidOffsetDistance=1,validFrame;
							return function(){
								var child, x=0, l;
								previousValidOffsetDistance=1;
								validFrame=null;
								for(l=reel.children.length;x<l;x++){
									child=reel.children[x];
									offsetDifference = Math.abs(scrollBox.scrollTop - child.offsetTop);
									//console.log('frameHeight:',frameHeight,'offsetDifference:',offsetDifference,'text',child.innerHTML);
									if(offsetDifference <= this.frameHeight){
										if(offsetDifference <= previousValidOffsetDistance){ return child; }//if reel didnt move enough to change
										else if(validFrame !== null && offsetDifference > previousValidOffsetDistance){ this.value=''; return validFrame; }
										previousValidOffsetDistance = offsetDifference;
										validFrame = child;
									}
								}
								this.value=spotter.getFirstTextNode(child);
								return validFrame;//return this if nothing else found.
							};
						}()),
						set: (function(){
							return function(newValue){ scrollBox.scrollTop = newValue.offsetTop + (frameHeightPortion * this.frameHeight); };
						}())
					});
					
					var setupReel = function(){
						var totalScrollDistance = 0, 
							previousScrollPos = scrollBox.scrollTop, 
							cycleActive,
							scrollTop,
							scrollLimitTop = 2 * scrollBox.frameHeight,
							scrollLimitBottom = 3 * scrollBox.frameHeight//this is needed because the scrollTop way of thinking doesnt account for the height of the last frame
						;
						//setup the initial cycled slides
						reel.insertBefore(reel.children[reel.children.length-1],reel.children[0]);
						reel.insertBefore(reel.children[reel.children.length-1],reel.children[0]);
						scrollBox.scrollTop = scrollBox.scrollTop + scrollLimitTop;
						
						var visibleSlides = spotter.getHeight(slotsCont) / scrollBox.frameHeight;
						console.debug(visibleSlides);
						
						scrollBox.cycleSlides = function(){
							//scrolling action can occur faster than this function can keep up. So if the scrollposition is reaching close to the bottom or the top, an automatic cycling needs to occur.
							if(cycleActive){ return; }
							cycleActive = true;
							scrollTop = scrollBox.scrollTop;
							if(scrollTop >= (scrollBox.scrollHeight - scrollLimitBottom)){
								reel.appendChild(reel.children[0]);
								reel.appendChild(reel.children[0]);
								reel.appendChild(reel.children[0]);
								scrollBox.scrollTop = scrollBox.scrollTop - scrollLimitBottom;
							}
							else if(scrollTop < scrollLimitTop){
								reel.insertBefore(reel.children[reel.children.length-1], reel.children[0]);
								reel.insertBefore(reel.children[reel.children.length-1], reel.children[0]);
								scrollBox.scrollTop = scrollBox.scrollTop + scrollLimitTop;
							}
							else{
								totalScrollDistance += scrollTop - previousScrollPos;
								//console.log('totalScrollDistance',totalScrollDistance);
								if(totalScrollDistance >= this.frameHeight){
									reel.appendChild(reel.children[0]);
									scrollBox.scrollTop = scrollBox.scrollTop - this.frameHeight;
									totalScrollDistance = totalScrollDistance - this.frameHeight;
									//console.log('top has been moved to bottom leaving a total scroll distance of ',totalScrollDistance);
								}
								else if(totalScrollDistance <= (0 - this.frameHeight)){
									reel.insertBefore(reel.children[reel.children.length-1], reel.children[0]);
									scrollBox.scrollTop = scrollBox.scrollTop + this.frameHeight;
									totalScrollDistance = 0 - (Math.abs(totalScrollDistance) - this.frameHeight);
									//console.log('bottom frame moved to top leaving a total scroll distance of ',totalScrollDistance);
								}
							}
							previousScrollPos = scrollTop;
							cycleActive = false;
						};
						scrollBox.addEventListener('scroll', scrollBox.cycleSlides, false);//this event cycles the frames
					};
					setupReel();
					new timerScroll(scrollBox, getSnapToFunc(scrollBox));//scroll event only snaps the frames and triggers change
				}
				
				var slots = document.querySelectorAll('spotter-slot'), l = slots.length;
				while(--l > -1){ __constructor(slots[l]); }
				
				__components.afterPolyFillLoaded(function(){			
					var SpotterSlotPrototype = Object.create(HTMLDivElement.prototype);
					SpotterSlotPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterSlot = document.registerElement('spotter-slot', {
						prototype: SpotterSlotPrototype,
						extends: 'div'
					});
					
					//complete the initial tags
					var els = document.querySelectorAll('spotter-slot'),l=els.length,input,el,popMenu,opts;
					while(--l > -1){//for each modal-select
						__constructor(els[l]);
					}
					spotter.events.fire(spotter.events('slots-ready'));
				});
				
				return __constructor;
			}());
			*/
			__components.slots = (function(){
				var buildReel = function(cont){
					var scrollBox=document.createElement('DIV'),
						reel=document.createElement('DIV');
					
					scrollBox.className="spotter-hide-scroll";
					reel.className="reel";
					
					var frameValues={}, frames=cont.getAttribute('type'), frame, value;
			
					if((frames=frames.split(" to ")).length === 2){
						frames[1]=Number(frames[1]);
						for(var x=Number(frames[0]); x<=frames[1]; x++){
							(frame=document.createElement("DIV")).className="step";
							value=("0" + x).slice(-2);
							frame.innerHTML='<span class="center">'+value+'</span>';
							frame.value=value;
							frameValues[value]=frame;
							reel.appendChild(frame);
						}
					}
					else{
						return false;
					}
					scrollBox.appendChild(reel);
					cont.appendChild(scrollBox);
					return [scrollBox,reel,frameValues];
				};
				
				var __constructor = function(slotsCont){  
					if(typeof slotsCont === "undefined") slotsCont = this;
					if(isPartOfTemplate(slotsCont)) return;
					if(!registerElem(slotsCont)) return;
					
					var frameValues, scrollBox, reel, result;
					if((result=buildReel(slotsCont))===false){ console.error('build reel for slots failed',slotsCont); return false; }
					else{ scrollBox=result[0]; reel=result[1]; frameValues=result[2]; }
					
				    var snapToActive     = false,
						cycleActive      = false,
						changeEvt        = spotter.events.setEventTrigger(slotsCont, 'change'),
						scrollBoxHeight	 = spotter.getHeight(scrollBox),
						frameHeight 	 = reel.children[1].offsetTop,//snapTo & cycleSlides also set this bc of issues with getting constant height
						visibleFrames	 = Math.round(scrollBoxHeight/frameHeight),
						last			 = reel.children.length - 1,
						reelHeight		 = frameHeight * (last + 1),
						maxScrollHeight  = reelHeight - scrollBoxHeight,
						previousFrame	 = null,
						offsetFrames	 = Number(slotsCont.getAttribute('offset-frames')) || 0;//(attr) offset-frames=integer if the top most frame IS NOT the frame to retrieve value
					
					/*
					console.log(' - frameHeight:',frameHeight);
					console.log(' - scrollBoxHeight:',scrollBoxHeight);
					console.log(' - visibleFrames:',visibleFrames);
					console.log(' - reelHeight:',reelHeight);
					console.log(' - maxScrollHeight:',maxScrollHeight);
					*/
					
					var disableScrollEvent=function(){
						scrollBox.removeEventListener('scroll', cycleSlides, false);
						scrollBox.disableScrollEnd();
					};
					
					var enableScrollEvent=function(){
						scrollBox.addEventListener('scroll', cycleSlides, false);
						scrollBox.enableScrollEnd();
					};
					
					var snapTo = function(elem){
						if(snapToActive) return;
						snapToActive=true;
						frameHeight = reel.children[1].offsetTop;
						//console.log('snapTo');
						//console.log(' - frameHeight:',frameHeight);
						if(typeof elem === 'undefined' || typeof elem.tagName === 'undefined'){
							var index = Math.round(scrollBox.scrollTop / frameHeight);
							elem = reel.children[index];
						}
						disableScrollEvent();
						enforceBottomLimit(undefined, elem);
						enforceUpperLimit(undefined, elem);
						scrollBox.scrollTop = elem.offsetTop;
						previousScrollPos=scrollBox.scrollTop;
						enableScrollEvent();
						if(previousFrame!=elem){ slotsCont.eventTriggers['change'](); previousFrame=elem; }
						snapToActive=false;
				    };
				    
				    var previousScrollPos = scrollBox.scrollTop;
				    var cycleSlides = function(e){
						if(cycleActive){ return; }
						cycleActive = true;
						frameHeight = reel.children[1].offsetTop;
						var scrollChg = scrollBox.scrollTop - previousScrollPos;
						if(Math.abs(scrollChg) > frameHeight){
							console.log('cycleSlides');
							console.log(' - scrollChg = '+scrollChg);
							//console.log(' - scrollTop = '+scrollBox.scrollTop);
							console.log(' - frameHeight = '+frameHeight);
							//console.log(' - calc frameHeight = '+spotter.getHeight(reel.children[0]));
							//console.log(' - previousScrollPos = '+previousScrollPos);
							var frameChg = scrollChg / frameHeight;
				            if(scrollChg > 0){
								cycleDown(Math.floor(frameChg));
				            }
				            else{
								cycleUp(Math.ceil(frameChg));
				            }
				        }
						cycleActive = false;
				    }
				    
				    var cycleUp = function(count, ignoreCycle){//count assumed negative (upwards scroll)
						console.log('cycleUp');
						while(count < 0){
							scrollBox.scrollTop += frameHeight;
							if(ignoreCycle !== true) previousScrollPos = Math.ceil(scrollBox.scrollTop / frameHeight) * frameHeight;
							reel.insertBefore(reel.children[last], reel.children[0]);
							count++;
						}
				    };
				    
				    var cycleDown = function(count, ignoreCycle){//count assumed positive (downwards scroll)
						console.log('cycleDown');
						while(count > 0){
							scrollBox.scrollTop -= frameHeight;
							if(ignoreCycle !== true) previousScrollPos = Math.floor(scrollBox.scrollTop / frameHeight) * frameHeight;
							reel.appendChild(reel.children[0]);
				            count--;
				        }
				    };
					
					//these functions ensure that the necessary number of frames are on top/bot for scrolling to be effective
					var enforceBottomLimit=function(index, elem){//leave index blank if using scrollTop
						if(typeof elem !== 'undefined' && typeof index === 'undefined'){
							var d=elem.offsetTop, mH=(last + 1) * frameHeight, r=mH - (visibleFrames + 2) * frameHeight;
							console.log('enforceBottomLimit:','offsetTop:',d,'maxHeight:',mH,'range:',r);
							if(d >= r){
								var cycle=(visibleFrames + 2) - Math.ceil((d - r) / frameHeight);
								console.log(' - cycleDown:',cycle);
								cycleDown(cycle);
							}
							
							if(d >= mH){ cycleDown(Math.ceil((mH - d) / frameHeight)); }else{ return; }
						}
						else if(typeof index!=='undefined'){
							if((last - index) <= (visibleFrames + 2)){ cycleDown((visibleFrames + 2) - (last - index)); }
						}
						else{
							console.error('enforce lower limit for slots ',slotsCont,' index is required');
						}
					};
					
					var enforceUpperLimit=function(index, elem){
						if(typeof elem !== 'undefined' && typeof index === 'undefined'){
							var d = elem.offsetTop;
							if(d < (2 * frameHeight)){ index = 2 - Math.floor(d/frameHeight); console.log('enforceUpperLimit:','index:',index,'offsetTop:',d); }else{ return; }
						}
						if(typeof index!=='undefined'){
							if(!(index > 1)){ cycleUp(-1 * (2 - index)); }
						}
						else{
							console.error('enforce upper limit for slots ',slotsCont,' index is required');
						}
					};
					
					/* PUBLIC METHODS */
				
					slotsCont.getValue = function(){
						console.log('get slots');
						var targ=previousFrame;
						if(offsetFrames){
							for(var x=0; x<offsetFrames; x++){
								targ=targ.nextSibling;
							}
						}
						return targ.value;
					};
					
					slotsCont.setValue = function(newValue){
						var l = reel.children.length, sibling, targ=frameValues[newValue];
						console.log('set slots '+slotsCont.className+' to '+newValue,' target elem:',targ);
						if(targ){
							if(offsetFrames > 0){
								for(var i=0; i<offsetFrames; i++){
									sibling=targ.previousSibling;
									if(!sibling){
										cycleUp(-1, true);
										sibling=targ.previousSibling;
										x++;
									}
									targ=sibling;
								}
							}
							snapTo(targ);
							return true;
						}
						else{
							console.error('Set value on ',slotsCont,' failed. The value '+newValue+' was not found as an option', new Error().stack);
							return false;
						}
					};
					
					//ELEMENT SETUP
					
					var l = last+1, startIndex=null, defaultFrame=null;
					for(var x=0; x<last; x++){
						child = reel.children[x];
						if(child.hasAttribute('start')){
							startIndex=x;
							defaultFrame=child;
						}
					}
					if(defaultFrame===null){
						startIndex=0;
						defaultFrame=reel.children[0];
					}
					
					//a minimum of 2 frames must be above and below the start frame
					enforceUpperLimit(startIndex);
					enforceBottomLimit(startIndex);
					
					scrollBox.scrollTop=defaultFrame.offsetTop;
					previousFrame=defaultFrame;
					
					spotter.events.scrollEndEventv2(scrollBox, 800);
					scrollBox.addEventListener('scrollEnd', snapTo, false);
					enableScrollEvent();	
				};
				/*
				__components.afterPolyFillLoaded(function(){			
					var SpotterSlotPrototype = Object.create(HTMLDivElement.prototype);
					SpotterSlotPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterSlot = document.registerElement('spotter-slot', {
						prototype: SpotterSlotPrototype,
						extends: 'div'
					});
					
					//complete the initial tags
					Array.prototype.forEach.call(document.querySelectorAll('spotter-slot'), __constructor);
					spotter.events.fire(spotter.events('slots-ready'));
				});
				*/
				registerSpotterComponent('spotter-slot', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{createdCallback: {value: __constructor}}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-slot')).forEach(__constructor);
				spotter.events.fire(spotter.events('slots-ready'));
				
				return __constructor;
			}());	
		// -- END SLOTS --

		// -- MODAL SELECT --
			__components.popSelect = (function(){
			//<spotter-modal-select (optional)data-modal-select="options to pull" >
			//(modal-select).input.addEventListener('change'... to detect a value change
			//(modal-select).selected to get the selected option
			//(attr) deselect="disabled" if a list item must always be selected
			//(attr) multi-select="none|valueList" if all options are exclusive set to none otherwise set a list of values that are selectable together - individual rows can also have exclusive = true/false
			//(attr) text-target="ElemId" to target a specific element to receive selected items text
			//(attr) data-modal-title="string" set title of modal menu
			//(attr) data-template="custom template name" - defaults to "spotter-template" - the template for the menu
			//(attr) data-option-template="options template name" - defaults to "modal-select" - the template to use for the individual options
				var __factory = {instances:[],menus:[],inputs:[]};
				
				//return setup function to be run when modal menu is created ie popMenu.onMenu(
				__factory.setupMenu = function(cont, input){
					
					spotter.events.setEventTrigger(input, 'change');//input 'change' event
					var selected=[]//currently selected option(s)
						,multiSelect = cont.getAttribute('multi-select')
						,deselect = (cont.getAttribute("deselect") === "disabled" ? false : true)
						,textTarget;
					
					//where selection choice will be shown
					if(textTarget = cont.hasAttribute('text-target')){
						if(!(textTarget = document.getElementById(textTarget))){
							console.warn('no target element with id '+cont.getAttribute('text-target')+' was found for '+cont);
							return false;
						}
					}
					else{
						textTarget = cont.querySelector('.text-target');
					}
		
					return function(modalMenuVars){
						var options = []
							,initialSelected = modalMenuVars.menus[0].querySelector('[selected]');
		
						Array.prototype.push.apply(options, modalMenuVars.menus[0].children);
						cont.options = {};
						options.forEach(function(option){
							cont.options[option.getAttribute('data-value')] = option;
						});
						
						var setSelected = function(){
							var c;
		
							if(~(c = selected.indexOf(this))){//previously selected
								if(deselect !== true) return false;
								selected.splice(c,1);
								input.value=input.value.removeListValue(this.parseData.value);
								spotter.toggle.class.remove(this,'selected');
								if(textTarget) spotter.firstTextNodeRemoveValue(textTarget, this.parseData.name);
							}
							else{
								if(
									multiSelect === 'none' 
									|| this.parseData.special==='exclusive' 
									|| this.hasAttribute('exclusive') 
									|| ( selected.length && (selected[0].parseData.special==='exclusive' || selected[0].hasAttribute('exclusive')))
								){//is exclusive
									spotter.toggle.class.remove(selected,'selected');
									selected=[this];
									input.value=this.parseData.value;
									spotter.toggle.class.add(this,'selected');
									if(textTarget) spotter.setFirstTextNode(textTarget, this.parseData.name);
								}
								else{
									selected.push(this);
									input.value=input.value.addListValue(this.parseData.value);
									spotter.toggle.class.add(this,'selected');
									if(textTarget) spotter.firstTextNodeAddValue(textTarget, this.parseData.name);
								}
							}
							input.eventTriggers['change']();
						};
							
						spotter.events.setDelegatedEvent('click', modalMenuVars.menus[0], setSelected);
						
						Object.defineProperty(cont, 'value', {
							get: function(){ return this.input.value; },
							set: function(newValue){
								if(o = this.options[newValue]){
									setSelected.call(o);
								}
								else{
									console.log('the value '+newValue+' was not found in the list of options for modal select');
								}
							}
						});
						
						if(initialSelected !== null){
							initialSelected.click();
							cont.input.eventTriggers['modal-select-change']();
						}
					};
				};
				
				var __constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;
					
					//multi-select attribute lets selections be groupable instead of exclusive
					var exclusive = null
						,cache = cont.getAttribute('cache-name')
						,inputId = cont.getAttribute('targ-input')
						,targInput = getElemByIdOrBuildIfFail(inputId, '<input type="hidden"/>')
						,optTemplate = cont.getAttribute('data-option-template') || 'modal-select'
						,name
						,opts = cont.querySelectorAll('spotter-option')
						,o
						,popMenu
						,title;
		
					if((typeof targInput !== "object") || (targInput.tagName !== 'INPUT' && !(targInput = targInput.querySelector('input')))){
						console.warn('target for modal select must either be an input or contain an input', "stack:", new Error().stack);
						return false;
					}
					
					if(inputId === null){
						if(name = cont.getAttribute('data-input-name')) targInput.name = name;
						if(name = cont.getAttribute('data-input-id')) targInput.id = name;
						cont.appendChild(targInput);
					}
					if(!targInput.id && !targInput.name) targInput.id = spotter.makeId(5);
					
					cont.input = targInput;
					targInput.popChangeEvt = spotter.events.setEventTrigger(targInput,'modal-select-change');
					
					// * menu template *
					targInput.popSelectTemplate = cont.querySelector(cont.getAttribute('data-template') || 'spotter-template');
					
					// * setup options *
					if(opts !== null && (o = opts.length) > 0){//if spotter-options are given, use them
						opts = __components.spotterOptions(opts, cont, {value:'value',abbr:'abbr',name:'innerHTML',exclusive:'exclusive'});
						targInput.value = opts.selected.value;
						
						//static modal menu
						popMenu = new spotter.popMenu('modal-select-'+inputId)
							.useTemplate(optTemplate)
							.bindDataToParseTemplate(opts.rows);
					}
					else if(url = cont.getAttribute('options-src')){//else if a remote address is given pull from remote
						if(cache) cache = {name:cache, type:cont.getAttribute('cache-type')||"local", expiration:cont.getAttribute('cache-time')||48*3600};
						
						//ajax modal menu
						popMenu = new spotter.popMenu('modal-select-'+inputId)
							.useTemplate(optTemplate)//use static options set in markup
							.bindDataToRemoteRequest({}, url, cache);
					}
					else{//otherwise error
						console.warn('modal select menus require an options source or for spotter options nodes within the modal select');
						return false;
					}
					
					if(title = cont.getAttribute('data-modal-title')) popMenu.setTitle(title);
		
					popMenu.onMenu(__factory.setupMenu(cont,targInput))
						.onOpen((function(targInput, popMenu){
							return function(arg){
								targInput.formerValue = targInput.value;
							};
						}(targInput, popMenu)))
						.onClose((function(targInput){
							return function(){
								if(targInput.formerValue !== targInput.value){
									targInput.eventTriggers['modal-select-change'](); 
								}
							};
						}(targInput)))
						.attachTo(cont)
						.loadTemplate();
					
					__factory.instances.push(cont);
					__factory.inputs.push(targInput);
					__factory.menus.push(popMenu);
		
					__components.isReady(cont);
				};
				
				__constructor.onClose = function(el,func){
					var i;
					if((i = __factory.instances.indexOf(el)) > -1){
						var newFunc = function(){ func.call(__factory.instances[i],__factory.inputs[i]) };
						__factory.menus[i].onClose(newFunc);
					}
				};
				
				__constructor.onOpen = function(el,func){
					var i;
					if((i = __factory.instances.indexOf(el)) > -1){
						var newFunc = function(){ func.call(__factory.instances[i],__factory.inputs[i]) };
						__factory.menus[i].onOpen(newFunc);
					}
				};	
				
				//add import to head
				var link = document.createElement('link');
				link.href = "/js/spotter/templates/modal-select.html";
				link.rel = "import";
				document.getElementsByTagName('HEAD')[0].appendChild(link);
				/*
				__components.afterPolyFillLoaded(function(){			
					var SpotterModalSelectPrototype = Object.create(HTMLDivElement.prototype);
					SpotterModalSelectPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterModalSelect = document.registerElement('spotter-modal-select', {
						prototype: SpotterModalSelectPrototype,
						extends: 'div'
					});
					
					//complete the initial tags
					var els = document.querySelectorAll('spotter-modal-select'),l=els.length,input,el,popMenu,opts;
					while(--l > -1){//for each modal-select
						__constructor(els[l]);
					}
					spotter.events.fire(spotter.events('modal-select-ready'));
				});
				*/
				registerSpotterComponent('spotter-modal-select', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{createdCallback: {value: __constructor}}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-modal-select')).forEach(__constructor);
				spotter.events.fire(spotter.events('modal-select-ready'));
				
				return __constructor;
			}());
		// -- END MODAL SELECT --
		
		// -- AJAX LIST --
			//filler - save ajax lists and then construct them once search and sort has loaded
			var ajaxListReadyElems = [];
			//pre constructor - changes to ajaxList function once DataManager has loaded
			/*__components.ajaxList = function(el){
				if(typeof el === "undefined") el = this;
				//if(!(el && el.tagName === '') && this.tagName === 'SPOTTER-AJAX-LIST') el = this;
				console.log('ajaxList __preConstructor: \n', 'el:', el, ' \n', 'ajaxListReadyElems.indexOf(el):', ajaxListReadyElems.indexOf(el)); 
				if(isPartOfTemplate(el)) return;
				if(~ajaxListReadyElems.indexOf(el)) return;		
				ajaxListReadyElems.push(el);
				console.log('ajaxList __preConstructor: \n', 'el:', el, ' \n', 'ajaxListReadyElems:', ajaxListReadyElems); 
			};*/
			//var ajaxList = function(){//sets components.ajaxList to instead be a constructor after search and sort has loaded
				//element pulls in data from 'src' and parses it into 'html'. Maintains a data object relating to that 'html' and provides event hooks for adding, deleting, sorting and searching
				// the html.
				//attributes:
					//src 			= (optional*) (string) url to retrieve json data
					//total-limit 	= (optional) (integer) total results before no more will load (null or zero for unlimited)
					//page-limit 	= (optional) (integer) number of listings per load (per page) (null or zero for unlimited)
					//template		= (optional) (string) name of html import template. If not set or null a spotter-template element must be set as a child of the spotter-ajax-list
					//id-field		= (optional) (string) the field name to be used as an index for the search and sort object
					
					//* - leave null and use el.refresh({data:[... to use static data
					
				//events
					//selected element: 'selectedChange' event - this.selectedListItems =array[selected list items] will be the newly selected list item.
					//element ready: 'ready'
				//if(spotter.require.isReady('DataManager')){
					__components.ajaxList = (function(){
						var __Factory = {
							defaultErrorHandler: function(response){ console.error('An error occurred retrieving data for ajax list: \n', 'response: \n', response); }
						};
						
						var __Constructor = function(el){
							if(!spotter.require.isReady('DataManager')){
								ajaxListReadyElems.push(el);
								return;
							}
							
							if(typeof el === "undefined") el = this;
							if(isPartOfTemplate(el)) return;
							if(!registerElem(el)) return;
							
							// ** PRIVATE **
							var lastRequestURL
								,limitQueryString
								,startQueryString
								,ignoreQueryString
								,queryParams		= {}
								,rawTemplate
								,templateImportName
								,templateSource
								,importSource
								,onTemplateLoad = [] //functions to run when template has loaded
								,currentRequestedData
								,mostRecentResponse
								,selectDisabled = false
								,stopNewRequests = false
								,dataReady 		= false
								,templateReady 	= false
								,suspended		= (el.hasAttribute('delay-activation') ? true : false)//to delay loading the list until suspension is removed (like waiting for form input)
								,dataSrc 		= el.getAttribute('src')//set src="form" and form="form id" to use a form to get the list data
								,totalLimit 	= el.getAttribute('total-limit')//total number of rows cannot exceed limit
								,pageLimit		= el.getAttribute('page-limit')//# rows per request - omit if no limit
								,initialSort 	= el.getAttribute('sort')
								,cache			= el.getAttribute('cache-name')//"(string) name" - will be stored under name in storage
								,deselect		= (el.hasAttribute('no-deselect') ? false : true)
								,idField		= el.getAttribute('id-field')
								,form
								,errorHandler 	= __Factory.defaultErrorHandler
								,indexedFields 	= el.getAttribute('index-fields')
								,hiddenListItems= new fastArray(100);
							
							if(totalLimit !== null) totalLimit = Number(totalLimit);
							if(pageLimit !== null) pageLimit = Number(pageLimit);
							if(indexedFields !== null) indexedFields = indexedFields.split(',');
		
							//cache-type="[local|session]" - the type of cache, local for permanent, session until browser close.
							//cache-time=(integer) seconds - time range cache is valid
							if(cache !== null) cache = {
								name: cache,
								type: el.getAttribute('cache-type') || "session",
								expiration: el.getAttribute('cache-time') || 3600 * 24
							};
							
							// ** PUBLIC **
							spotter.events.setEventTrigger(el, 'ready');
							spotter.events.setEventTrigger(el, 'selectedChange');
							spotter.events.setEventTrigger(el, 'moreResults');
							
							/*spotter.log('debug', {func:'ajax list', msg:'options being sent to remote data', vars:{
								URL: dataSrc, 
								name: el.id||undefined, 
								idField: el.getAttribute('id-field'), 
								pageLimit: pageLimit, 
								totalLimit: totalLimit, 
								indexedFields: indexedFields
							}});*/
							
							//*** EVENT FUNCS ***
							
								//add the attribute 'groupable' if the list item should be non-exclusive when selected
								var setSelected = function(){
									if(selectDisabled === true) return;
									
									if(~el.disabledListItems.indexOf(this)){ 
										console.log('list item is currently disabled'); 
										return;
									}
		
									var i;
									if(~(i = el.selectedListItems.indexOf(this))){
										if(deselect || this.hasAttribute('groupable')){ 
											spotter.toggle.class.remove(el.selectedListItems.splice(i,1), 'selected'); 
										}
										else{
											spotter.toggle.class.remove(el.selectedListItems, 'selected');
											el.selectedListItems = [this];
											spotter.toggle.class.add(this, 'selected');
										}
									}
									else{
										if(this.hasAttribute('groupable') && el.allowGroupSelect === true){
											el.selectedListItems.push(this);
										}
										else{
											spotter.toggle.class.remove(el.selectedListItems, 'selected');
											el.selectedListItems = [this];
										}
										spotter.toggle.class.add(this, 'selected'); 
									}
									el.eventTriggers['selectedChange']();
								};
							
							//*** HELPERS ***
							
								//helper - parse template to spotter.templates working object
								var setTemplate = function(template, templateName){
									spotter.templates.setup(template, templateName);
									templateReady = true;
									onTemplateLoad.forEach(function(func){
										func();
									});
								};
								
								//helper - manage 'load more' and 'no more' buttons and prevent/allow new requests. 
								//'true' for no more results and 'false' for more results
								var noMoreResults = function(bool, source){
									if(bool === true){
										console.log('no more results'+(source ? ' - '+source : ''));
										spotter.toggle.hide(el.loadMoreButton);
										spotter.toggle.show(el.endResults);
										stopNewRequests = true;
										if(form) form.validator.disableSubmit = true;
									}
									else if(bool === false){
										spotter.toggle.show(el.loadMoreButton);
										spotter.toggle.hide(el.endResults);
										stopNewRequests = false;
										if(form) form.validator.disableSubmit = false;
									}
								}
			
								//helper - parse data into html/list elements			
								var createListings = function(rows){
									//console.debug('components -> createListings: \n', 'rows length: ', Number(rows.length));
									var cont = document.createElement('SPAN'), l;
									cont.className = 'page_'+el.dataManager.data.master.length;
									spotter.templates.append(templateName, rows, cont, el.id === 'group_contacts');
									el.listCont.appendChild(cont);
									l = cont.children.length;
									for(var x=0, child=cont.children[x], add=spotter.toggle.class.add;x<l;child=cont.children[++x]){
										add(child, 'spotter-li');
										rows[x]._node_ = child;
										child.listData = rows[x];
									}
									//console.debug('components -> createListings: \n', 'cont:', cont, ' \n', 'children length:', cont.children.length);
									return cont;
								};
								
								//helper - add limit,page,search,sort standard GET params to form action before submission
								var setFormRequestURL = function(){
									form.action = form.defaultAction + '&' + startQueryString + '&' + limitQueryString;
									var searchCond 	= el.dataManager.getLastSearchParams();
									if(searchCond[1].length) form.action + '&searchField=' + searchCond[0].encodeURLParam() + '&searchTerm=' + searchCond[1].encodeURLParam();
									var sortCond	= el.dataManager.getLastSortParams();
									if(sortCond[0].length > 0) form.action + '&sortParams=' + sortCond[0].map(function(f,i){return f.encodeURLParam() + '+' + (sortCond[1][i] < 0 ? 'desc' : 'asc')}).join(',');
								};
								
								//helper - setup data source form to use spotter forms
								var setupFormAsDataSrc = function(){
									if(!(form = document.getElementById(el.getAttribute('form')))){ console.error('the id ',el.getAttribute('form'),' does not have an associated form element',el); return; }
									if(!form.hasAttribute('data-ajax-submit')) form.setAttribute('data-ajax-submit',true);
									form.defaultAction = String(form.action);
									if(form.defaultAction.indexOf('?') === -1) form.defaultAction += '?cache=1';
									var validator = spotter.form(form, {success: routeRemoteRequestResponse});
									form.addEventListener('change', function(){
										suspended = true;
										el.refresh();
										suspended = false;
									}, false);
								};
		
								var setRequestParams = function(){
									var dataManager = this.dataManager;
									
									if(dataManager.search.active){
										searchHistory = dataManager.search.history.last();
										dataManager.setParams({searchField:searchHistory['field'].join(',').encodeURLParam(), searchTerm:searchHistory['terms'].join(',').encodeURLParam()});
									}
									
									var sortCond = dataManager.sortParams;
									if(sortCond.active) dataManager.setParams({sortParams:sortCond.fields.map(function(f,i){return f.encodeURLParam() + '+' + (sortCond.directions[i] < 0 ? 'desc' : 'asc')}).join(',')});
								};
		
							// *** METHODS *** run from element
								
								//adds the 'hide' class to list items with searchField values equals any of findValues
								el.hideListItems = function(searchField, findValues){
									var rows = el.dataManager.search.exact(searchField, findValues)
										,l = rows.length
										, x = 0
										,addClass = spotter.toggle.class.add;
										
									for(x;x<l;x++){
										node = rows[x]._node_;
										addClass(node, 'hide');
										hiddenListItems.push(node);
									}
									return rows;
								};
								
								//should be called with no arguments - removes 'hide' class from all hidden list items
								el.unhideListItems = function(){
									var l = hiddenListItems.length, x = 0, removeClass = spotter.toggle.class.remove;
									for(x;x<l;x++){
										removeClass(hiddenListItems.values[x], 'hide');
									}
									hiddenListItems.clear();
								};
								
								// -- disabled list items are removed from selected list items while hidden items are not --
								//disables all currently selected list items
								el.disableSelectedListings = function(){
									var li;
									while(li = el.selectedListItems.pop()){
										if(!~el.disabledListItems.indexOf(li)){
											li.className = li.className.addListValue('disabled', ' ');
											li.className = li.className.removeListValue('selected', ' ');
											el.disabledListItems.push(li);
										}
									}
								};
								
								//(string)(optional)field - search field, (string|array)(optional)fieldValues - values to search for - if field/values not given all listings will be disabled
								el.disableListings = function(field, fieldValues){
									
									var rows
										,i
										,disabled = el.disabledListItems
										,selected = el.selectedListItems
										,li
										,l
										,row;
										
									if(typeof field === 'string' && typeof fieldValues !== 'undefined'){
										rows = el.dataManager.search.exact(field, fieldValues);
										l=rows.length;
									}
									else{
										var master = el.dataManager.data.master;
										rows = master.values;
										l = master.length;
									}
		
									for(var x=0;x<l;x++){
										row = rows[x];
										li = row._node_;
										if(!li) console.log('row:', row);
										if(!~disabled.indexOf(li)){
											li.className = li.className.addListValue('disabled', ' ');
											if(~(i = selected.indexOf(li))){
												li.className = li.className.removeListValue('selected', ' ');
												selected.splice(i,1);
											}
											disabled.push(li);
										}
									};
								};
								
								//(string)(optional)field - search field, (string|array)(optional)values - values to search for - if field/values not given all listings will be enabled
								el.enableListings = function(field, values){
									var i, li, l, x = 0, rows, disabledListItems = el.disabledListItems;
									
									if(typeof field === 'string' && typeof values !== 'undefined'){
										rows = el.dataManager.search.exact(field, values);
		
										for(l=rows.length;x<l;x++){
											li = rows[x]['_node_'];
											i = disabledListItems.indexOf(li);
											li.className = li.className.removeListValue('disabled', ' ');
											disabledListItems.splice(i, 1);
										}
									}
									else{
										while(li = disabledListItems.pop()){
											li.className = li.className.removeListValue('disabled', ' ');
										}
									}
								};
								
								//removes listings by field and value then refreshes all listings to reflect the changes. This does not communicate remotely.
								//use field = _node_ and fieldValue = elem to target a single list item
								el.deleteListingsByFieldValue = function(field,fieldValues){
									var deleted = el.dataManager.deleteByField(field, fieldValues)
										,nodes = [];
		if(deleted.length === 0) console.log('deleteListingsByFieldValue: \n', 'no listings found', ' \n', 'not found: ', this.dataManager.search.notFound, ' \n', 'arguments: ', arguments);
									deleted.forEach(function(row){
										nodes.push(row._node_);
										delete row._node_;
									});
									el.deleteListingsHelper(nodes);
								};
								
								//de reference and remove
								el.deleteListingsHelper = function(nodes){
									if(nodes === undefined) console.log('nodes sent to deleteListingsHelper undefined');
									if(!Array.isArray(nodes)) nodes = [nodes];
									nodes.forEach(function(node){
										delete node.listData._node_;
										delete node.listData;
										spotter.deleteElement(node);
									});
								};
			
								el.addListingsFromExternal = function(rows){
									if(!Array.isArray(rows)) rows = [rows];
									console.log('addListingsFromExternal');
									var _DM = this.dataManager, row;
									_DM.addData(rows);
									rows = _DM.data.recent.new.slice(0);
									console.log('rows:',rows);
									var span = createListings(rows);
								};
								
								//show only listings that were found for a datamanager search of type allMatch or anyMatch
								el.showSearchResults = function(){
									var master = el.dataManager.data.master
										,allNodes = master.values
										,searchResults = this.dataManager.search.results
										,disabled = el.disabledListItems
										,selected = el.selectedListItems
										,x = 0
										,l = master.length
										,row
										,li;
		
									console.log('components@showSearchResults: \n', 'master length:', l, ' \n', 'searchResults:', searchResults);
									for(x;x<l;x++){
										row = allNodes[x];
										li = row._node_;
										d = ~disabled.indexOf(li);
										sr = ~searchResults.indexOf(row);
										
										if(!d && !sr){
											li.className = li.className.addListValue('disabled', ' ');
											if(~(i = selected.indexOf(li))){
												li.className = li.className.removeListValue('selected', ' ');
												selected.splice(i,1);
											}
											disabled.push(li);
										}
										else if(d && sr){
											li = rows[x]['_node_'];
											i = disabledListItems.indexOf(li);
											li.className = li.className.removeListValue('disabled', ' ');
											disabledListItems.splice(i, 1);
										}
									};
								};
								
								//return the objects associated with field = fieldValue
								el.retrieveInformationAboutListingsByField = function(field,fieldValues){
									if(typeof fieldValues === 'undefined'){
										data = el.dataManager.getValuesByField(field);
									}
									else{
										var data = el.dataManager.search.exact(field, fieldValues);
									}
									if(data.length > 0) return data;
									return false;
								}
								
								//returns an array of the list item elements associated with the field values
								el.getListingsByFieldValue = function(searchField, findValues){
									var rows = el.dataManager.search.exact(searchField, findValues);						
									return Array.getRowFieldValues(rows, '_node_');
								};
								
								// --------- modify query params --------
								//(objectOrRows)obj{prop=value... Use this if modifying a query param that isnt search or sort
								el.addRemoteRequestParams = function(obj){
									this.dataManager.setParams(obj);
								};
								
								//Use this to remove a query param that isnt search or sort
								el.removeRemoteRequestParam = function(str){
									this.dataManager.setParams([str]);
								};
								
								el.resetQueryParams = function(){
									this.dataManager.resetParams();
								};
			
								//alias for getMoreData
								el.getMoreListings = function(){
									getMoreData();
									el.eventTriggers['moreResults']();
									return el;
								};
								
								//removes all data in s&s with data[useField] === row[useField] including from indexed so if only one row is to be removed 'useField' should have a unique value (like 'id').
								el.updateSelectedListItems = function(rows, useField){
									var span, newListItem;
									var l, finalRow;//if rows length less than selected items length, make rows as long with last value of rows filling out the remainder
									if((l = el.selectedListItems.length) > rows.length){
										for(var x=0; x<l; x++){
											if(typeof rows[x] === 'object') finalRow = rows[x];
											rows[x] = finalRow
										}							
									}
									
									el.selectedListItems.forEach(function(listItem, i){
										span = createListings(rows[i]);
										newListItem = span.children[0];
										//rows[i]._node_ = newListItem;
										//newListItem.listData = rows[i];
										el.dataManager.overwriteByFieldValue(rows[i], useField, listItem.listData[useField]);
										el.dataManager.repeatLastSearchAndSort();
										spotter.replaceElement(listItem, newListItem);
										spotter.deleteElement(span);
										newListItem.click();
									});
								};
								
								el.dataReady = function(){
									return !!dataReady;
								};
								
								el.deselectAll = function(){
									var selectedListItems = el.selectedListItems, l = selectedListItems.length, li;
									while(--l > -1){
										li = selectedListItems.pop();
										li.className = li.className.removeListValue('selected', ' ');
									}
								};
								
								el.setErrorOnResponseHandler = function(func){
									if(typeof func !== 'function'){ console.error('set error response handler must be given a function \n', 'argument:', func, new Error().stack); return false; }
									
									errorHandler = func;
								};
								
								el.enableRequests = function(){
									stopNewRequests = false;
									return el;
								};
							
								//this must be run before updateListings.
								el.refresh = function(obj){//refresh takes object for changing list params						
									obj = obj || {};
									
									if(typeof obj.dataSrc !== "undefined") dataSrc = obj.dataSrc;
									if(typeof dataSrc !== "string"){ console.error("a datasrc was never specified for ajax list "+"<spotter-ajax-list"+(el.id?' id='+el.id:'')+(el.className?' class='+el.className:'')); return false; }
									
									templateReady = false;
									dataReady 	  = false;
									stopNewRequests = false;
									
									// obj[perPageLimit:int, limit: int, template: [import name], data: [array of objects | new src], onRefresh: func
									if(typeof obj.pageLimit !== "undefined") pageLimit = obj.pageLimit;
									if(typeof obj.totalLimit !== "undefined") totalLimit = obj.totalLimit;
									
									var __DM = this.dataManager;
									
									// setup data manager (if not previously setup)
									if(typeof __DM === "undefined"){
										__DM = this.dataManager = new spotter.RemoteData({
											URL: dataSrc,
											name: el.id||undefined,
											idField: el.getAttribute('id-field'),
											pageLimit: pageLimit,
											totalLimit: totalLimit,
											indexedFields: indexedFields
										});
										__DM.setSourceNode(el);
										el.selectedListItems = [];
										el.disabledListItems = [];
										el.allowGroupSelect = true;//false to stop groupable select, true to allow
										
										//handle special case for response result
										__DM.setParseResponse(function(response){
											//console.log('components -> setParseResponse: \n', 'response.results: \n', JSON.parse(JSON.stringify(JSON.parse(response).result)));
											response = JSON.parse(response);
											if(response.status === 'success' && response.result[0] === 'no more results'){
												response.status = 'error';
												noMoreResults(true, 'parseResponse');
											}
											return response;
										});
										
										//setup hook to datamanager search event
										__DM.addEventListener('search', hideListItemsAfterSearch, false);
								
										//setup hook to datamanager search RESET event
										__DM.addEventListener('searchReset', showAllListItems, false);
								
										//setup hook onto datamanager sort event
										__DM.addEventListener('sort', sortListItems, false);
								
										//hide get more button when total results greater than total limit
										__DM.addEventListener(__DM.events.limitReached, function(){noMoreResults(true, 'limitReached');});
								
										//hide get more button when number of results was less than the requested page limit
										__DM.addEventListener(__DM.events.resultsComplete, function(){noMoreResults(true, 'resultsComplete');});
									}
									//otherwise just change pagination params and reset
									else{
										if(typeof obj.dataSrc === "string") this.dataManager.setURL(obj.dataSrc);
										__DM.pageLimit = pageLimit;
										__DM.totalLimit = totalLimit;
										__DM.reset();
										__DM.resetData();
										__DM.setTrackPagination();
									}
									
									el.listCont.innerHTML = '';
									if(form){ setFormRequestURL(); }
		
									//set other params - (obj)requestParams{key:value...}
									if(obj.hasOwnProperty('requestParams') && !!obj.requestParams){
										__DM.setParams(obj.requestParams);
									}
									
									//static - template
									if(typeof obj.template !== 'undefined'){
										if(!(rawTemplate = templateSource.innerHTML)){console.error('The "template" param of the refresh method of ajax list should be an element. Use "import" param if you wish to name an import',el); return false;}
										templateReady = true;
										templateName = templateSource.id || templateSource.getAttribute('name');
										setTemplate(rawTemplate, templateName);
									}
									//dynamic - import
									else if(typeof obj.import === 'string'){	
										templateReady = false;
										templateName = obj.import;
										spotter.imports.useImport(templateName, function(e){
											setTemplate(e.content.template, templateName);
											updateListings();
										});
									}
									else{
										templateReady = true;
									}
									//console.log('AJAX LIST REFRESH ::: AFTER', ' \n', JSON.stringify(__DM.queryParams), ' \n', __DM.URL, spotter.log.stackDump(new Error().stack));
									__DM.resetData();
									__DM.reset();
									__DM.preventRequests = false;
									noMoreResults(false);
									if(obj.data && Array.isArray(obj.data)){
										routeRemoteRequestResponse({status:'success',result:obj.data});
									}
									else if(!suspended){
										getMoreData(routeRemoteRequestResponse);
									}
									else{
										console.log('ajax list refresh failed because list is suspended');
									}
								};
								
								//stops future select actions if true sent or reenables if false sent
								el.disableSelect = function(bool){
									selectDisabled = !!bool;
								};
		
							// *** PRIVATE METHODS ***
								//helper - route data after receiving from remote call
								var routeRemoteRequestResponse = function(responseRows){
									//console.log(" -- routeRemoteRequestResponse --", ' \n', 'responseRows:', ' \n', Number(responseRows.length));
		
									currentRequestedData = responseRows;
									if(responseRows.length > 0){
										dataReady = true;
										updateListings();
										if(form) setFormRequestURL();
									}
									else{
										noMoreResults(true);
									}
								};
		
								//pull down groups of listings from the server - send response directly to createListings to add listings from outside data.
								var getMoreData = (function(el){
									if(stopNewRequests) console.log('no more results so stopNewRequests is stopping further calls');
									var request={};
									
									if(dataSrc !== 'form'){
										return function(){
											request = el.dataManager.getData(routeRemoteRequestResponse);
											//request.onSuccess = [routeRemoteRequestResponse];
											return request;
										};
									}
									else{
										return function(){ 
											setFormRequestURL(); 
											form.querySelector('input[type="submit"]').click(); 
										};
									}
								}(el));
								
								//Templates and data must be ready.
								//Called by 'refresh' and 'getmoreresults'(if data src given explicitly) otherwise should be ignored.
								var updateListings = function(){
		
									if(dataReady === false){ console.debug('updateListings - data not ready or template not ready'); return false; }
									if(templateReady === false){ console.debug('updateListings - template not ready'); return false; }
		
									var newCont = createListings(currentRequestedData), c = newCont.children;
									//console.log('components@updateListings: \n', 'newCont: \n', newCont, '#children: ',Number(c.length), 'length currentRequestedData: ', currentRequestedData.length);
									if(c.length === 0) console.error('no children created for list update operation:', new Error().stack);
									/*
									currentRequestedData.forEach(function(obj, i){
										//console.log('current child ('+i+'):', c[i], ' \n', 'parentNode: ', c[i].parentNode);
										currentRequestedData[i]._node_ = c[i];
										c[i].listData = currentRequestedData[i];
									});
									*/
									el.eventTriggers['dataReady'](null,{contNode: newCont, data: currentRequestedData});
									//dataReady = false;
								};
								
								var hideListItemsAfterSearch = function(){
									console.debug('hideListItemsAfterSearch',el.dataManager.getCurrentResults());
									var data = el.dataManager.data.master;
									data.forEach(function(obj){ spotter.toggle.class.add(obj._node_, 'hide'); });
									el.dataManager.getCurrentResults().forEach(function(obj){
										console.log('unhide after search:', obj._node_);
										spotter.toggle.class.remove(obj._node_, 'hide');
									});
								};
								
								var showAllListItems = function(){
									var data = el.dataManager.data;
									data.forEach(function(obj){ spotter.toggle.class.remove(obj._node_, 'hide'); });
								};
								
								var sortListItems = function(){
									if(!el.listCont.appendChild){ 
											console.warn('list cannot be sorted because list has not yet been setup'); 
											return false;
									}
									else{
										el.dataManager.getCurrentResults().forEach(function(obj){
											if(typeof obj._node_ !== "object"){
												console.warn('list cannot be sorted because list items have not yet been added as nodes to the data manager'); 
												return; 
											}
											else{
												el.listCont.appendChild(obj._node_);
											}
										});
									}
								};
		
							// *** SETUP ***
							
								spotter.events.setEventTrigger(el, 'dataReady');
		
								el.className = el.className.addListValue('vertical', ' ');
		
								//create list container
								var d 		= document.createElement('DIV');
								d.className = "spotter-hide-scroll list-slide";
								el.listCont	= document.createElement('DIV');
								el.listCont.className = 'list-cont';// spotter-hide-scroll';
								d.appendChild(el.listCont);
								el.appendChild(d);
			
								el.endResults = document.createElement('DIV');
								el.loadMoreButton = document.createElement('DIV');
								el.appendChild(el.endResults);
								el.appendChild(el.loadMoreButton);
								
								//ajax list uses 'click' to set list items this allows the delegated click event to not interfere with swipes or holds are used
								spotter.events.expandedMouseEvents(el);
								spotter.events.setDelegatedEvent('click', el, setSelected, '.spotter-li');
								
								if(pageLimit > 0){
									//end of results label
									el.endResults.className = 'no-more hide';
									el.endResults.innerHTML = 'No More Results';
									
									//load more button
									if(	pageLimit ){
										el.loadMoreButton.className = 'get-more';
										el.loadMoreButton.innerHTML = 'Load More';
										el.loadMoreButton.addEventListener('click',function(){ el.getMoreListings(); },false);
									}
								}
								
								//setup on scroll bottom load
								if(	!pageLimit ){	
									var scrollEvt = spotter.events.onScrollBottom(d);
									d.addEventListener('scrollBot', getMoreData);
								}
								
							// ** SETUP **
								var setupOpts = {
									pageLimit: pageLimit,
									totalLimit: totalLimit,
									sort: initialSort
								};
								
								if(dataSrc === 'form'){
									var form;
									setupFormAsDataSrc();
								}
								else{
									setupOpts.cache = 1;
								}
		
								//initial template setup
								var templateName = null;
								if(templateSource = el.querySelector('spotter-template')){
									setupOpts.template = templateSource;
								}
								else if(templateSource = el.getAttribute('template')){
									if(!(templateSource = document.getElementById(templateSource))){
										console.error('a template attribute was set for ajax list but the targeted template was not found',el);
										return false;
									}
									setupOpts.template = templateSource;
								}
								else if(importSource = el.getAttribute('import')){
									setupOpts.import = importSource;
								}
								else{
									console.error('ajax list must contain a template or else have the id of a template or import specified',el);
									return false;
								}
								
								//set initial list params and get data
								if(dataSrc){	
									el.refresh(setupOpts);
								}
								else{
									console.debug('data source not ready for ajax list',el);
								}
							
							__components.isReady(el);
						};
						
						__Constructor.setDefaultResponseErrorHandler = function(func){
							if(typeof func !== 'function'){ console.error('Argument sent to set default response error handlder for ajax list must be a function. \n', 'func: ', func); return false; }
							
							__Factory.defaultErrorHandler = func;
						};
						
						return __Constructor;
					}());
					
					//ajaxListReadyElems.forEach(__components.ajaxList);
					//ajaxList = null;
				/*}
				else{
					spotter.log('debug', {func:'ajax list constructor', msg:'Spottr components ajax list is awaiting search and sort. Make sure the dependency has been set', vars:{stack:new Error().stack}});;
					//spotter.testLoaded(ajaxList, 'DataManager');
				}
			};*/
			
			//load the initial ajax lists
			/*__components.afterPolyFillLoaded(function(){
				var AjaxListPrototype = Object.create(HTMLDivElement.prototype);
				AjaxListPrototype.createdCallback = __components.ajaxList;
				var AjaxList = document.registerElement('spotter-ajax-list', {
					prototype: AjaxListPrototype,
					extends: 'div'
				});
				spotter.castToArray(document.getElementsByTagName('spotter-ajax-list')).forEach(__components.ajaxList);
			});*/
			registerSpotterComponent('spotter-ajax-list', {
				prototype: Object.create(
					HTMLDivElement.prototype,
					{createdCallback: {value: __components.ajaxList}}
				)
			});
			//spotter.castToArray(document.querySelectorAll('spotter-ajax-list')).forEach(__components.ajaxList);
			//spotter.events.fire(spotter.events('ajax-list-ready'));
		
			spotter.testLoaded(function(){
				ajaxListReadyElems.forEach(__components.ajaxList);
				spotter.events.fire(spotter.events('ajax-list-ready'));
			}, 'DataManager');
		// -- END AJAX LIST --
		
		// -- SEARCH INPUT --
			__components.searchInput = (function(){
				//<spotter-input-search
					//ATTRIBUTES
						//(optional)auto-complete - set to 'disable' to not use the autocomplete menu
					//HOOKS
						//(this evt)autoCompleteRequestKeys - use this.setAutoCompleteResults(arrData) to set info to build the autocomplete menu - menu is ONLY built by this method - get current search term with evt.arguments['searchTerm']
						//(this evt)searchTermChange - if the search term is changed and is not empty, this event is called. The new search term can be acquired with evt.arguments['searchTerm']
						//(this evt)searchSubmit - when submit button is clicked or a list item is clicked - get submitted search term with evt.arguments['searchTerm']
						//(this evt)autoCompleteSelect - fired anytime the selected autocomplete list item is changed - get the currently selected list item with evt.arguments.selectedListItem
						//(this evt)autoCompleteActive - fired anytime the selected AC item is changed AND the new selected item is not the input
						//(this evt)autoCompleteInactive - fired whenever the list item is changed to the input
				
				// ----- AUTO COMPLETE PROTOTYPE ------
		
					var AutoComplete = function(menu, UIElem, cont, template, searchSubmit){	
						this.cont = cont;//spotter-search-input elem
						this.menu = menu;
						menu.className = '_auto-fill-menu open';
						this.listItemClick = (function(_self){
							return function(e){ AutoComplete.prototype.listItemClick.call(_self, this); };
						}(this));
						spotter.events.setEventTrigger(this, "select");
						spotter.events.setDelegatedEvent('click', menu, this.listItemClick);
						this.listItems = [];
						this.listRows = [];
						this.input = UIElem;
						this.selectedListItem = null;
						this.selectedListIndex = -1;
						this.currentUserInputSearchTerm = null;
						this.previousValues = {};
						
						this.setTemplate(template);
						
						var hide = (function(__self){ return function(){ __self.hide(); };}(this));
						var show = (function(__self){ return function(){ __self.show(); };}(this));
					
						this.input.addEventListener('focus', show);
						this.input.addEventListener('blur', hide);
					};
					AutoComplete.prototype.hide = function(){
						spotter.toggle.class.add(this.menu, 'invis');
					};
					AutoComplete.prototype.show = function(){
						spotter.toggle.class.remove(this.menu, 'invis');
					};
					AutoComplete.prototype.setTemplate = function(strTemplate){
						this.templateId = spotter.makeId();
						spotter.templates.setup(strTemplate, this.templateId);
						return true;
					};
					AutoComplete.prototype.buildMenu = function(){
						if(!this.active || !this.templateId){ console.debug('auto complete build menu was called but is not active'); return false; }
						console.log('buildMenu: \n', 'rows:\n', this.listRows, ' \n', 'this:\n', this);
						this.menu.innerHTML = "";
						if(this.listRows.length > 0){
							this.listItems = spotter.castToArray(this.menu.children);
							spotter.templates.append(this.templateId, this.listRows, this.menu);
							this.show();
						}
						else{
							this.hide();
						}
					};
					AutoComplete.prototype.clear = function(){
						this.menu.className = '_auto-fill-menu';
						this.listItems = [];
						this.menu.innerHTML = '';
						this.active = false;
					};
					AutoComplete.prototype.resetPosition = function(){
						this.selectedListIndex = -1;
						this.selectedListItem = null;
						this.input.focus();
						this.cont.eventTriggers['autoCompleteInactive']();
						//if(typeof inputValue === 'undefined') inputValue = this.input.value;//used to set cursor to end of text
						//this.input.value = inputValue;
					};
					AutoComplete.prototype.changeListItem = function(upOrDown/*1 or -1*/){
						var currentListItem;
						if(~this.selectedListIndex){
							currentListItem = this.listItems[this.selectedListIndex];
							spotter.toggle.class.remove(currentListItem, 'selected');//unselect last selected
						}
						else{
							this.currentUserInputSearchTerm = this.input.value;
						}
						
						this.selectedListIndex += upOrDown;
						if(this.selectedListIndex === -1 || this.selectedListIndex >= this.listItems.length){
							this.resetPosition();
							this.cont.eventTriggers['autoCompleteSelect'](undefined, {selectedListItem:this.input});
							this.input.value = this.currentUserInputSearchTerm;
						}
						else{
							if(this.selectedListIndex < -1) this.selectedListIndex = this.listItems.length - 1;//cycle select
							
							currentListItem = this.listItems[this.selectedListIndex];
							spotter.toggle.class.add(currentListItem, 'selected');
							this.input.value = currentListItem.innerHTML;
							this.cont.eventTriggers['autoCompleteActive']();
							this.cont.eventTriggers['autoCompleteSelect'](undefined, {selectedListItem:currentListItem});
						}
					};
					AutoComplete.prototype.getSelectedListItem = function(){
						if(this.selectedListIndex !== -1){
							return this.listItems[this.selectedListIndex];
						}
						else{
							return this.input;
						}
					};
					AutoComplete.prototype.setSelectedListItem = function(){
						if(this.selectedListIndex !== -1){
							this.input.value = this.listItems[this.selectedListIndex].innerHTML;
						}
						else{
							return false;
						}
					};
					AutoComplete.prototype.listItemClick = function(targListItem){//method is overwritten for each instance (bound to instance)
						this.input.value = targListItem.innerHTML;
						this.eventTriggers["select"]();
					};
					//if this is false when build menu is called, it will do nothing.
					AutoComplete.prototype.active = false;
					
				// **** CONSTRUCTOR ****
			
				var __constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;
				
					var menu
						, autoComplete 		= cont.getAttribute('auto-complete')
						, UIElem 			= document.createElement('INPUT')
						, submitButton 		= cont.querySelector('.submit-button')
						, noCase 			= (noCase = cont.getAttribute('data-ignore-case') ? noCase : '')
						, menuLimit 		= cont.getAttribute('auto-complete-limit') || 100
						, searchTerm
						, previousSearchTerm
						, template;
		
					//dom setup
					UIElem.type = "text";
					UIElem.className = "_auto-fill";
					UIElem.placeholder = cont.getAttribute('placeholder');
					cont.appendChild(UIElem);
					
					//auto complete
					if(autoComplete !== "disabled"){
						if(template = cont.querySelector('spotter-template')){
							template = template.innerHTML;
						}
						else{
							template = '<span class="_auto-complete-result">$[DATA]</span>';
						}
						autoComplete = new AutoComplete((menu = document.createElement('DIV')), UIElem, cont, template);
						cont.appendChild(menu);
					}
			
					// ** EVENTS **
					
						//get new search term by events.arguments.searchTerm - does not trigger if no change occurs
						spotter.events.setEventTrigger(cont, 'searchTermChange');
						
						//get the search term by events.arguments.searchTerm - triggers when submit button is clicked
						spotter.events.setEventTrigger(cont, 'searchSubmit');
						
						//use this event to set the auto complete terms - set them using this.autoComplete.terms = (array)
						spotter.events.setEventTrigger(cont, 'autoCompleteRequestKeys');
						
						//triggered when an auto complete list item is selected - get the search term with events.arguments.searchTerm
						spotter.events.setEventTrigger(cont, 'autoCompleteSelect');
						
						//triggers when auto complete is opened
						spotter.events.setEventTrigger(cont, 'autoCompleteActive');
						
						//trigger when auto complete is closed
						spotter.events.setEventTrigger(cont, 'autoCompleteInactive');
					
					// *** FUNCTIONS ***
				
						//search term changed - user scrolling through AC menu does not trigger - default action is to both build the AC menu and submit the search
						var searchTermChange = function(searchTerm, key){
							cont.searchTerm = searchTerm;
							console.log('searchTermChange:',searchTerm);
							if(searchTerm.length === 0){
								if(autoComplete !== null){	
									autoComplete.hide();
									autoComplete.resetPosition();
									autoComplete.clear();
								}
							}
							else if(autoComplete !== null){
								console.log(autoComplete.previousValues);
								autoComplete.active = true;
								if(autoComplete.previousValues[searchTerm] === undefined){
									cont.eventTriggers['autoCompleteRequestKeys'](undefined, {searchTerm:searchTerm});
								}
								else{
									cont.setAutoCompleteResults(autoComplete.previousValues[searchTerm]);
								}
							}
							cont.eventTriggers['searchTermChange'](undefined, {searchTerm: searchTerm, key: key});
						};
						
						//triggered when one of the following: submit button clicked, enter pressed on input or an AC list item, AC list item is clicked
						var searchSubmit = function(e){
							var searchTerm = UIElem.value;
							if(e && e.preventDefault) e.preventDefault();
							if(autoComplete !== null){
								autoComplete.hide();
								autoComplete.resetPosition();
								autoComplete.clear();
							}
							UIElem.focus();
							//cont.searchSubmitActive = true;
							cont.eventTriggers['searchSubmit'](undefined, {searchTerm: searchTerm});
						};
						
					
					// *** UI INTERACTION ***
						/*
						//single character keys
						var keyPress = function(e){
							var key, term;
							if(e.which === 0 || (e.key && e.key.length > 1) || ((key = spotter.keyboard.getChar(e)) && key.length > 1)) return;//if key isnt a simple character key
							console.log('keyPress \n', 'value:', UIElem.value);
							term = UIElem.value + key.toLowerCase();
							searchTermChange(term);
							previousSearchTerm = term;
						};
						UIElem.addEventListener('keypress', keyPress);
						*/
						//list traversing (arrows) and activate keyup for non character keys
						var keyDown = function(e){
							keyDown.event = e;
							var key = spotter.keyboard.keyCodes[e.keyCode];
							
							if(key === 'down arrow'){
								autoComplete.changeListItem(1);
							}
							else if(key === 'up arrow'){
								autoComplete.changeListItem(-1);
							}
							else if(key === 'tab'){
								
							} 
							else if(key === 'enter'){
								e.preventDefault();
								var currentListItem = autoComplete.getSelectedListItem();
								if(currentListItem != this){//set selected list item
									previousSearchTerm = UIElem.value = currentListItem.innerHTML;
								}
								if(submitButton) submitButton.click();
							}
							else{
								keyUp.active = true;
							}
						};
						keyDown.event = null;
						UIElem.addEventListener('keydown', keyDown);
						
						//handles delete & backspace - activated by keydown event and deactivates itself
						var keyUp = function(){
							console.log('keyup is '+(keyUp.active === false?'not ':'active ')+' and the key is '+spotter.keyboard.keyCodes[keyDown.event.keyCode]);
							if(keyUp.active === false) return;
							keyUp.active = false;
							
							var e = keyDown.event, key = spotter.keyboard.keyCodes[e.keyCode];
							
							if(key === 'backspace' || key === 'delete'){
								if(UIElem.value.length > 0){}
								var newValue = UIElem.value;
								previousSearchTerm = newValue;
								console.log('keyUp \n', newValue);
								searchTermChange(newValue, key);
							}
							else if(e.which === 0 || (e.key && e.key.length > 1) || ((key = spotter.keyboard.getChar(e)) && key.length > 1)){
								return;
							}
							else{
								var term;
								console.log('keyPress \n', 'value:', UIElem.value);
								term = UIElem.value;
								searchTermChange(term, key);
								previousSearchTerm = term;
							}
						};
						keyUp.active = false;
						UIElem.addEventListener('keyup', keyUp);
					
						//submit button
						if(submitButton !== null){
							submitButton.addEventListener('click', searchSubmit);
						}
				
						cont.setAutoCompleteResults = function(arrayOfValues){
							if(autoComplete.previousValues[cont.searchTerm] === undefined) autoComplete.previousValues[cont.searchTerm] = arrayOfValues;
							autoComplete.listRows = arrayOfValues;
							if(arrayOfValues.length > 0){
								autoComplete.buildMenu();
							}
							else{
								autoComplete.clear();
							}
						};
						
						autoComplete.addEventListener("select", searchSubmit);
						
						__components.isReady(cont);
				};
		
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterInputSearchPrototype = Object.create(HTMLDivElement.prototype);
					SpotterInputSearchPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterInputSearch = document.registerElement('spotter-input-search', {
						prototype: SpotterInputSearchPrototype,
						extends: 'div'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-input-search')).forEach(__constructor);
				});*/
				registerSpotterComponent('spotter-input-search', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{createdCallback: {value: __constructor}}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-modal-textarea')).forEach(__constructor);
				
				return __constructor;
			}());
		// -- END SEARCH INPUT --

		// -- SORT INPUT --
			__components.sortInput = (function(){
				//<spotter-input-sort optional:user-interface="UIElemId" required:data-src="this or DataSrcElemId"
				var parseSortString = function(sortString){
					//sortString = field-A[ type-A][ direction-A][,REPEAT, ...]
					sortString = sortString.split(',');
					var i = sortString.length
						, fields= []
						, types= []
						, directions= []
						, data
						, iter
						, l;
					while(--i > -1){
						iter = sortString[i];
						iter = iter.trim().split(' ');
						l = iter.length;
						//normalize
						if(l === 1){//field only
							iter[1]= 'alpha';
							iter[2]= '1';
						}
						else if(l === 2){//'field [type|direction]'
							if(~[1, -1, 'asc', 'desc'].indexOf(iter[1])){ 
								iter[2] = iter[1]; 
								iter[1]= 'alpha'; 
							}
							else{ iter[2] = '1'; }
						}
						else if(l === 3 && l[1] === 'use'){//'field use type'
							l[1]= l[2];
							l[2]= '1'; 
						}
						else if(l === 4){//full string: 'field use type direction'
							iter[1]= iter[2];
							iter[2]= iter[3];
						}
						else{
							spotter.consoleError('string sent is not of correct format', arguments[0]);
							return false;
						}
						fields.push(iter[0]);
						types.push(iter[1]);
						directions.push((iter[2] === 'asc' ? 1 : (iter[2] === 'desc' ? -1 : iter[2])));
					}
					return {fields:fields, types:types, directions:directions};
				};
				
				var __preConstructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;;
					if(!registerElem(cont)) return;
					
					//get user interface source
					cont.UIElem = cont.getAttribute('user-interface');
					if(cont.UIElem !== null){
						if((cont.UIElem = document.getElementById(cont.UIElem)) !== null){
							if(cont.UIElem.tagName.slice(0,7) === 'spotter'){//target is a custom tag
								__components.onReady(cont.UIElem, function(){
									this.UIElem = __self.input;
									__constructor(__self);
								});
							}
						}
						else{//target not found				
							console.error('no element found by id for user-interface attribute', cont.getAttribute('user-interface'));
							return false;
						}
					}
		
					var dataSrc = cont.getAttribute('data-src'), data;
					
					cont.setDataSource = function(dataSrc){
						this.dataManager = dataSrc;
						this.setDataSource = undefined;
						__constructor(this);
					};
					
					if(dataSrc !== null && (dataSrc = document.getElementById(dataSrc))){
						cont.setDataSource = undefined;
						if(data = spotter.DataManager.getObjectFor(dataSrc)){//get datamanager object name from target
							cont.dataManager = data;
							__constructor(cont);
						}
						else{
							document.addEventListener('datamanagerready', (function(cont, dataSrc){//or else listen for 'dataSrc' to create a datamanager object
								return function(e){
									if(e.content && e.content.srcNode === dataSrc){ 
										cont.dataManager = spotter.DataManager.getObjectFor(dataSrc);
										__constructor(cont);
									} 
								};
							}(cont, dataSrc)), false);
							return;
						}
					}
					else{
						console.debug('sort input waiting for data source');
					}
				};
				
				var __constructor = function(cont){
					//data and ui element must be ready
						if(!cont.UIElem || !cont.dataManager) return;
					//------
					
					cont.sort = function(event){
						var input = this.querySelector('input'), sortOpts = parseSortString(input.value);
						console.log('cont.sort:', event, 'sortOpts:',sortOpts);
						cont.dataManager.sort(sortOpts.fields, sortOpts.types, sortOpts.directions);
					};
					cont.UIElem.addEventListener('modal-select-change', cont.sort, false);
					console.log('spotter input sort: \n', cont.UIElem, ' \n', String(cont.UIElem.value), ' \n', typeof cont.UIElem.defaultSelection);
					if(cont.UIElem.value){ cont.sort.call(cont.UIElem); }
					else if(typeof cont.UIElem.defaultSelection === "function"){ cont.UIElem.defaultSelection(); }
					
					__components.isReady(cont);
				};
				
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterInputSortPrototype = Object.create(HTMLDivElement.prototype);
					SpotterInputSortPrototype.createdCallback = function(){ __preConstructor(this); };
					var SpotterInputSort = document.registerElement('spotter-input-sort', {
						prototype: SpotterInputSortPrototype,
						extends: 'div'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-input-sort')).forEach(__preConstructor);
				});*/
				registerSpotterComponent('spotter-input-sort', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{createdCallback: {value: __preConstructor}}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-input-sort')).forEach(__preConstructor);
				
				__preConstructor.parseSortString = parseSortString;
				
				return __preConstructor;
			}());	
		// -- END SORT INPUT --
		
		// -- MODAL TEXT AREA --
			__components.popUpTextArea = (function(){
			//Attributes: button=elemId (elem to activate modal), text-target=elemId (elem to show text), target=elemId (input to hold value), placeholder=text, name=text (if target not used), limit=int (max characters allowed), text-limit=int (max characters to be shown)
			//button, text-target, and target can be elems within the modal by giving them the same class name i.e. <elem class="button"...
			//if you want to have the text to show in the textarea then a textarea element must be sent '..popUpTextArea(button, textarea_element)' or located in a 'spotter-modal-textarea' component <spotter-modal-textarea...><textarea... 
			//if only the button is sent, then a textarea will be created within the button and the text will show through the first textnode of the button element.		
				var __private = {popMenus:[], error:function(msg){console.log('ERROR [spotter.components.popUpTextArea]: '+msg);}, template:'big-textbox'};
				var __constructor;
				var __factory = {
					functions:{
						getOnClose: function(button,textarea){
							return function(){
								console.log('big text box value info: \n', 'value length:', textarea.modalRepresentative.value.length, ' \n', 'textarea value: ', textarea.modalRepresentative.value, ' \n', 'target text area:', textarea);
								if(textarea.modalRepresentative.value.length){
									textarea.value = textarea.innerText = textarea.innerHTML = textarea.modalRepresentative.value;
								}
								else{
									textarea.value = textarea.innerText = textarea.innerHTML = textarea.value = '';
								}
								//textarea.eventTriggers.blur();
							};
						},
						modalRepClick: function(){ 
							if(!this.hasBeenActivated){ this.value = ''; this.hasBeenActivated = true; } 
						}
					}
				};
				
				__constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;
		
					//elem to activate the modal
					var button = cont.getAttribute('button');
					if(button && !(button = document.getElementById(button))){ console.error('the button for modal textarea was not found by id',cont.getAttribute('button'),cont); return; }
					else if(!(button = cont.querySelector('.button'))){ button = cont; }
					
					//input to hold the value
					var targInput = cont.getAttribute('target');
					if(targInput && !(targInput = document.getElementById(button))){
						console.log('the target input ('+cont.getAttribute('target')+') for modal textarea was not found by id');
						return;
					}
					else if(!(targInput = cont.querySelector('.target'))){
						targInput = document.createElement('textarea');
						if(cont.hasAttribute('name')) targInput.name = cont.getAttribute('name');
						if(cont.hasAttribute('placeholder')) targInput.placeholder = cont.getAttribute('placeholder');
						if(cont.hasAttribute('maxlength')) targInput.maxLength = cont.getAttribute('maxlength');
						if(cont.hasAttribute('initial-value')) targInput.value = cont.getAttribute('initial-value');
						targInput.className = 'hide';
						cont.appendChild(targInput);
					}
					
					//container to show the text - text-target="element.id" OR contains elem with class 'text'
					var textTarget = cont.getAttribute('text-target');
					
					if(textTarget != null && !(textTarget = document.getElementById(textTarget))){
						console.log('the text target ('+cont.getAttribute('text-target')+') for modal textarea was not found by id');
						return;
					}
					else{ textTarget = cont.querySelector('.text'); }
					
					//set initial values - bind text target to input target
					if(textTarget){
						var filter = function(content){
							if(!content && targInput.placeholder !== null){
								return targInput.placeholder;
							}else{
								return content;
							}; 
						};
						spotter.data.bindElementToInput(textTarget, targInput, filter);
		
						if(textTarget.hasAttribute('text-limit')){
							textTarget.textLimit = textTarget.getAttribute('text-limit');
						}
						else if(cont.hasAttribute('text-limit')){
							textTarget.textLimit = cont.getAttribute('text-limit');
						}
		
						if(targInput.value.length){
							spotter.setFirstTextNode(textTarget, targInput.value);
						}
						else if(targInput.placeholder.length){
							spotter.setFirstTextNode(textTarget, targInput.placeholder);
						}
					}
		
					//build the popmenu
					//console.log('poptext',button);
					var textBoxModal = new spotter.popMenu(targInput.name)
						.useTemplate('big-textbox')
						.onMenu(function(){
							targInput.modalRepresentative = this.querySelector('.big-textbox');
							targInput.modalRepresentative.addEventListener('click', __factory.modalRepClick, false);
							targInput.modalRepresentative.placeholder = targInput.placeholder || null; 
							targInput.modalRepresentative.value = targInput.value.trim() || null;
						})
						.onClose( __factory.functions.getOnClose(button, targInput) )
						.onOpen(function(){ 
							if(targInput.value !== null && targInput.value.length >= 0) { 
								targInput.modalRepresentative.value = targInput.value || null;
								targInput.modalRepresentative.hasBeenActivated = true;
							} 
							targInput.modalRepresentative.focus();
							spotter.resetCursor(targInput.modalRepresentative);
						})
						.setTitle((button.getAttribute('title') || 'title not set'))
						.attachTo(button)
						.loadTemplate();
						
					var i = __private.popMenus.push(textBoxModal);
					
					cont.setValue = function(newValue){
						if((newValue === null || newValue.length === 0) && targInput.placeholder.length) spotter.setFirstTextNode(textTarget, targInput.placeholder);
						targInput.value = newValue;
					};
				};
		
				/*__components.afterPolyFillLoaded(function(){
					var ModalTextAreaPrototype = Object.create(HTMLElement.prototype);
					ModalTextAreaPrototype.createdCallback = function(){ __constructor(this); };
					var ModalTextArea = document.registerElement('spotter-modal-textarea', {
						prototype: ModalTextAreaPrototype,
					});
					spotter.castToArray(document.querySelectorAll('spotter-modal-textarea')).forEach(__constructor);
				});*/		
				registerSpotterComponent('spotter-modal-textarea', {
					prototype: Object.create(
						HTMLElement.prototype,
						{
							createdCallback: {value: __constructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-modal-textarea')).forEach(__constructor);
				
				return __constructor;
			}());
		// -- END MODAL TEXT AREA --

		// -- KEY PAD --
			__components.keypad = (function(){
				//<spotter-keypad custom-keys="keyText1,keyText2,..."
				//use keypad.addEventListener('done'... to monitor user registered completion.Get the current value with this.textTarg.innerHTML
				//set keypad.filters.custom = function(keyText){ doSomething...return newText; to handle the custom keys
				var __constructor = function(keypadParent){
					if(typeof keypadParent === "undefined") keypadParent = this;
					if(isPartOfTemplate(keypadParent)) return;
					if(!registerElem(keypadParent)) return;
					
					var simpleValue='';//stores a nonformatted copy of the entered data
					
					//initial setup
					var textTarg=document.createElement('DIV');
					textTarg.className="input";
					keypadParent.appendChild(textTarg);
					keypadParent.textTarget=textTarg;
					
					var keypad=document.createElement('DIV');
					keypad.className="keypad clear";
					keypadParent.appendChild(keypad);
					
					//filters
					if(typeof keypadParent.filters === 'undefined') keypadParent.filters={custom:function(keyText){return keyText}};
					
					//special filter
					var localePref=spotter.getLocalePreferences();
					var specialFilter=function(text){ return text.toLocaleString(localePref.language); };
					if(keypadParent.hasAttribute('special')){
						var specialType=keypadParent.getAttribute('special');
						switch(specialType){
							case 'currency':
								specialFilter=function(text){return Number(text.replace(/[^0-9]/g,'')).toLocaleString(localePref.language, {style:'currency', currency:localePref.currency.abbr});};
								break;
						}
					}
					
					//clear function
					keypadParent.clear=function(def){
						this.textTarget.innerHTML=(def!=='undefined' ? specialFilter(def) : '');
						simpleValue='';
					};
					
					//events
					var doneEvent=spotter.events.setEventTrigger(keypadParent,'done');
					
					//set numeric keys
					var html='', l=10;
					while(--l > -1){
						html+='<div class="key hvr-push"><div class="text">'+l+'</div></div>';
					}
					
					//set custom keys
					customKeys=keypadParent.getAttribute('custom-keys');
					if(customKeys){
						customKeys=customKeys.split(',');
						customKeys.forEach(function(keyText){
							html+='<div class="key double hvr-push"><div class="text">'+keyText+'</div></div>';
						});
					}
					
					//backspace key
					html+='<div class="key double hvr-push"><div class="text">backspace</div></div>';
					
					//finished key
					html+='<div class="key triple hvr-push"><div class="text">done</div></div>';
					
					keypad.innerHTML=html;
					
					var keys = Array.prototype.slice.call(keypad.querySelectorAll('.key'));
					keys.forEach(function(key){
					  	key.text=key.querySelector('.text').innerHTML;
					  	key.addEventListener('click', function(){
							if(key.text==='done'){
								keypadParent.eventTriggers['done']()
							}
							else if(key.text==='backspace'){
								simpleValue=simpleValue.slice(0, -1);
								textTarg.innerHTML=specialFilter(simpleValue);
							}
							else if(key.text == parseInt(key.text, 10)){
								if(typeof keypadParent.filters.numeric !== 'undefined') keypadParent.filters.numeric(simpleValue);
								simpleValue+=String(this.text);
								textTarg.innerHTML=specialFilter(simpleValue);
							}
							else{
								keypadParent.filters.custom.call(keypadParent, key.text);
							}
						}, false);
						//animation events
						key.addEventListener('mouseup', function(){
							this.className=this.className+' active';
						}, false);
						key.addEventListener('mousedown', function(){
							this.className=this.className.replace(/\sactive/g,'');
						}, false);
					});
					
					// *** PUBLIC METHODS ***
					keypadParent.setValue = function(value){
						textTarg.innerHTML=specialFilter(value);
						return keypadParent;
					};
					
					keypadParent.linkInput = function(input){
						spotter.requiredParam(input).element('INPUT').result()();
						this.targInput = input;
						keypadParent.setValue(input.value);
						keypadParent.addEventListener('done', function(){this.targInput.value=this.textTarget.innerHTML;}, false);
						return keypadParent;
					};
				};		
				
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterKeyPadPrototype = Object.create(HTMLDivElement.prototype);
					SpotterKeyPadPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterKeyPad = document.registerElement('spotter-keypad', {
						prototype: SpotterKeyPadPrototype,
						extends: 'div'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-keypad')).forEach(__constructor);
				});*/
				registerSpotterComponent('spotter-keypad', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{
							createdCallback: {value: __constructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-keypad')).forEach(__constructor);
			
				return __constructor;
			}());
		// -- END KEY PAD --	
		
		// -- TOGGLE SWITCH --
			__components.toggleSwitch=(function(){
				//<spotter-toggle options="text,text OR text(value),text(value)" where text will be displayed to users and value will be the same as text if first pattern used.
				//ex: <spotter-toggle options="dogs(1),cats(2),birds(3)...
				//spotter options can also be used
				var __constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;	
					
					var reel=document.createElement('DIV');
					reel.className='reel';
					
					var listItems=cont.getAttribute('options').split(','), HTML="";
					listItems.forEach(function(text){
						var match,value=text;
						if(match=/^(.+?)\((.+)\)$/.exec(text)){ value=match[2]; text=match[1]; }
						HTML+='<div class="option" value="'+value+'">'+text+'</div>';
					});
					var options=cont.querySelectorAll('spotter-option'), opt;
					for(var x=0, l=options.length; x<l; x++){
						opt=options[x];
						HTML+='<div class="option" value="'+opt.getAttribute('value')+'">'+opt.innerHTML+'</div>';
						cont.removeChild(opt);
					}
			
					HTML='<div class="option empty top"></div>'+HTML+'<div class="option empty bot"></div>';
					reel.innerHTML=HTML;
					
					cont.appendChild(reel);
					
					var l=reel.children.length - 3, count=0;
					spotter.events.setEventTrigger(cont, 'change');
					
					var scrollTo=function(newValue){
						var newMarginTop = '-' + Number(count * 100) + '%';
						Velocity(reel, {marginTop:newMarginTop}, {duration:200, complete:function(){
							var newValue=reel.children[count+1].getAttribute('value');
							cont.setAttribute('value', newValue);
							cont.eventTriggers['change']();
						}});
					};
					
					cont.getValue=function(){return this.getAttribute('value');};
					cont.setValue=function(newValue){
						var targ=this.querySelector('.option[value="'+newValue+'"]');
						if(targ === null){ console.error('the toggle switch ',this,' does not contain a child with value '+newValue); }
						else{
							count=[].indexOf.call(targ.parentNode.children, targ) - 1;
							scrollTo();
						}
					};
					
					spotter.events.swipeEvents(cont, '5%');
					cont.addEventListener('swipeup', function(){
						if(count >= l) return;
						count++;
						scrollTo();
					}, false);
					cont.addEventListener('swipedown', function(){
						if(count <= 0) return;
						count--;
						scrollTo();		
					}, false);
					
					//INITIALIZE
					var value;
					if((value=cont.getAttribute('value')) !== null){
						cont.setValue(value);
					}
					else{
						cont.setValue(reel.children[1].getAttribute('value'));
					}
				};
				
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterToggleSwitchPrototype = Object.create(HTMLScriptElement.prototype);
					SpotterToggleSwitchPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterToggleSwitch = document.registerElement('spotter-toggle-switch', {
						prototype: SpotterToggleSwitchPrototype,
						extends: 'div'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-toggle-switch')).forEach(__constructor);
				});*/
				registerSpotterComponent('spotter-toggle-switch', {
					prototype: Object.create(
						HTMLScriptElement.prototype,
						{
							createdCallback: {value: __constructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-toggle-switch')).forEach(__constructor);
				
				return __constructor;
			}());
		// -- END TOGGLE SWITCH --

		// -- CALENDAR --
			__components.calendar = (function(){	
				var __preConstructor = function(cont){
					console.log('moment');
					if(typeof cont === 'undefined') cont = this;
					if(typeof moment !== "object"){
						spotter.require('moment', '/js/spotter/third_party/moment.js', [], function(){ return window.moment; });
						spotter.testLoaded(function(){
							console.log('moment loaded');
							__constructor(cont);
						}, 'moment');
					}
					else{
						__constructor(cont);
					}
				}
				
				var __constructor = function(cont){
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;	
					
					var date	= moment(cont.getAttribute('value')||undefined);
					var year 	= date.year();
					var month	= date.month();
					var day	 	= date.date();
					
					//console.log('start date:',day+'/'+month+'/'+year);
					
					var titleBar=document.createElement('DIV');
					titleBar.className='title-bar';
					titleBar.innerHTML='<div class="selected-date"></div>';
					cont.appendChild(titleBar);
					
					/* ---------------------LIMITS------------------------- */
					var upperLimit=cont.getAttribute('upper-limit'), upperDateLimit;
					console.debug('upperLimit',typeof upperLimit, upperLimit);
					if(upperLimit !== null){
						if(upperLimit === 'now' || upperLimit === 'today'){
							var upperDateLimit = moment();
							upperLimit = {year:upperDateLimit.year(), month:upperDateLimit.month(), day:upperDateLimit.date()};
						}
						else if(upperDateLimit = /([0-9]+)\-([0-9]+)\-([0-9]+)/.exec(upperLimit)){//date form day-month-year
							upperLimit = {year:upperDateLimit[3],month:upperDateLimit[2],day:upperDateLimit[1]};
						}
						else{//relative form '+Xdays +Ymonths +Zyears'
							upperLimit = upperLimit.split(' ');
							var upperDateLimit = moment(day+'-'+String(month+1)+'-'+year, 'D-M-YYYY');
							upperLimit.forEach(function(opt){
								var parts = /([\+\-])([0-9]+)(days|months|years)/.exec(opt);
								if(parts[1]==='+'){
									upperDateLimit.add(parts[2], parts[3]);
								}
								else if(parts[1]==='-'){
									upperDateLimit.subtract(parts[2], parts[3]);
								}
							});
							upperLimit = {year:upperDateLimit.year()||0, month:upperDateLimit.month()||0, day:upperDateLimit.date()||0};
						}
					}
					
					var lowerLimit = cont.getAttribute('lower-limit');
					if(lowerLimit){
						if(lowerLimit === 'now' || lowerLimit === 'today'){
							var lowerDateLimit = moment();
							lowerLimit = {year:lowerDateLimit.year(), month:lowerDateLimit.month(), day:lowerDateLimit.date()};
						}
						else if(lowerLimit = /([0-9]+)\-([0-9]+)\-([0-9]+)/.exec(lowerLimit)){
							lowerLimit = {year:lowerLimit[3],month:lowerLimit[2]-1,day:lowerLimit[1]};
						}
						else{
							lowerLimit = ' '+lowerLimit;
							var lowerDateLimit = moment(day+'-'+String(month+1)+'-'+year, 'D-M-YYYY');
							lowerLimit.forEach(function(opt){
								var parts = /([\+\-])([0-9]+)(days|months|years)/.exec(opt);
								if(parts[1]==='+'){
									lowerDateLimit.add(parts[2], parts[3]);
								}
								else if(parts[1]==='-'){
									lowerDateLimit.subtract(parts[2], parts[3]);
								}
							});
							lowerLimit = {year:lowerDateLimit.year(), month:lowerDateLimit.month()-1, day:lowerDateLimit.date()};
						}
					}
					
					var upperLimitMonth=12, lowerLimitMonth=-1, upperLimitDay=0, lowerLimitDay=0;
					var testUpperLimit = function(type){//type = 'year|month'
						if(upperLimit === null) return;
						if(type==='year'){
							if(year >= upperLimit.year){
								year=upperLimit.year;
								upperLimitMonth=upperLimit.month;
								return true;
							}
							else{
								upperLimitMonth=12;
								return false;
							}
						}
						else if(type === 'month'){
							if(month >= upperLimit.month && year >= upperLimit.year){
								month=upperLimit.month;
								upperLimitDay=upperLimit.day;
								return true;
							}
							else{
								upperLimitDay=0;
								console.log('month within range');
								return false;
							}
						}
						else{ console.error('argument type is required for test upper limit and must be month or year ('+type+')'); }
					};
					
					var testLowerLimit = function(type){//type = 'year|month'
						if(lowerLimit === null) return;
						if(type==='year'){
							if(year <= lowerLimit.year){
								year=lowerLimit.year;
								lowerLimitMonth=lowerLimit.month;
								return true;
							}
							else{
								lowerLimitMonth=-1;
								return false;
							}
						}
						else if(type === 'month'){
							if(month <= lowerLimit.month && year <= lowerLimit.year){
								month=lowerLimit.month;
								lowerLimitDay=lowerLimit.day;
								return true;
							}
							else{
								lowerLimitDay=0;
								return false;
							}
						}
						else{ console.error('argument type is required for test lower limit and must be month or year ('+type+')'); }
					};
					
					/* ---------------------SELECTED DATA------------------ */
					var selectedDate = titleBar.querySelector('.selected-date');
					spotter.events.setEventTrigger(cont, 'change');
					var changeDateText = function(){
						//console.log('changeDateText',day+'-'+String(month+1)+'-'+year);
						selectedDate.innerHTML = moment(day+'-'+String(month+1)+'-'+year, 'D-M-YYYY').format('MMM, DD YYYY');
						cont.year=year;
						cont.month=month;
						cont.day=day;
						cont.eventTriggers['change']();
					};
					
					/* --------------------- YEARS ---------------------- */
				
					var incrementYear = function(dir){
						upperLimitMonth=12;
						lowerLimitMonth=-1;
						if(dir==='+'){
							year++;
							testUpperLimit('year');
						}
						else if(dir==='-'){
							year--;
							testLowerLimit('year');
						}
						else if(dir > 0){
							year=dir;
							testUpperLimit('year');
							testLowerLimit('year');
						}
						changeDateText();
					}
					
					var setYear = function(intYear){
						//alias so function names are consistent (setMonth)
						incrementYear(intYear);
					};
					
					/* --------------------- MONTHS ----------------------- */
					var monthsCont = document.createElement('DIV');
					monthsCont.className="months-scroll";
					monthsCont.innerHTML='<div class="month-bar"><img class="arrow-left" src="/images/universal/nav_arrow_left.png"/><div class="name"></div><img class="arrow-right" src="/images/universal/nav_arrow_right.png"/></div>';
					var scrollMonthRight = monthsCont.querySelector('.arrow-right');
					var scrollMonthLeft = monthsCont.querySelector('.arrow-left');
					var monthSlider = monthsCont.querySelector('.name');
					var HTML='';
					var months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
					var monthsTags = [];
					var monthsByName = {};
					months.forEach(function(month, i){
						tag = document.createElement('SPAN');
						tag.className = 'tag';
						tag.textContent = month;
						monthsTags[i]=tag;
						monthSlider.appendChild(tag);
						monthsByName[month]=i;
					});
					cont.appendChild(monthsCont);
					
					//MONTHS ACTIONS	
					var setMonth = function(monthInt){//zero based so january is 0 and december is 11
						if(!Number.isInteger(monthInt) || !(monthInt >= 0 && monthInt <= 11)){ console.error('argument ('+monthInt+') to cycle month must be an integer between 0 and 11 inclusive', new Error().stack); return false; }
						var targ = monthsTags[monthInt], count=0;
						while(monthSlider.children[0] !== targ && count < 13){
							monthSlider.appendChild(monthSlider.children[0]);
							count++;
						}
						if(count > 12){ console.error('set month failure. the target month was not found'); return false; }
						month=monthInt;
						if(month >= upperLimitMonth){ scrollMonthRight.style.visibility="hidden"; scrollUp=false; }
						if(month <= lowerLimitMonth){ scrollMonthLeft.style.visibility="hidden"; scrollDown=false; }
						testUpperLimit('month');
						testLowerLimit('month');
						cycleDays();
					}
					
					var incrementMonth = function(dir){
						//helper - set the month taking into consideration limits and cycling around
						//upper/lowerLimitMonth are set by incrementYear
						if(dir==='+'){
							month++;
							if(month > 11){ incrementYear('+'); month=0; }
							console.log('incrementMonth: month',month,'lowerLimitMonth:',lowerLimitMonth,'upperLimitMonth:',upperLimitMonth);
							if(month !== lowerLimitMonth){ scrollMonthLeft.style.visibility="visible"; scrollDown=true; }
							if(month >= upperLimitMonth){ scrollMonthRight.style.visibility="hidden"; scrollUp=false; testUpperLimit('month'); }
							lowerLimitDay=0;
							//month = month > upperLimitMonth ? lowerLimitMonth : month;
						}
						else if(dir==='-'){
							month--;
							if(month < 0){ incrementYear('-'); month=11; }
							if(month !== upperLimitMonth){ scrollMonthRight.style.visibility="visible"; scrollUp=true; }
							if(month <= lowerLimitMonth){ scrollMonthLeft.style.visibility="hidden"; scrollDown=false; testLowerLimit('month'); }
							upperLimitDay=0;
							//month = --month < lowerLimitMonth ? upperLimitMonth : month;
						}
						changeDateText();
					};
					
					var scrollMonthActive=false, scrollUp=true, scrollDown=true;
					var scrollMonth = function(dir){
						//the animation of scrolling the month names
						if(scrollMonthActive===true){ console.log('scrollMonthActive is true'); return; }
						scrollMonthActive=true;
						if(dir==='+'){
							if(scrollUp===false){ console.log('scrollUp is false'); return; }
							var targ = monthSlider.children[0];
							Velocity(targ, {marginLeft:'-100%'}, {duration:200, complete:function(){
								incrementMonth(dir);
								monthSlider.appendChild(targ); 
								targ.style.marginLeft="0"; 
								cycleDays();
								scrollMonthActive=false;
							}});
						}
						else if(dir==='-'){
							if(scrollDown===false){ console.log('scrollDown is false'); return; }
							var targ=monthSlider.children[monthSlider.children.length - 1];
							targ.style.marginLeft='-100%';
							monthSlider.insertBefore(targ, monthSlider.children[0]);
							Velocity(targ, {marginLeft:'0'}, {duration:200,complete:function(){
								incrementMonth(dir);
								cycleDays();
								scrollMonthActive=false;
							}});
						}
						else{
							console.error('scroll month argument ('+dir+') must be 1 or -1');
						}
						console.log('month:',month);
					};
					
					monthsCont.querySelector('.arrow-left').addEventListener('click', function(){scrollMonth('-');}, false); 
					monthsCont.querySelector('.arrow-right').addEventListener('click', function(){scrollMonth('+');}, false);
					
					/* --------------------- DAYS ----------------------- */
					var daysCont=document.createElement('DIV');
					daysCont.className='days-bar';
					//DAYS OF WEEK
					var daysNameBar=document.createElement('DIV');
					daysNameBar.className="days-name-bar";
					HTML="";
					var dayNames=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
					dayNames.forEach(function(name){
						HTML += '<div class="name">'+name.substr(0,3)+'</div>';
					});
					daysNameBar.innerHTML=HTML;
					daysCont.appendChild(daysNameBar);
					//NUMBER OF DAYS
					var dayNumBar=document.createElement('DIV');
					dayNumBar.className="days-number";
					HTML='';
					for(var x=0; x<8; x++){
						HTML+='<div class="inactive start">'+(24+x)+'</div>';
					}
					for(x=1; x<32; x++){
						HTML+='<div class="active">'+x+'</div>';
					}
					for(x=1; x<14; x++){
						HTML+='<div class="inactive end">'+x+'</div>';
					}
					dayNumBar.innerHTML=HTML;
					daysCont.appendChild(dayNumBar);
					cont.appendChild(daysCont);
					
					var totalDaysShown=42;//account for incomplete start weeks and end weeks
					var activeDays=Array.prototype.slice.call(dayNumBar.querySelectorAll('.active')).reverse();
					var inactiveDaysStart=Array.prototype.slice.call(dayNumBar.querySelectorAll('.inactive.start'));
					var inactiveDaysEnd=Array.prototype.slice.call(dayNumBar.querySelectorAll('.inactive.end'));
					var deactivatedDays=[], targ;
					// DAYS ACTIONS
					var cycleDays = function(){
						for(var x=0; x<4; x++){//difference of 28 days and 31
							activeDays[x].style.display="inline-block";
						}
						
						//reactivate days
						//console.log('deactivatedDays 1:',deactivatedDays.length);
						deactivatedDays.forEach(function(targ){
							targ.className = targ.className.removeListValue('deactivated', ' ');
						});
						deactivatedDays=[];
						
						var daysInCurrentMonth=moment(year+'-'+String(month+1),'YYYY-M').daysInMonth();
						var currentOffsetDays=31 - daysInCurrentMonth;
						for(x=0; x<currentOffsetDays; x++){
							activeDays[x].style.display='none';
						}
						if(upperLimitDay > 0){//disable days that are blocked off by upper range limit
							//console.log('UPPER LIMIT DAY IS '+upperLimitDay);
							var diff = 31 - upperLimitDay - currentOffsetDays;
							for(x=0; x<diff; x++){
								targ = activeDays[x];
								targ.className = targ.className.addListValue('deactivated', ' ');
								deactivatedDays.push(targ);
							}
							if(day > upperLimitDay) setDay(upperLimitDay);
						}
						if(lowerLimitDay > 0){//disable days that are blocked off by lower range limit
							//console.log('LOWER LIMIT DAY IS '+lowerLimitDay);
							for(x=31-(lowerLimitDay-1); x<31; x++){
								targ = activeDays[x];
								targ.className = targ.className.addListValue('deactivated', ' ');
								deactivatedDays.push(targ);
							}
							if(day <lowerLimitDay) setDay(lowerLimitDay);
						}
						previouslySelectedDay.click();
						//console.log('deactivatedDays 2:',deactivatedDays.length);
						
						//show days from previous month
						inactiveDaysStart.forEach(function(el){el.style.display="none";});
						var date = new Date(year, month, 1);
						var daysFromSunday = date.getDay();
						if(daysFromSunday > 0){
							var daysInPreviousMonth=moment((month===0?year-1:year)+'-'+(month===0?12:month),'YYYY-M').daysInMonth();
							console.log('daysInPreviousMonth',(month===0?year-1:year)+'-'+(month===0?12:month),daysInPreviousMonth);
							var previousOffsetDays=31 - daysInPreviousMonth;//offset for previous months with less than 31 days
							for(x=0; x<daysFromSunday; x++){
								inactiveDaysStart[7-previousOffsetDays-x].style.display="inline-block";
							}
						}
						
						//show days from following month
						inactiveDaysEnd.forEach(function(el){el.style.display="none";});
						var diff=42 - (daysFromSunday + daysInCurrentMonth);
						//if(diff < 0) diff = 42 - (daysFromSunday + daysInCurrentMonth);
						for(x=0; x<diff; x++){
							inactiveDaysEnd[x].style.display='inline-block';
						}
						
						if(cont.month !== month){ previouslySelectedDay.className=previouslySelectedDay.className.removeListValue('selected', ' '); }
						else{ previouslySelectedDay.className=previouslySelectedDay.className.addListValue('selected', ' '); }
					};
					
					var setDay = function(intDay){
						activeDays[31-intDay].click();
					};
					
					var previouslySelectedDay=activeDays[0];
					activeDays.forEach(function(dayTag){
						dayTag.addEventListener('click', function(e){
							if(this===previouslySelectedDay) return;
							if(e.target.className.indexOf('deactivated') > -1) return;
							day=this.innerHTML;
							this.className=this.className.addListValue('selected', " ");
							previouslySelectedDay.className=previouslySelectedDay.className.removeListValue('selected', " ");
							previouslySelectedDay=this;
							changeDateText();
						}, false);
					});
					
					//INITIALIZATION
					changeDateText();
					setYear(year);
					setMonth(month);
					setDay(day);
					if(lowerLimitDay > 0) lowerLimitDay=0;
					if(upperLimitDay > 0) upperLimitDay=0;
					
					return date;
				};
				
				//load the initial components and register them
				registerSpotterComponent('spotter-calendar', {
					prototype: Object.create(
						HTMLElement.prototype,
						{
							createdCallback: {value: __preConstructor}
						}
					)
				});
				
				return __preConstructor;
			}());	
		// -- END CALENDAR --
		
		// -- TIME CALENDAR --
			__components.timeCalendar = (function(){	
				var __constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;	
					
					//BUILD CALENDAR
					var calendar=document.createElement('SPOTTER-CALENDAR')
						, upperLimit = cont.getAttribute('upper-date-limit')
						, lowerLimit = cont.getAttribute('lower-date-limit');
					if(lowerLimit !== null) calendar.setAttribute('lower-limit', lowerLimit);
					if(upperLimit !== null) calendar.setAttribute('upper-limit', upperLimit);
					cont.appendChild(calendar);
					var date=spotter.components.calendar(calendar);
					var dateTitle=calendar.querySelector('.title-bar');
			
					var timeButton=document.createElement('IMG');
					timeButton.className='icon';
					timeButton.src="/spotter/images/universal/clock_s_bicolour.png";
					timeButton.addEventListener('click', function(){
						Velocity(timeCont, {left:0}, {duration:250});
					}, false);
					dateTitle.appendChild(timeButton);
					
					var selectedDateTime=document.createElement('DIV');
					selectedDateTime.className='selected-datetime';
					var selectedDate=dateTitle.querySelector('.selected-date');
					dateTitle.insertBefore(selectedDateTime, selectedDate);
					selectedDateTime.appendChild(selectedDate);
					var selectedTime=document.createElement('DIV');
					selectedTime.className='selected-time';
					selectedDateTime.appendChild(selectedTime);
					
					//BUILD TIME SELECTOR
					spotter.events.setEventTrigger(cont, 'change');
					var setTime = function(){
						var value = slotsHour.getValue() + ':' + slotsMinute.getValue() + meridiemToggle.getValue();
						selectedTime.innerHTML = value;
						cont.eventTriggers['change']();
					};
					
					var timeCont=document.createElement('DIV');
					timeCont.className="time";
					
					var title=document.createElement('DIV');
					title.className="title-bar";
					title.innerHTML=cont.getAttribute('title-time');
					timeCont.appendChild(title);
					
					var slotsHour=document.createElement('SPOTTER-SLOT');
					slotsHour.className='start-hour vertical';
					slotsHour.setAttribute('offset-frames', cont.getAttribute('offset-frames'));
					slotsHour.setAttribute('type', '1 to 12');
					timeCont.appendChild(slotsHour);
					
					var divider=document.createElement('DIV');
					divider.className='divider';
					timeCont.appendChild(divider);
					
					var slotsMinute=document.createElement('SPOTTER-SLOT');
					slotsMinute.className='start-minute vertical';
					slotsMinute.setAttribute('offset-frames', cont.getAttribute('offset-frames'));
					slotsMinute.setAttribute('type', '0 to 59');
					timeCont.appendChild(slotsMinute);
					
					var meridiemToggle=document.createElement('SPOTTER-TOGGLE');
					meridiemToggle.className="meridiem";
					meridiemToggle.setAttribute('options', 'am,pm');
					timeCont.appendChild(meridiemToggle);
					
					cont.appendChild(timeCont);
				
					spotter.components.slots(slotsHour);
					spotter.components.slots(slotsMinute);
					spotter.components.toggleSwitch(meridiemToggle);
					
					spotter.events.swipeEvents(timeCont, '20%');
					timeCont.addEventListener('swiperight', function(){Velocity(this, {left:'100%'}, {duration:250, complete:setTime});}, false);
					
					slotsMinute.setValue(("0" + date.format("mm")).slice(-2));
					var hour = date.format("HH"), meridiem='pm';
					if(hour > 12){
						hour=hour - 12;
					}
					else{
						meridiem='am';
					}
					hour = Number(hour);
					hour = (hour === 0 ? "12" : ("0" + String(hour)).slice(-2));
					slotsHour.setValue(hour);
					console.log('meridiem:',meridiem);
					meridiemToggle.setValue(meridiem);
					
					calendar.addEventListener('change', cont.eventTriggers['change'], false);
					slotsHour.addEventListener('change', setTime, false);
					slotsMinute.addEventListener('change', setTime, false);
					meridiemToggle.addEventListener('change', setTime, false);
					
					//INITIALIZE
					setTime();
					
					//PUBLIC METHODS
					Object.defineProperty(cont, 'value', {
						get:function(){
							return selectedDate.innerHTML + 'T' + selectedTime.innerHTML;
						}
					});
					
					Object.defineProperty(cont, 'UTC', {
						get:function(){
							var format='MMM, DD YYYYThh:mma';
							return moment(selectedDate.innerHTML + 'T' + selectedTime.innerHTML, format).unix();
						}
					});
					
					cont.getFormattedDate = function(newFormat){
						var format='MMM, DD YYYYThh:mma';
						console.log('selectedTime.innerHTML:',selectedTime.innerHTML);
						return moment(selectedDate.innerHTML + 'T' + selectedTime.innerHTML, format).format(newFormat);
					};
					
					//PUBLIC EVENTS
					//hook into cont.addEventListener('change'...
				};
				
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterTimeCalendarPrototype = Object.create(HTMLScriptElement.prototype);
					SpotterTimeCalendarPrototype.createdCallback = function(){ __constructor(this); };
					var SpotterTimeCalendar = document.registerElement('spotter-time-calendar', {
						prototype: SpotterTimeCalendarPrototype,
						extends: 'div'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-time-calendar')).forEach(__constructor);
				});*/
				registerSpotterComponent('spotter-time-calendar', {
					prototype: Object.create(
						HTMLScriptElement.prototype,
						{
							createdCallback: {value: __constructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-time-calendar')).forEach(__constructor);
				
				return __constructor;
			}());
		// -- END TIME CALENDAR --	
			
		// -- TEMPLATE --	
			__components.spotterTemplate = (function(){				
				var __constructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					if(!isPartOfTemplate(cont) && registerElem(cont)){ spotter.imports.registerTemplate(cont); }
				};
			
				//load the initial components and register them
				/*__components.afterPolyFillLoaded(function(){
					var SpotterTemplatePrototype = Object.create(HTMLScriptElement.prototype);
					SpotterTemplatePrototype.createdCallback = function(){ __constructor(this); };
					var SpotterTemplate = document.registerElement('spotter-template', {
						prototype: SpotterTemplatePrototype,
						extends: 'script'
					});
					spotter.castToArray(document.getElementsByTagName('spotter-template')).forEach(__constructor);
				});*/
				registerSpotterComponent('spotter-template', {
					prototype: Object.create(
						HTMLScriptElement.prototype,
						{
							createdCallback: {value: __constructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-template')).forEach(__constructor);
				
				return __constructor;
			}());
		// -- END SPOTTER TEMPLATE --
		
		// -- OPTIONS --
			document.createElement('spotter-option');
			__components.spotterOptions = function(elemOrArrayOrNodeList, parent, mapping){
				//does not run automatically. Instead parent elements should query for spotter-option and then run this for the group
				//accepts a single element, array of elems, or nodelist as elems argument
				//mapping is an object of attribute-to-attribute. The default is {value:'value',name:'name',innerText:'innerText'} so option.value = option.getAttribute('value')
				//if select is an attribute, the LAST elem with that attribute will be set as the selected in the group.
					//family.rows will be an array of objects representing the information for each option. The data can be retrieved by option.family.rows[option.index]
				
				mapping = mapping || {value:'value', name:'name'};
				if(!elemOrArrayOrNodeList.length) elemOrArrayOrNodeList = [elemOrArrayOrNodeList];
				
				var l = elemOrArrayOrNodeList.length, elem, row, value, x, prop;
				var family = {parent:parent, children:[], selected:elemOrArrayOrNodeList[0], rows:[]};
				family.setSelected = function(indexOrElem){ if(spotter.isType.numeric(indexOrElem)){ this.selected = this.children[indexOrElem] }else{ this.selected = indexOrElem; } };
				family.setSelected(0);
				for(x=0;x<l;x++){
					elem = elemOrArrayOrNodeList[x];
					//console.log(elemOrArrayOrNodeList,'elem',elem);
					if(!elem.getAttribute) console.log(new Error().stack);
					row = {};
					for(prop in mapping){
						value = (mapping[prop] === 'innerHTML') ? elem.innerHTML : elem.getAttribute(mapping[prop]);
						elem[prop] = value;
						row[prop] = value;
					}
					elem.index = family.children.push(elem) -1;
					family.rows[elem.index] = row;
					elem.family = family;
					
					if(elem.hasAttribute('selected')) family.selected = elem;
				}
				
				return family;
			};
		// -- END OPTIONS --	
			
		// -- CROPPER --	
			__components.cropper=(function(){
				
				//helper - to make the template setup more distinct
				var setTemplate = function(cont, template, templateName){
					var cropperCont = document.createElement('DIV');
					cont.cropperCont = cropperCont;
					
					spotter.templates.setup(template, templateName);
					spotter.templates.append(templateName, null, cropperCont);
				};
				
				var __preConstructor = function(cont){
					if(typeof cont === "undefined") cont = this;
					var templateName, temp;
					
					//set template and get relevant elems from
					if((templateName = cont.getAttribute('template'))){
						//template must contain 
						//elem.className="canvas-cont" where the main cropper will be added
						//elem.className="crop-button", elem.className="undo-button", elem.className="save-button" which are ofc the interaction buttons
						spotter.imports.useImport(templateName, function(e){ 
							setTemplate(cont, e.content.template, templateName);
							__constructor(cont);
						});
					}
					else if(temp=cont.querySelector('spotter-template')){
						setTemplate(cont, temp.innerHTML, temp.id || temp.getAttribute('name'));
						temp=null;
						__constructor(cont);
					}
					else{//default template
						setTemplate(cont, '<div class="canvas-cont"></div>'+
						'<img src="/spotter/images/universal/crop_s_tri_colour.png" class="crop-button"/>'+
						'<img src="/spotter/images/universal/undo_s_bicolour.png" class="undo-button"/>'+
						'<img src="/spotter/images/universal/save_file_s_bicolour.png" class="save-button"/>', 'defaultSpotterCropper');
						__constructor(cont);
					}
				};
				
				var __constructor = function(cont){	
					//attributes (all optional)
					// crop-width|height - width of cropped image. height determined by 'aspect'.
					// max-crop-width|height - the maximum width/height these dimensions can be. Limits the frame size.
					// min-crop-width|height - the minimum width/height these dimensions can be. Limits the frame size.
					// aspect=(int/int)(width/height) - If set then max, min & crop will be set by this.
					// blur-opacity="int" - int/10 will be used as the opacity for the side blurs.
					// use-blur=true/false - dont use blur or do
					// frame-width=int(as percentage) - the percent width the frame will be of the full canvas (ie 80 means the frame will be 80% of the canvas width)
					// frame-thickness="int" - width of the frame lines
					// handle-thickness="int" - width of the lines on the resize handle
					// handle-height/width="int" - percentage of canvas width the handle shoudl be in height/width (so handle-height="5" would be 5% of the width)
					// fill-mode="cover|whitespace" - cover will warp the cropped image to fill the cropped dimensions, whitespace will fill extra space with whitespace.
					// image-mimetype="jpeg|png|gif" - type of crop image created
					// image-quality="int" - quality of the image created by crop
					// maximum-image-resize="int" - source images will be resized to a maximum of this width
					/*
						Aspect takes priority over both height and width with width taking priority over height. If width is not specified but height and aspect are, then width will depend on height.
						This is true for max and min as well.
					*/
					
					if(isPartOfTemplate(cont)) return;
					if(!registerElem(cont)) return;
					
					cont = cont || this;
					
					var shade = new spotter.shade('imageCropper'+cont.getAttribute('name')),
						name,
						temp,
						cropperCont = cont.cropperCont,//the container that holds the canvases + buttons. If a template is used, it will become the innerHTML for this elem
						canvasCont = null,
						imgInput = document.createElement('INPUT'),
					    frame = {
							thickness: Number(cont.getAttribute('frame-thickness'))||2,
							heightMult: Number(cont.getAttribute('frame-height'))||80,
							widthMult: Number(cont.getAttribute('frame-width'))||80,
							width: null,
							height: null,
							maxWidth: null,
							maxHeight:null,
							minWidth: null,
							minHeight:null,
							x: null,
							y: null,
							color: cont.getAttribute('frame-color')||'#FFFFFF',
							canvas: document.createElement('CANVAS'),//canvas that holds the frame
							aspect: null,//referenceWidth/sourceWidth
							active: false
						},
					    handle = {
					    	thickness: Number(cont.getAttribute('handle-thickness'))||2,
							ctx: frame.canvas.getContext('2d'),
							heightMult: Number(cont.getAttribute('handle-height'))||15,
							widthMult: Number(cont.getAttribute('handle-width'))||15,
							width: null,
							height: null,
							color: cont.getAttribute('handle-color')||'#FFFFFF',
							x: null,
							y: null,
							active: false
					    },
						blur = {
							ctx: frame.canvas.getContext('2d'),
							opacity: (cont.getAttribute('blur-opacity')||8)/10,
							color: cont.getAttribute('blur-color')||'#000',
							active: cont.getAttribute('blur-active')||true
						},
					    source = {//holds the actual image to be cropped from. this is not visible to user
							canvas: document.createElement('CANVAS'),
							imageData:null,
							maxWidth: cont.getAttribute('maximum-image-resize') || null
						},
						preview = {//the canvas that the cropped image is applied to for the user to see
							canvas: document.createElement('CANVAS'),
							width: cont.getAttribute('crop-width'),
							height: cont.getAttribute('crop-height'),
						},
						reference = {//canvas w/ image for user to crop from. Frame is on top of this one.
							canvas: document.createElement('CANVAS'),
							width: null,
							height: null
						},
						cropped = {//holds cropped images. this is not visible to the user
							canvas: document.createElement('CANVAS'),
							width: cont.getAttribute('crop-width'),//the end crop will be this width
							height: cont.getAttribute('crop-height'),//the end crop will be this height unless width & aspect are set
							maxWidth: cont.getAttribute('max-crop-width'),//limits the width that can be cropped to
							maxHeight: cont.getAttribute('max-crop-height'),
							minWidth: cont.getAttribute('min-crop-width'),
							minHeight: cont.getAttribute('min-crop-height'),
							aspect: ((temp=cont.getAttribute("aspect-ratio")) && (temp=temp.split('/')) ? temp[0]/temp[1] : temp),//the aspect that the crop will maintina (enforced at the frame level)
							fillMode: cont.getAttribute('fill-mode')||'cover',
							quality: Number(cont.getAttribute('image-quality'))|.92,
							mimeType: cont.getAttribute('image-mimetype')||'jpg'
						},
						mouse = {
					    	start: {x:0, y:0},
							end: {x:0, y:0}
					    },
						buttons = {
							crop: null,
							save: null,
							undo: null
						},
						input = {//parts of the actual cropper element
							canvas: document.createElement('CANVAS'),
							width: null
						},
						events = {
							crop: spotter.events.setEventTrigger(cont, 'crop'),
							undo: spotter.events.setEventTrigger(cont, 'undo'),
							save: spotter.events.setEventTrigger(cont, 'save'),
							close: spotter.events.setEventTrigger(cont, 'close'),
							open: spotter.events.setEventTrigger(cont, 'open')
						},
						active = {
							save: false,
							crop: true,
							undo: false
						},
						src,
						maxWidth,
						maxHeight,
						frm
					;
					
					//add contexts
					frame.context = frame.canvas.getContext("2d");
					preview.context = preview.canvas.getContext("2d");
					reference.context = reference.canvas.getContext("2d");
					cropped.context = cropped.canvas.getContext("2d");
					
					//add crop specific properties
					cropped.canvas.setAttribute('image-quality', cropped.quality);
					cropped.canvas.setAttribute('mimetype', cropped.mimeType);
				
					//helper - parse template to spotter.templates working object
					var setTemplate = function(template, templateName){
						spotter.templates.setup(template, templateName);
						templateReady = true;
					};
					
					//template must contain the following:
					canvasCont		= cropperCont.querySelector('.canvas-cont');
					buttons.crop	= cropperCont.querySelector('.crop-button');
					buttons.undo	= cropperCont.querySelector('.undo-button');
					buttons.save	= cropperCont.querySelector('.save-button');
					buttons.undo.className = buttons.undo.className.addListValue('inactive', ' ');
					buttons.save.className = buttons.save.className.addListValue('inactive', ' ');
					
					frame.canvas.className = 'frame';
					reference.canvas.className = 'reference';
					preview.canvas.className = 'preview';
					input.canvas.className = "cropper-input";
					
					//add canvases
					canvasCont.appendChild(preview.canvas);
					canvasCont.appendChild(reference.canvas);
					canvasCont.appendChild(frame.canvas);
					shade.content.appendChild(cropperCont);
					
					cont.appendChild(input.canvas);
					
					var setFrame=function(x,y,w,h){
						//w/h are width/height including line thickness
						if((x!==0 && !x) || (y!==0 && !y) || (w!==0 && !w) || (h!==0 && !h)) console.error('set frame arguments must all be defined and non null',arguments);
						frame.context.clearRect(0, 0, frame.canvas.width, frame.canvas.height);		
						frame.context.strokeStyle=frame.color;
						frame.context.lineWidth=frame.thickness;
						frame.x=Math.ceil(x);
						frame.y=Math.ceil(y);
						frame.width=w;
						frame.height=h;
						frame.context.strokeRect(x, y, w-frame.thickness, h-frame.thickness);
						setBlur();
					};
					
					var setHandle=function(w,h){
						w=w||handle.width;
						h=h||handle.width;
						handle.ctx.strokeStyle=handle.color;
						handle.ctx.lineWidth=handle.thickness;
						handle.x=frame.x+frame.width-w-handle.thickness;
						handle.y=frame.y+frame.height-h-handle.thickness;
						handle.width=w;
						handle.height=h;
						handle.ctx.strokeRect(handle.x, handle.y, w, h);
					};
					
					var setBlur=function(){
						if(!blur.active) return;
						var x2=frame.x+frame.width,
							y2=frame.y,
							x3=frame.x,
							y3=frame.y+frame.height,
							x4=x2,
							y4=y3
						;	
						blur.ctx.fillStyle='rgba('+[spotter.hexToRgb(blur.color),blur.opacity].join(',')+')';
						//left
						blur.ctx.fillRect(0, 0, frame.x, frame.canvas.height);
						//right
						blur.ctx.fillRect(x2, 0, frame.canvas.width-x2, frame.canvas.height);
						//top
						blur.ctx.fillRect(frame.x, 0, frame.width, frame.y);
						//bottom
						blur.ctx.fillRect(x3, y3, frame.width, frame.canvas.height-y3);
					};
					
					//reveal shade and scroll crop canvas open
					var activate = function(){
						var dimX=frame.width, dimY=frame.height;
						undoCrop();
						shade.open();
						if(cropped.maxWidth) dimX = Math.min(cropped.maxWidth, dimX);	
						if(cropped.maxHeight) dimY = Math.min(cropped.maxHeight, dimY);
						if(cropped.minWidth) dimX = Math.max(cropped.minWidth, dimX);
						if(cropped.minHeight) dimY = Math.max(cropped.minHeight, dimY);
						if(cropped.aspect) dimY = dimX/cropped.aspect;
						setFrame((frame.canvas.width - dimX)/2, (frame.canvas.height - dimY)/2, dimX, dimY);
						setHandle();
						Velocity(cropperCont, {width:'100%'}, {duration:400});
						cont.eventTriggers['open']();
					};
				
					//hide shade and scrolls crop closed
					var deactivate = function(){
						cont.eventTriggers['close']();
						Velocity(cropperCont, {width:'0'}, {duration:400, complete:shade.close});
					};
					
					var setCanvasWidths=function(w){
						var previousWidth, width;
						previousWidth = cropperCont.style.width;
						cropperCont.style.width = "";	
						width = Math.round(spotter.getWidth(cropperCont));
						cropperCont.style.width = previousWidth;
						
						if(source.canvas.width){
							frame.aspect = width / source.canvas.width;
							if(cropped.maxWidth) frame.maxWidth = cropped.maxWidth * frame.aspect;
							if(cropped.maxHeight) frame.maxHeight = cropped.maxHeight * frame.aspect;
							
							if(cropped.minWidth) frame.minWidth = cropped.minWidth * frame.aspect;
							if(cropped.minHeight) frame.minHeight = cropped.minHeight * frame.aspect;
						}
						
						frame.canvas.width = width;
						frame.canvas.setAttribute('width', width+'px');
						
						reference.canvas.width = width;
						reference.canvas.setAttribute('width', width+'px');
						
						preview.canvas.width = width;
						preview.canvas.setAttribute('width', width+'px');
						
						width = spotter.getWidth(cont, undefined, true);
						input.canvas.setAttribute('width', width);
					};
					
					var setCanvasHeights=function(){
						var srcWidth = reference.canvas.width, scale = reference.canvas.width/source.canvas.width, scaledHeight = scale * source.canvas.height;
						
						frame.canvas.height = reference.canvas.height = scaledHeight;
						frame.canvas.setAttribute('height', scaledHeight);
						
						frame.width = (frame.widthMult/100) * srcWidth;
						if(cropped.aspect){ 
							frame.height = frame.width/cropped.aspect;
							if(frame.height > scaledHeight) {
								frame.height = (frame.widthMult/100) * scaledHeight;
								frame.width = frame.height * cropped.aspect;
							}
						}
						else{
							frame.height = (frame.widthMult/100) * scaledHeight;
						}
						
						handle.width = (handle.widthMult / 100) * frame.width;
						handle.height = (handle.heightMult / 100) * frame.width;
						
						reference.canvas.setAttribute('height', scaledHeight);
						if(source.image) reference.context.drawImage(source.image, 0, 0, reference.canvas.width, reference.canvas.height);
					};
					
					//helper
					var afterImageLoadedSetWidths = function(){
						/*
						document.body.appendChild(source.canvas);
						window.testImage = source.image;
						document.body.appendChild(source.image);
						window.testCanvas = source.canvas;
						*/
						
						frame.aspect = frame.canvas.width / source.canvas.width;
						if(cropped.maxWidth) frame.maxWidth = cropped.maxWidth * frame.aspect;
						if(cropped.maxHeight) frame.maxHeight = cropped.maxHeight * frame.aspect;
						
						if(cropped.minWidth) frame.minWidth = cropped.minWidth * frame.aspect;
						if(cropped.minHeight) frame.minHeight = cropped.minHeight * frame.aspect;
				
						setCanvasHeights();
						if(open) activate();
					};
					
					var setSourceImage=function(strOrFile, open){
						//open=[true/false] - activate once loaded?
						var targImage;
						if(typeof strOrFile == 'string'){
							targImage = new spotter.images.createImageFromDataUrl(strOrFile, true, source.image||null);
						}
						else{
							targImage = new spotter.images.createImageFromFile(strOrFile, true, source.image||null);
						}
						targImage.promise(function(image){
							//set the heights of all the canvases and draw the reference image to the reference canvas and reset the frame
							var sourceCanvas = source.canvas,
								ctx = sourceCanvas.getContext("2d");
							
							source.image = image;
							spotter.images.maxSize(image, 1024, 1024);
							
							if(image.exif){
								image.onload = afterImageLoadedSetWidths;
								spotter.images.orient(image, sourceCanvas);
							}
							else{
								sourceCanvas.width = image.width;
								sourceCanvas.height= image.height;
								ctx.drawImage(image, 0, 0, image.width, image.height);
								afterImageLoadedSetWidths();
							}
						});
					};
					
					var fileChange = (function(){
						var previousFile = {};
						return function(){//used for on change. If src is static (set by attribute) the activate command needs to be used
							var file = this.files[0], testOn = ['lastModified','name','size','type'], isNew = false;
							
							testOn.forEach(function(prop){
								if(previousFile[prop] !== file[prop]) isNew = true;
							});
							
							if(!isNew){ activate(); }
							else{
								if(typeof previousFile !== 'undefined'){
									testOn.forEach(function(prop){
										previousFile[prop] = file[prop];
									});
								}
								setSourceImage(file, true);
							}
						};
					}());
					
					var cropImage=function(){
						if(!active.crop) return;
						active.crop = false;
						
						var srcX = Math.round(frame.x / frame.aspect),//these frame dimensions will pull from source canvas.
							srcY = Math.round(frame.y / frame.aspect),
							cropWidth = frame.width / frame.aspect,
							cropHeight= frame.height / frame.aspect;
						
						//this will copy the image pulled from source to the cropped canvas and then the preview canvas.
						scaleCanvasToCanvas(srcX, srcY, cropWidth, cropHeight, source.canvas, cropped.canvas, cropped.width, null, cropped.fillMode, function(){
							preview.canvas.style.zIndex = 101;
							reference.canvas.style.display = 'none';
							frame.canvas.style.display = 'none';
							preview.canvas.style.position = 'relative';
							preview.canvas.style.visibility = 'visible';
							buttons.undo.className = buttons.undo.className.removeListValue('inactive', ' ');
							buttons.save.className = buttons.save.className.removeListValue('inactive', ' ');
							buttons.crop.className = buttons.crop.className.addListValue('inactive', ' ');
							//the callback for scalecanvastocanvas has access to the temporary image (this) used by imagetocanvas
							imageToCanvas(this, preview.canvas, preview.canvas.width, null, cropped.fillMode);
							active.save = true;
							active.undo = true;
							cont.eventTriggers['crop']();
						});
					};
					
					var undoCrop=function(){
						if(!active.undo) return;
						active.undo = false;
						active.save = false;
						active.crop = true;
						
						preview.canvas.style.zIndex = 99;
						reference.canvas.style.display='inline-block';
						frame.canvas.style.display='inline-block';
						preview.canvas.style.position = 'absolute';
						preview.canvas.style.visibility = 'hidden';
						buttons.undo.className = buttons.undo.className.addListValue('inactive', ' ');
						buttons.save.className = buttons.save.className.addListValue('inactive', ' ');
						buttons.crop.className = buttons.crop.className.removeListValue('inactive', ' ');
							
						cont.eventTriggers['undo']();
					};
					
					var saveCrop=function(){
						if(!active.save) return;
						
						imageToCanvas(null, input.canvas, input.canvas.width, null, cropped.fillMode);
						deactivate();
						cont.eventTriggers['save']();
						cont.hasValue = true;
					};
					
					var imageToCanvas = (function(lastImage){
						return function(image, canvas, canvasWidth, canvasHeight, fillMode){
							if(image){ lastImage = image; }
							else{ image = lastImage; }
							var scale, scaleW, scaleH, width, height;
							if(canvasWidth && !canvasHeight){
								scale = canvasWidth / image.width;
								if(scale > 1){//canvas wider than image
									if(fillMode === 'cover'){
										canvas.setAttribute('height', image.height * scale);
										canvas.getContext("2d").drawImage(image, 0, 0, image.width * scale, image.height * scale);
									}
									else if(fillMode === 'contain'){
										canvas.setAttribute('height', image.height * scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, image.height * scale);
									}
									else if(fillMode === 'whitespace'){
										canvas.setAttribute('height', image.height);
										canvas.getContext("2d").drawImage(image, (canvasWidth - image.width)/2, 0, image.width, image.height);
									}
								}
								else{//image wider than canvas
									if(fillMode === 'cover'){
										canvas.setAttribute('height', image.height * scale);
										canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
									}
									else{
										canvas.setAttribute('height', image.height * scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, image.height * scale);
									}
								}
							}
							else if(canvasHeight && !canvasWidth){
								scale = canvasHeight / image.height;
								if(scale > 1){//set width to match aspect	
									if(fillMode === 'cover'){
										canvas.setAttribute('width', image.width * scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasHeight, image.height);
									}
									else{
										canvas.setAttribute('width', image.width/scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, image.height/scale);
									}
								}
								else{	
									if(fillMode === 'cover'){
										canvas.setAttribute('width', image.width/scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, canvasHeight);
									}
									else if(fillMode === 'whitespace'){
										canvas.setAttribute('width', image.width);
										canvas.getContext("2d").drawImage(image, (canvasHeight - image.height)/2, (canvasWidth - image.width)/2, image.width, image.height);
									}
									else if(fillMode === 'contain'){
										canvas.setAttribute('width', image.width/scale);
										canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, canvasHeight);
									}
								}
							}
							else if(canvasHeight && canvasWidth){
								canvas.setAttribute('width', canvasWidth);
								cavnas.setAttribute('height', canvasHeight);
								if(fillMode === 'cover'){
									scaleW = canvasWidth/image.width, scaleH = canvasHeight/image.width, scale = Math.min(scaleW, scaleH);
									if(scale < 1){ canvas.getContext("2d").drawImage(image, 0, 0, image.width / scale, image.height / scale); }
									else{ canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height); }
								}
								else if(fillMode === 'contain'){
									canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, canvasHeight);
								}
								else if(fillMode === 'whitespace'){
									scaleW = canvasWidth/image.width, scaleH = canvasHeight/image.width, scale = Math.min(scaleW, scaleH);
									canvas.getContext("2d").drawImage(image, Math.max((canvasWidth-image.width)/2, 0), Math.max((canvasHeight-image.height)/2, 0), image.width, image.height);
								}
							}
							else{
								canvas.setAttribute('width', image.width);
								canvas.setAttribute('height', image.height);
								canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
							}
						};
					}());
					
					var scaleCanvasToCanvas = (function(){
						var placeHolderImage = new Image(), placeHolderCanvas = document.createElement('CANVAS');
						
						return function(srcX, srcY, srcW, srcH, src, targ, targWidth, targHeight, fillMode, callBack){
							var srcData = src.getContext("2d").getImageData(srcX, srcY, srcW, srcH);
							//source.canvas.strokeRect(srcX, srcY, srcW, srcH);
							placeHolderCanvas.setAttribute('width', srcW);
							placeHolderCanvas.setAttribute('height', srcH);
							placeHolderCanvas.getContext("2d").putImageData(srcData, 0, 0);
							
							placeHolderImage.addEventListener('load', function(){
								imageToCanvas(this, targ, targWidth, targHeight, "contain");
							}, false);
							if(callBack) placeHolderImage.addEventListener('load', callBack, false);
							placeHolderImage.src = placeHolderCanvas.toDataURL();
						};
					}());
					
					//initialize
					spotter.testLoaded(setCanvasWidths);
					spotter.onResize(function(){
						setCanvasWidths();
						setCanvasHeights();
						var dimX=frame.width, dimY=frame.height;
						setFrame((frame.canvas.width - dimX)/2, (frame.canvas.height - dimY)/2, dimX, dimY);
						setHandle();
					});
					
					//setup input
					imgInput.className = 'hide';
					if(src = cont.getAttribute('src')){	
						imgInput.type="hidden";
						setSourceImage(src, true);
					}
					else{
						//cont.setAttribute('type', 'file');
						imgInput.type = "file";
						imgInput.className = 'hide';
						var acceptTypes = [], accept;
						if(accept = cont.getAttribute('accept')){
							accept = accept.split(',');
							if(~accept.indexOf('jpg') || ~accept.indexOf('jpeg')){
								acceptTypes.push('jpeg');
							}
							if(~accept.indexOf('gif')){
								acceptTypes.push('gif');
							}
							if(~accept.indexOf('png')){
								acceptTypes.push('png');
							}
						}
						else{ acceptTypes.push('*'); }
						acceptTypes = 'image/'+acceptTypes.join(',image/');
							
						//cont.accept = acceptTypes;
						imgInput.accept = acceptTypes;
						cont.addEventListener('click', function(e){e.stopPropagation(); imgInput.click();}, false);
						imgInput.addEventListener('change', fileChange, false);
					}
					imgInput.name = cont.getAttribute("name");
					imgInput.fileTarget = cropped.canvas;
					cont.appendChild(imgInput);
					
					//validation
					if(cont.hasAttribute('data-required')){
						imgInput.setAttribute('data-required', '');
						if(name = cont.getAttribute('data-validate-name')) imgInput.setAttribute('data-validate-name', name);
						if(imgInput.form && imgInput.form.validator) imgInput.form.validator.setupInput(imgInput);
					}
					
					//form interactions - add a second file input that will show in form elements and target the cropped canvas
					/*
					if(frm = spotter.findParent(cont, 'FORM', 'tagName')){	
						temp = document.createElement('INPUT');
						temp.type = 'file';
						temp.name = cont.getAttribute('name');
						temp.fileTarget = cropped.canvas;
						temp.className = "hide";
						cont.appendChild(temp);
					}
					*/
					
					shade.onClose(deactivate);
					
					//setup cropped dims
					if(cropped.width){
						cropped.canvas.setAttribute('width', cropped.width);
					}
					if(cropped.height){
						cropped.canvas.setAttribute('height', cropped.height);
					}
					
					//events
					frame.canvas.addEventListener(spotter.mobile.events.mouse['mousedown'], function(e){
						mouse.start = spotter.getRelativeMousePos(this, e);
						if(mouse.start.x < frame.x+frame.width
						   && mouse.start.x > frame.x
						   && mouse.start.y < frame.y+frame.height
						   && mouse.start.y > frame.y
						){//in frame
							if(mouse.start.x > handle.x
							   && mouse.start.y > handle.y
							){//in handle
								handle.active=true;
							}
							else{
								frame.active=true;
							}
						}
					}, false);
					
					frame.canvas.addEventListener(spotter.mobile.events.mouse['mouseout'], function(e){
						frame.active=false;
						handle.active=false;
					}, false);
					
					frame.canvas.addEventListener(spotter.mobile.events.mouse['mouseup'], function(e){
						frame.active=false;
						handle.active=false;
					}, false);
					
					//frame move
					frame.canvas.addEventListener(spotter.mobile.events.mouse['mousemove'], function(e){
						if(!frame.active) return;
						mouse.end = spotter.getRelativeMousePos(this, e);
						var vector = getVector(mouse), x = frame.x+vector.chgX, y = frame.y+vector.chgY;
						
						if(x < 0){ x = 0;}
						else if(frame.width + x > frame.canvas.width){ x = frame.canvas.width - frame.width; }
						if(y < 0){ y = 0; }
						else if(frame.height + y > frame.canvas.height){ y = frame.canvas.height - frame.height; }
						
						setFrame(x, y, frame.width, frame.height);
						setHandle();
						mouse.start.x=mouse.end.x;
						mouse.start.y=mouse.end.y;
					}, false);
				
					//resize
					frame.canvas.addEventListener(spotter.mobile.events.mouse['mousemove'], function(e){
						if(!handle.active) return;
						mouse.end = spotter.getRelativeMousePos(this, e);
						var vector = getVector(mouse), dimX, dimY;
						if(cropped.aspect){//for aspect, the dominant axis will determine the end result
							if(Math.abs(vector.chgX) > Math.abs(vector.chgY)){
								dimX = frame.width+vector.chgX;
								if(dimX + frame.x >= frame.canvas.width) dimX = frame.canvas.width - frame.x;
								dimY = dimX/cropped.aspect;
								if(dimY + frame.y >= frame.canvas.height){
									dimY = frame.canvas.height - frame.y;
									dimX = dimY * cropped.aspect;
								}
							}
							else{
								dimY = frame.height+vector.chgY;
								if(dimY + frame.y >= frame.canvas.height) dimY = frame.canvas.height - frame.y;
								dimX = dimY * cropped.aspect;
								if(dimX + frame.x >= frame.canvas.width){
									dimX = frame.canvas.width - frame.x;
									dimY = dimX/cropped.aspect;
								}
							}
							if(frame.maxWidth && dimX >= frame.maxWidth) return;
							if(frame.minWidth && dimX <= frame.minWidth) return;
							if(frame.maxHeight && dimY >= frame.maxHeight) return;
							if(frame.minHeight && dimY <= frame.minHeight) return;
							setFrame(frame.x, frame.y, Math.ceil(Math.max(dimX, 0)), Math.ceil(Math.max(dimY, 0)));
						}
						else{
							dimX = frame.width+vector.chgX;
							if(dimX + frame.x >= frame.canvas.width) dimX = frame.canvas.width - frame.x;
							dimY = frame.height+vector.chgY;
							if(dimY + frame.y >= frame.canvas.height) dimY = frame.canvas.height - frame.y;
							if(frame.maxWidth) dimX = Math.min(frame.maxWidth, dimX);	
							if(frame.maxHeight) dimY = Math.min(frame.maxHeight, dimY);
							if(frame.minWidth) dimX = Math.max(frame.minWidth, dimX);
							if(frame.minHeight) dimY = Math.max(frame.minHeight, dimY);
							setFrame(frame.x, frame.y, Math.ceil(dimX, 0), Math.ceil(dimY, 0));
						}
						setHandle();
						mouse.start.x=mouse.end.x;
						mouse.start.y=mouse.end.y;
					}, false);
					
					//intiate crop
					buttons.crop.addEventListener('click', cropImage, false);
					
					//undo crop
					buttons.undo.addEventListener('click', undoCrop, false);
					
					//save crop
					buttons.save.addEventListener('click', saveCrop, false);
					
					// ** methods **
					cont.reset = function(){
						var canvas = input.canvas;
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
						
						canvas = preview.canvas;
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
						
						canvas = source.canvas;
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
						
						canvas = reference.canvas;
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
						
						canvas = cropped.canvas;
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
						
						imgInput.value = "";
					};
				};
				
				/*__components.afterPolyFillLoaded(function(){			
					var tagName = 'spotter-image-cropper', SpotterCropperPrototype = Object.create(HTMLDivElement.prototype);
					SpotterCropperPrototype.createdCallback = __preConstructor;
					var SpotterCropper = document.registerElement(tagName, {
						prototype: SpotterCropperPrototype,
						extends: 'div'
					});
					
					//complete the initial tags
					Array.prototype.forEach.call(document.querySelectorAll(tagName), __preConstructor);
					spotter.events.fire(spotter.events('cropper-ready'));
				});*/
				registerSpotterComponent('spotter-image-cropper', {
					prototype: Object.create(
						HTMLDivElement.prototype,
						{
							createdCallback: {value: __preConstructor}
						}
					)
				});
				//spotter.castToArray(document.querySelectorAll('spotter-image-cropper')).forEach(__preConstructor);
				spotter.events.fire(spotter.events('cropper-ready'));
						
				return __preConstructor;
			}());
		// -- END CROPPER --

	// *** OPERATIONAL/HELPERS ***

	componentFuncs['[data-modal-timer]'] = function(){};//temporary
	componentFuncs['SPOTTER-MODAL-SELECT'] = __components.popSelect; 
	componentFuncs['SPOTTER-INPUT-SEARCH'] = __components.searchInput; 
	componentFuncs['SPOTTER-INPUT-SORT'] = __components.sortInput; 
	componentFuncs['SPOTTER-MODAL-TEXTAREA'] = __components.popUpTextArea; 
	componentFuncs['SPOTTER-AJAX-LIST'] = __components.ajaxList; 
	componentFuncs['SPOTTER-SLOTS-SCROLLER'] = __components.slotsScroller; 
	
	return __components;
}());