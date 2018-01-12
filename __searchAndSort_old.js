console.log("using search and sort");

//--------------------------------------------------------------

//cont.searchAndSort takes a direct array of data objects or a parent node. If a node is sent, the direct children of the node will be used to build the data object where any element
// with the attribute data-field="[field name]" will be added as data to the object representing the parent node. 'field name' will be the field and the text within the FIRST text
// node will be the value. So <div data-field="name">Brian</div> will add to object like {...name: 'Brian'...}. If multiple elements are found for a single field name then they will
// be added as an array {...name: ['Brian', 'Chris']...}
window.spotter.searchAndSort = (function(){
	var __factory = {
		searchAndSortObjects: {},
		readyEvent: spotter.events('searchandsortready'),//fires when constructor run if a 'node' is passed in OR when setSourceNode is called. srcNode will be appended to the event as event.srcNode
		registeredNodes: [],
		registeredInstances: []
	};
	
	window.debugFactory = __factory;
	
	/*
	//'field' can only contain letters, numbers, and underscore
	//each formatted object will have the following structure:
	//formattedObject = {
	//	original: [copy of original data],
	//	indexed: {
	//		'field': {
	//			'value': ['indexes']
	//			...
	//		},
	//		...
	//	}
	//}
	*/
	
	// ** PRIVATE METHODS **
	
	//helper - get a single object from a single element
	__factory.createDataObjectFromNode = function(node){
		var newObject = {}, searchableNodes = node.querySelectorAll('[data-field]'), l = searchableNodes.length;
		while(--l > -1){
			newObject[searchableNodes[l].getAttribute('data-field')] = spotter.getFirstTextNode(searchableNodes[l]).nodeValue.trim();
		}
		newObject._node_ = node;
		node.searchAndSort = newObject;
		return newObject;
	};
	
	//helper - add a single bit of info to the indexed data object
	__factory.addSearchableData = function(indexedData, field, fieldValue, index){
		if(typeof indexedData.indexed[field] === 'undefined') indexedData.indexed[field] = {};
		if(String(fieldValue).length){
			if(typeof indexedData.indexed[field][fieldValue] === 'undefined') indexedData.indexed[field][fieldValue] = [];
			indexedData.indexed[field][fieldValue].push(index);
		}
		//console.log('searchAndSort -> addSearchableData:\n', indexedData.indexed[field]);
	};
	
	//helper - set intial structure of searchandsort object {original:data, indexed:{field:{fieldValue:[indexes corresponding to original]}}}
	__factory.getInitialStructure = function(){
		console.log('getInitialStructure');
		return {
			original:[], 
			indexed:{}
		};
	};
	
	//helper - set intial structure of result object {data:[objects], indexed:{lastSearch fieldValue:[indexes corresponding to indexedObj.original]}}
	__factory.getInitialResultObjectStructure = function(){//this is used for subsequent operations after the first search/sort
		return {
			indexed:{},
			data:[]
		};
	};
	
	// *** PUBLIC METHODS ***
	var __constructor = function(arrayOfObjectsOrElems, idField){
		
		spotter.requiredParam(arrayOfObjectsOrElems).DOMList().element().array().result()();
		
		//PARAMETERIZE
		if(typeof idField !== 'undefined' && idField !== null){ idField = String(idField); }else{ idField = null; }
		
		var __public = {}
			, srcNode
			, registeredInstancesIndex = __factory.registeredInstances.push(__public) - 1
			, indexedObj = __factory.getInitialStructure()
			, resultObj = __factory.getInitialResultObjectStructure()
			, lastSearchTerm
			, lastSearchField
			, lastSortFields = []//these are stored in reverse order of the sort.
			, lastSortDirections = []//index-to-index with 'lastSortFields'
			, lastSortTypes = []//only last types are stored. This is for private use.
			, lastSortFunc
			, searchActive = false
			, sortActive = false
		;
		
		//setup events
		spotter.events.setEventTrigger(__public, 'update');//triggered by addTo
		spotter.events.setEventTrigger(__public, 'resetData');//triggered by resetData
		spotter.events.setEventTrigger(__public, 'search');//triggered by searchByFieldFor
		spotter.events.setEventTrigger(__public, 'noResults');
		spotter.events.setEventTrigger(__public, 'searchReset');//triggered by resetSearch
		spotter.events.setEventTrigger(__public, 'sort');//triggered by sort, but NOT by sortby
		
		//adds data to the indexedData - if a search or sort was active then the new data will be acted on the same
		__public.addTo = function(arrayOfObjectsOrElems){
			
			console.log('searchAndSort.addTo -> arrayOfObjectsOrElems:\n',arrayOfObjectsOrElems);
			if(!arrayOfObjectsOrElems.length && spotter.isType.element(arrayOfObjectsOrElems)){
				arrayOfObjectsOrElems = arrayOfObjectsOrElems.children;
			}
			
			var newData = []
				, l = arrayOfObjectsOrElems.length
				, originalData = indexedObj.original
				, s = originalData.length //get the starting point of the new data
				, object
				, field
				, fieldValue
				, x
				, m
				, i;

			for(s=0; s<l; s++){
				object = arrayOfObjectsOrElems[s];
				if(spotter.isType.element(object)){
					newData.push(__factory.createDataObjectFromNode(object));
				}
				else{
					newData.push(object);
				}
			}

			//remove any new data with an existing 'primary key'
			if(idField !== null && !Array.empty(originalData.indexed)){
				l = newData.length, targIndex = originalData.indexed[idField];
				while(--l > -1){
					if(!Array.empty(targIndex[newData[l][idField]])) newData.splice(l, 1);
				}
			}
			if(!newData.length){ console.error('addTo:\n', ' All data added repeats on primary key:\n', '  '+idField); return; }

			//console.log('searchandsort.addTo -> newData\n', newData);
			//console.log('searchandsort.addTo -> originalData\n', originalData);
			originalData.merge(newData); //append the new arrayOfObjectsOrElems
			l = originalData.length;
			console.log('searchandsort.addTo -> merged data\n', originalData);
			
			__public.resetSearchResults(indexedObj);
			
			//starting at the new data, index the now appended newData. Also if a search is active on this s&s then run the search 
			for(s=0; s<l; s++){
				object = originalData[s];
				for(field in object){
					fieldValue = object[field];
					if(Array.isArray(fieldValue)){
						fieldValue.forEach(function(value){
							__factory.addSearchableData(indexedObj, field, value, s);
						});
					}
					else{
						__factory.addSearchableData(indexedObj, field, fieldValue, s);
					}
				}
			}
			
			__public.repeatLastSearchAndSort();
			
			//spotter.events.fire(updateEvent);
			__public.eventTriggers['update']({sortFields:lastSortFields, sortTypes:lastSortTypes, sortDirections:lastSortDirections, searchQuery:lastSearchTerm, searchField:lastSearchField});
			return this;
		};
		
		//go through an object and remove index references to it from the indexes object.
		var removeObjIndexReferences = function(rows){
			if(!Array.isArray(rows)) rows = [rows];
			var original = indexedObj.original;
			rows.forEach(function(obj, index){
				var field, ref, i = original.indexOf(obj) ;
				for(field in obj){
					ref = indexedObj.indexed[field][obj[field]];
					ref.splice([ref.indexOf(i)],1);
					if(ref.length === 0) delete indexedObj.indexed[field][obj[field]];
				}
			});
		};
		
		//retrieve of array of values for a given field in the data
		__public.getValuesByField = function(field){
			if(targ = indexedObj.indexed[field]){	
				return Object.keys(indexedObj.indexed[field]);
			}
			else{
				console.error('search and sort get values by field does not have records for field '+field);
				return [];
			}
		};
		
		//overwrites records in original data where 'searchField' has value of 'findValue' with object. Will also trigger 'updateListings' event
		__public.overwriteByFieldValue = function(objNewData, searchField, findValue){
			if(typeof indexedObj.indexed[searchField] === 'undefined'){ console.error('a search field of '+searchField+' does not exist in the indexed data'); return false; }
			
			//console.log('searchAndSort.overwriteByFieldValue', arguments);
			var arr=[];
			
			if(idField !== null){
				if(!Array.empty(indexedObj.indexed[idField][objNewData[idField]])){
					console.error('cannot use object to replace by field value because of conflicting id fields', objNewData);
					return false;
				}
			}
			
			indexedObj.indexed[searchField][findValue].forEach(function(i){
				arr.push(i);
				removeObjIndexReferences(indexedObj.original[i]);
				indexedObj.original[i] = objNewData;
				for(searchField in objNewData){
					__factory.addSearchableData(indexedObj, searchField, objNewData[searchField], i);
				}
			});
			return this;
		};
		
		//change targField value to newValue where findField has a value of searchValue
		__public.setFieldByFieldValue = function(findField, searchValue, targField, newValue){
			var indexed = indexedObj.indexed, vals = indexed[findField][searchValue], obj;
			
			if((vals = indexed[findField]) && (vals = vals[searchValue])){
				vals.forEach(function(i){
					obj = indexedObj.original[i];
					//console.debug('targField:', targField, ' \n', 'obj[targField]:', obj[targField], ' \n', 'object:', obj);
					indexed[targField][String(obj[targField])].removeValues(i);
					obj[targField] = newValue;
					__factory.addSearchableData(indexedObj, targField, newValue, i);
				});
				return this;
			}
			else{
				console.error('field ('+findField+') or field value ('+searchValue+') was not found when making a set field by field value call');
				return this;
			}
		};
		
		//send field and value to remove all value indexes and associated objects in ...original
		//Returns an array of the objects removed
		__public.deleteByField = function(field, fieldValue){
			//console.log('searchAndSort.deleteByField');
			var arr=[];
			indexedObj.indexed[field][fieldValue].forEach(function(i){
				arr.push(indexedObj.original[i]);
				indexedObj.original[i] = null; 
			});
			delete indexedObj.indexed[field][fieldValue];
			return arr;
		};
		
		//return the indexed object that searchandsort uses
		__public.getIndexedDataObject = function(){
			return indexedObj;
		};
		
		//find objects with exact match (third argument 'NC' for case insensitive search) //return array of original data objects
		__public.getDataByFieldValues = function(searchField, findValues){
			//console.error(arguments);
			//console.debug(indexedObj);
			if(typeof findValues === 'string'){ findValues = findValues.split(','); }
			else if(!Array.isArray(findValues)){ findValues = [findValues]; }
			var data = indexedObj.original, fieldIndex = indexedObj.indexed[searchField], l = findValues.length, result = [], targIndex;
			__public.getDataByFieldValues.unfoundFieldValues = [];
			while(--l > -1){
				targIndex = fieldIndex[findValues[l]];
				if(targIndex){	
					if(targIndex > 1){
						result.merge(targIndex.map(function(i){ return data[i] }));
					}
					else{
						result.push(data[targIndex[0]]);
					}
				}
				else{
					__public.getDataByFieldValues.unfoundFieldValues.push(findValues[l]);
				}
			}
			return result;
		};

		//find values by search term(s). Only find values (not objects/nodes) Useful to search w/incomplete search terms (like autocomplete) - searchByField can be a string or array of strings - store result to 'resultObj'
		//usage: searchFields[first_name, last_name], searchFor['cr', 'en'] would return a list of first names with 'cr' and/or last names that contain 'en'
		__public.searchByFieldFor = (function(){
			var __searchByFieldFor = {recursion:false,matchingValues:[],aggregatedIndexes:[]};
			return function(searchField, searchFor, flag){
				flag = flag || '';
				var indexedData = indexedObj.indexed//used to perform search
					, field = Array.isArray(searchField) ? searchField.shift() : searchField
					, query = Array.isArray(searchFor) ? (searchFor.shift() || searchFor.last()) : searchFor
					, indexes
					, aggregatedIndexes = []//for local storage, __searchByFieldFor.aggregatedIndexes is for overall storage
					, noCase = ~flag.indexOf('NC')
					, filterFunc;
				console.log('searchField:', field, ' \n', 'searchFor:', query);
				lastSearchField = field;
				lastSearchTerm 	= query;
				
				if(__searchByFieldFor.recursion === false){
					__searchByFieldFor.matchingValues = [];
					__searchByFieldFor.aggregatedIndexes = [];
					__public.resetSearchResults();
				}

				if(typeof indexedData[field] === 'object'){
					//setup filter func for search operation
					if(Array.isArray(query)){
						query = query.join("|");
						if(noCase) query = query.toLowerCase();
						query = new RegExp(query);
						filterFunc = function(v){
							if(noCase) v = v.toLowerCase();
							return query.test(v);
						};
					}
					else{
						filterFunc = function(v){
							if(noCase) v = v.toLowerCase();
							return ~v.indexOf(query);
						};
					}					

					//get array of values containing query term
					__searchByFieldFor.matchingValues = __searchByFieldFor.matchingValues.concat(Object.keys(indexedData[field]).filter(filterFunc));
					console.log('values found:', __searchByFieldFor.matchingValues);

					__searchByFieldFor.matchingValues.forEach(function(v){
						console.log('indexedData:', indexedData, ' \n', 'searchField:', searchField);
						indexes = indexedData[searchField][v];
						if(indexes) __searchByFieldFor.aggregatedIndexes.mergeDistinct(indexes);
					});

					if(Array.isArray(searchField) && searchField.length){ 
						__searchByFieldFor.recursion = true;
						__public.searchByFieldFor(searchField, searchFor); 
					}
					else{
						__searchByFieldFor.recursion = false;
						resultObj.data = __searchByFieldFor.aggregatedIndexes.map(function(i){ return indexedObj.original[i]; });//array of objects corresponding to search result
						__searchByFieldFor.matchingValues.forEach(function(v){
							resultObj.indexed[v] = indexes;//resultObj.indexed[fieldValue] = [indexes corresponding to search result] for LAST search field ONLY
						});
						searchActive = true;
						//spotter.events.fire(searchEvent);
						__public.eventTriggers['search']({targetField:searchField,query:searchFor,flags:flag});
						if(resultObj.data.length === 0) /*spotter.events.fire(noResultsEvent);*/ __public.eventTriggers['noResults']();
					}
				}
				else{
					console.error('The searchandsort item does not contain field ('+field+').'+"\n"+' - this error can be ignored if only setting a search term.',Object.keys(indexedData),indexedObj);
				}
			    return this;
			};
		}());
		
		//finds any matches within any of the fields - usage: searchFields[first_name, last_name], searchQueries['ch', 'do'] will return any results where first_name or last_name contains 'ch' or 'do' 
		__public.searchFieldsForAnyMatches = (function(){
			return function(searchFields, searchQueries, noCase){
				if(!Array.isArray(searchFields)) searchFields = [searchFields];
				var l = searchFields.length
					, field
					, values
					, indexedData = indexedObj.indexed
					, filterFunc
					, aggregatedIndexes = []
					, isArray
					, getIndexes = function(v){
						return indexedData[field][v];
					};
				
				if((isArray = Array.isArray(searchQueries)) && searchQueries.length > 1){
					var regex = '(' + searchQueries.join(')|(') + ')';console.log('regex:',regex);
					regex = new RegExp(regex);
					filterFunc = function(v){
						if(noCase) v = v.toLowerCase();
						return regex.test(v);
					};
				}
				else{
					if(isArray) searchQueries = searchQueries[0];
					filterFunc = function(v){
						if(noCase) v = v.toLowerCase();
						return ~v.indexOf(searchQueries);
					};
				}
				console.log('filterFunc:',filterFunc);
				
				//for each field to check...
				while(--l > -1){
					field = searchFields[l];
					if(typeof indexedData[field] === 'object'){
						values = Object.keys(indexedData[field]).filter(filterFunc);
						if(values.length > 0) aggregatedIndexes = Array.prototype.concat.apply(aggregatedIndexes, values.map(getIndexes));
					}
				}
				aggregatedIndexes = aggregatedIndexes.unique();
				var original = indexedObj.original;
				resultObj.data = aggregatedIndexes.map(function(i){ return original[i]; });
				
				searchActive = true;
				__public.eventTriggers['search']({targetField:searchFields, query:searchQueries, flags:noCase});
				if(resultObj.data.length === 0) __public.eventTriggers['noResults']();
				
				return this;
			};
		}());
		
		__public.searchByFieldByCond = function(searchFields, searchConds){};
		
		//return the last result of a search or all results if no search was performed.
		__public.getCurrentResults = function(){
			return resultObj;
		};
		
		__public.getLastSearchParams = function(){
			return [lastSearchField, lastSearchTerm];
		};
		
		//use this function to set search params without performing the search. Useful for getting search results and THEN performing the search after data is added.
		__public.setSearchParams = function(searchField, searchTerm){
			lastSearchField = searchField;
			lastSearchTerm 	= searchTerm;
			searchActive = false;
			return this;
		};
		
		//If no arguments are sent then sort by relevance of last search. 
		__public.sort = function(fields, sortTypes, directions){
			//console.debug('searchAndSort.sort -> arguments:',arguments);
			var field,direction;
			
			lastSortFields 	   = [];
			lastSortDirections = [];
			lastSortTypes	   = sortTypes;
			
			if(typeof directions === 'undefined') directions = [1];
			if(typeof sortTypes === 'undefined'){
				if(!lastSearchTerm){ return; }//do not do a relevance sort when nothing to compare relevance with
				else{ sortTypes = null; }
			}

			if(searchActive === false && resultObj.data.length === 0) resultObj.data = indexedObj.original.slice(0);//special case search was not previously activated
			var resultData = resultObj.data;
			//console.debug('searchAndSort.sort -> (before sort)resultData:',resultData);
			
			if(!fields){//if fields not passed, assumed to be last search field
				var func = __public.sortFuncs(sortTypes || 'relevance');
				lastSortFields[0] 		= lastSearchField;
				lastSortDirections[0] 	= 1;
				lastSortFunc = function(a,b){ return (directions || 1) * func(a[lastSearchField], b[lastSearchField], lastSearchTerm); }
				resultData = resultData.sort(lastSortFunc);
			}
			else if(!Array.isArray(fields) || fields.length === 1){
				var func = __public.sortFuncs((Array.isArray(sortTypes) ? sortTypes[0] : sortTypes || 'alphanumeric'));
				lastSortFields[0] 		= (field = fields[0] || fields);
				lastSortDirections[0] 	= direction = parameterizeSortDirection(directions[0] || directions);
				direction = parameterizeSortDirection(direction);
				lastSortFunc = function(a,b){ return direction * func(a[field], b[field]); };
				resultData = resultData.sort(lastSortFunc);
			}
			else{
				lastSortFields[0] 		= (field = fields.shift());
				lastSortDirections[0] 	= (direction = directions.shift() || 1);
				var func = __public.sortBy(sortTypes.shift() || 'alphanumeric', field, direction);
				fields.forEach(function(f, i){
					lastSortFields.push(fields[i]);
					lastSortDirections.push(directions[i] || 1);
					func = func.thenBy(sortTypes[i] || 'alphanumeric', fields[i], directions[i] || 1);
				});
				lastSortFunc = func;
				resultData = resultData.sort(func);
			}
			//console.debug('searchAndSort.sort -> (after sort)resultData:',resultData);
			sortActive = true;
			//spotter.events.fire(sortEvent);
			__public.eventTriggers['sort']({sortFields:lastSortFields, sortTypes:lastSortTypes, sortDirections:lastSortDirections, searchQuery:lastSearchTerm, searchField:lastSearchField});
			return this;
		};
		
		var parameterizeSortDirection = function(str){
			if(typeof str === 'number') return str;
			if(typeof str === 'undefined') return 1;
			switch(str){
				case 'asc':
					return 1;
				case 'desc':
					return -1;
				default:
					console.error('the str sent to parameterizeSortDirection is not recognized');
			}
		};
		
		//returns a multi sortable function. If only sorting on one field, then just call the function from ...sortFuncs([function name]) and do not call this
		__public.sortBy = (function(){
			var __sortBy = { funcs: [], fields: [], sortOrders: [], expandedParams: [] }, func, field, extraParams, sortOrder, result, A, B;
					
			__sortBy.mainSortFunc = function(a, b, i){
				if(typeof i === 'undefined') i = -1;
				i++;
						
				if(!(func = __sortBy.funcs[i])) return 0; 
						
				field 		= __sortBy.fields[i] || null;
				A 			= (!!field ? a[field] : a);
				B 			= (!!field ? b[field] : b);
				extraParams	= __sortBy.expandedParams[i] || null;
				sortOrder 	= __sortBy.sortOrders[i];
						
				if(typeof extraParams === 'function') extraParams = extraParams();
						
				result = func(A, B, extraParams) || __sortBy.mainSortFunc(a, b, i);
				if(sortOrder === -1){ result = -result; sortOrder = 1;}
						
				return result;
			};
					
			__sortBy.addSortFunc = function(func, field, sortOrder, extraParams){
				func 		= typeof func === 'string' ? __public.sortFuncs(func) : func;
				field 		= field || null;
				extraParams	= extraParams || null;
				sortOrder	= parameterizeSortDirection(sortOrder);
				//console.log(arguments);
						
				__sortBy.funcs.push(func);
				__sortBy.fields.push(field);
				__sortBy.sortOrders.push(sortOrder);
				__sortBy.expandedParams.push(extraParams);
			};
					
			__sortBy.mainSortFunc.thenBy = function(func, field, sortOrder, extraParams){
				__sortBy.addSortFunc(func, field, sortOrder, extraParams);
				return __sortBy.mainSortFunc;
			};
					
			var __self = function(func, field, sortOrder, extraParams){
				__sortBy.funcs  			= [];
				__sortBy.fields 			= [];
				__sortBy.expandedParams  	= [];
				__sortBy.sortOrders			= [];
						
				__sortBy.addSortFunc(func, field, sortOrder, extraParams);
						
				return __sortBy.mainSortFunc;
			};
					
			return __self;
		}());
		
		//common sort functions. Send string name of function to get the function back
		__public.sortFuncs = (function(){
			//alpha, numeric, alphanumeric, relevance
			var __sortFuncs = {},
				__self = function(str){
					if(typeof __sortFuncs[str.toLowerCase()] === 'function') return __sortFuncs[str];
					spotter.consoleError('sort function unknown ('+str+')', '', 'major');
				};
				
			__sortFuncs.alpha = function(a, b){
				a = String(a).toLowerCase();
				b = String(b).toLowerCase();
				if(a === b){  return 0; }
				return (a < b ? -1 : 1);
			};
					
			__sortFuncs.numeric = function(a, b){
				a = Number(a);
				b = Number(b);
				return a - b;
			};
					
			__sortFuncs.alphanumeric = function(a, b){
				if(a === b) return 0;
				aT = spotter.isNumeric(a);
				bT = spotter.isNumeric(b);
				if(aT){
					if(bT){ return __sortFuncs.numeric(a, b); }
					else{ return -1; }
				}
				else{
					if(bT){	return 1; }
					else{ return __sortFuncs.alpha(a, b); }
				}
			};
					
			__sortFuncs.relevance = function(a, b, query){
				a = String(a).toLowerCase();
				b = String(b).toLowerCase();
				if(a === b){  return 0; }
				a = a.indexOf(query);
				b = b.indexOf(query);
				if( a === -1) return 1;
				if( b === -1) return -1;
				return a - b;
			};
					
			return __self;
		}());
		
		//returns (array)[(array)fields, (array)directions]
		__public.getLastSortParams = function(){
			return [lastSortFields.reverse(),lastSortDirections.reverse()];
		};
		
		//set the sort params without performing a search. Use when data will BE added and should be sorted but is not yet soreted.
		__public.setSortParams = function(sortFields, sortTypes, sortDirs){
			if(!Array.isArray(sortFields)) sortFields = [sortFields];
			var l = sortFields.length;
			
			if(!Array.isArray(sortTypes)) sortTypes = [sortTypes];
			
			if(!sortDirs){
				sortDirs = [1];
			}
			else if(!Array.isArray(sortDirs)){
				sortDirs = [sortDirs];
			}
			
			while(--l > -1){
				if(typeof sortDirs[l] === 'undefined'){
					sortDirs[l] = 1;//default 'asc'
				}
				if(typeof sortTypes[l] === 'undefined'){
					sortTypes[l] = 'alphanumeric';//default 'asc'
				}
			}

			lastSortFields = sortFields;
			lastSortTerms = sortTerms;
			lastSortDirs = sortDirs;
			sortActive = true;
			
			return this;
		};
		
		//public method to trigger the change event, which I dont know what it does atm
		__public.triggerChangeEvent = function(){
			//spotter.events.fire(changeEvent);
			__public.eventTriggers['change']();
			return this;
		};
		
		//deletes all the current data
		__public.resetData = function(){
			indexedObj = __factory.getInitialStructure();
			//spotter.events.fire(resetDataEvent);
			__public.eventTriggers['resetData']();
			return this;
		};
		
		//sets all the serach params to null
		__public.resetSearch = function(){
			lastSearchTerm  = '';
			lastSearchField = '';
			searchActive = false;
			__public.resetSearchResults();
			//spotter.events.fire(searchResetEvent);
			__public.eventTriggers['searchReset']();
			return this;
		};
		
		//sets all the sort params to null
		__public.resetSort = function(){
			lastSortFields		= [];
			lastSortDirections	= [];
			sortActive = false;
			lastSortFunc = undefined;
			return this;
		};
		
		//reset the stored search results, but does not reset the search params
		__public.resetSearchResults = function(){
			resultObj = __factory.getInitialResultObjectStructure();
		};
		
		//run search and sort operations on the existing data
		__public.repeatLastSearchAndSort = function(){
			console.debug('searchAndSort:\n', 'repeatLastSearchAndSort:\n', 'lastSearchField:', lastSearchField, 'lastSearchTerm:', lastSearchTerm, 'lastSortFields:', lastSortFields); 
			if(lastSearchTerm || lastSearchTerm === 0){
				__public.searchByFieldFor(lastSearchField, lastSearchTerm);
			}
			
			if(lastSortFields.length > 0){
				__public.sort(lastSortFields, lastSortTypes, lastSortDirections);
			}
			return this;
		};
		
		//In cases where data passed instead of being generated by searchandsort, if the data is to be associated with an ELEM, run this to create that association.
		//This way 'searchandsortready' event captures know if the event trigger is the one they are waiting.
		//Generally addEventListener('searchandsortready', function(e){ if(e.content.srcNode = [target node]){ do something... 
		__public.setSourceNode = function(elem){
			spotter.events.appendTo({srcNode:elem}, __factory.readyEvent);
			__factory.registeredNodes[registeredInstancesIndex] = elem;
			//console.debug('setSourceNode',__factory.registeredNodes.indexOf(elem));
			//console.debug('setSourceNode',spotter.searchAndSort.getObjectFor(elem));
			spotter.events.fire(__factory.readyEvent);
		};
		
		//initial data setup
		if(arrayOfObjectsOrElems.length) __public.addTo(arrayOfObjectsOrElems);//no point for empty data sets
		if(spotter.isType.element(arrayOfObjectsOrElems)) __public.setSourceNode(arrayOfObjectsOrElems);
		
		return __public;
	};
	
	var testObj;
	//__public.test = function(){}
	
	// *** PUBLIC STATIC METHODS ***
	//if an object has been created for an elem/node this will return that object, otherwise it will return false
	__constructor.getObjectFor = function(node){
		var i = __factory.registeredNodes.indexOf(node);
		//console.debug('getObjectFor:');
		/*
		__factory.registeredNodes.forEach(function(node, i){
			console.debug('entry '+i+' is ',node);
		});
		*/		
		//console.debug('getObjectFor', node);
		//console.debug('getObjectFor', i);
		if(i === -1) return false;
		return __factory.registeredInstances[i];
	};
	
	return __constructor;
}());

console.log('search and sort loaded');