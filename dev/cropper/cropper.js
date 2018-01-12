var registerAsElemToForm = function(targ){
	var par = spotter.findParent(targ, 'FORM', 'tagName');
	if(!par) return;
};

spotter.components.cropper=(function(){
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
		
		var shade = new spotter.shade('imageCropper'+cont.getAttribute('name')),
			temp,
			cropperCont = document.createElement('DIV'),//the container that holds the canvases + buttons. If a template is used, it will become the innerHTML for this elem
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
			maxHeight
		;
		
		//add contexts
		frame.context = frame.canvas.getContext("2d");
		preview.context = preview.canvas.getContext("2d");
		reference.context = reference.canvas.getContext("2d");
		cropped.context = cropped.canvas.getContext("2d");
		
		//add crop specific properties
		cropped.canvas.setAttribute('image-quality', cropped.quality);
		cropped.canvas.setAttribute('mimetype', cropped.mimeType);
	
		//set template and get relevant elems from
		if(temp=cont.querySelector('spotter-template')){
			//template must contain 
			//elem.className="canvas-cont" where the main cropper will be added
			//elem.className="crop-button", elem.className="undo-button", elem.className="save-button" which are ofc the interaction buttons
			cropperCont.innerHTML = temp.innerHTML;
			temp=null;
		}
		else{//default template
			cropperCont.innerHTML = '<div class="canvas-cont"></div>'+
			'<img src="/spotter/images/universal/crop_s_tri_colour.png" class="crop-button"/>'+
			'<img src="/spotter/images/universal/undo_s_bicolour.png" class="undo-button"/>'+
			'<img src="/spotter/images/universal/save_file_s_bicolour.png" class="save-button"/>';
		}
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
			var width = Math.round(spotter.getWidth(cropperCont));
			
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
			
			width = spotter.getWidth(input.canvas.parentNode);
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
					console.log('testing:',previousFile[prop]+' !== '+file[prop],isNew);
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
		setCanvasWidths();
		spotter.onResize(setCanvasWidths);
		spotter.onResize(setCanvasHeights);
		
		//setup input
		imgInput.className = 'hide';
		if(src = cont.getAttribute('src')){	
			imgInput.type="hidden";
			setSourceImage(src, true);
		}
		else{
			imgInput.type = "file";
			imgInput.style.display = 'none';
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
				
			imgInput.accept = acceptTypes;
			cont.addEventListener('click', function(e){e.stopPropagation(); imgInput.click();}, false);
			imgInput.addEventListener('change', fileChange, false);
			imgInput.fileTarget = cropped.canvas;
			cont.appendChild(imgInput);
		}
		imgInput.name=cont.getAttribute("name");
		cont.appendChild(imgInput);
		
		shade.onClose(deactivate);
		
		//setup cropped dims
		if(cropped.width){
			cropped.setAttribute('width', cropped.width);
		}
		if(cropped.height){
			cropped.setAttribute('height', cropped.height);
		}
		
		frame.canvas.addEventListener(spotter.mobile.events.mouse['mousedown'], function(e){
			mouse.start = getRelativeMousePos(this, e);
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
			mouse.end = getRelativeMousePos(this, e);
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
			mouse.end = getRelativeMousePos(this, e);
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
					if(dimX + frame.x >= frame.canvas.weight){
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
				dimY = frame.height+vector.chgY;
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
	};
	
	__components.afterPolyFillLoaded(function(){			
		var SpotterCropperPrototype = Object.create(HTMLInputElement.prototype);
		SpotterCroppertPrototype.createdCallback = function(){ __constructor(this); };
		var SpotterCropper = document.registerElement('spotter-image-cropper', {
			prototype: SpotterCropperPrototype,
			extends: 'div'
		});
		
		//complete the initial tags
		Array.prototype.forEach.call(document.querySelectorAll('spotter-image-cropper'), __constructor);
		spotter.events.fire(spotter.events('cropper-ready'));
	});
			
	return __constructor;
}());
	
spotter.testLoaded(function(){
	spotter.mobile(12, 1297, 'content');
});
	