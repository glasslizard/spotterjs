spotter.timeCalendar = (function(){	
	var __constructor = function(cont){
		//BUILD CALENDAR
		var calendar=document.createElement('SPOTTER-CALENDAR');
		calendar.setAttribute('lower-limit', cont.getAttribute('lower-date-limit'));
		calendar.setAttribute('upper-limit', cont.getAttribute('upper-date-limit'));
		calendar.setAttribute('title', cont.getAttribute('title-date')||'select date');
		cont.appendChild(calendar);
		spotter.calendar(calendar);
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
		var setTime = function(){
			selectedTime.innerHTML = slotsHour.value + ':' + slotsMinute.value + ' ' +meridiemToggle.value;
		};
		
		var timeCont=document.createElement('DIV');
		timeCont.className="time";
		spotter.events.swipeEvents(timeCont);
		timeCont.addEventListener('swiperight', function(){Velocity(this, {left:'100%'}, {duration:250, complete:setTime});}, false);
		
		var title=document.createElement('DIV');
		title.className="title";
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
		spotter.toggleSwitch(meridiemToggle);
		timeCont.appendChild(meridiemToggle);
		
		cont.appendChild(timeCont);
	
		spotter.slots(slotsHour);
		spotter.slots(slotsMinute);
		
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
				var format='MMM, DD YYYYThh:mm a';
				return moment(selectedDate.innerHTML + 'T' + selectedTime.innerHTML, format).unix();
			}
		});
	};
	
	return __constructor;
}());