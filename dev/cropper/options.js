if(canvasWidth && !canvasHeight){		
	var scale = canvas.width / image.width;
	if(scale > 1){//set height to match aspect	
		if(fillMode === 'cover'){
			canvas.setAttribute('height', image.height * scale);
			canvas.context.drawImage(image, 0, 0, image, canvas.height);
		}
		else{
			canvas.setAttribute('height', image.height/scale);
			canvas.context.drawImage(image, 0, 0, image.width/scale, canvas.height);
		}
	}
	else{	
		if(fillMode === 'cover'){
			canvas.setAttribute('height', image.height/scale);
			canvas.context.drawImage(image, 0, 0, canvas.width, canvas.height);
		}
		else if(fillMode === 'whitespace'){
			canvas.setAttribute('height', image.height);
			canvas.context.drawImage(image, (canvas.width - image.width)/2, (canvas.height - image.height)/2, image.width, image.height);
		}
		else if(fillMode === 'contain'){
			canvas.setAttribute('height', image.height/scale);
			canvas.context.drawImage(image, 0, 0, canvas.width, canvas.height);
		}
	}
}
else if(canvasHeight && !canvasWidth){
	var scale = canvas.height / image.height;
	if(scale > 1){//set width to match aspect	
		if(fillMode === 'cover'){
			canvas.setAttribute('width', image.width * scale);
			canvas.context.drawImage(image, 0, 0, image, canvas.width);
		}
		else{
			canvas.setAttribute('width', image.width/scale);
			canvas.context.drawImage(image, 0, 0, image.height/scale, canvas.width);
		}
	}
	else{	
		if(fillMode === 'cover'){
			canvas.setAttribute('width', image.width/scale);
			canvas.context.drawImage(image, 0, 0, canvas.height, canvas.width);
		}
		else if(fillMode === 'whitespace'){
			canvas.setAttribute('width', image.width);
			canvas.context.drawImage(image, (canvas.height - image.height)/2, (canvas.width - image.width)/2, image.height, image.width);
		}
		else if(fillMode === 'contain'){
			canvas.setAttribute('width', image.width/scale);
			canvas.context.drawImage(image, 0, 0, canvas.height, canvas.width);
		}
	}
}
else if(canvasHeight && canvasWidth){
	canvas.setAttribute('width', canvasWidth);
	cavnas.setAttribute('height', canvasHeight);
	if(fillMode === 'cover'){
		var scaleW = canvas.width/image.width, scaleH = canvas.height/image.width, scale = Math.min(scaleW, scaleH);
		if(scale < 1){ canvas.context.drawImage(image, 0, 0, image.width / scale, image.height / scale); }
		else{ canvas.context.drawImage(image, 0, 0, image.width, image.height);
	}
	else if(fillMode === 'contain'){
		canvas.context.drawImage(image, 0, 0, canvas.width, canvas.height);
	}
	else if(fillMode === 'whitespace'){
		var scaleW = canvas.width/image.width, scaleH = canvas.height/image.width, scale = Math.min(scaleW, scaleH);
		canvas.context.drawImage(image, Math.max((canvas.width-image.width)/2, 0), Math.max((canvas.height-image.height)/2, 0), image.width, image.height);
	}
}
else{
	canvas.setAttribute('width', image.width);
	canvas.setAttribute('height', image.height);
	canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
}