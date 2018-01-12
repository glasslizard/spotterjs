//All modules including the main module must be loaded to the window.spotterModules object. Modules is observed. When a module is created on window.spotterModules an event is triggered
//that will check all the modules currently registered for the readiness of their dependencies, and if the dependencies are all ready, the module will then be readied. 
//Modules should be included with spotter.require(moduleName) or by using the 'data-modules=[list of modules]' attribute on the main spotter script element. 

//Modules can be checked for readiness with spotter.require.isReady(moduleName). Once a module is readied, fire all the functions added to that module ready state through testLoaded.
window.spotter.onModuleReady={
	eventName:'', 
	functions:{}
};

window.spotter.require = (function(){
	//add attribute 'data-dependents=[list]' to the script tag for spotter.js in order to load those modules immediately. Otherwise call this afterwards with 
	//...require([module name]) Modules will not be reloaded if they were previously loaded.
	var evtName = spotter.events('moduleCreated');//event triggered when a module is created
	var __private = {
		name:'require.js',
		registered:[],//modules registered but not necessarily loaded
		dependencies: [],
		ready:[],//completed modules
		testModuleReady: function(){
			console.log('** testModuleReady **');
			var l = __private.registered.length - 1, moduleName, dependencies, i;
			modules:
				while(l > -1 && __private.registered.length){//run through registered modules
					var moduleName = __private.registered[l], dependencies = __private.dependencies[l];	
					console.info('---- Trying to ready '+moduleName);
					if(dependencies && (i = dependencies.length)){//test if dependencies are ready
						while(--i > -1){
							console.log('        checking if '+dependencies[i]+' is ready');
							if(__private.ready.indexOf(dependencies[i]) === -1){
								console.info('            dependency is not ready');
								--l;
								continue modules;//if dependency not ready, 
							}
						}
					}
					__private.ready.push(moduleName);
					__private.registered.splice(l, 1);
					window.spotter.onModuleReady.functions[moduleName].forEach(function(func){func();});
					console.log('    **** module ('+moduleName.toUpperCase()+') is ready ***');
				}
			//end modules
		}
	};

	var __self = function(module){			
		var dependencies = [];
		switch(module){
			case 'newSearchObject':
				path = __self.homeURL + 'dev/' + module + '.js';
				break;
			case 'template':
				dependencies.push('main');
				break;
			case 'searchAndSort':
				dependencies.push('main');
				break;
			case 'mobile':
				dependencies.push('main');
				break;
			case 'image':
				dependencies.push('main');
				break;
			case 'fader':
				dependencies.push('main');
				break;
			case 'error':
				dependencies.push('main');
				break;
			case 'components':
				dependencies[0] = 'searchAndSort';
				break;
			case 'form':
				dependencies.push('main');
				break;
			default:
				core.consoleError('required module not recognized', module, 'major');
		}
		console.log('module name',module,'dependencies',dependencies);
		if(!__self.register(module, dependencies)) return;
		spotter.observeSetter(window.spotter, module, evtName);
		spotter.addScriptToHead(__self.homeURL + module + '.js');
	};

	var thisScript;
	if(document.currentScript && document.currentScript.src){
		thisScript = document.currentScript;
	}
	else{
		thisScript = document.querySelector('script[src*="'+ __private.name + '"]');
	}
	__self.spotterScript = thisScript;

	__self.homeURL = (function(){ 
		var homeURL;
		if(document.currentScript && document.currentScript.src){
			homeURL = thisScript.src;
			homeURL = homeURL.slice(0, homeURL.indexOf(__private.name));
		}
		else{
			var src = thisScript.getAttribute('src');
			var homeURL = window.location.href.split('/');
				homeURL = homeURL[0] + '//' + homeURL[2] + src.slice(0, src.indexOf(__private.name));
			}
		return homeURL
	}());

	__self.register = function(module, dependencies){//does NOT include the module. This is for modules loaded from other places to register themselves
		dependencies = dependencies || [];
		var l = dependencies.length;
		if(__private.registered.indexOf(module)=== -1){
			__private.dependencies[__private.registered.push(module) - 1] = dependencies;
			window.spotter.onModuleReady.functions[module] = [];
			return true;
		}
		else{
			return false;
		}
	};

	__self.isReady = function(moduleName){
		return __private.ready.indexOf(moduleName) > -1;
	};

	//register this module and main
	spotter.observeSetter(window.spotter, 'require', evtName);
	__self.register('require');
	
	//the moduleReady event - testModuleReady tries to ready all modules
	document.addEventListener(evtName, __private.testModuleReady, false);

	return __self;	
}());
	
//load modules from the spotter script tag using 'data-modules' attribute
	var onLoadModules = spotter.require.spotterScript.getAttribute('data-modules');
	if(onLoadModules){ 
		onLoadModules = onLoadModules.split(',');
		onLoadModules.forEach(function(moduleName){ spotter.require(moduleName); }); 
	}