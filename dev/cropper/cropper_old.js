spotter.temporary = {};
spotter.temporary.cropper=function(cont){
	//attributes
	// (optional)
	//  reference-width - the width that the other numbers are based on.
	//  max-height - maximum height of cropper canvas
	//  src - if sepcified, creates a blob of the image at url and sets input to the value of the blob
	// 	accept - file types to accept. ignored if src specified. [jpg,gif,png]
	//  aspect-ratio="int/int" - if specified the dimensions of the frame will not deviate from this ratio and the crop will maintain the ratio
	//  crop-width="int" - the initial width of the crop frame. if aspect ratio is defined, crop-height will be ignored and set to match aspect ratio.
	//  crop-height="int" - the initial height of the crop frame
	//  resize-width="int" - the width of the cropped image. Will be shrunk or expanded to meet this number.
	//  resize-height="int" - the height of the cropped image. Will be shrunk or expanded to meet this number.
	//  blur-opacity="int" - int/10 will be used as the opacity for the side blurs.
	//  use-blur=true/false - dont use blur or do
	//  frame-thickness="int" - width of the frame lines
	//  handle-thickness="int" - width of the lines on the resize handle
	//  handle-height/width="int" - percentage of canvas width the handle shoudl be in height/width (so handle-height="5" would be 5% of the width)
	var frameCanvas = document.createElement('CANVAS'),
		imageCanvas = document.createElement('CANVAS'),
		previewCanvas = document.createElement('CANVAS'),
		cropperCont = document.createElement('DIV'),
		imgInput = document.createElement('INPUT'),
	    frame = {
			thickness: Number(cont.getAttribute('frame-thickness'))||1,
			ctx: frameCanvas.getContext('2d'),
			width: Number(cont.getAttribute('crop-width'))||200,
			height: Number(cont.getAttribute('crop-height'))||200,
			x: 10,
			y: 10,
			color: cont.getAttribute('frame-color')||'#E23636',
			active: false
		},
	    handle = {
	    	thickness: Number(cont.getAttribute('handle-thickness'))||1,
			ctx: frameCanvas.getContext('2d'),
			width: Number(cont.getAttribute('handle-width'))||30,
			height: Number(cont.getAttribute('handle-height'))||30,
			color: cont.getAttribute('handle-color')||'#36E26D',
			x: null,
			y: null,
			active: false
	    },
		blur = {
			ctx: frameCanvas.getContext('2d'),
			opacity: (cont.getAttribute('blur-opacity')||8)/10,
			color: cont.getAttribute('blur-color')||'#fff',
			active: cont.getAttribute('blur-active')||true
		},
	    mouse = {
	    	start: {x:0, y:0},
			end: {x:0, y:0}
	    },
		src,
		temp,
		aspectRatio = ((temp=cont.getAttribute("aspect-ratio")) && (temp=temp.split('/')) ? temp[0]/temp[1] : temp)
	;
	
	if(aspectRatio){
		frame.height = frame.width * (1/aspectRatio);
	}
	console.log('frame',frame);
	console.log('blur',blur);
	console.log('handle',handle);
	console.log('aspectRatio',aspectRatio);
	
	//setup input
	imgInput.className = 'hide';
	if(src = cont.getAttribute('src')){	
		imgInput.type="hidden";
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
		acceptTypes = 'image/'+acceptType.join(',image/');
			
		imgInput.accept = acceptTypes;
		cont.addEventListener('click', imgInput.click, false);
	}
	imgInput.name=cont.getAttribute("name");
	
	cropperCont.className = 'image-cropper';
	
	frameCanvas.width=imageCanvas.width=cont.getAttribute('width')||512;
	frameCanvas.height=imageCanvas.height=cont.getAttribute('height')||512;
	frameCanvas.setAttribute('width', frameCanvas.width+'px');
	frameCanvas.setAttribute('height', frameCanvas.height+'px');
	imageCanvas.setAttribute('width', frameCanvas.width+'px');
	imageCanvas.setAttribute('height', frameCanvas.height+'px');
	
	previewCanvas.width=cont.getAttribute('crop-width')||frameCanvas.width;
	previewCanvas.height=cont.getAttribute('crop-height')||frameCanvas.height;
	previewCanvas.setAttribute('width', previewCanvas.width+'px');
	previewCanvas.setAttribute('height', previewCanvas.height+'px');
	
	frameCanvas.className='frame';
	imageCanvas.className='image';
	previewCanvas.className='preview';
	
	cropperCont.appendChild(previewCanvas);
	cropperCont.appendChild(imageCanvas);
	cropperCont.appendChild(frameCanvas);
	
	document.body.appendChild(cropperCont);
	
	imageCanvas.context=imageCanvas.getContext('2d');
	var setSourceImage=function(strOrFile){
		var targImage;
		if(typeof strOrFile == 'string'){
			targImage = new spotter.images.createImageFromDataUrl(strOrFile);
		}
		else{
			targImage = new spotter.images.createImageFromFile(strOrFile);
		}
		targImage.promise(function(image){ 
			//imageCanvas.context.clearRect(0, 0, imageCanvas.width, imageCanvas.height); 
			imageCanvas.context.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height); 
		});
	};
	
	var setFrame=function(x,y,w,h){
		//w/h are width/height including line thickness
		w=w||frame.width;
		h=h||frame.height;
		frame.ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);		
		frame.ctx.strokeStyle=frame.color;
		frame.x=x;
		frame.y=y;
		frame.width=w;
		frame.height=h;
		frame.ctx.strokeRect(x, y, w-frame.thickness, h-frame.thickness);
		setBlur();
	};
	
	var setHandle=function(w,h){
		w=w||handle.width;
		h=h||handle.width;
		handle.ctx.strokeStyle=handle.color;
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
		blur.ctx.fillRect(0, 0, frame.x, frameCanvas.height);
		//right
		blur.ctx.fillRect(x2, 0, frameCanvas.width-x2, frameCanvas.height);
		//top
		blur.ctx.fillRect(frame.x, 0, frame.width, frame.y);
		//bottom
		blur.ctx.fillRect(x3, y3, frame.width, frameCanvas.height-y3);
	};
	
	var resize=function(){
		var parWidth = spotter.getWidth(cropperCont.parentNode), width, height, parHeight;
		
		if(aspectRatio){
			
		}
		else{
		}
	};
	
	//initial
	setFrame(frame.x, frame.y);
	setHandle();
	if(cont.hasAttribute('src')){
		setSourceImage(cont.getAttribute('src'));
	}
	else{
		imgInput.addEventListener('change', function(){
			setSourceImage(this.files[0]);
		}, false);
	}
	
	frameCanvas.addEventListener('mousedown', function(e){
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
	
	frameCanvas.addEventListener('mouseout', function(e){
		frame.active=false;
		handle.active=false;
	}, false);
	
	frameCanvas.addEventListener('mouseup', function(e){
		frame.active=false;
		handle.active=false;
	}, false);

	//frame move
	frameCanvas.addEventListener('mousemove', function(e){
		if(!frame.active) return;
		mouse.end = getRelativeMousePos(this, e);
		var vector = getVector(mouse), x = frame.x+vector.chgX, y = frame.y+vector.chgY;
		
		if(x < 0){ x = 0;}
		else if(frame.width + x > frameCanvas.width){ x = frameCanvas.width - frame.width; }
		if(y < 0){ y = 0; }
		else if(frame.height + y > frameCanvas.height){ y = frameCanvas.height - frame.height; }
		
		setFrame(x, y, frame.width, frame.height);
		setHandle();
		mouse.start.x=mouse.end.x;
		mouse.start.y=mouse.end.y;
	}, false);
	
	//resize
	frameCanvas.addEventListener('mousemove', function(e){
		if(!handle.active) return;
		mouse.end = getRelativeMousePos(this, e);
		var vector = getVector(mouse);
		if(aspectRatio){
			var dimX, dimY;
			if(Math.abs(vector.chgX) > Math.abs(vector.chgY)){
				dimX = frame.width+vector.chgX;
				if(dimX + frame.x >= frameCanvas.width) dimX = frameCanvas.width - frame.x;
				dimY = dimX * (1/aspectRatio);
				if(dimY + frame.y >= frameCanvas.height){
					dimY = frameCanvas.height - frame.y;
					dimX = dimY * aspectRatio;
				}
			}
			else{
				dimY = frame.height+vector.chgY;
				if(dimY + frame.y >= frameCanvas.height) dimY = frameCanvas.height - frame.y;
				dimX = dimY * aspectRatio;
				if(dimX + frame.x >= frameCanvas.weight){
					dimX = frameCanvas.width - frame.x;
					dimY = dimX * (1/aspectRatio);
				}
			}
			setFrame(frame.x, frame.y, Math.ceil(dimX), Math.ceil(dimY));
		}
		else{
			setFrame(frame.x, frame.y, frame.width+vector.chgX, frame.height+vector.chgY);
		}
		setHandle();
		mouse.start.x=mouse.end.x;
		mouse.start.y=mouse.end.y;
	}, false);
};