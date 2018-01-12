if(typeof spotter === 'undefined') spotter={};
spotter.slots = (function(){	
	var buildForm = function(cont){
		var scrollBox=document.createElement('DIV');
		scrollBox.className="spotter-hide-scroll";
		
		var reel=document.createElement('DIV');
		reel.className="reel";
		var frames=cont.getAttribute('type');

		if((frames=frames.split(" to ")).length === 2){
			var HTML="";
			frames[1]=Number(frames[1]);
			for(var x=Number(frames[0]); x<=frames[1]; x++){
				HTML+='<div class="step"><span class="center">'+("0" + x).slice(-2)+'</span></div>';
			}
		}
		else{
			return false;
		}
		reel.innerHTML=HTML;
		scrollBox.appendChild(reel);
		cont.appendChild(scrollBox);
		return true;
	};
	
	var __constructor = function(slotsCont, scrollBox, reel, frameHeight){  
	    
		if(typeof scrollBox === 'undefined' || !scrollBox.children.length) if(!buildForm(slotsCont)){console.error('build form for slots failed',slotsCont); return false;}
		
	    scrollBox = slotsCont.children[0];
	    reel = scrollBox.children[0];
	    frameHeight = spotter.getHeight(reel.children[0]);
	
	    var scrollPoints     = Array.prototype.slice.call(reel.children);
	    var snapToActive     = false;
	    var cycleActive      = false;
	    var changeEvt        = spotter.events.setEventTrigger(slotsCont, 'change');
		var last			 = reel.children.length - 1;
		var maxScrollHeight  = frameHeight * (last + 1);
		var previousFrame	 = null;
		var offsetFrames	 = slotsCont.getAttribute('offset-frames') || 0;//(attr) offset-frames=integer if the top most frame IS NOT the frame to retrieve value
	    
		Object.defineProperty(slotsCont, 'currentFrame', {
			get: function(){
				var index = Math.round(scrollBox.scrollTop / frameHeight);
				return reel.children[index];
			},
			set: function(elem){
				enforceBottomLimit(elem);
				scrollBox.scrollTop = elem.offsetTop;
			}
		});
	
		var onScroll = function(action){
			//used to add/remove the scroll listener
			onScroll.functions.forEach(function(func){
				scrollBox[action+'EventListener']('scroll', func, 0);
			});
		};
		onScroll.functions = [];
	
		var timerScroll = function(scrollBox, doFunc){
			//a generic scroll detection function //takes a func to execute after a minInterval time has passed
			//scrollBox = element to monitor scroll, 
			//doFunc is the function to perform after interval and scroll. 'this' will be the scroll element (scrollBox)
			//minInterval is the minimum time difference that must have occurred.
			var __private = {
				minInterval: 800,
				start: new Date().getTime(),
				now: null,
				timer: null,
				timeElapsed: 0,
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
					__private.timeElapsed = __private.now - __private.start;
					if( __private.timeElapsed > __private.minInterval){
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
		
	    var snapTo = function(){
	        if(snapToActive) return;
	        snapToActive=true;
			var targ=slotsCont.currentFrame;
	        scrollBox.scrollTop = targ.offsetTop;
	        if(previousFrame!=targ){ slotsCont.eventTriggers['change'](); previousFrame=targ; }
	        snapToActive=false;
	    };
	    
	    var previousScrollPos = scrollBox.scrollTop;
	    var cycleSlides = function(e){
			if(cycleActive) return;
			cycleActive = true;
			var scrollChg = scrollBox.scrollTop - previousScrollPos;
	        //console.log('cycleSlides');
			//console.log(' - scrollChg = '+scrollChg);
			//console.log(' - scrollTop = '+scrollBox.scrollTop);
			//console.log(' - previousScrollPos = '+previousScrollPos);
			if(Math.abs(scrollChg) >= frameHeight){
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
			console.log('cycleUp: initial count = '+count);
			while(count < 0){
				//console.log(' - ITERATION - ');
				var startFrame = slotsCont.currentFrame;
				//console.log(' - starting previousScrollPos = '+previousScrollPos);
				//console.log(' - startFrame = '+startFrame.innerHTML);
				//console.log(' - previousScrollPos = '+previousScrollPos);
				//var targ = scrollPoints.pop();
				//reel.insertBefore(targ, reel.children[0]);
				//scrollPoints.unshift(targ);
				scrollBox.scrollTop += frameHeight;
				if(ignoreCycle !== true) previousScrollPos = Math.ceil(scrollBox.scrollTop / frameHeight) * frameHeight;
				reel.insertBefore(reel.children[last], reel.children[0]);
				count++;
			}
	    };
	    
	    var cycleDown = function(count, ignoreCycle){//count assumed positive (downwards scroll)
			console.log('cycleDown: initial count = '+count);
			while(count > 0){
				//console.log(' - ITERATION - ');
				var startFrame = slotsCont.currentFrame;
				//console.log('- starting previousScrollPos = '+previousScrollPos);
				//console.log('- startFrame = '+startFrame.innerHTML);
				//console.log('- previousScrollPos = '+previousScrollPos);
				//var targ = scrollPoints.shift();
				//reel.appendChild(targ);
				//scrollPoints.push(targ);
				scrollBox.scrollTop -= frameHeight;
				if(ignoreCycle !== true) previousScrollPos = Math.floor(scrollBox.scrollTop / frameHeight) * frameHeight;
				reel.appendChild(reel.children[0]);
	            count--;
	        }
	    };
		
		//these functions ensure that the necessary number of frames are on top/bot for scrolling to be effective
		var enforceBottomLimit=function(index, elem){//leave index blank if using scrollTop
			if(typeof index!=='undefined'){
				if(!((last - index) > 2)) cycleDown(2 - (last - startIndex));
			}
			else{
				var d=maxScrollHeight - elem.offsetTop;
				if(d <= (2 * frameHeight)){
					enforceBottomLimit(-1 * Math.ceil(d/frameHeight));
				}
			}
		};
		var enforceUpperLimit=function(index){
			if(!(index > 1)) cycleUp(-1 * (2 - index));
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
		
		//console.log([].slice.call(reel.children));
		//console.log('defaultFrame was found to be '+defaultFrame.innerHTML);
		//console.log('The start index is '+startIndex+(!(startIndex > 1) ? ' which should result in '+(2 - startIndex)+' elements being cycled to the top' : ' so no elements will be cycled up'));
		//console.log('The last index is '+last+(!((last - startIndex) > 2) ? ' which should result in '+(3 - (last - startIndex))+' being cycled to the bottom' : ' so no elements will be cycled down'));
		
		//a minimum of 2 frames must be above and below the start frame
		enforceUpperLimit(startIndex);
		enforceBottomLimit(startIndex);
		
		scrollBox.scrollTop=defaultFrame.offsetTop;
		previousFrame=defaultFrame;
		
		timerScroll(scrollBox, snapTo);
		scrollBox.addEventListener('scroll', cycleSlides, false);//this event cycles the frames
		
		/* PUBLIC METHODS */
		Object.defineProperty(slotsCont, 'value', {
			get: function(){
				var targ=previousFrame;
				if(offsetFrames){
					for(var x=0; x<offsetFrames; x++){
						targ=targ.nextSibling;
					}
				}
				while(targ.children.length){
					targ=targ.children[0];
				}
				return targ.innerHTML;
			},
			set: function(newValue){
				var l = reel.children.length, child, sibling;
				for(var x=0; x<l; x++){
					child=reel.children[x];
					if(child.innerHTML===newValue){
						if(offsetFrames > 0){
							for(var i=0; i<offsetFrames; i++){
								sibling=child.previousSibling;
								if(!sibling){
									cycleUp(-1, true);
									sibling=child.previousSibling;
									x++;
								}
								child=sibling;
							}
						}
						enforceUpperLimit(x);
						console.log('scroll to '+child.innerHTML);
						this.currentFrame=child;
						previousScrollPos=scrollBox.scrollTop;
						return true;
					}
				}
				console.error('Set value on ',slotsCont,' failed. The value '+newValue+' was not found as an option');
				return false;
			}
		});
	};
	return __constructor;
}());