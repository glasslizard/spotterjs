var spotterSlots = (function(){
	//form: <spotter-slots><div class="reel"><div class="step"></div>...</div>(end of reel 1)<div class="reel">...</div>(end of reel 2)...</spotter-slots>
	//monitor changes in a reel using reel.addEventListener('change'...
	
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
	var timerScroll = function(scrollBox, doFunc, minInterval){
		//scrollBox = element to monitor scroll, 
		//doFunc is the function to perform after interval and scroll. 'this' will be the scroll element (scrollBox)
		//minInterval is the minimum difference that must have occurred.
		var __private = {
			minInterval: minInterval||100,
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
		
		//frameHeightPortion - positive non-zero decimal less than or equal to one. Determines what portion of unselected steps are shown.			
		var frameHeightPortion = slotsCont.hasAttribute('frame-portion') ? slotsCont.getAttribute('frame-portion') : 1;
		
		var reel = slotsCont.querySelector('.reel'), frameHeight, scrollBox;
		
		spotter.events.setEventTrigger(slotsCont, 'change');

		frameHeight = spotter.getHeight(reel.children[0]);
		scrollBox = document.createElement('DIV');
		scrollBox.className = "spotter-hide-scroll";
		scrollBox.appendChild(reel);
		slotsCont.appendChild(scrollBox);
		slotsCont.className = slotsCont.className.addListValue('vertical');
		
		Object.defineProperty(scrollBox, 'currentFrame', {
			get: (function(){
				var offsetDifference,previousValidOffsetDistance=1,validFrame;
				return function(){
					previousValidOffsetDistance=1;
					validFrame=null;
					for(var x=0,l=reel.children.length;x<l;x++){
						offsetDifference = Math.abs(scrollBox.scrollTop - reel.children[x].offsetTop);
						//console.log('frameHeight:',frameHeight,'offsetDifference:',offsetDifference,'text',reel.children[x].innerHTML);
						if(offsetDifference <= frameHeight){
							if(offsetDifference <= previousValidOffsetDistance){ return reel.children[x]; }//if reel didnt move enough to change
							else if(validFrame !== null && offsetDifference > previousValidOffsetDistance){ return validFrame; }
							previousValidOffsetDistance = offsetDifference;
							validFrame = reel.children[x];
						}
					}
					return validFrame;//return this if nothing else found.
				};
			}()),
			set: (function(){
				return function(newValue){ scrollBox.scrollTop = newValue.offsetTop + (frameHeightPortion * frameHeight); };
			}())
		});
		
		var setupReel = function(){
			var totalScrollDistance = 0, 
				previousScrollPos = scrollBox.scrollTop, 
				ignore,
				scrollTop,
				scrollLimitTop = 2 * frameHeight,
				scrollLimitBottom = 3 * frameHeight//this is needed because the scrollTop way of thinking doesnt account for the height of the last frame
			;
			//setup the initial cycled slides
			reel.insertBefore(reel.children[reel.children.length-1],reel.children[0]);
			reel.insertBefore(reel.children[reel.children.length-1],reel.children[0]);
			scrollBox.scrollTop = scrollBox.scrollTop + scrollLimitTop;
			
			scrollBox.cycleSlides = function(){
				//scrolling action can occur faster than this function can keep up. So if the scrollposition is reaching close to the bottom or the top, an automatic cycling needs to occur.
				if(ignore){ console.log('ignore:',ignore); return; }
				ignore = true;
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
					if(totalScrollDistance >= frameHeight){
						reel.appendChild(reel.children[0]);
						scrollBox.scrollTop = scrollBox.scrollTop - frameHeight;
						totalScrollDistance = totalScrollDistance - frameHeight;
						//console.log('top has been moved to bottom leaving a total scroll distance of ',totalScrollDistance);
					}
					else if(totalScrollDistance <= (0 - frameHeight)){
						reel.insertBefore(reel.children[reel.children.length-1], reel.children[0]);
						scrollBox.scrollTop = scrollBox.scrollTop + frameHeight;
						totalScrollDistance = 0 - (Math.abs(totalScrollDistance) - frameHeight);
						//console.log('bottom frame moved to top leaving a total scroll distance of ',totalScrollDistance);
					}
				}
				previousScrollPos = scrollTop;
				ignore = false;
			};
			scrollBox.addEventListener('scroll', scrollBox.cycleSlides, false);//this event cycles the frames
		};
		setupReel();
		new timerScroll(scrollBox, getSnapToFunc(scrollBox), 6 * frameHeight);//scroll event only snaps the frames and triggers change
	}
	
	var slots = document.querySelectorAll('spotter-slot'), l = slots.length;
	while(--l > -1){ __constructor(slots[l]); }
	
	return __constructor;
}());

document.getElementById('first-slot').addEventListener('change', function(){console.log('test');}, false);


	