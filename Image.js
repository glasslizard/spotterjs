	console.log('using images');
	//*** IMAGES ***
	
	function base64ToArrayBuffer (base64) {
		base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
		var binaryString = window.atob(base64);
		var len = binaryString.length;
		var bytes = new Uint8Array(len);
		for (var i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}
	
	spotter.images={};
	
	spotter.addScriptToHead('/js/spotter/third_party/exif.js');
	spotter.addScriptToHead('/js/spotter/third_party/velocity.js');
	
	Image.prototype.load = function(url, onload, max){
		onload = onload || function(){};
		max = max||100;
		var thisImg = this, xmlHTTP = new XMLHttpRequest();
        xmlHTTP.open('GET', url, true);
        xmlHTTP.responseType = 'arraybuffer';
        xmlHTTP.onload = function(e){
            var blob = new Blob([this.response]);
            thisImg.onload=function(){
				onload(this);
			};
			thisImg.src = window.URL.createObjectURL(blob);
        };
        xmlHTTP.onprogress = function(e){
			thisImg.completedPercentage = parseInt((e.loaded / e.total) * max);
			spotter.images.progressBar.progress(thisImg.completedPercentage);
		};
        xmlHTTP.onloadstart = function(){
            thisImg.completedPercentage = 0;
        };
		spotter.images.progressBar.open();
        xmlHTTP.send();
    };
	
	Image.prototype.completedPercentage = 0;
	
	spotter.images.progressBar = (function(){
		var cont = document.createElement('DIV'), current = 0;
		cont.id = 'progress';
		cont.className = "hide";
		
		cont.innerHTML = '<div id="upload-bar-cont">'+
							'<div class="title"></div>'+
							'<div class="background">'+
								'<div class="bar">'+
									'<div class="fill"></div>'+
								'</div>'+
							'</div>'+
						'</div>';
		
		spotter.testLoaded(function(){
			document.body.appendChild(cont);
		}, 'document');
		
		cont.open = (function(titleCont){
			return function(title){
				title =  title || 'loading...';
				current = 0;
				cont.className = cont.className.removeListValue('hide');
				titleCont.innerHTML = title;
			};
		}(cont.querySelector('.title')));
		
		cont.progress = (function(fill){
			cont.close = function(){
				if(current < 100){
					Velocity(fill, {width:'100%'}, {duration:300, easing:'easeInQuint', complete:function(){
						cont.className = cont.className.addListValue('hide');
						fill.style.width='5%';
						current = 0;
					}});
				}
				else{
					cont.className = cont.className.addListValue('hide');
					fill.style.width='5%';
					current = 0;
				}
			};
			
			return function(completionPercentage){
				if(completionPercentage === current) return;
				current = completionPercentage;
				console.log('spotter progressBar completion amount:',completionPercentage);
				Velocity(fill, {width:String(completionPercentage)+'%'}, {duration:200, easing:'easeInQuint'});
			};
		}(cont.querySelector('.fill')));
		
		return cont;
	}());
	
	//IMPORTANT!! use a 'new' instance when calling this method
	spotter.images.createImageFromFile = function(inputFile, showProgress, image){//specific input file from input type=file, event the event name to fire
		var reader,self={};
		
		//create promise
		this.hasTriggered = false;
		self.func = function(){this.hasTriggered = true;}
		this.promise = function(newFunc){
			if(this.hasTriggered){
				newFunc(this.canvas);
			}
			else{self.func = newFunc;}
		};
		
		if(typeof inputFile==='string'){
			console.error('argument sent to create image from file must be a file','if using a url, use "createImageFromDatUrl" instead');
		}
		if (inputFile.type.match(/image.*/)){
			reader = new FileReader();
			if(!image){ image = new Image(); }
			else{
				image.removeAttribute('width');
				image.removeAttribute('height');
			}
			
			reader.onloadend = function(e) {				
				image.onload=function(){
					self.func(this); 
					spotter.images.progressBar.close(); 
				};
				image.src = e.target.result;
				image.exif = EXIF.readFromBinaryFile(base64ToArrayBuffer(e.target.result));
			};
			if(showProgress){ 
				spotter.images.progressBar.open();
				reader.addEventListener('progress', function(e){
					if(e.lengthComputable){
						var percentage = Math.round((e.loaded * 100) / e.total);
						spotter.images.progressBar.progress(percentage);
					}
				}, false);
			}
			reader.readAsDataURL(inputFile);
		}
	};
	
	spotter.images.createImageFromDataUrl = function(url, showProgress, image){
		//url = 'https://i.reddituploads.com/0870beeffeee40028f2cf40a32f0b33c?fit=max&h=1536&w=1536&s=6446ebdbb70ad05a64f0ecaab1ef3d96';
		var self={};
		
		//create promise
		this.hasTriggered = false;
		self.func = function(){this.hasTriggered = true;}
		this.promise = function(newFunc){
			if(this.hasTriggered){
				newFunc(this.canvas);
			}
			else{self.func = newFunc;}
		};
		
		if(!image) image = new Image();
		if(showProgress){	
			image.load(url, function(){
				self.func(image);
			});
		}
		else{
			image.onload = function(){ if(image.width > maxWidth) image.width = maxWidth; self.func(image); };
			image.src = url;
		}
	};
	
	spotter.images.orient = function(image, canvas){
		//http://stackoverflow.com/questions/19463126/how-to-draw-photo-with-correct-orientation-in-canvas-after-capture-photo-by-usin
		var orientation = image.exif.Orientation,
			ctx = canvas.getContext("2d"), 
			width = image.width,
			height = image.height,
			onload = image.onload || function(){}, 
			ratio = 1;
		
		/*
		console.log('orient--');
		console.log('image width:',width);
		console.log('image height:',height);
		*/
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		if (orientation > 4) {
			canvas.width = height;
			canvas.height= width;
		}
		else{
			canvas.width = width;
			canvas.height= height;
		}
		
		ctx.save();
		switch(orientation){
			case 2:
		        // horizontal flip
		        ctx.translate(width, 0);
		        ctx.scale(-1, 1);
		        break;
		    case 3:
		        // 180° rotate left
		        ctx.translate(width, height);
		        ctx.rotate(Math.PI);
		        break;
		    case 4:
		        // vertical flip
		        ctx.translate(0, height);
		        ctx.scale(1, -1);
		        break;
		    case 5:
		        // vertical flip + 90 rotate right
		        ctx.rotate(0.5 * Math.PI);
		        ctx.scale(1, -1);
		        break;
		    case 6:
				// 90° rotate right
				ctx.rotate(0.5 * Math.PI);
		        ctx.translate(0, -height);
		        break;
		    case 7:
		        // horizontal flip + 90 rotate right
		        ctx.rotate(0.5 * Math.PI);
		        ctx.translate(width, -height);
		        ctx.scale(-1, 1);
		        break;
		    case 8:
		        // 90° rotate left
		        ctx.rotate(-0.5 * Math.PI);
		        ctx.translate(-width, 0);
		        break;
		}	

		ctx.drawImage(image, 0, 0, width, height);
		ctx.restore();
		image.width = height;
		image.height= width;
		image.src = canvas.toDataURL();
	};
	
	spotter.images.maxSize = function(image, maxWidth, maxHeight){
		var ratio, widthRatio, heightRatio;
		if(!maxWidth || maxWidth >= image.width){
			maxWidth = null;
		}
		else{
			widthRatio = maxWidth/image.width;
		}
		
		if(!maxHeight || maxHeight >= image.height){
			maxHeight = null;
		}
		else{
			heightRatio= maxHeight/image.height;
		}
		
		if(maxWidth && maxHeight){
			ratio = Math.max(heightRatio, widthRatio);
			image.width *= ratio;
			image.height*= ratio;
		}
		else if(maxWidth){
			image.width = maxWidth;
			image.height= image.height * widthRatio;
		}
		else if(maxHeight){
			image.height = maxHeight;
			image.width = image.width * heightRatio;
		}
	};
	
console.log('images loaded');