var getResizedDimensions = (function(){
	
	var maxAndReq = function(init, req, max, ratio, dim){
		ratio = 1;
		if(req <= max){
			dim = req;
			ratio = init/req;
		}
		else{
			ratio = 1;
			if(init > max)
				dim = max;
				ratio = init/max;
			ratio = init/ratio;
		}
		return {dim:dim, ratio:ratio};
	};
	
	return function(initialWidth, initialHeight, maxWidth, maxHeight, reqWidth, reqHeight){	
		var value=1, ratioWidth, ratioHeight, ratio, params, paramsA, paramsB, imageWidth, imageHeight, offsetX, offsetY;
		
		if(reqWidth) value *= 2;
		if(reqHeight) value *= 3;
		if(maxWidth) value *= 5;
		if(maxHeight) value *= 7;
		
		switch(value){
			case 2:
				imageWidth = reqWidth;
				imageHeight= Math.round(initialHeight/(initialWidth/reqWidth));
				break;
			case 3:
				imageHeight = reqHeight;
				imageWidth  = Math.round(initialWidth/(initialHeight/reqHeight));
				break;
			case 5:
				ratioWidth = 1;
				if(initialWidth > maxWidth)
				imageWidth = maxWidth;
				ratioWidth = Math.round(initialWidth/maxWidth);
				imageHeight = Math.round(initialHeight/ratioWidth);
				break;
			case 7:
				ratioHeight = 1;
				if(initialHeight > maxHeight)
				imageHeight = maxHeight;
				ratioHeight = initialHeight/maxHeight;
				imageWidth = Math.round(initialWidth/ratioHeight);
				break;
			case 6:
				imageWidth = reqWidth;
				imageHeight= reqHeight;
				break;
			case 10:
				params = maxAndReq(initialWidth, reqWidth, maxWidth);
				imageWidth = params.dim;
				imageHeight= Math.round(initialHeight/params.ratio);
				offsetX = (reqWidth - imageWidth)/2;
				break;
			case 14:
				imageWidth = reqWidth
				ratioWidth = initialWidth/reqWidth
				imageHeight= initialHeight/ratioWidth
				if(imageHeight > maxHeight) imageHeight = maxHeight
				break;
			case 30:
				params = maxAndReq(initialWidth, reqWidth, maxWidth);
				imageWidth = params.dim;
				imageHeight= reqHeight;
				offsetX = (reqWidth - imageWidth)/2;
				break;
			case 42:
				params = maxAndReq(initialHeight, reqHeight, maxHeight);
				imageHeight= params.dim;
				imageWidth = reqWidth;
				offsetY = (reqHeight- imageHeight)/2;
				break;
			case 70:
				params = maxAndReq(initialWidth, reqWidth, maxWidth);
				imageWidth = params.dim;
				imageHeight= initialHeight/params.ratio;
				if(imageHeight > maxHeight) imageHeight = maxHeight;
				offsetX = (reqWidth - imageWidth)/2;
				break;
			case 210:
				paramsA = maxAndReq(initialHeight, reqHeight, maxHeight);
				paramsB = maxAndReq(initialWidth, reqWidth, maxWidth);
				ratio = Math.max(paramsA.ratio, paramsB.ratio);
				imageWidth = Math.round(initialWidth/ratio);
				imageHeight= Math.round(initialHeight/ratio);
				offsetX = (reqWidth - imageWidth)/2;
				offsetY = (reqHeight- imageHeight)/2;
				break;
			case 15:
				imageHeight = reqHeight;
				ratioWidth  = initialHeight/reqHeight;
				imageWidth  = initialWidth/ratioWidth;
				if(imageWidth > maxWidth) imageWidth = maxWidth;
				break;
			case 21:
				params = maxAndReq(initialHeight, reqHeight, maxHeight);
				imageHeight = params.dim;
				imageWidth= initialWidth/params.ratio;
				offsetY = (reqHeight - imageHeight)/2;
				break;
			case 105:
				params = maxAndReq(initialHeight, reqHeight, maxHeight);	
				imageHeight= params.dim;
				imageWidth = initialWidth/params.ratio;
				if(imageWidth > maxWidth) imageWidth = maxWidth	
				offsetY = (reqHeight- imageHeight)/2;
				break;
			case 35:
				ratioWidth=1;
				ratioHeight=1;
				if(initialWidth > maxWidth){
					ratioWidth = initialWidth/maxWidth;
				}
				if(initialHeight > maxHeight){
					ratioHeight = initialHeight/maxHeight;
				}
				ratio = Math.max(ratioWidth, ratioHeight);
				imageWidth = initialWidth/ratio;
				imageHeight= initialHeight/ratio;
				break;
		}
		return {imageWidth:imageWidth, imageHeight:imageHeight, offsetX:offsetX, offsetY:offsetY};
	}
}());

console.log(getResizedDimensions(1247, 982, 480, 480, 480, 480));