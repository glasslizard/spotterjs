	//template
	var manifest = function(manifest){
		if(!manifest){ console.error('a manifest was not found for pages.'); return false; }
		var entries = manifest.querySelectorAll('spotter-entry'), entry, name;
		if(entries === null){ console.error('a pages manifest was found but no entries were present.', manifest); return false; }
		this.entries = {};
		
		for(var x = 0, l = entries.length; x < l; x++){
			entry = entries[x];
			name = entry.getAttribute('name');
			this.entries[name] = {
				url: entry.getAttribute('href'),
				entry: entry,
				ready: false,
				cache: entry.hasAttribute('cache'),
				html: null,
				active: false,
				index: null
			};
		}
	};
	
	spotter.testLoaded(function(){
		var pagesManifest = new manifest(document.querySelector('spotter-manifest[type="pages"]'))
			, par = document.getElementById('pages-container')
			, count = 0
			, pageReady = spotter.events('pageReady')
			, cont
			, entry;
		console.debug(pagesManifest);
		
		var parsePage = function(response){
			var responseParts = response.split('</head>'), args, attributes, attrParts, l;
			if(responseParts.length > 1){//has a head section
				var findLinks = new RegExp('<link([^>]+)"', 'g');
				var findScripts = new RegExp('<script(.*?)<\/script>', 'g');
				
				var foundLinks = responseParts[0].match(findLinks);
				var foundScripts = responseParts[0].match(findScripts);
				
				console.log('number of links found:',foundLinks.length);
				console.log('number of scripts found:',foundScripts.length);
				
				var l = foundLinks.length;
				while(--l > -1){
					link = foundLinks[l];
					attributes = link.split(' ');
					args = {};
					console.log(link);
					for(var x = 1, al = attributes.length; x < al; x++){
						var attrParts = attributes[x].split('=');
						args[attrParts[0]] = attrParts[1].slice(1, -1);
					}
					spotter.addLinkToHead(args);
				}
				
				var l = foundScripts.length;
				while(--l > -1){
					script = foundScripts[l];
					src = script.match(/src="([^"]+)"/);
					if(src){
						spotter.addScriptToHead(src[1]);
					}
					else{
						text = script.match(/>([^<]*)</)[1];
					}
				}
				
				return responseParts[1].replace(/<body([^>]+)>/, '').replace('</body>', '');
			}
			return responseParts[0];
		};
		
		for(var page in pagesManifest.entries){
			entry = pagesManifest.entries[page];
			cont = document.createElement('DIV');
			cont.className = "spotter-page";
			entry.pageCont = cont;
			entry.index = count;
			spotter.ajax({
				url: entry.url,
				dataType: 'HTML',
				method: "GET",
				cache: entry.cache,
				success:(function(entry){
					return function(response){
						entry.ready = true;
						entry.html = response;
						entry.pageCont.innerHTML = parsePage(response);
						//response = response.replace(new RegExp('<(\\/)*head', 'g'), '<$1div');
						//console.debug(response);
						par.appendChild(entry.pageCont);
						//spotter.components.setup(entry.pageCont);
					};
				}(entry)),
				error: function(){
					console.error(arguments);
				}
			});
			if(count === 0) active = cont;
			count++;
		}
	
		var transitionIn = function(par, cont, index){
			Velocity(par, {marginLeft: 0 - ((index - 1) * window.width)}, {duration: 1000});
		};
		var transitionOut = function(){};
		var transition = function(pageName){
			var to = pagesManifest.entries[pageName];
			if(typeof to !== 'object'){ console.error('the page '+pageName+' is not a known page in manifest'); return false; }
			transitionOut(par, active.pageCont, active.index);
			transitionIn(par, to.pageCont, to.index);
			active = to;
		};
		
		spotter.pages = function(pageName){
			transition(pageName);
		};
		
		spotter.pages.setTransitionInFunction = function(func){
			//func(par, cont, i) - activated whenever a page change occurs - (i) is the child index of the page container (cont) entering
			transitionIn = func;
		};
		
		spotter.pages.setTransitionOutFunction = function(func){
			//func(par, cont, i) - activated whenever a page change occurs - (i) is the child index of the page container (cont) leaving
			transitionOut = func;
		};
	});