	var imageToCanvas = function(image, canvas, canvasWidth, canvasHeight, fillMode){
		var scale, scaleW, scaleH;
		if(canvasWidth && !canvasHeight){	
			scale = canvasWidth / image.width;
			if(scale > 1){//set height to match aspect	
				if(fillMode === 'cover'){
					canvas.setAttribute('height', image.height * scale);
					canvas.getContext("2d").drawImage(image, 0, 0, image, canvasHeight);
				}
				else{
					canvas.setAttribute('height', image.height/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, image.width/scale, canvasHeight);
				}
			}
			else{	
				if(fillMode === 'cover'){
					canvas.setAttribute('height', image.height/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, canvasHeight);
				}
				else if(fillMode === 'whitespace'){
					canvas.setAttribute('height', image.height);
					canvas.getContext("2d").drawImage(image, (canvasWidth - image.width)/2, (canvasHeight - image.height)/2, image.width, image.height);
				}
				else if(fillMode === 'contain'){
					canvas.setAttribute('height', image.height/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, canvasWidth, canvasHeight);
				}
			}
		}
		else if(canvasHeight && !canvasWidth){
			scale = canvasHeight / image.height;
			if(scale > 1){//set width to match aspect	
				if(fillMode === 'cover'){
					canvas.setAttribute('width', image.width * scale);
					canvas.getContext("2d").drawImage(image, 0, 0, image, canvasWidth);
				}
				else{
					canvas.setAttribute('width', image.width/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, image.height/scale, canvasWidth);
				}
			}
			else{	
				if(fillMode === 'cover'){
					canvas.setAttribute('width', image.width/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, canvasHeight, canvasWidth);
				}
				else if(fillMode === 'whitespace'){
					canvas.setAttribute('width', image.width);
					canvas.getContext("2d").drawImage(image, (canvasHeight - image.height)/2, (canvasWidth - image.width)/2, image.height, image.width);
				}
				else if(fillMode === 'contain'){
					canvas.setAttribute('width', image.width/scale);
					canvas.getContext("2d").drawImage(image, 0, 0, canvasHeight, canvasWidth);
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
	
	var scaleCanvasToCanvas = (function(){
		var placeHolderImage = new Image(), placeHolderCanvas = document.createElement('CANVAS');
		document.getElementById('shade-imageCroppertest').appendChild(placeHolderCanvas);
		console.log(placeHolderCanvas);
		
		return function(srcX, srcY, srcW, srcH, src, targ, targWidth, targHeight, fillMode, callBack){
			var srcData = src.getContext("2d").getImageData(srcX, srcY, srcW, srcH);
			placeHolderCanvas.setAttribute('width', srcW);
			placeHolderCanvas.setAttribute('height', srcH);
			placeHolderCanvas.putImageData(srcData, 0, 0);
			
			placeHolderImage.addEventListener('load', function(){
				imageToCanvas(this, targ, targWidth, targHeight, fillMode);
			}, false);
			if(callBack) placeHolderImage.addEventListener('load', callBack, false);
			placeHolderImage.src = PlaceHolderCanvas.toDataUrl();
		};
	}());
	
	var getDimensions = function(srcWidth, srcHeight, targWidth, targHeight, aspect, fillMode){
		//aspect="float"(width/height) - the ratio that must be maintained by the final dimensions
		//fillMode="string"(contain|cover|whitespace|none) - how excess space will be handled if result dimensions are smaller than the target dimensions
		var resultWidth=targWidth, resultHeight=targHeight, offsetX=0, offsetY=0, diff;
		
		if(aspect){
			if(targWidth){ resultHeight = targWidth / aspect; }
			else if(targHeight){ resultWidth = targHeight * aspect; }
			else{
				resultHeight = srcWidth / aspect;
				resultWidth = srcHeight * aspect;
				if(resultHeight/srcHeight > resultWidth/srcWidth){
					resultWidth = targHeight * aspect;
				}
				else{
					resultHeight = targWidth / aspect;
				}
			}
		}
		else if(targWidth){
			resultHeight = (targWidth/srcWidth) * srcHeight;
		}
		else if(targHeight){
			resultWidth = (targHeight/srcHeight) * srcWidth;
		}
		else{
			resultWidth = srcWidth;
			resultHeight= srcHeight;
		}
		
		if(fillMode === 'whitespace'){
			if((diff = (targWidth - resultWidth)) > 0){
				offsetX = diff/2;
			}
			if((diff = (targHeight - resultHeight)) > 0){
				offsetY = diff/2;
			}
		}
	
		return {width: resultWidth, height: resultHeight, offsetX: offsetX, offsetY: offsetY};
	};