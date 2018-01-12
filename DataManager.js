console.log("using data manager");

// -- DATA MANAGER -- {
	//data manager base class maintains rows of data using a primary key and offers search and sort functionality and add and remove methods and other data manipulations
	window.spotter.DataManager = (function(){
		
		var __factory = {
			searchAndSortObjects: {},
			readyEvent: spotter.events('datamanagerready'),//fires when constructor run if a 'node' is passed in OR when setSourceNode is called. srcNode will be appended to the event as event.srcNode
			registeredNodes: [],
			registeredInstances: []
		};
		
		// *** SEARCH PROTOTYPE ***
			function spotterSearchAndSortSearch(__parent){
				this.parent = __parent;
				this.results = new fastArray(100);
				this.reset();
				this.notFound = [];
			}		
			// --- MANAGEMENT ---
				spotterSearchAndSortSearch.prototype.saveHistory = function(type, opts){
					var history = this.history;
						
					if(type === 'query'){
						history.data = [];
						history.push({type:type, query:opts.query, field:null, terms:null, flags:opts.flags});
					}
					else{
						history.push({type:type, query:null, field:opts.field, terms:opts.terms, flags:opts.flags});
					}
					this.active = true;
				};
				spotterSearchAndSortSearch.prototype.complete = function(results){
					this.results.clear();
					this.results.concat(results);
					this.parent.eventTriggers['search'](undefined, {source:this, results:this.results});
				};
				spotterSearchAndSortSearch.prototype.reset = function(){
					this.results.clear();
					this.history = [];
					this.active = false;
				};
				spotterSearchAndSortSearch.prototype.repeat = function(){
					var history = this.history.slice(0)
						, x = 0
						, l = history.length
						, searchInfo
						, dataSrc;
					
					this.reset();
					
					for(x; x<l; x++){
						searchInfo = history[x];
						
						switch(searchInfo.type){
							case "fuzzyAnyMatch":
								this.fuzzySearchForAnyMatch(searchInfo.fields, searchInfo.terms, searchInfo.flags);
								break;
							case "fuzzyAllMatch":
								this.fuzzySearchForAllMatch(searchInfo.fields, searchInfo.terms, searchInfo.flags);
								break;
							case "exactAnyMatch":
								this.exactSearchForAnyMatch(searchInfo.fields, searchInfo.terms, searchInfo.flags);
								break;	
							case "exactAllMatch":
								this.exactSearchForAllMatch(searchInfo.fields, searchInfo.terms, searchInfo.flags);
								break;
							case "query":
								this.query(searchInfo.query, searchInfo.flags);
								break;
						}
					}
				};			
			// --- SEARCH HELPERS --- return the results - do not 'complete' the search
				//returns array of rows with matches exact matches for value in field
				spotterSearchAndSortSearch.prototype.exactNonIndex = function(searchField, findValues, dataSrc, flags){
					var T = typeof findValues;
					if(T === 'string'){ findValues = findValues.split(','); }
					else if(T === 'number'){ findValues = [""+findValues]; }

					var unFoundValues = findValues.slice(0)
						,results = []
						,l = dataSrc.length
						,fVal = findValues.length
						,row
						,x
						,r;
						
					dataSrc = dataSrc.values;
					while(--l > -1){//loop data
						row = dataSrc[l];
						if(typeof row === "undefined" || row === null) continue;
						
						value = row[searchField];
						r = false;
						
						for(x = 0; x < fVal && !r; x++){//loop find values
							if(r = (findValues[x] === value)){
								results.push(row);
								unFoundValues[x] = null;
							}
						}
					}

					this.notFound = [];
					for(x = 0; x < fVal; x++){
						if(unFoundValues[x] !== null) this.notFound.push(unFoundValues[x]);
					}
					if(unFoundValues.length) console.log("spotter.custom.contacts.list.dataManager.search.notFound:", spotter.custom.contacts.list.dataManager.search.notFound);
					return results;
				};
				//returns array of rows with full or partial matches for value in field
				spotterSearchAndSortSearch.prototype.fuzzyNonIndex = function(searchField, findValues, dataSrc, flags){
					if(typeof findValues === 'string') findValues = findValues.split(',');

					var results = []
						, l = dataSrc.length
						, fVal = findValues.length
						, row
						, x
						, r;
					
					dataSrc = dataSrc.values;
					
					while(--l > -1){//loop data
						row = dataSrc[l];
						if(typeof row === "undefined") continue;
						value = row[searchField];
						if(value === undefined) spotter.log('error', {func:'fuzzyNonIndex:', msg:'data does not contain field', vars:{field:searchField, data:dataSrc[l]}});
						r = false;
						for(x = 0; x < fVal && !r; x++){//loop find values
							if(r = ~value.indexOf(findValues[x])) results.push(row);
						}
					}
					return results;
				};
				//returns array of rows with partial matches for value in field in same order as value ('value' would be a match for 'values' but not 'svalue')
				spotterSearchAndSortSearch.prototype.partialNonIndex = function(searchField, findValues, dataSrc, flags){
					if(typeof findValues === 'string') findValues = findValues.split(',');
					if(findValues === undefined) console.log('findvalues undefined', new Error().stack);

					var results = []
						, l = dataSrc.length
						, fVal = findValues.length
						, row
						, x
						, r;
					
					dataSrc = dataSrc.values;
					
					while(--l > -1){//loop data
						row = dataSrc[l];
						if(typeof row === "undefined") continue;
						value = row[searchField];
						if(value === undefined) spotter.log('error', {func:'partialNonIndex:', msg:'data does not contain field', vars:{field:searchField, data:dataSrc[l]}});
						r = false;
						for(x = 0; x < fVal && !r; x++){//loop find values
							findValue = findValues[x];
							if(r = (value.slice(0, findValue.length) === findValue)) results.push(row);
							//console.log('partial non index search', 'slice value:', value.slice(0, findValue.length), ' \n', 'comparison value:', findValue, ' \n', 'result:', r);
						}
					}
					return results;
				};
				//returns array of rows with exact matches for value in field - searchField must be indexed - fastest when lots of repeating values for searchField
				spotterSearchAndSortSearch.prototype.exactIndexed = function(searchField, findValues, flags){
					if(typeof findValues === 'string') findValues = findValues.split(',');
					this.notFound = [];
					
					var results = []
						, fVal = findValues.length
						, fieldIndex = this.parent.data.index[searchField]
						, values = Object.keys(fieldIndex)
						, value
						, l = values.length
						, x = 0
						, r;

					for(x = 0; x<fVal; x++){
						value = findValues[x];
						indexedValues = fieldIndex[value];
						if(typeof indexedValues !== "undefined" && indexedValues.length > 0){
							Array.prototype.push.apply(results, indexedValues);
						}
						else{
							this.notFound.push(value);
						}
					}
					return results;
				};
				//returns array of rows with full or partial matches for value in field - searchField must be indexed - fastest when lots of repeating values for searchField
				spotterSearchAndSortSearch.prototype.fuzzyIndexed = function(searchField, findValues, flags){
					if(typeof findValues === 'string') findValues = findValues.split(',');
					
					var results = []
						, fVal = findValues.length
						, l = values.length
						, fieldIndex = this.parent.data.index[searchField]
						, values = Object.keys(fieldIndex)
						, value
						, x
						, r;
		
					while(--l > -1){//loop values
						value = values[l];
						r = false;
						for(x = 0; x < fVal && !r; x++){//loop find values
							if(~value.indexOf(findValues[x])) Array.prototype.push.apply(results, fieldIndex[value]);
						}
					}
					results.unique();
					return results;
				};
				//returns array of rows where partial matches occur in the same order as the value ('value' would be a match for 'values' but not 'svalue')
				spotterSearchAndSortSearch.prototype.partialIndexed = function(searchField, findValues, flags){
					if(typeof findValues === 'string') findValues = findValues.split(',');
					
					var results = []
						, fVal = findValues.length
						, fieldIndex = this.parent.data.index[searchField]
						, values = Object.keys(fieldIndex)
						, l = values.length
						, findValue
						, value
						, x
						, r
						, v;
		
					while(--l > -1){//loop index values
						value = values[l];
						r = false;
						for(x = 0; x < fVal && !r; x++){//loop find values
							findValue = findValues[x];
							v = findValue.length;
							if(findValue === value.slice(0,v)) Array.prototype.push.apply(results, fieldIndex[value]);
						}
					}
					results.unique();
					return results;
				};
				//value@field=term(s) - used by the accessible methods
				spotterSearchAndSortSearch.prototype.exact = function(searchField, searchTerms, dataSrc, flags){
					var data = this.parent.data;
					dataSrc = dataSrc || data.master;
					
					if(dataSrc === data.master && typeof data.index[searchField] === 'object'){
						return this.exactIndexed(searchField, searchTerms, dataSrc);
					}
					else{
						return this.exactNonIndex(searchField, searchTerms, dataSrc);
					}
				};
				//value@field~term(s)
				spotterSearchAndSortSearch.prototype.fuzzy = function(searchField, searchTerms, dataSrc, flags){
					var data = this.parent.data;
					dataSrc = dataSrc || data.master;
					
					if(dataSrc === data.master && typeof data.index[searchField] === 'object'){//if a dataSrc is sent, indexes cannot be used as they always apply to the master data set
						return this.fuzzyIndexed(searchField, searchTerms, dataSrc);
					}
					else{
						return this.fuzzyNonIndex(searchField, searchTerms, dataSrc);
					}
				};
				//value@field=term(s)%
				spotterSearchAndSortSearch.prototype.partial = function(searchField, searchTerms, dataSrc, flags){
					var data = this.parent.data;
					dataSrc = dataSrc || data.master;
					
					if(dataSrc === data.master && typeof data.index[searchField] === 'object'){//if a dataSrc is sent, indexes cannot be used as they always apply to the master data set
						return this.partialIndexed(searchField, searchTerms, dataSrc);
					}
					else{
						return this.partialNonIndex(searchField, searchTerms, dataSrc);
					}
				};
			// --- METHODS ---		
				//For 'or' searches use 'anyMatch' sending the fields to search as an array and the queries to search for as a list or array
				//To perform 'and' matches use 'allMatch'
				//To get the results use ...search.results
				//inline searches (.allMatch('fuzzy'...).anyMatch('exact'...)...) operate on results of the previous search - except .query() which always searches the master data)
				// so .allMatch('fuzzy'...).anyMatch('exact'...) would first do a fuzzy search in the master data and then do an exact match search in the results of the fuzzy search I.E. (results = fuzzyAllMatch) AND (exactAnyMatch(results))
				// sending the flag 'master' to a search method will cause the master data to be searched instead of the results of the previous searches I.E. fuzzyAllMatch(master) AND/OR exactAnyMatch(master)			
				//or-type search - value1@field1=query1 OR... valueN@fieldN=queryN - (string)comparisonType: [exact,fuzzy,partial]
				spotterSearchAndSortSearch.prototype.anyMatch = function(comparisonType, searchFields, searchTerms, flags){
					console.log('DataManager.anyMatch \n', 'arguments:', arguments);
					if(!Array.isArray(searchFields)) searchFields = [searchFields];
					flags = flags || [];
	
					var l = searchFields.length
						, x = 0
						, field
						, value
						, dataSrc
						, isMaster = ~flags.indexOf('master')
						, aggregatedResults = [];

					if(isMaster || !this.active){ 
						dataSrc = this.parent.data.master; 
					}
					else{
						dataSrc = this.results;
					}

					for(x;x<l;x++){//loop search fields
						field = searchFields[x];
						value = searchTerms[x] || value;//use last valid value if not enough values sent
						
						Array.prototype.push.apply(aggregatedResults, this[comparisonType](field, value, dataSrc, flags));
					}
					aggregatedResults.unique();
					console.log('DataManager.anyMatch \n', 'aggregatedResults:', aggregatedResults);
					this.results.mergeDistinct(aggregatedResults);
					console.log('DataManager.anyMatch \n', 'this.results:', this.results);
					
					this.saveHistory("anyMatch", {type:comparisonType, field:searchFields, terms:searchTerms, flags:flags});
					return this;
				};
				//and-type search - value1@field1=query1 AND... valueN@fieldN=queryN - (string)comparisonType: [exact,fuzzy,partial]
				spotterSearchAndSortSearch.prototype.allMatch = function(comparisonType, searchFields, searchTerms, flags){
					if(!Array.isArray(searchFields)) searchFields = [searchFields];
					flags = flags || [];
					
					var l = searchFields.length
						, x = 0
						, field
						, value
						, isMaster = ~flags.indexOf('master')
						, aggregatedResults;
					
					if(isMaster || !this.active){ aggregatedResults = this.parent.data.master; }
					else{ aggregatedResults = this.results; }
					
					for(x;x<l;x++){//loop search fields
						field = searchFields[x];
						value = searchTerms[x] || value;//use last valid value if not enough values sent
						
						aggregatedResults = this[comparisonType](field, value, aggregatedResults, flags);
					}
					
					this.results.mergeDistinct(aggregatedResults);
					
					this.saveHistory("allMatch", {type:comparisonType, field:searchFields, terms:searchTerms, flags:flags});
					return this;
				};
				//takes a complex search query - because complex searches change depending on the collective searched data, this method overwrites other searches and is ALWAYS performed on the entire data set
				spotterSearchAndSortSearch.prototype.query = function(query, flags){
					//field = query, field LIKE query, field = (query1,query2...), field LIKE (query1,query2...)
					//EX: field = query OR field LIKE query AND (field = (query1,query2) OR (field LIKE (query1,query2) AND field = query))
					
					flags = flags || [];
					query = '(' + query + ')';
					var regex = new RegExp('(OR|AND)\\s\\(' + '|' + '(OR|AND)\\s' + '|' + "(([\\w]+)\\s(=|LIKE)\\s(\\([^\\)]+\\)|'[^']+'|[0-9\.]+))" + '|' + '\\(' + '|' + '\\)','g')
						, argsgex = new RegExp("'([^',]+)'|([0-9\.]+)",'g')
						, match
						, dataSrc = this.parent.data.master
						, masterIndex = this.parent.data.index
						, subQueries = []
						, currentSQIndex = -1
						, currentType
						, result
						, comparator
						, field
						, parentSQ
						, rawTerms
						, parsedTerms
						, vals
						, sq;
					
					//from left to right, divide the query into subqueries which act on the results of their parent subqueries
					while(match = regex.exec(query)){
						//console.log(match);
						if(match[1] !== undefined){//and/or subquery
							if(currentSQIndex === -1) currentSQIndex = 0;
							parentSQ = subQueries[currentSQIndex];
							//console.log('adding subquery: \n','parentSQ:', parentSQ, ' \n', 'dataSrc:', parentSQ['dataSrc'], ' \n', 'result:', parentSQ['result']);
							if(match[1] === 'OR'){
								currentSQIndex = subQueries.push({dataSrc:parentSQ['dataSrc'], type:'or', parentSQ:subQueries[currentSQIndex], result:undefined}) - 1;
							}
							else if(match[1] === 'AND'){
								currentSQIndex = subQueries.push({dataSrc:parentSQ['result'], type:'and', parentSQ:subQueries[currentSQIndex], result:undefined}) - 1;
							}
							//console.log('this subquery:',subQueries[currentSQIndex]);
						}
						else if(match[2] !== undefined){//and/or statement
							if(match[2] === 'OR'){
								currentType = 'or';
							}
							else if(match[2] === 'AND'){
								currentType = 'and';
							}
						}
						else if(match[3] !== undefined){//statement
							field = match[4];
							comparator = match[5];
							parentSQ = subQueries[currentSQIndex];
							//break down search terms - ('string',number...) or 'string' or number
							rawTerms = match[6];
							if(rawTerms[0]==='('){
								parsedTerms = [];
								rawTerms = rawTerms.slice(1,-1);
								//console.log('list: ',rawTerms);
								while(vals = argsgex.exec(rawTerms)){
									//console.log(vals);
									parsedTerms.push(vals[1]||vals[2])
								}
							}
							else if(rawTerms[0] === "'"){
								parsedTerms = rawTerms.slice(1,-1);
							}
							else{
								parsedTerms = rawTerms;
							}
							
							if(currentType === 'or' || currentType === undefined/*for first in subquery*/){ dataSrc = parentSQ.dataSrc; }
							else if(currentType === 'and'){ dataSrc = parentSQ.result; }
							
							//console.log('evaluate statement: \n','field:',field,' \n','comparator:',comparator,' \n','find:',parsedTerms,' \n','currentType:',currentType,' \n','dataSrc:',dataSrc,' \n','parentSQ:',parentSQ);
							//get results of this statement
							if(comparator === '='){				
								if(typeof masterIndex[field] === 'object'){
									result = this.exactIndexed(field, parsedTerms, dataSrc);
								}
								else{
									result = this.exactNonIndex(field, parsedTerms, dataSrc);
								}	
							}
							else if(comparator === 'LIKE'){
								if(typeof masterIndex[field] === 'object'){
									result = this.fuzzyIndexed(field, parsedTerms, dataSrc);
								}
								else{
									result = this.fuzzyNonIndex(field, parsedTerms, dataSrc);
								}
							}
							//console.log('statement results:',result);
							
							//add result to parent query results
							//console.log('parentSQ:',parentSQ);
							if(parentSQ.result === undefined){ 
								parentSQ.result = result; 
							}
							else if(currentType === 'or'){ 
								parentSQ.result = parentSQ.result.mergeDistinct(result); 
							}
							else{ 
								parentSQ.result = parentSQ.result.xProd(result); 
							}
							//console.log('new parentSQ results:',parentSQ.result);
	
							currentType = undefined;
						}
						else{//opening or ending
							if(match[0] === '('){
								if(currentSQIndex > -1){ dataSrc=subQueries[currentSQIndex].dataSrc; }
								currentSQIndex = subQueries.push({dataSrc:dataSrc, type:null, parentSQ:parentSQ, result:undefined}) - 1;
							}
							else if(match[0] === ')'){//handle end of subquery
								sq = subQueries.pop();
								parentSQ = subQueries.last();
								switch(sq.type){
									case 'or':
										parentSQ.result.mergeDistinct(sq.result);
										//console.log("parentSQ result after closing 'OR' subquery:",parentSQ.result);
										break;
									case 'and':
										parentSQ.result.xProd(sq.result);
										break;
									default:
										this.saveHistory("query", {query:query, flags:flags});
										return this;
								}
								currentSQIndex--;
							}
						}
					}
					//console.log('subQueries:', subQueries, '\n', 'currentIndex:', currentSQIndex);
				};
				//call this to fire the search event
				spotterSearchAndSortSearch.prototype.end = function(){
					this.parent.eventTriggers['search'](undefined, {source:this, results:this.results});
					return this.parent;
				};
				spotterSearchAndSortSearch.prototype.setAsSearchResults = function(rows){
					this.results.clear();
					this.results.concat(rows);
					return this.parent;
				};
				spotterSearchAndSortSearch.prototype.addRecentToSearchResults = function(rows){
					Array.prototype.push.apply(this.results, rows);
					return this.parent;
				};
			// --- HELPERS ---
				spotterSearchAndSortSearch.prototype.contextArgs = {};
				spotterSearchAndSortSearch.prototype.find = (function(row){
					var value = row[this.searchField];
					var r = false;
					var x = 0;
					var fVal = this.fVal;
					for(x = 0; x < fVal && !r; x++){//loop find values
						if(r = (findValues[x] === value)) results.push(row);
					}
				}).bind(spotterSearchAndSortSearch.prototype.contextArgs);

		// *** CONSTRUCTOR PROTOTYPE ***
			//rows: data to add - arrIndexes(optional): array of fields that should be indexed - idfield(optional): field that should be unique
			var __constructor = function(rows, arrIndexes, primaryKey){

				spotter.requiredParam(rows).array().result()();

				arrIndexes 				= arrIndexes || [];
				primaryKey 				= primaryKey || null;

				var i;

				this.registeredInstancesIndex = __factory.registeredInstances.push(this) - 1;
				this.data = {
					master: new fastArray(1000),//the primary data
					index: {},
					primaryKey: primaryKey,
					recent: function(){
						var recent = this.recent
							, res = new fastArray(recent.new.length + recent.conflicts.length);

						res.concat(recent.new.slice(0));
						res.concat(recent.conflicts.slice(0));
						//console.info('recent results combined:', res.length, ' \n', res);
						return res.values;
					}
				};
				this.data.recent.new = new fastArray(100);
				this.data.recent.conflicts = new fastArray(100);

				//setup events
				spotter.events.setEventTrigger(this, 'update');//triggered by addTo
				spotter.events.setEventTrigger(this, 'resetData');//triggered by resetData
				spotter.events.setEventTrigger(this, 'search');//triggered by searchByFieldFor
				spotter.events.setEventTrigger(this, 'noResults');
				spotter.events.setEventTrigger(this, 'searchReset');//triggered by resetSearch
				spotter.events.setEventTrigger(this, 'sort');//triggered by sort, but NOT by sortby
				spotter.events.setEventTrigger(this, 'sortReset');

				this.search = new spotterSearchAndSortSearch(this);

				this.resetSort();
				this.sortBy = this.sortBy();
				
				if(rows.length){
					this.addData(rows);
					
				}
			};			
			// --- DATA MANAGEMENT HELPERS ---
				//arguments should share the relationship: this.data.master[indexes[N]] = rows[N]
				__constructor.prototype.indexRows = function(rows){
					if(!Array.isArray(rows)) rows = [rows];
					
					var data = this.data
						, masterIndex = data.index
						, indexedFields = Object.keys(masterIndex)
						, l = rows.length
						, x = 0
						, y
						, row
						, i = indexedFields.length
						, field
						, value;
	
					for(x; x<l; x++){//loop rows
						row = rows[x];
						for(y=0; y<i; y++){//foreach indexed field
							field = indexedFields[y];
							value = "" + row[field];
							if(value.length === 0) value = "0";
							if(typeof masterIndex[field][value] === 'undefined'){
								masterIndex[field][value] = [row]; 
								if(typeof this.values[field] === 'undefined') console.debug('field:', field, ' \n', 'values:', this.values, ' \n', new Error().stack); 
								this.values[field].push(value); }
							else{ masterIndex[field][value].push(row); }
						}
					}
				};
				//go through an object and remove index references to it from the indexes object.
				__constructor.prototype.removeObjs = function(rows, indexes){
					if(rows === null){
						if(indexes !== 'undefined') rows = this.getRowsByMasterIndexes(indexes); 
					}
					else if(!Array.isArray(rows)){ 
						rows = [rows]; 
					}
					
					var data = this.data.master
						, indexedData = this.data.index
						, indexedFields = Object.keys(indexedData)
						, i
						, l
						, m
						, value;
					
					l = rows.length;
					while(--l > -1){
						row = rows[l];
						m = indexedFields.length;
						while(--m > -1){
							value = row[field];
							if(value !== undefined){
								indexedValues = indexedData[indexedFields[m]][value];
								i = indexedValues.indexOf(row);
								indexedValues.splice(i,1);
								if(indexedValues.length === 0) delete indexedData[indexedFields[m]][value];
							}
						}
					}
					data.forEach(function(obj, index, array){
						array.values[obj._index_] = null;
					});
				};
				//remove rows with primary key conflicts with previously added data
				__constructor.prototype.removePKConflicts = function(rows){
					var data = this.data
						, primaryKey = data.primaryKey;

					if(primaryKey === null) return this;
					
					var pkIndex
						, recentConflicts = data.recent.conflicts
						, masterIndex = data.index
						, l = rows.length
						, x = 0;
						
					//store the data most recently added - used when setting search results directly to recently added data or sorting only the most recent data - 'new' will hold the rows that did not conflict and 'conflicts' holds the rest
					recentConflicts.clear();
		
					//remove any new rows with an existing 'primary key'
					if(primaryKey !== null && (pKIndex = masterIndex[primaryKey])){
						this.removeRepeatsOnField(primaryKey, rows);//remove conflicting keys in new data
		
						l = rows.length;
						while(--l > -1){
							x = pKIndex[rows[l][primaryKey]];
							if(typeof x !== 'undefined' && x.length > 0){
								rows.splice(l, 1);
								recentConflicts.concat(x);//the rows that the removed rows conflict with should be treated as having just been added
							}
						}
					}
					return this;					
				};
			// --- SETUP METHODS ---
				//adds data to the indexedData - if a search or sort was active then the new data will be acted on the same - (obj)opts {(bool)noSort: disable sort for new data, (bool)noSearch: disable search for new data}
				__constructor.prototype.addData = function(rows){
					//console.log('RemoteData@completeRequests: \n', 'rows:', rows, ' \n', 'this.sortParams.active:', this.sortParams.active);
					var data = this.data
						,masterData = data.master
						,newData = this.data.recent.new
						,row
						,i;

					//remove any new rows with an existing 'primary key'
					if(data.primaryKey){
						this.removePKConflicts(rows);
						//console.log('dataManager -> addData: \n', 'removing data repeats on primary key ('+data.primaryKey+') \n', 'results length: \n', Number(rows.length));
						if(rows.length === 0){ console.warn('all data added repeats on primary key'); return this; }
					}

					newData.clear();
					//add new data and index it
					this.indexRows(rows);
					if(this.sortParams.active !== true){
						while(row = rows.pop()){
							i = masterData.push(row) - 1;
							row._index_ = i;
							newData.push(row);
						}
					}
					else{
						this.sortNewData(rows);
						i = masterData.length;
						while(--i > -1){
							masterData.values[i]._index_ = i;
						}
						newData.concat(rows);
					}
					//console.log('RemoteData@completeRequests: \n', 'masterData:', masterData);
					
					return this;
				};
				//trigger 'update' event
				__constructor.prototype.update = function(){
					this.eventTriggers['update']();
				};
				//removes objects with values that repeat on field from (rows)dataSrc
				__constructor.prototype.removeRepeatsOnField = function(field, dataSrc){
					var indexed = {}, x = 0, l = dataSrc.length, value;
					for(x;x<l;x++){
						value = dataSrc[x][field];
						if(typeof indexed[value] !== 'undefined'){
							dataSrc.splice(x,1);
							x--;
						}
						indexed[value] = 1;
					}
				};
				//(element)par - element whose children will be used to generate 'rows' of data - plucks data like <node data-field='field'>value</node> => {field:value}
				__constructor.prototype.listParentToRows = function(par){
					var rows = [], children = par.children, l = children.length, x = 0;
					for(x;x<l;x++){
						rows.push(this.listItemToRow(children[x]));
					}
					return rows;
				};
				//convert an (element)rowElem into an object - plucks data like <node data-field='field'>value</node> => {field:value}
				__constructor.prototype.listItemToRow = function(rowElem){
					var fieldSrcs = rowElem.querySelectorAll('[data-field]'), m = fieldSrcs.length, n = 0, row = {}, fieldSrc;
					for(n=0;n<m;n++){
						fieldSrc = fieldSrcs[n];
						row[fieldSrc.getAttribute('data-field')] = spotter.getFirstTextNode(fieldSrc).nodeValue.trim();
					}
					return row;
				};
				//indexes all data for field and adds the index to the registered indexes
				__constructor.prototype.addIndex = function(field){
					var value
						, masterData = this.data.master
						, values = masterData.values
						, fieldIndex
						, arr
						, value
						, row
						, x
						, l;
	
					if(this.data.index[field] !== undefined){
						spotter.log('error', {func:'addIndex', msg:'field is already indexed', vars:{field:field}});
					}
					else{
						fieldIndex = this.data.index[field] = {};
						l = masterData.length;
						for(x=0;x<l;x++){
							row = values[x];
							value = "" + row[field];
							if(value.length === 0) value = "0";
							if(typeof fieldIndex[value] === 'undefined'){ 
								fieldIndex[value] = [row];
							}
							else{ 
								fieldIndex[value].push(row); 
							}
						}
					}
					return this;
				};
				//sets the primary key - running this after data has been added and indexed will cause duplicate data to be remove wherein only the row indexed first within the indexes will be kept
				//ie index[primary key field][value] = [1,4,5] the data @ indexes 4 & 5 will be removed
				__constructor.prototype.addPrimaryKey = function(field){
					if(field === this.data.primaryKey) return this;
					
					var aggregatedRows = []
						, masterIndex = this.data.index
						, i
						, r
						, value;
					
					if(this.data.primaryKey !== null) console.debug('primary key ('+this.data.primaryKey+') already registered which will now be set to '+field+' \n'+' this operation can be intensive due to removing duplicate data');
					
					this.data.primaryKey = field;
					if(typeof masterIndex[field] === 'undefined'){//not contains
						this.addIndex(field);
					}
					
					//if rows with duplicate primary key are found, delete those rows
					for(value in masterIndex[field]){//loop indexed values
						indexedValues = masterIndex[field][value];
						if(indexedValues.length > 1){
							r = indexedValues.shift();
							Array.prototype.concat.apply(aggregatedRows, indexedValues);
							masterIndex[field][value] = [r];
						}
					}
					
					if(aggregatedRows.length){
						this.removeData(aggregatedRows);
					}
					
					return this;
				};
				//deletes data by index but does not dereference the indexes. Dereferencing is done as the now null objects are discovered.
				__constructor.prototype.removeData = function(rows){
					var i
						, l = rows.length
						, masterData = this.data.master
						, masterIndex = this.data.index
						, row
						, indexedFields = Object.keys(masterIndex)
						, field
						, m = indexedFields.length
						, n;
					
					while(--l > -1){
						row = rows[l];
						delete masterData[row._index_];
						for(n=0;n<m;n++){
							field = indexedFields[n];
							i = masterIndex[field][row[field]].indexOf(row);
							valueIndex[i] = undefined;
						}
					}
				};
				//return list of objects from the main data source for array of indexes
				__constructor.prototype.getRowsByMasterIndexes = function(indexes){
					if(!Array.isArray(indexes)) indexes = [indexes];
					var results = [], l=indexes.length, x;
					for(x=0;x<l;x++){
						results.push(this.data.master[indexes[x]]);
					}
					return results;
				};				
			// --- DATA RETRIEVAL/MANIPULATION METHODS ---
				//retrieve of array of values for a given field
				__constructor.prototype.getValuesByField = function(field){
					if(this.data.index[field] !== undefined){	
						return Object.keys(this.data.index[field]);
					}
					else{
						console.log('search and sort is not indexed on field ('+field+')');
						var rows = [], masterData = this.data.master, values = masterData.values, l = masterData.length, x = 0, row, v;
						for(x;x<l;x++){
							row = values[x];
							if(typeof row === "object" && (v = row[field]) !== undefined) rows.push(v);
						}
						
						return rows;
					}
				};
				//overwrites records in master data where 'searchField' has value of 'findValue' with object - also triggers 'updateListings' event - will only overwrite first record if primary key is active
				__constructor.prototype.overwriteFieldForSearchResults = function(objNewData, searchField, findValue){
					var arr=[]
						, masterData = this.data.master
						, primaryKey = this.data.primaryKey
						, masterIndex = this.data.indexed
						, searchResults
						, newIndexes
						, value
						, l
						, i;
					
					//check if primary key is violated
					if(primaryKey !== null){
						if(!Array.empty(masterIndex[primaryKey][objNewData[primaryKey]])){
							console.debug('cannot use object to replace by field value because of conflicting key field values', objNewData);
							return false;
						}
					}
					
					searchResults = this.search.exact(searchField, findValue, masterData);
					console.log('overwritefieldofrsearchresults: \n', 'searchResults:', searchResults);
					//set master rows to null from search results then set the last index to be the same as the new row
					l = searchResults.length;
					while(--l > -1){
						row = searchResults[l];
						i = row._index_;
						masterData.values[i] = null;
					}
					masterData.values[i] = objNewData;
					objNewData._index_ = i;
					this.indexRows(masterData.values[i]);
			
					return this;
				};
				//change targField value to newValue where searchField has an exact value of findValue
				__constructor.prototype.setFieldByFieldValue = function(searchField, findValue, targField, newValue){
					var masterIndex = this.data.index;
					
					if(this.data.primaryKey === targField && masterIndex[targField][newValue] !== undefined && masterIndex[targField][newValue].length > 0){
						console.debug('the target field ('+targField+') is the same as the primary key and the value ('+newValue+') conflicts');
					}
					else{
						var targetData = this.search.exact(searchField, findValue), l = targetData.length;
						while(--l > -1){
							targetData[l][targField] = newValue;
						}
					}
					return this;
				};
				//send field and value to remove all value indexes and associated objects in master
				//Returns an array of the objects removed
				__constructor.prototype.deleteByField = function(findField, searchValues){
					var searchResults, masterData = this.data.master;
					
					searchResults = this.search.exact(findField, searchValues, masterData);
					this.removeData(searchResults);
	
					return searchResults;
				};
				__constructor.prototype.getCurrentResults = function(){
					if(this.search.active === true) return this.search.results;
					return this.data.master.values;
				};
			// --- SORT HELPERS ---
				__constructor.prototype.resetSort = function(){
					this.sortParams 	= {fields: null, directions: null, types: null, func: null, active: false};
					this.eventTriggers['sortReset']();
				};
				__constructor.prototype.completeSort = function(fields, types, directions, func){	
					var params = this.sortParams;
					
					params.active = true;
					params.fields = fields;
					params.directions = directions;
					params.types = types;
					params.func = func;
					
					console.log(this.data.master);
					this.eventTriggers['sort'](undefined, {sortFields:fields, sortTypes:types, sortDirections:directions});
				};
				//to use this do not insert the data into this.data.master, this function will insert the new data properly according to the current sort params
				__constructor.prototype.sortNewData = function(newData){
					this.data.master.insertSort(newData, this.sortParams.func);
					console.log('sortNewData:', this.data.master);
					this.completeSort();
				};
				__constructor.prototype.repeatSort = function(){
					this.data.master.mergeSort(this.sortParams.func);
					this.completeSort();
				};
			// --- SORT METHODS ---
				//If no arguments are sent then sort by relevance of last search. 
				__constructor.prototype.sort = function(sortFields, sortTypes, sortDirections){
					var targetData = this.search.results.length ? this.search.results : this.data.master;
					
					console.debug('DataManager.sort -> arguments:',arguments);
					if(typeof sortFields === 'string'){
						sortFields = [sortFields];
						sortTypes = [sortTypes || 'alphanumeric'];
						sortDirections = [sortDirections || 1];
					}
					else if(Array.empty(sortFields)){
						if(this.search.active === false){ console.debug('a sort field is required if a search is not active'); return false; }
						sortFields = [this.search.history.fields.last()];
						sortTypes = ['relevance'];
						sortDirections = [1];
					}
					else{
						if(Array.empty(sortTypes)){
							sortTypes = [];
							if(typeof sortTypes === 'string') sortTypes.forEach(function(){sortTypes.push('alphanumeric');});
						}
						if(Array.empty(sortDirections)){
							sortDirections = [];
							if(typeof sortDirections === 'string') sortDirections.forEach(function(){sortDirections.push(1);});
						}
					}
					
					var field, direction, func, completeSortFunc, indexFunc;
					
					if(sortFields.length === 1){
						field = sortFields[0];
						direction = sortDirections[0];
						func = this.sortFuncs(sortTypes[0]);
						completeSortFunc = function(a,b){ return direction * func(a[field], b[field]); };
					}
					else{
						field = sortFields.shift();
						direction = sortDirections.shift();
						func = __constructor.sortBy(sortTypes.shift(), field, direction);
						sortFields.forEach(function(f, i){
							func = func.thenBy(sortTypes[i] || 'alphanumeric', sortFields[i], sortDirections[i] || 1);
						});
						completeSortFunc = func;
					}
					//indexFunc = (function(i){ return function(v){ return v[i]; }; }(sortFields[0]));
					console.log('completeSortFunc:',completeSortFunc, ' \n', 'func:',func, ' \n', 'direction:',direction, ' \n', 'targetData:', targetData);
					targetData.mergeSort(completeSortFunc);
					//targetData.sort(completeSortFunc);
					this.completeSort(sortFields, sortTypes, sortDirections, completeSortFunc);
					return this;
				};
				//returns a multi sortable function. If only sorting on one field, then just call the function from ...this.sortFuncs([function name]) and do not call this
				__constructor.prototype.sortBy = function(){
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
						func 		= typeof func === 'string' ? this.sortFuncs(func) : func;
						field 		= field || null;
						extraParams	= extraParams || null;
						sortOrder	= this.parameterizeSortDirection(sortOrder);
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
				};
			// --- GENERAL METHODS ---
				//deletes all the current data
				__constructor.prototype.resetData = function(){
					var data = this.data;
					data.master.clear();
					data.recent.new.clear();
					data.recent.conflicts.clear();
					this.search.reset();

					this.eventTriggers['resetData']();
					return this;
				};
				//run search and sort operations on the existing data
				__constructor.prototype.repeatLastSearchAndSort = function(){
					if(this.search.active === true){
						this.repeatSearches();
					}
					
					if(this.sortParams.active === true){
						this.repeatSort();
					}
					return this;
				};
				//In cases where data passed instead of being generated by DataManager, if the data is to be associated with a node element, run this to create that association.
				//This way 'searchandsortready' event captures know if the event trigger is the one they are waiting.
				//Generally addEventListener('searchandsortready', function(e){ if(e.content.srcNode = [target node]){ do something... 
				__constructor.prototype.setSourceNode = function(elem){
					spotter.events.appendTo({srcNode:elem}, __factory.readyEvent);
					__factory.registeredNodes[this.registeredInstancesIndex] = elem;
					//console.debug('setSourceNode',__factory.registeredNodes.indexOf(elem));
					//console.debug('setSourceNode',spotter.DataManager.getObjectFor(elem));
					spotter.events.fire(__factory.readyEvent);
				};
			// ** HELPERS **
				//helper - get a single object from a single element
				__constructor.prototype.createDataObjectFromNode = function(node){
					var newObject = {}, searchableNodes = node.querySelectorAll('[data-field]'), l = searchableNodes.length;
					while(--l > -1){
						newObject[searchableNodes[l].getAttribute('data-field')] = spotter.getFirstTextNode(searchableNodes[l]).nodeValue.trim();
					}
					newObject._node_ = node;
					node.DataManager = newObject;
					return newObject;
				};
				//common sort functions. Send string name of function to get the function back
				__constructor.prototype.sortFuncs = (function(){
					//alpha, numeric, alphanumeric, relevance
					var __sortFuncs = {}
						, __self = function(str){
							if(typeof __sortFuncs[str.toLowerCase()] === 'function') return __sortFuncs[str];
							spotter.consoleError('sort function unknown ('+str+')', '', 'major');
						};
						
					__sortFuncs.alpha = function(a, b){
						a = ("" + a).toLowerCase();
						b = ("" + b).toLowerCase();
						//console.log('comparing '+a+' and '+b+' \n', 'result:', (a === b) ? 0 : (a < b) ? -1 : 1);
						return (a === b) ? 0 : (a < b) ? -1 : 1;
					};
							
					__sortFuncs.numeric = function(a, b){
						a = a - 0;
						b = b - 0;
						return a - b;
					};
							
					__sortFuncs.alphanumeric = function(a, b){
						var aT,bT;
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
						a = ("" + a).toLowerCase();
						b = ("" + b).toLowerCase();
						if(a === b){  return 0; }
						a = a.indexOf(query);
						b = b.indexOf(query);
						if( a === -1) return 1;
						if( b === -1) return -1;
						return a - b;
					};
							
					return __self;
				}());
				__constructor.prototype.parameterizeSortDirection = function(str){
					if(typeof str === 'number') return str - 0;
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
		// *** PUBLIC STATIC METHODS ***
			//if an object has been created for an elem/node this will return that object, otherwise it will return false
			__constructor.getObjectFor = function(node){
				var i = __factory.registeredNodes.indexOf(node);
				if(i === -1) return false;
				return __factory.registeredInstances[i];
			};
		
		return __constructor;
	}());
// } -- END DATA MANAGER --
	
// -- REMOTE DATA MANAGER -- {
	//remote data manager maintains pagination params when pulling data from a remote source
	
	//(object)opts - {(string)URL, (optional:string)name, (optional:string)idField, (optional:integer)pageLimit, (optional:totalLimit)totalLimit}
	//RemoteData.getData=>(onresponse event)(this.parseResponse(response))RemoteData.onResponse=>RemoteData.completeRequests
	spotter.RemoteData = function(opts){
		//console.debug('opts:',JSON.stringify(opts));
		//parameters
		if(typeof opts.URL !== "string"){ console.debug('a url is required to setup a remote data manager'); return false; }
		if(typeof opts.name !== "string"){ opts.name = spotter.makeId(); }
		if(typeof opts.idField !== "string"){ console.debug("an id field was not setup for remote data manager - setting an id field is recommended"); }
		if(typeof opts.pageLimit !== "number"){ opts.pageLimit = -1; }//limit results per request
		if(typeof opts.totalLimit !== "number"){ opts.totalLimit = -1; }//total number of results before requests are blocked
		
		window.spotter.DataManager.call(this, [], opts.indexedFields, opts.idField);
		
		this.name = opts.name;//used to refer to a RemoteData instance
		this.idField = opts.idField || null;//primary key for data
		this.queryParams = {};
		this.defaultParams = {};
		this.setURL(opts.URL);//default URL - query params will be split off and added to this.queryParams

		// -- data --
			this.dataReady = spotter.events('dataReady');
		// -- request handling --
			this.setParseResponse(function(R){ R=JSON.parse(R); return R; });//default parse function assumes responses are in JSON form {status:(string},result:(rows)}
			this.requestsQueue = [];//queue line for requests each having form: {response:obj, status:[complete|pending]} where [0]->oldest request....[n]->newest request
			this.error = function(res){ console.warn('the following error occurred receiving remote data \n', 'result: \n', res); };
		// -- pagination --		
			this.currentPage = 0;
			this.pageLimit = opts.pageLimit;
			this.totalLimit= opts.totalLimit;
			this.setPaginationParams({offsetParam:'offset', limitParam:'limit'});
			this.setTrackPagination();
			this.resetPagination();
		// -- events --
			this.events = {
				emptyResult: spotter.events.setEventTrigger(this, 'emptyResult'),
				limitReached: spotter.events.setEventTrigger(this, 'limitReached'),
				resultsComplete: spotter.events.setEventTrigger(this, 'resultsComplete')
			};
	};
	// -- data methods --
		spotter.RemoteData.prototype.setURL = function(URL){
			URL = URL.split('?');
			if(URL.length > 1){
				var params = URL[1].split('&'), x = 0, l = params.length, param;
				for(x;x<l;x++){
					param = params[x].split('=');
					this.queryParams[param[0]] = param[1];
					this.defaultParams[param[0]] = param[1];
				}
			}
			this.URL = URL[0];
			return this;
		};
		//(obj)paramsObj - object like {paramName: value...}
		spotter.RemoteData.prototype.setParams = function(paramsObj){
			var prop;
			for(prop in paramsObj){
				this.queryParams[prop] = paramsObj[prop];
			}
			return this;
		};
		//(array)paramsArr - array of parameter names to remove from the request
		spotter.RemoteData.prototype.removeParams = function(paramsArr){
			var l = paramsArr.length;
			while(--l > -1){
				delete this.queryParams[paramsArr[l]];
			}
		}
		spotter.RemoteData.prototype.resetParams = function(){
			this.queryParams = {};
			for(var prop in this.defaultParams){
				this.queryParams[prop] = this.defaultParams[prop];
			}
		};
		//requests 'complete' in order - use a kill/reset command to avoid this - this function attempts to 'complete' all requests in order
		spotter.RemoteData.prototype.completeRequests = function(){
			var requestInfo
				,response
				,recent = this.data.recent
				,x = 0
				,l = this.requestsQueue.length
				,completed = 0;//running tally of completed requests

			//console.log('RemoteData@completeRequests: \n \n', 'stack:', spotter.log.stackDump(new Error().stack), ' \n', ' \n', 'requestsQueue length:', this.requestsQueue.length, ' \n', ' \n', 'requestsQueue: \n', JSON.parse(JSON.stringify(this.requestsQueue)), ' \n -----------------------------');
			for(x;x<l && (requestInfo = this.requestsQueue[x]);x++){
				//console.log('RemoteData@completeRequests: \n', 'request status: ', requestInfo.status, ' \n', 'complete request?',(!!((x === completed || requestInfo.ignoreQueue === true) && requestInfo.status === 'received')?'yes':'no'), ' \n','response results length:',requestInfo.response.result.length);
				if((x === completed || requestInfo.ignoreQueue === true) && requestInfo.status === 'received'){
					response = requestInfo.response;
					//console.log('RemoteData@completeRequests: \n', 'requestInfo.response:', requestInfo.response);
					if(response.status === 'success'){
						this.addData(response.result);
						//console.log('RemoteData@completeRequests: \n', 'master data after addData: \n', this.data.master, ' \n', 'this.data.recent() length:', Number(recent.new.length + recent.conflicts.length));
						this.trackDataLimits();//if over totalLimit, will automatically remove excess rows that were added (stored in this.data.recent.new) and stop new requests
						//console.log('RemoteData -> completeRequests: \n', 'master data after trackDataLimits: \n', this.data.master, ' \n', 'this.data.recent() length:', Number(recent.new.length + recent.conflicts.length), ' \n', 'currentRequest: ', requestInfo);
						//console.log('RemoteData@completeRequests: \n', 'recent: \n', this.data.recent());
						if(requestInfo.callBack) requestInfo.callBack(this.data.recent());
					}
					completed++;
					requestInfo.status = 'completed';
				}
				else if(requestInfo.status === 'completed'){
					completed++;
				}
			}
			//console.log('RemoteData@completeRequests (After complete): \n', 'requestsQueue length:', this.requestsQueue.length, ' \n', 'requestsQueue: \n', JSON.stringify(this.requestsQueue));
		};
		//set request response as received - fires request complete which will fully complete the request if prior requests are complete - if the response from 'parseResponse' has status === 'error' then request complete will not fire for this response
		spotter.RemoteData.prototype.onResponse = function(requestInfo, response){
			response = this.parseResponse(response, this);
			//console.log('RemoteData@onResponse: \n', 'response after parse: \n', JSON.parse(JSON.stringify(response)));
			requestInfo.response = response;
			requestInfo.status = 'received';
			this.completeRequests(response);
		};
		//(bool)completeOnResponse - true if callBack will be executed as soon as request is received instead of waiting on previous requests to complete
		spotter.RemoteData.prototype.getData = function(callBack, completeOnResponse){
			if(this.preventRequests === true){ console.debug(this.stopRequests.why); return; }
			//console.log('RemoteData@getData (before): \n', 'requestsQueue: \n', JSON.parse(JSON.stringify(this.requestsQueue)));
			var i = this.requestsQueue.push({response:null, status:'pending', callBack:callBack, request:null, ignoreQueue:completeOnResponse}) - 1, req;
			this.requestsQueue[i].request = req = spotter.ajax({
				url: this.URL,
				data: this.queryParams,
				method: "POST",
				success: this.onResponse.bind(this, this.requestsQueue[i]),
				error: this.error
			});
			//console.log('RemoteData@getData (after): \n', 'requestsQueue: \n', JSON.parse(JSON.stringify(this.requestsQueue)));
			this.requestsQueue[i].index = i;
			this.trackPagination();
			return req;
		};			
	// -- kill methods --	
		//kill all current requests and set pagination back to 0
		spotter.RemoteData.prototype.reset = function(){
			//console.log('reset', new Error().stack);
			this.currentPage = 0;
			this.cancelCurrentRequests();
			this.resetPagination();
		};
		//kill all current requests and prevent future requests
		spotter.RemoteData.prototype.stopRequests = function(msg){
			this.preventRequests = true;
			this.cancelCurrentRequests();
			this.stopRequests.why = msg;
		};
		//kill all current requests
		spotter.RemoteData.prototype.cancelCurrentRequests = function(){
			var R;
			while(R = this.requestsQueue.pop()){
				R.request.kill();
			}
		};
	// -- setup methods --
		//the response must end up in the format {status:(string)[success|error], result:(array)[data]} - use this to set a function that will parse the response correctly to create this format F(response) => 'correct format'
		spotter.RemoteData.prototype.setParseResponse = function(func){
			if(typeof func !== 'function'){ console.debug('parse response must be set to a function, '+typeof func+' was given'); return false; }
			this.parseResponse = func;
			return this;
		};
		//change the parameter names for the offset and limit query params used to track pagination
		spotter.RemoteData.prototype.setPaginationParams = function(opts){
			if(opts.offsetParam !== undefined){
				if(this.queryParams[this.offsetParam] !== undefined){
					this.queryParams[opts.offsetParam] = this.queryParams[this.offsetParam];
					delete this.queryParams[this.offsetParam];
				}
				this.offsetParam = opts.offsetParam;
			}
			if(opts.limitParam !== undefined){
				if(this.queryParams[this.limitParam] !== undefined){ 
					this.queryParams[opts.limitParam] = this.queryParams[this.limitParam];
					delete this.queryParams[this.limitParam];
				}
				this.limitParam = opts.limitParam;
			}
		};	
		//calling this method will set the offset and cache the previous value
		spotter.RemoteData.prototype.resetOffset = function(){
			this.cachedOffset = this.queryParams[this.offsetParam];
			this.queryParams[this.offsetParam] = 0;
		};
		//restore the previous offset that would have been set by calling resetOffset
		spotter.RemoteData.prototype.restoreOffset = function(){
			this.queryParams[this.offsetParam] = this.cachedOffset;
		};
	// ** STATIC **
		spotter.RemoteData.prototype.limitReachedMessage = 'total limit reached for remote request manager';
		spotter.RemoteData.prototype.noMoreResultsMessage = 'no more results for request';
	// ** FACTORY METHODS **
		//factory method to build pagination methods
		spotter.RemoteData.prototype.setTrackPagination = function(){
			//spotter.log("debug", {func:"setTrackPagination", vars:{pageLimit:this.pageLimit, totalLimit:this.totalLimit, URL:this.URL, params:JSON.stringify(this.queryParams), stack:spotter.log.stackDump(new Error().stack)}});
			//setup resetPagination, trackPagination & trackDataLimits - trackPagination is run after every request is created - trackDataLimits is run after the data is received
			var pageLimit = this.pageLimit || -1
				,totalLimit = this.totalLimit || -1;
				
			if(!~pageLimit && totalLimit > 0){//limit only total results but get all available per request
				this.resetPagination = function(){
					this.queryParams[this.limitParam] = this.totalLimit;
					this.queryParams[this.offsetParam] = '0';
				};
				this.trackPagination = function(){};
				this.trackDataLimits = function(newData){
					var dataLength = this.data.master.length
						,diff = dataLength - this.totalLimit;
					
					if(diff > 0){
						this.stopRequests(this.limitReachedMessage);
						this.removeObjs(this.data.recent.new);
						this.eventTriggers[this.events.limitReached]();
					}
					else{
						this.queryParams[this.limitParam] = this.totalLimit - dataLength;
					}
				};
			}
			else if(pageLimit > 0 && !~totalLimit){//total results unlimited, limit results per request
				this.resetPagination = function(){
					this.queryParams[this.limitParam] = this.pageLimit;
					this.queryParams[this.offsetParam] = '0';
				};
				this.trackPagination = function(){
					this.currentPage++;
					this.queryParams[this.offsetParam] = this.currentPage * this.pageLimit;
				};
				this.trackDataLimits = function(){
					var recent = this.data.recent
						,newDataLength = recent.new.length + recent.conflicts.length
						,diff = newDataLength - this.pageLimit;

					if(diff > 0){
						console.debug('request responses exceed the requested limit - check server handling or change limit param to avoid unnecessary overhead');
						this.removeObjs(recent.new.slice(0-(diff))); 
					}
					else if(diff < 0){
						this.stopRequests(this.noMoreResultsMessage);
						this.eventTriggers[this.events.resultsComplete]();
						return;
					}
				};
			}
			else if(pageLimit > 0 && totalLimit > 0){//limit total number of results and results per request
				this.resetPagination = function(){
					this.queryParams[this.limitParam] = Math.min(this.pageLimit, this.totalLimit);
					this.queryParams[this.offsetParam] = '0';
				};
				this.trackPagination = function(){	
					this.currentPage++;
					this.queryParams[this.offsetParam] = this.currentPage * this.pageLimit;
				};
				this.trackDataLimits = function(){
					var recent = this.data.recent
						,newDataLength = recent.new.length + recent.conflicts.length
						,diff = newDataLength - this.pageLimit;

					if(diff > 0){
						console.debug('request responses exceed the requested limit - check server handling or change limit param to avoid unnecessary overhead');
						this.removeObjs(recent.new.slice(0-(diff))); 
					}
					else if(diff < 0){
						this.stopRequests(this.noMoreResultsMessage);
						this.eventTriggers[this.events.resultsComplete]();
						return;
					}
					
					
					var dataLength = this.data.master.length
						,diff = dataLength - this.totalLimit;
					
					if(diff > 0){
						this.stopRequests(this.limitReachedMessage);
						this.removeObjs(this.data.recent.new);
						this.eventTriggers[this.events.limitReached]();
					}
					else{
						this.queryParams[this.limitParam] = this.totalLimit - dataLength;
					}

					this.queryParams[this.limitParam] = Math.min(pageLimit, totalLimit - dataLength);
				};
			}
			else{//if(!pageLimit && !totalLimit) no limit for total results or number of results received per request
				this.resetPagination = function(){
					this.queryParams[this.limitParam] = -1;
					this.queryParams[this.offsetParam] = -1;
				};
				this.trackPagination = function(){};
				this.trackDataLimits = function(){};
			}
		};
	// ** EXTEND **
		spotter.extend(spotter.RemoteData, spotter.DataManager);
// } -- END REMOTE DATA MANAGER --

//window.spotter.FormDataManager = function(){};
//window.spotter.extend(spotter.FormDataManager, spotter.DataManager);

console.log('data manager loaded');