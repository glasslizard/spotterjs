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
	
	// *** SEARCH PROTOTYPE ***
		function spotterSearchAndSortSearch(__parent){
			this.parent = __parent;
			this.reset();
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
				this.results = results;
				this.parent.eventTriggers['search'](undefined, {source:this, results:this.results});
			};
			spotterSearchAndSortSearch.prototype.reset = function(){
				this.results = null;
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
				if(typeof findValues === 'string') findValues = findValues.split(',');
				
				var results = []
					, l = dataSrc.length
					, fVal = findValues.length
					, row
					, x
					, r;
	
				while(--l > -1){//loop data
					row = dataSrc[l];
					value = row[searchField];
					r = false;
					for(x = 0; x < fVal && !r; x++){//loop find values
						if(r = (findValues[x] === value)) results.push(row);
					}
				}
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
	
				while(--l > -1){//loop data
					row = dataSrc[l];
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

				while(--l > -1){//loop data
					row = dataSrc[l];
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
				
				var results = []
					, fVal = findValues.length
					, fieldIndex = this.parent.data.index[searchField]
					, values = Object.keys(fieldIndex)
					, value
					, l = values.length
					, x
					, r;
	
				while(--l > -1){//loop index values
					value = values[l];
					r = false;
					for(x = 0; x < fVal && !r; x++){//loop find values
						if(r = (findValues[x] === value)) Array.prototype.push.apply(results, fieldIndex[value]);
					}
				}
				results.unique();
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
				if(!Array.isArray(searchFields)) searchFields = [searchFields];
				flags = flags || [];

				var l = searchFields.length
					, x = 0
					, field
					, value
					, dataSrc
					, isMaster = ~flags.indexOf('master')
					, aggregatedResults = [];
					
				if(isMaster || !this.active){ dataSrc = this.parent.data.master; }
				else{ dataSrc = this.results; }

				for(x;x<l;x++){//loop search fields
					field = searchFields[x];
					value = searchTerms[x] || value;//use last valid value if not enough values sent
					
					Array.prototype.push.apply(aggregatedResults, this[comparisonType](field, value, dataSrc, flags));
				}
				aggregatedResults.unique();

				if(isMaster){ this.results.mergeDistinct(aggregatedResults); }
				else{ this.results = aggregatedResults; }
				
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
				
				if(isMaster){ this.results.mergeDistinct(aggregatedResults); }
				else{ this.results = aggregatedResults; }
				
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
			spotterSearchAndSortSearch.prototype.setRecentAsSearchResults = function(){
				this.results = this.parent.data.recent;
				return this.parent;
			};
			spotterSearchAndSortSearch.prototype.addRecentToSearchResults = function(){
				Array.prototype.push.apply(this.results, this.parent.data.recent);
				return this.parent;
			};
	
	// *** CONSTRUCTOR PROTOTYPE ***
	
		//arrayOfObjectsOrElems: data to add - arrIndexes(optional): array of fields that should be indexed - idfield(optional): field that should be unique
		var __constructor = function(arrayOfObjectsOrElems, arrIndexes, idField){
			
			spotter.requiredParam(arrayOfObjectsOrElems).DOMList().element().array().result()();
			
			var i;
			
			arrayOfObjectsOrElems 	= arrayOfObjectsOrElems || [];
			arrIndexes 				= arrIndexes || [];
			idField 				= idField || null;
			
			this.registeredInstancesIndex = __factory.registeredInstances.push(this) - 1;
			this.data = {
				master:[],
				recent:[],
				index:{},
				primaryKey: idField
			};//the primary data
			
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
			
			if(arrayOfObjectsOrElems.length) this.addData(arrayOfObjectsOrElems);
			if(spotter.isType.element(arrayOfObjectsOrElems)) this.setSourceNode(arrayOfObjectsOrElems);
		};
		
		// --- DATA MANAGEMENT HELPERS ---
			//arguments should share the relationship: this.data.master[indexes[N]] = rows[N]
			__constructor.prototype.indexRows = function(rows){
				var data = this.data
					, masterIndex = data.index
					, indexedFields = Object.keys(masterIndex)
					, l = rows.length
					, x = 0
					, row
					, i = indexedFields.length
					, field
					, value;

				if(rows !== null && !Array.isArray(rows)){
					rows = [rows];
				}

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
					if(indexes !== 'undefined') rows = this.getDataObjectsByIndexes(indexes); 
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
			};
		
		// --- SETUP METHODS ---
			//adds data to the indexedData - if a search or sort was active then the new data will be acted on the same
			//(obj)opts {(bool)noSort: disable sort for new data, (bool)noSearch: disable search for new data}
			__constructor.prototype.addData = function(rows, opts){
				opts = opts || {};
				
				var newIndexes = []
					, l = rows.length
					, data = this.data
					, masterData = data.master
					, masterIndex = data.index
					, primaryKey = data.primaryKey
					, s
					, object
					, field
					, fieldValue
					, pKIndex
					, row
					, x
					, m
					, i;

				data.recent = [];
		
				//remove any new data with an existing 'primary key'
				if(primaryKey !== null && (pKIndex = masterIndex[primaryKey])){
					l = rows.length;
					while(--l > -1){
						x = pKIndex[rows[l][primaryKey]];
						if(typeof x !== 'undefined' && x.length > 0){
							rows.splice(l, 1);
							Array.prototype.push.apply(data.recent, x);
						}
					}
				}
				if(rows.length === 0){ spotter.log('error', {func:'add data', msg: 'All data added repeats on primary key', vars:{key:primaryKey, data:data.recent}}); return; }
				
				//add new data and index it
				this.indexRows(rows);
				while(row = newData.pop()){
					i = masterData.push(row) - 1;
					row.__index__ = i;
					data.recent.push(row);
				}
				
				if(opts.search === true) this.search.repeat();
				if(opts.sort === true) this.repeatSort();

				this.eventTriggers['update']();
				return this;
			};
			//(element)par - element whose children will be used to generate 'rows' of data - plucks data like <node data-field='field'>value</node> => {field:value}
			__constructor.prototype.listParentToRows = function(par){
				var rows = [], children = par.children, l = children.length, child, x = 0, m, n, row, fieldSrc, fieldSrc;
				for(x;x<l;x++){
					row = {};
					child = children[x];
					fieldSrcs = child.querySelectorAll('[data-field']);
					m = fieldSrcs.length;
					for(n=0;n<m;n++){
						fieldSrc = fieldSrcs[n];
						row[fieldSrc.getAttribute('data-field')] = spotter.getFirstTextNode(fieldSrc[n]).nodeValue.trim();
					}
					row._node_ = node;
					rows.push(row);
				}
				return rows;
			};
			//indexes all data for field and adds the index to the registered indexes
			__constructor.prototype.addIndex = function(field){
				var value
					, masterData = this.data.master
					, fieldIndex
					, arr
					, value
					, row
					, l;

				if(this.data.index[field] !== undefined){
					spotter.log('error', {func:'addIndex', msg:'field is already indexed', vars:{field:field}});
				}
				else{
					fieldIndex = this.data.index[field] = {};
					l = masterData.length;
					while(--l > -1){
						row = masterData[l];
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
					, indexedFields = Object.keys(masterIndex);
				
				while(--l > -1){
					row = rows[l];
					delete masterData[row.__index__];
					indexedFields.forEach(function(field){
						var valueIndex = masterIndex[field][row[field]]
							, i = valueIndex.indexOf(row);
						
						valueIndex.splice(i, 1);
					});
				}
			};
			//return list of objects from the main data source for array of indexes
			__constructor.prototype.getDataObjectsByIndexes = function(indexes){
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
					var values = [], masterData = this.data.master, l = masterData.length, x = 0, row;
					for(x;x<l;x++){
						row = masterData[x];
						if(row[field] !== undefined) values.push(row[field]);
					}
					
					return values;
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
				
				searchResults = this.search.exact(searchField, findValue, masterIndex);
				
				//set master rows to null from search results then set the last index to be the same as the new row
				l = searchResults.length;
				while(--l > -1){
					row = searchResults[l];
					i = row.__index__;
					masterData[i] = null;
				}
				masterData[i] = objNewData;
				objNewData.__index__ = i;
				this.indexRows(masterData[i]);
		
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
			__constructor.prototype.deleteByField = function(findField, searchValue){
				var searchResults, masterData = this.data.master;
				
				searchResults = this.exact(searchField, searchValues, masterData);
				this.removeData(searchResults);

				return searchResults;
			};
			__constructor.prototype.getCurrentResults = function(){
				if(this.search.active === true) return this.search.results;
				return this.data.master;
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
			//to use this, do not insert the data into this.data.master, this function will insert the new data properly according to the current sort params
			__constructor.prototype.sortNewData = function(newData){
				this.data.master.insertSort(newData, this.sortParams.func);
			};
			__constructor.prototype.repeatSort = function(){
				this.data.master.mergeSort(this.sortParams.func);
			};
			
		// --- SORT METHODS ---
			//If no arguments are sent then sort by relevance of last search. 
			__constructor.prototype.sort = function(sortFields, sortTypes, sortDirections){
				var targetData = this.search.results || this.data.master;
				
				console.debug('searchAndSort.sort -> arguments:',arguments);
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
				console.log('completeSortFunc:',completeSortFunc,'func:',func,'direction:',direction);
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
				this.data = {
					master:[],
					recent:[],
					index:{},
					primaryKey: this.data.primaryKey
				};//the primary data;
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
			//In cases where data passed instead of being generated by searchandsort, if the data is to be associated with a node element, run this to create that association.
			//This way 'searchandsortready' event captures know if the event trigger is the one they are waiting.
			//Generally addEventListener('searchandsortready', function(e){ if(e.content.srcNode = [target node]){ do something... 
			__constructor.prototype.setSourceNode = function(elem){
				spotter.events.appendTo({srcNode:elem}, __factory.readyEvent);
				__factory.registeredNodes[this.registeredInstancesIndex] = elem;
				//console.debug('setSourceNode',__factory.registeredNodes.indexOf(elem));
				//console.debug('setSourceNode',spotter.searchAndSort.getObjectFor(elem));
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
				node.searchAndSort = newObject;
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

window.spotter.dataManager
window.spotter.formDataManager
window.spotter.remoteDataManager = spotter.extend(spotter.RemoteData, spotter.searchAndSort);

console.log('search and sort loaded');