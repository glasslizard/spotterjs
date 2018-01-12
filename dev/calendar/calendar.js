if(typeof spotter === 'undefined') spotter={};
spotter.calendar = (function(){	
	var __constructor = function(cont){
		if(!moment){ console.error('moment js required'); return false; }
		
		var date	= moment(cont.getAttribute('value')||undefined);
		var year 	= date.year();
		var month	= date.month();
		var day	 	= date.date();
		
		//console.log('start date:',day+'/'+month+'/'+year);
		
		var titleBar=document.createElement('DIV');
		titleBar.className='title-bar';
		titleBar.innerHTML='<div class="title">'+(cont.getAttribute('title') || 'select date')+'</div><div class="selected-date"></div>';
		cont.appendChild(titleBar);
		
		/* ---------------------LIMITS------------------------- */
		var upperLimit=cont.getAttribute('upper-limit'), upperDateLimit;
		if(upperLimit){
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
					//console.log('parts:',opt,parts);
					if(parts[1]==='+'){
						upperDateLimit.add(parts[2], parts[3]);
					}
					else if(parts[1]==='-'){
						upperDateLimit.subtract(parts[2], parts[3]);
					}
				});
				upperLimit = {year:upperDateLimit.year()||0, month:upperDateLimit.month()||0, day:upperDateLimit.date()||0};
			}
			console.log('upperLimit:',upperLimit);
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
			console.log('lowerLimit:',lowerLimit);
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
		var changeDateText = function(){
			//console.log('changeDateText',day+'-'+String(month+1)+'-'+year);
			selectedDate.innerHTML = moment(day+'-'+String(month+1)+'-'+year, 'D-M-YYYY').format('MMM, DD YYYY');
			cont.year=year;
			cont.month=month;
			cont.day=day;
		};
		
		/* --------------------- YEARS ---------------------- */
	
		var incrementYear = function(dir){
			console.log('change year');
			upperLimitMonth=12;
			lowerLimitMonth=-1;
			//restoreMonths();
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
				console.log('testUpperLimit Result',testUpperLimit('year'));
				console.log('testLowerLimit Result',testLowerLimit('year'));
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
			console.log('incrementMonth Start:');
			if(upperLimit) console.log(' - upperLimitYear:',upperLimit.year,'upperLimitMonth:',upperLimitMonth,'upperLimitDay:',upperLimitDay,'dir:',dir,'month:',month);
			if(lowerLimit) console.log(' - lowerLimitYear:',lowerLimit.year,'lowerLimitMonth:',lowerLimitMonth,'lowerLimitDay:',lowerLimitDay,'dir:',dir,'month:',month);
			if(dir==='+'){
				month++;
				if(month > 11){ incrementYear('+'); month=0; }
				console.log('testUpperLimit:',testUpperLimit('month'));
				console.log('incrementMonth End:','upperLimitMonth:',upperLimitMonth,'lowerLimitMonth:',lowerLimitMonth,'dir:',dir,'month:',month);
				if(month !== lowerLimitMonth){ scrollMonthLeft.style.visibility="visible"; scrollDown=true; }
				if(month >= upperLimitMonth){ scrollMonthRight.style.visibility="hidden"; scrollUp=false; }
				lowerLimitDay=0;
				//month = month > upperLimitMonth ? lowerLimitMonth : month;
			}
			else if(dir==='-'){
				month--;
				if(month < 0){ incrementYear('-'); month=11; }
				console.log('testLowerLimit:',testLowerLimit('month'));
				console.log('incrementMonth End:','upperLimitMonth:',upperLimitMonth,'lowerLimitMonth:',lowerLimitMonth,'dir:',dir,'month:',month);
				if(month !== upperLimitMonth){ scrollMonthRight.style.visibility="visible"; scrollUp=true; }
				if(month <= lowerLimitMonth){ scrollMonthLeft.style.visibility="hidden"; scrollDown=false; }
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
			console.log('deactivatedDays 1:',deactivatedDays.length);
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
				console.log('UPPER LIMIT DAY IS '+upperLimitDay);
				var diff = 31 - upperLimitDay - currentOffsetDays;
				for(x=0; x<diff; x++){
					targ = activeDays[x];
					targ.className = targ.className.addListValue('deactivated', ' ');
					deactivatedDays.push(targ);
				}
				if(day > upperLimitDay) setDay(upperLimitDay);
			}
			if(lowerLimitDay > 0){//disable days that are blocked off by lower range limit
				console.log('LOWER LIMIT DAY IS '+lowerLimitDay);
				for(x=31-(lowerLimitDay-1); x<31; x++){
					targ = activeDays[x];
					targ.className = targ.className.addListValue('deactivated', ' ');
					deactivatedDays.push(targ);
				}
				if(day <lowerLimitDay) setDay(lowerLimitDay);
			}
			previouslySelectedDay.click();
			console.log('deactivatedDays 2:',deactivatedDays.length);
			
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
	};
	
	return __constructor;
}());