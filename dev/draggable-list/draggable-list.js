// *** REQUIRED DEFAULTS ***	
	function getCoords(elem) { // crossbrowser version
     var box = elem.getBoundingClientRect();//console.log(box);
	
	    var body = document.body;
	    var docEl = document.documentElement;
	
	    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
	    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
	
	    var clientTop = docEl.clientTop || body.clientTop || 0;
	    var clientLeft = docEl.clientLeft || body.clientLeft || 0;
	
	    var top  = box.top +  scrollTop - clientTop;
	    var left = box.left + scrollLeft - clientLeft;
      var bot  = box.bottom + scrollTop - clientTop;
	
	    return [Math.round(left),Math.round(top),Math.round(box.right),Math.round(box.bottom)];
	}
	
	document.createElement('spotter-input');
	document.createElement('spotter-option');

// *** SETUP PARENT CONT ***	
	var _SpotterInputDrag = {
		reorderActive: false,//if true then allows reordering of list items
		currentParent: null,//mousedown sets this property to the current parent container
		currentLabel: null,//the label that is currently being dragged
		activeCommand: null,//the command currently set as active (in the target zone)
		targXmin: 0,//min/max for the target zone (where command must be dragged)
		targYmin: 0,
		targXmax: 0,
		targYmax: 0,
		xDiff: 0,//the difference between where the label was grabbed and the screen offset of the label
		yDiff: 0,
		contXmin: 0,//the boundaries for the main input container (used for reorder to gauge if pointer is within)
		contYmin: 0,
		contXmax: 0,
		contYmax: 0
	};
	
	_SpotterInputDrag.setup = function(cont){
		var liCont
			,optGhost
			,opts = cont.children
			,l = opts.length
			,opt
			,c;
		
		while(--l > -1){
			opt = opts[l];
			
			//create list item container
			liCont = document.createElement('DIV');
			liCont.className = "list-item-cont";
			
			//create ghost label to show while label is being dragged
			optGhost = opt.cloneNode(true);
			optGhost.className = optGhost.className+"ghost-proxy";
			liCont.appendChild(optGhost);
			
			//change option into a draggable label
			opt.className = opt.className+"draggable-label";
			liCont.appendChild(opt);
			
			c = opt.commandName = opt.getAttribute('command');
			//spotter.setEventTrigger(cont, c);
		  
			cont.appendChild(liCont);
			cont.addEventListener('mousedown', _SpotterInputDrag.mousedown);
		};
	}

// *** METHODS ACTIVATED BY MOUSE ***	
	_SpotterInputDrag.mousemove = function(e){
		var mouseX = e.pageX
			,mouseY = e.pageY
			,label = this.currentLabel;
	  
		if(!label) return;

		if(this.reorderActive === true) this.reorder(mouseX,mouseY,label);

		if(mouseX > this.targXmin && mouseY > this.targYmin && mouseX < this.targXmax && mouseY < this.targYmax){
			label.style.left = this.targXmin+'px';
			label.style.top = this.targYmin+'px';
			this.activeCommand = label.commandName;
		}
		else{
			label.style.left = (mouseX - this.xDiff)+'px';
			label.style.top = (mouseY - this.yDiff)+'px';
			this.activeCommand = null;
		}
	}.bind(_SpotterInputDrag);
	
	//enable by setting 'allow-reorder' attribute on parent container
	_SpotterInputDrag.reorder = function(mouseX, mouseY, label){
	  	if(mouseX > this.contXmin && mouseX < this.contXmax){
	    	var cont = this.currentParent;
			if(mouseY < this.contYmin){//move label to very top
				cont.insertBefore(label.parentNode, cont.firstChild);
				//cont.eventTriggers['orderchange']();
			}
			else if(mouseY > this.contYmax){//move label to very bottom
				cont.appendChild(label.parentNode);
				//cont.eventTriggers['orderchange']();
			}
			else{
				var mouseOffset = mouseY - this.contYmin
					,c = cont.children
					,l = c.length
					,x = 0
					,li
					,d;
	            
				while(--l > -1){
					li = c[l];
					if((d = (mouseOffset - li.offsetTop)) >= 0){
						if(li === label.parentNode) continue;
						if(!c[l+1]){
							cont.appendChild(label.parentNode);
							//cont.eventTriggers['orderchange']();
						}
						else{
							cont.insertBefore(label.parentNode, c[l+1]);
							//cont.eventTriggers['orderchange']();
						}
						break;
					}
				}
			}
	    }
	}.bind(_SpotterInputDrag);
	
	//set currently active label (the draggable part) and the boundaries of the command target and the parent container being activated - this will be the parent container
	_SpotterInputDrag.mousedown = function(e){
		var label = e.originalTarget;
		//console.log('label:',label,' \n','offset:',label.parentNode.offsetTop);
		_SpotterInputDrag.activeCommand = null;
		_SpotterInputDrag.reorderActive = this.hasAttribute('allow-reorder');
		_SpotterInputDrag.currentParent = this;
		
		if(label.className === "draggable-label"){
			//setup list cont bounds
	    	var coords = getCoords(this);
		  	_SpotterInputDrag.contXmin = coords[0];
			_SpotterInputDrag.contYmin = coords[1];
			_SpotterInputDrag.contXmax = coords[2];
			_SpotterInputDrag.contYmax = coords[3];
	
			//setup label
		    _SpotterInputDrag.currentLabel = label;
		    coords = getCoords(label);
		  	_SpotterInputDrag.xDiff = e.pageX - coords[0];
		  	_SpotterInputDrag.yDiff = e.pageY - coords[1];//console.log('label coords:',coords);
			label.style.position = "fixed";
			label.style.zIndex = '102';
			_SpotterInputDrag.mousemove(e);
		  	
			//setup command target
		    var targ = document.getElementById('input-target');
		  	coords = getCoords(targ);
		  	_SpotterInputDrag.targXmin = coords[0];
		  	_SpotterInputDrag.targYmin = coords[1];
		  	_SpotterInputDrag.targXmax = coords[2];
		  	_SpotterInputDrag.targYmax = coords[3];
		}
	};
	
	_SpotterInputDrag.mouseup = function(e){
		var label = this.currentLabel;
		if(!label) return;
		if(this.activeCommand) cont.eventTriggers[this.activeCommand]();
		label.style.position = "absolute";
		label.style.left = '0';
		label.style.top = '0';
		label.style.zIndex = '101';
		this.currentLabel = null;
	}.bind(_SpotterInputDrag);

// *** GLOBAL MOUSE EVENTS ***	
	document.addEventListener('mousemove', _SpotterInputDrag.mousemove);
	document.addEventListener('mouseup', _SpotterInputDrag.mouseup);
	
// *** INIT
	_SpotterInputDrag.setup(document.getElementById('submit-form'));
