var spotter=spotter||{};
spotter.toggleSwitch=(function(){
	//<spotter-toggle options="text,text OR text(value),text(value)" where text will be displayed to users and value will be the same as text if first pattern used.
	//ex: <spotter-toggle options="dogs(1),cats(2),birds(3)...
	//spotter options can also be used
	var __constructor = function(cont){		
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
		
		var scrollTo=function(){
			var newMarginTop = '-' + Number(count * 100) + '%';
			Velocity(reel, {marginTop:newMarginTop}, {duration:200, complete:function(){
				var newValue=reel.children[count+1].getAttribute('value');
				cont.value=newValue;
				cont.eventTriggers['change']();
			}});
		};

		Object.defineProperty(cont, 'value', {
			get:function(){
				return this.getAttribute('value');
			},
			set:function(newValue){
				var targ=this.querySelector('.option[value="'+newValue+'"]');
				if(targ === null){ console.error('the toggle switch ',this,' does not contain a child with value '+newValue); }else{
					this.setAttribute('value', newValue);
					count=[].indexOf.call(targ.parentNode.children, targ) - 1;
					scrollTo();
				}
			}
		});
		spotter.events.swipeEvents(cont);
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
			cont.value=value;
		}
		else{
			cont.value=reel.children[1].getAttribute('value');
		}
	};
	
	return __constructor;
}());