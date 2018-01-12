	console.log("using form");
	
	//create a new instance with "var validator = spotter.form(frmElement, (opt)ajax funcs, (opt)error msg box element)"
	//validations are automatically setup according to the data attributes on the individual elements.
	//(opt)ajaxFuncs={complete:func,success:func,error:func} if ajaxFuncs=func it will be assumed to be the 'complete' function only
	//(args)ajaxFunc(ajaxResponse, requestData, sourceFrm) - context(this) will be the ajaxEvent
	//Form needs to have an element with 'data-validation-messages' attribute to receive messages (set to display:none to not use), element created if doesnt exist
	//(attr)(opt)data-validation-name="string" to send a custom name in the error messages
	//(attr)(opt)data-ajax-waiting="nodeId" - id of element to treat as waiting screen - will use spotter.toggle.show/hide to control visibility
	//(attr)(opt)data-ajax-sync="bool" - ajax is sync or async - default false
	//*Does not validate inputs w/o (attr)name
	//-- methods --
	//this.validate() == true/false to check if the form is validated.
	//-- input attributes --
	//(attr)data-validate-name="(string)" - set a custom name for input when error displayed to user
	//(attr)data-validate="(string)pattern" - pattern: 'between (int)N-(int)M' - (str)[alpha, numeric, alphanumeric, personName, streetaddress, phone, phoneint, day, zipcodedom, zipcodeint, country, email, password, between] || regex_pattern - matches preset or pattern, allows empty
	//(attr)data-validate-onchange - analog of 'data-validate' except check is only performed on change
	//(attr)(opt)data-required - input cannot be empty
	//(attr)(opt)data-max-length="(int)" - maximum length of input value
	//(attr)(opt)data-min-length="(int)" - minimum length of input value
	//(attr)(opt)data-matching="(string)groupName" - test that all inputs with the same value of this attribute (aside from null) have matching values
	//(attr)(opt)data-group-required="(string)groupName" - test that at least one member of the group has a non empty value
	//(attr)(opt)data-group-exclusive="(string)groupName" - test that one or less members of the group has a non empty value
	// -- arguments --
	//(elem)frm - the form to attach validator
	//(object)ajaxFuncs - functions to run for ajax request submitted via form - {success,error,complete}
	//(array[functions] - functions that run only once for form when validating entire form - functions have form:
		//function validationFunc(input, form){
			//var msg = (string)message to user on fail;
			//...
			//return [true|msg];
		//} - return true if validation succeeds and msg if validation fails
	spotter.form = (function(){
		window.validationCount = 0;
		window.validationResults = [];
		var __factory = {}
			, __self = function(frm, ajaxFuncs, errorMsgTarget, frmLvlVal){ return (frm.validator = new __constructor(frm, ajaxFuncs, errorMsgTarget, frmLvlVal)); }
			, __registeredForms = []
			, __constructor = function(frm, ajaxFuncs, errorMsgTarget, frmLvlValFuncs){
				//verify arguments
				if(~__registeredForms.indexOf(frm)){ console.error('form already registered in spotter.form', frm, new Error().stack); return false; }
				if((typeof frm === 'string' && !(frm = document.getElementById(frm))) || frm.tagName !== 'FORM'){ console.error('form passed as argument is not defined, not a form, or could not be found',frm); return false; }
				if(ajaxFuncs
					&& !(typeof ajaxFuncs.complete === 'function'
						|| typeof ajaxFuncs.success === 'function'
						|| typeof ajaxFuncs.error === 'function'
					)
				){
					if(typeof ajaxFuncs === 'function'){
						ajaxFuncs = {complete: ajaxFuncs};
					}
					else{	
						console.warn('argument ajaxFuncs for spotter form is not of the correct form', frm, ajaxFuncs, new Error().stack); return false; 
					}
				}
				
				//search 'VIEW setupAjaxSubmit' to see the arguments passed to ajaxFuncs
				if(frm.hasAttribute("data-ajax-submit")) spotter.form.setupAjaxSubmit(frm, ajaxFuncs);
				__registeredForms.push(frm);
				//console.debug(frm.id, new Error().stack);
				
				var spotterRef = spotter.form.validate
					, type
					, elems
					, l
					, input
					, pattern 
					, current;
				
				this.inpLvlValFuncs = [];
				this.valOnCreateFuncs = [];
				this.groupValFuncs = [];
				
				if(spotter.isType.element(errorMsgTarget)){
					this.messageBox = errorMsgTarget;
				}
				else if((this.messageBox = frm.querySelector("[data-validation-messages]")) === null){
					this.messageBox = document.createElement('DIV');
					this.messageBox.setAttribute('data-validation-messages', 'created by spotter forms');
					frm.appendChild(this.messageBox);
				}
				spotter.toggle.class.add(this.messageBox, 'hide');
				this.messageBox.show = (function(frmLvlVal){
					return function(){
						if(frmLvlVal.validate.status !== 1) spotter.toggle.class.remove(frmLvlVal.messageBox, "hide");
					};
				}(this));
				this.messageBox.hide = (function(frmLvlVal){
					return function(){
						//console.log('form messagebox hide: parent validation level:',frmLvlVal.validate.status);
						if(frmLvlVal.validate.status === 1) spotter.toggle.class.add(frmLvlVal.messageBox, "hide");
					};
				}(this));

				if(frmLvlValFuncs){
					var msgBox;
					if(typeof frmLvlValFuncs === "function") frmLvlValFuncs = [frmLvlValFuncs];
					for(var x = 0, testFunc; testFunc = frmLvlValFuncs[x]; x++){
						if(typeof testFunc === "function"){
							testFunc.msgBox = (msgBox=document.createElement('DIV'));
							msgBox.className = "hide";
							this.messageBox.appendChild(msgBox);
							
							msgBox.show = function(msg){
								spotter.setFirstTextNode(this, msg);
								spotter.toggle.show(msgBox);
							};
							msgBox.hide = function(msg){
								spotter.toggle.hide(msgBox);
							};
							
							testFunc.status = 1;
						}
						else{
							console.warn("custom form validation functions must all be functions", ' \n', frm, ' \n', testFunc);
						}
					}
				}
				else{
					frmLvlValFuncs = [];
				}
				this.frmLvlValFuncs = frmLvlValFuncs;
				
				//use primes to check which validations have failed to prevent events from stepping on one another
				//a new instance of isValid is created for each input to track it individually
				//use the class level to check form overall validity (isValid.valid)
				//accepts the following data-attributes:
					//data-validate=pattern OR a preset (alpha,numeric,alphanumeric,streetaddress,phone,phoneint (international),zipcodedom (US),zipcodeint (international),country,email)
					//data-validate-onchange=pattern OR a preset. Same as above except will validate with change event instead of input
					//data-required - Doesnt need a value. Onchange, checks if data is blank.
					//data-min-length=intMinLength. Onchange checks if data length is under intMinLength.
					//data-max-length=intMaxLength. Onchange checks if data length is under intMaxLength.
					//data-matching=groupName. Onchange checks if all the elements with the same attribute and value are equal within the same form.
				//Will add a property to each input, 'validate', exposing methods affecting that input. 
					//Use input.validate.setOnPass(func) and ..setOnFail(func) to set callbacks for pass/fail validations.
						//func should be of structure function(){doSomething to this;} where this is the input
					//Calling input.validate.all() will run every validation for that specific input.
					//Use spotter.form.setOnPass/setOnFail(groupName,func) to set the onPass/onFail callBacks for a matching group.
						//Within func, this will refer to the members as they are iterated through within the group
				//Will add a box to data-validation-messages for each validation or matching group.
					//Each of these boxes specific animations for pass/fail can be changed using input.validate.messageBox.onPass/.onFail(func)

				// ********** VALIDATE ENTIRE FORM ************ //

				this.validate = function(form){ 
					var inpLvlValFuncs = this.inpLvlValFuncs
						,groupValFuncs = this.groupValFuncs
						,frmLvlValFuncs = this.frmLvlValFuncs
						,func
						,x
						,r;

					//console.log("inpLvlValFuncs",inpLvlValFuncs," \n","groupValFuncs",groupValFuncs," \n","frmLvlValFuncs",frmLvlValFuncs);

					//inpLvlValFuncs are validation functions checking individual inputs
					for(x=0; func=inpLvlValFuncs[x]; x++) func();

					//groupValFuncs are validation functions that validate across all members of a group instead of validating individual members
					for(x=0; func=groupValFuncs[x]; x++) func();

					//frmLvlValFuncs were sent as arguments when the validator was created
					for(x=0; func=frmLvlValFuncs[x]; x++){
						if((r = func(form)) === true){
							if(func.status === 0){
								func.msgBox.hide();
								this.validate.pass(23);
								func.status = 1;
								this.messageBox.hide();
							}
						}
						else{
							if(func.status === 1){	
								func.msgBox.show(r);
								this.validate.failure(23);
								func.status = 0;
								this.messageBox.show();
							}
						}
					}

					return this.validate.status === 1;
				}.bind(this, frm);

				this.validate.status = 1;
				this.validate.failure = (function(frmLvlVal){
					return function(prime){
						frmLvlVal.validate.status *= prime;
						//console.log('the new form status on failure:',frmLvlVal.validate.status,' prime:',prime);
					};
				}(this));

				this.validate.pass = (function(frmLvlVal){
					return function(prime){
						frmLvlVal.validate.status /= prime;
						//console.log('the new form status on pass:',frmLvlVal.validate.status,' prime:',prime);
					};			
				}(this));
				//The individual validation types can also be called using input.validate.pattern(), input.validate.matching()...etc
				//This function, input.validate(), will call all of them and push a result obj into the input.validate.results
				//input.validate.results is an array with result objects: [{type:type of validate failure, message:specific message, associate: the inputs involved in the failure}]
				//failures using input.validate() will be added as errors to factory. Associated by index to the specific form reference in factory

				// *********** INITIATE ************* //

				var elems = frm.querySelectorAll('INPUT'), l = -1, len = elems.length, el;
				while(++l < len){
					el = elems[l];
					if(!el.name) continue;
					el.validate = new InputLevelValidation(el, this); 
				}
				
				var elems = frm.querySelectorAll('TEXTAREA'), l = -1, len = elems.length, el;
				while(++l < len){
					el = elems[l];
					if(!el.name) continue;
					el.validate = new InputLevelValidation(el, this); 
				}
			
				this.valOnCreateFuncs.forEach(function(func){
					func();
				});
			};
		
		__constructor.prototype.setupInput = function(input){
			if(!input.name) return;
			input.validate = new InputLevelValidation(input, this); 
		};
		
		// ************ PROTOTYPE FOR INPUT LEVEL VALIDATION SETUP *************** //		
			//InputLevelValidation/inpLvlVal is tied to each individual input - the methods here are responsible for setting up the events and sending the correct information from the input attributes to the validation functions
			//created with methods from spotter.form.validation
			var InputLevelValidation = function(input, frmLvlVal){
				//frmLvlVal is the form level validation object
				this.frmLvlVal = frmLvlVal;
				this.valOnCreateFuncs = frmLvlVal.valOnCreateFuncs;
				this.input = input;
				this.funcs = [];
				this.result = [];
				this.current = 1;//value based on validations (1 if validation success)
				this.name = input.getAttribute('data-validate-name') || input.name;
				
				this.msgBox = document.createElement('DIV');			
				spotter.form.initMsgBox(this.msgBox, this.frmLvlVal.messageBox);
				this.frmLvlVal.messageBox.appendChild(this.msgBox);
				
				this.initialBorderColor = input.style.borderColor;
				this.setOnFail(function(){this.style.borderColor = 'rgb(255,0,0)';});
				this.setOnPass(function(){this.style.borderColor = this.initialBorderColor;});
	
				//data-validation=pattern, data-validate-onchange=pattern
				this.pattern();
				//data-required
				this.required();
				//data-min-length=length
				this.minLength();
				//data-max-length=length
				this.maxLength();
				//data-matching=group
				this.matching();
				//data-group-required=group
				this.groupRequired();
				//data-group-exclusive=group
				this.groupExclusive();
			};
			InputLevelValidation.prototype.all = function(){
				this.result = [];
				for(var x=0, l=this.funcs.length; x<l; x++){
					this.funcs[x]();
				}
			};				
			InputLevelValidation.prototype.setOnFail = function(func){ 
				this.onFail = function(){ 
					func.call(this.input); 
				}; 
			};
			InputLevelValidation.prototype.setOnPass = function(func){ 
				this.onPass = function(){ 
					func.call(this.input);
				}; 
			};
			InputLevelValidation.prototype.patternTypes = {
				pattern:2,
				matching:3,
				required:5,
				minLength:7,
				maxLength:11,
				between:13,
				groupRequired:17,
				groupExclusive:19
			};
			InputLevelValidation.prototype.isValid 	 = function(testFor){
				if(this.current===1) return true;
				if(testFor !== undefined && (this.current / this.patternTypes[testFor] === 1)) return true;
				return false;
			};
			//set a failure programmatically
			InputLevelValidation.prototype.setFailure = function(testFor, showError){
				var prime = this.patternTypes[testFor];
				//console.log('input ('+this.input.name+') set:','current:',this.current,'prime:',prime,'result:',this.current % prime);
				if(this.current % prime === 0) return;
				this.current *= prime;
				this.frmLvlVal.validate.failure.call(this.frmLvlVal, prime);
			};
			//unset a failure programmatically
			InputLevelValidation.prototype.unsetFailure = function(testFor){
				var prime = this.patternTypes[testFor];
				//console.log('input ('+this.input.name+') unset:','current:',this.current,'prime:',prime,'result:',this.current % prime);
				if(this.current % prime !== 0) return;
				this.current /= prime;
				this.frmLvlVal.validate.pass.call(this.frmLvlVal, prime);
			};
			InputLevelValidation.prototype.report = function(){
				console.log('validation report:', this.input, this.current);
			};
			// ** when these prototype functions are called initially, they set the prototype to a new function value closured around the necessary arguments allowing them to be called under any other scope.
			// -------- PATTERN
			InputLevelValidation.prototype.pattern = function(){
				var input = this.input
					, pattern
					, closuredArgs;
					
				if((pattern = input.getAttribute('data-validate')) || (pattern = input.getAttribute('data-validate-onchange'))){
					if(pattern.substring(0,7) === 'between'){ this.range = pattern.substring(8).trim().split('-'); pattern = 'between'; }
					
					closuredArgs = {input: input, inpLvlVal: this, func: spotter.form.validate[pattern], pattern: pattern};
					
					if(typeof closuredArgs.func !== 'undefined'){
						this.pattern = function(e){
							var args = closuredArgs
								, inpLvlVal = args.inpLvlVal
								, result = args.func(args.input, inpLvlVal.name);
								
							if(result.status === 'fail'){ 
								inpLvlVal.setFailure('pattern');
								inpLvlVal.msgBox.fail(result.message);
								return false;
							}
							else{
								inpLvlVal.unsetFailure('pattern');
								if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass();
								return true;
							}
							//console.log('pattern validation:',result.status === 'fail',inpLvlVal.current,inpLvlVal.current === 1);
						};
					}
					else{
						closuredArgs.func = spotter.form.validate.pattern;
						closuredArgs.customMessage = input.getAttribute('data-validate-custom-message');
						this.pattern = function(e){
							var args = closuredArgs
								,inpLvlVal = args.inpLvlVal
								,result = args.func(args.input, args.pattern, inpLvlVal.name, closuredArgs.customMessage);
	
							if(result.status === 'fail'){ 
								inpLvlVal.setFailure('pattern');
								inpLvlVal.msgBox.fail(result.message);
								return false;
							}
							else{ 
								inpLvlVal.unsetFailure('pattern');
								if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass(result.message);
								return true;
							}
						};
					}
					this.funcs.push(this.pattern)
					this.frmLvlVal.inpLvlValFuncs.push(this.pattern);
					if(input.hasAttribute('data-validate-onchange')){	
						spotter.events.setEventTrigger(input,'change');
						input.addEventListener('change', this.pattern, false);
					}
					else{
						spotter.events.setEventTrigger(input, 'input');
						input.addEventListener('input', this.pattern, false);
						//input.addEventListener('change', this.pattern, false);
					}
				}
				else{
					this.pattern = null;
				}
			};
			// -------- REQUIRED
			InputLevelValidation.prototype.required = function(){
				var input = this.input, closuredArgs;
				
				if(input.hasAttribute('data-required')){			
					//if(input.value.length === 0 || Number(input.value) === 0){ this.setFailure('required'); }//invalidate required attributes on instantiation
					
					closuredArgs = {input: input, inpLvlVal: this};
	
					this.passRequired = function(){//assume when input is focused that the user is inputing data
						var args = closuredArgs
							, inpLvlVal = args.inpLvlVal;
					
						inpLvlVal.unsetFailure('required');
						if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass();
					};
					
					if(!~['file','radio','checkbox'].indexOf(input.type) || input.tagName === 'TEXTAREA'){
						this.required = function(){
							var args = closuredArgs
								, inpLvlVal = args.inpLvlVal
								, result = spotter.form.validate.required(args.input, inpLvlVal.name);
		
							if(result.status === 'fail'){
								inpLvlVal.setFailure('required');
								inpLvlVal.msgBox.fail(result.message);
								return false;
							}	
							else{ 
								inpLvlVal.unsetFailure('required');
								if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass();
								return true;
							}
						};
						//spotter.events.setEventTrigger(input, 'blur');
						spotter.events.setEventTrigger(input, 'focus');
						//input.addEventListener('blur', this.required, false);
						input.addEventListener('focus', this.passRequired, false);
					}
					else if(input.type === 'file'){
						this.required = function(){
							var args = closuredArgs
								, inpLvlVal = args.inpLvlVal
								, input = args.input
								, result = spotter.form.validate.fileRequired(args.input, inpLvlVal.name);
							
							if(result.status === 'fail'){
								inpLvlVal.setFailure('required');
								inpLvlVal.msgBox.fail(result.message);
								return false;
							}
							else{
								inpLvlVal.unsetFailure('required');
								if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass();
								return true;
							}
						}
						spotter.events.setEventTrigger(input, 'change');
						input.addEventListener('change', this.required, false);
					}
					
					//this.funcs.push(this.required);
					this.frmLvlVal.inpLvlValFuncs.push(this.required);
				}
				else{
					this.required = null;
				}
			};
			// -------- MAXLENGTH
			InputLevelValidation.prototype.maxLength = function(){
				var input = this.input
					, maxLength = input.getAttribute('data-max-length')
					, closuredArgs;
				
				if(spotter.isType.numeric(maxLength)){
					closuredArgs = {input: input, inpLvlVal: this, length: Number(maxLength)}
					
					this.maxLength = function(){
						var args = closuredArgs
							, input = args.input
							, result = spotter.form.validation.maxLength(input, args.length, inpLvlVal.name)
							, inpLvlVal = args.inpLvlVal;
	
						if(result.status==='fail'){ 
							inpLvlVal.setFailure('maxLength');
							inpLvlVal.msgBox.fail(result.message);
						}
						else{ 
							inpLvlVal.unsetFailure('maxLength');
							if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass(result.message);
						}
					};
					this.funcs.push(this.maxLength);
					this.frmLvlVal.inpLvlValFuncs.push(this.maxLength);
					spotter.events.setEventTrigger(input, 'input');
					input.addEventListener('input', this.maxLength, false);
				}
				else{
					this.maxLength = null;
				}
			};
			// -------- MINLENGTH
			InputLevelValidation.prototype.minLength = function(){
				var input = this.input
					, minLength = input.getAttribute('data-min-length')
					, closuredArgs;
				
				if(spotter.isType.numeric(minLength)){
					closuredArgs = {input: input, inpLvlVal: this, length: Number(minLength)}
					
					this.minLength = function(){
						var args = closuredArgs
							, input = args.input
							, result = spotter.form.validation.minLength(input, args.length, inpLvlVal.name)
							, inpLvlVal = args.inpLvlVal;
	
						//window.validationResults.push(result);
						if(result.status==='fail'){ 
							inpLvlVal.setFailure('minLength');
							inpLvlVal.msgBox.fail(result.message);
						}
						else{
							inpLvlVal.unsetFailure('minLength');
							if(inpLvlVal.current === 1) inpLvlVal.msgBox.pass();
						}
					};
					this.funcs.push(this.minLength);
					this.frmLvlVal.inpLvlValFuncs.push(this.minLength);
					spotter.events.setEventTrigger(input, 'input');
					input.addEventListener('input', this.minLength, false);
				}
				else{
					this.minLength = null;
				}
			};
			// -------- MATCHING
			InputLevelValidation.prototype.matching = function(){
				var input = this.input
					, frmLvlVal = this.frmLvlVal
					, closuredArgs
					, groupName
					, groupDetails;
				
				if(groupName = input.getAttribute('data-matching')){
					groupDetails = spotter.form.validate.matching(input, groupName, frmLvlVal, 'All '+groupName+' inputs must have matching values');
					
					closuredArgs = {input: input, inpLvlVal: this, groupName: groupName, validateFunc: groupDetails.checkFunc};
					
					this.matching = function(){//inputs are not added to the active members list until the first time they are validated
						var inpLvlVal = closuredArgs.inpLvlVal;
						input.removeEventListener('change', inpLvlVal.matching, false);
						spotter.form.validate.matching.addToActive(closuredArgs.input, closuredArgs.groupName);
						inpLvlVal.matching = closuredArgs.validateFunc;
						inpLvlVal.matching();
						inpLvlVal.funcs[inpLvlVal.funcs.indexOf(inpLvlVal.matching)] = inpLvlVal.matching;
						input.addEventListener('change', inpLvlVal.matching, false);
					};				
					this.funcs.push(this.matching);//validating a single input will not try to match inputs that have not had anything added yet
					frmLvlVal.inpLvlValFuncs.push(groupDetails.checkAllFunc);//validating form test ALL the members of any group
					spotter.events.setEventTrigger(input, 'change');
					input.addEventListener('change', this.matching, false);
				}
				else{
					this.matching = null;
				}
			};
			// -------- GROUPREQUIRED
			InputLevelValidation.prototype.groupRequired = (function(registeredGroups){
				return function(){
					//evaluates once when the form validator is created and then anytime a member input is changed
					var input = this.input
						, frmLvlVal = this.frmLvlVal
						, closuredArgs
						, multiGroupNames
						, groupName
						, groupDetails
						, titles
						, title
						, x;

					if(multiGroupNames = input.getAttribute('data-group-required')){
						multiGroupNames = multiGroupNames.split(':');
						if(titles = input.getAttribute('data-group-required-title')){
							titles = titles.split(":");
						}
						else{
							titles = [];
						}
						for(x=0; (groupName=multiGroupNames[x]); x++){
							title = titles[x];
							groupDetails = spotter.form.validate.groupRequired(input, groupName, frmLvlVal, title);
							
							if(typeof registeredGroups[groupName] === 'undefined'){
								registeredGroups[groupName] = groupDetails;
								frmLvlVal.inpLvlValFuncs.push(groupDetails.checkAllFunc);//validating form test ALL the members of any group
								frmLvlVal.valOnCreateFuncs.push(groupDetails.setDefaultErrorMsg);
							}
	
							spotter.events.setEventTrigger(input, 'change');
							input.addEventListener('change', groupDetails.checkFunc, false);
						};
					}
					else{
						this.groupRequired = null;
					}
				};
			}({}));
			// -------- GROUPEXCLUSIVE
			InputLevelValidation.prototype.groupExclusive = function(){
				//evaluates once when the form validator is created and then anytime a member input is changed
				var input = this.input
					, frmLvlVal = this.frmLvlVal
					, closuredArgs
					, groupName
					, groupDetails;
				
				if(groupName = input.getAttribute('data-group-exclusive')){
					groupDetails = spotter.form.validate.groupExclusive(input, groupName, frmLvlVal, 'Only one input in '+groupName+' should have a value');
					
					closuredArgs = {input: input, inpLvlVal: this, groupName: groupName, validateFunc: groupDetails.checkFunc};
					
					this.groupExclusive = function(){//inputs are not added to the active members list until the first time they are validated
						var inpLvlVal = closuredArgs.inpLvlVal;
						input.removeEventListener('change', inpLvlVal.groupExclusive, false);
						spotter.form.validate.groupExclusive.addToActive(closuredArgs.input, closuredArgs.groupName);
						inpLvlVal.groupExclusive = closuredArgs.validateFunc;
						inpLvlVal.groupExclusive();
						inpLvlVal.funcs[inpLvlVal.funcs.indexOf(inpLvlVal.groupExclusive)] = inpLvlVal.groupExclusive;
						input.addEventListener('change', inpLvlVal.groupExclusive, false);
					};				
					this.funcs.push(this.groupExclusive);//validating a single input will not try to match inputs that have not had anything added yet
					frmLvlVal.inpLvlValFuncs.push(groupDetails.checkAllFunc);//validating form test ALL the members of any group
					spotter.events.setEventTrigger(input, 'change');
					input.addEventListener('change', this.groupExclusive, false);
				}
				else{
					this.groupExclusive = null;
				}
			};

		// *********** VALIDATION PATTERNS (HELPERS) *********** //
			__self.validate = {
				pattern: function(input, pattern, name, msg){
					if(!new RegExp(pattern).test(input.value)){
						msg = msg || '$[NAME] contains disallowed characters';
						msg = msg.replace('$[NAME]', msg);
						return {status:'fail', type:'pattern', subType:'custom', message: msg.replace('$[NAME]', msg), associated:input};
					}
					return {status:'pass',type:'pattern',subType:'custom',name:input.name};
				},			
				alpha: function(input, name){
					if(!/^[a-zA-Z\s_]*$/.test(input.value)){
						return {status:'fail',type:'pattern',subType:'alpha',message:name+' must contain only letters, spaces, or underscores (_)',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'alpha',name:input.name};
				},			
				numeric: function(input, name){
					if(!Number(input.value) && Number(input.value) !== 0){	
						return {status:'fail',type:'pattern',subType:'numeric',message:name+' must contain only numbers',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'numeric',name:input.name};
				},
				alphanumeric: function(input, name){
					if(!/^[\w\s]*$/.test(input.value)){
						return {status:'fail',type:'pattern',subType:'alphanumeric',message:name+' must contain only letters, numbers, spaces, or underscores (_)',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'alphanumeric',name:input.name};
				},
				personName: function(input, name){
					if(!/^[\w\s\-\'\,\.]*$/.test(input.value)){
						return {status:'fail',type:'pattern',subType:'personName',message:name+" must contain only letters, spaces, comma(,), period(.), hyphen(-), and apostrophe(')"};
					}
					return {status:'pass',type:'pattern',subType:'personName',name:input.name};
				},					
				streetaddress: function(input, name){
					if(!/^[A-Za-z0-9'\.\-\s\,]*$/.test(input.value)){
						return {status:'fail',type:'pattern',subType:'streetaddress',message:name+' must be a properly formatted address with street number and street name',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'streetaddress',name:input.name};
				},			
				phone: function(input, name){
					if(input.value.length > 0){	
						var tv = input.value.replaceAll("[^0-9]","");
						if(tv.length < 10){
							return {status:'fail',type:'pattern',subType:'phone',message:name+' must be a full 10-digit phone number including area code',associated:input};
						}
					}
					return {status:'pass',type:'pattern',subType:'phone',name:input.name};
				},			
				phoneint: function(input, name){
					if(input.value.length > 0){		
						var tv = input.value.replaceAll("[^0-9]","");
						if(tv.length < 11){
							return {status:'fail',type:'pattern',subType:'phoneint',message:name+' must be a full internation phone number including area code and country code',associated:input};
						}
					}
					return {status:'pass',type:'pattern',subType:'phoneint',name:input.name};
				},			
				day: function(input, name){
					if(input.value > -1 && input.value < 32){
						return {status:'pass',type:'pattern',subType:'day',name:input.name};
					}
					else{
						return {status:'fail',type:'pattern',subType:'day',message:name+' exceeded the range for a day of the month.',associated:input};
					}
				},			
				zipcodedom: function(input, name){
					if(!/^[0-9]{5}$/.test(input.value) && input.value.length > 0){
						return {status:'fail',type:'pattern',subType:'zipcodedom',message:name+' must be a 5 digit US zip code',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'zipcodedom',name:input.name};
				},			
				zipcodeint: function(input, name){
					if(!/^[0-9a-zA-Z\s]{5,}$/.test(input.value) && input.value.length > 0){
						return {status:'fail',type:'pattern',subType:'zipcodeint',message:name+' must be a valid postal code',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'zipcodeint',name:input.name};
				},			
				country: function(input, name){
					if(!/^[a-zA-Z\s]+$/.test(input.value) && input.value.length > 0){
						return {status:'fail',type:'pattern',subType:'country',message:name+' must be a 5 digit US zip code',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'country',name:input.name};
				},			
				email: function(input, name){
					if(!/^.+@.+\..+$/.test(input.value) && input.value.length > 0){
						return {status:'fail',type:'pattern',subType:'email',message:name+' must be a valid email like user@domain.tld',associated:input};
					}
					return {status:'pass',type:'pattern',subType:'email',name:input.name};
				},			
				password: function(input, name){
					if(input.value.length > 19 && input.value.length < 41){
						return {status:'pass',type:'pattern',subType:'password',name:input.name};
					}
					else if(!input.value.length){
						return {status:'pass',type:'pattern',subType:'password',name:input.name};
					}
					else if(/[!@#$%\^&\*]/.test(input.value)){
						if(/[A-Z]/.test(input.value)){
							if(/[0-9]/.test(input.value)){
								if(input.value.length > 6 && input.value.length < 41){
									return {status:'pass',type:'pattern',subType:'password',name:input.name};
								}
								else{ $error = "<li>Must be a minimum of 6 characters and a maximum of 40.</li>" }
							}
							else{ $error = "<li>Must contain at least one number.</li>" }
						}
						else{ $error = "<li>Must contain at least one capital letter.</li>" }
					}
					else{
						$error = "<li>Must contain at least one of the following: ! @ # $ % ^ & *</li>"
					}
					var msg = "<ul><li>"+name+" must meet the following requirement:</li>"+$error+"<li>OR</li><li>Your password can be at least 20 characters in length (Max 40).</li></ul>";
					return {status:'fail',type:'pattern',subType:'password',message:msg,associated:input};
				},			
				between: function(input, name){
					var range = input.validate.range;
					if(input.value.length && !(Number(input.value) >= Number(range[0]) && Number(input.value) <= Number(range[1]))){
						return {status:'fail',type:'pattern',subType:'between',message:name+' must be between '+range[0]+' and '+range[1],associated:input};
					}
					return {status:'pass',type:'pattern',name:input.name};
				},			
				required: function(input, name){
					if(!input.value.length > 0){
						return {status:'fail',type:'required',message:name+' cannot be empty',associated:input};
					}
					return {status:'pass',type:'required',name:input.name};
				},
				fileRequired: function(input, name){
					if(input.files.length === 0){
						return {status: 'fail', type: 'required', message: name+' must have a file specified', associated: input};
					}
					return {status:'pass',type:'required',name:input.name};
				},
				minlength: function(input,minLength, name){
					if(input.value.length && input.value.length < minLength){
						return {status:'fail',type:'required',message:name+' must be more than '+(Number(minLength)-1)+' characters in length.',associated:input};
					}
					return {status:'pass',type:'minLength',name:input.name};
				},			
				maxlength: function(input,maxLength, name){
					if(input.value.length && input.value.length > maxLength){
						return {status:'fail',type:'required',message:name+' must be under '+(Number(maxLength)+1)+' characters.',associated:input};
					}
					return {status:'pass',type:'maxLength',name:input.name};
				},			
				matching: (function(){//use spotter.form.validate.matching(input,groupName) to add an input to a group
					//special case because all members of a group share a validation function
					var __matchingGroups = {};
					
					var __self = function(el, groupName, frmLvlVal, errorMsg){
						var msgBox, group = __matchingGroups[groupName];
						if(typeof group === 'undefined'){
							group = __matchingGroups[groupName] = {members:[], value:null};
							group.activeMembers = [];
							group.checkFunc = spotter.form.validate.matching.createCheckFunc(groupName, 'activeMembers');
							group.checkAllFunc = spotter.form.validate.matching.createCheckFunc(groupName, 'members');
							group.msgBox = [msgBox = document.createElement('DIV')];
							group.frmLvlVal = [frmLvlVal];
							
							msgBox.innerHTML = errorMsg;
							msgBox.className = "hide";
							frmLvlVal.messageBox.appendChild(msgBox);
							
							spotter.form.validate.matching.setOnFail(groupName, function(){this.style.borderColor = 'rgb(255,0,0)';});
							spotter.form.validate.matching.setOnPass(groupName, function(){this.style.borderColor = null;});
						}
						else if(!~group.frmLvlVal.indexOf(frmLvlVal)){//each form has its own message box for each group
							group.msgBox.push(msgBox = document.createElement('DIV'));
							msgBox.innerHTML = errorMsg;
							frmLvlVal.messageBox.appendChild(msgBox);
							group.frmLvlVal.push(frmLvlVal);
						}
						
						group.members.push(el);
						
						return group;
					};
					
					__self.addToActive = function(el, groupName){
						__matchingGroups[groupName].activeMembers.push(el);
					};
					
					//this function returns a function to check each members in a group for matching. memberPool = string(members||activeMembers) and determines which members are checked
					__self.createCheckFunc = function(groupName, memberPool){//returns a function to be associated with the elements group
						var group = __matchingGroups[groupName], memberPool = memberPool || 'activeMembers';
						return function(){
							var input
								,coll = group[memberPool]
								,l = coll.length-1
								,previousValue = coll[l].value;
								
							while(--l > -1){
								input = coll[l];
								if(input.value != previousValue){
									group.onFail();
									return {status:'fail', type:'matching', message:'the '+groupName+' inputs must match', associated:groupName};
								}
							}
							group.value = previousValue;
							group.onPass();
							return {status:'pass', type:'matching', associated:groupName};
						};
					};
					
					//use this to set the action for a group fail. This is specific to the group
					__self.setOnFail = function(groupName, func){
						__matchingGroups[groupName].onFail = function(){
							__matchingGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.setFailure('matching');
							});
							__matchingGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.remove(box, 'hide');
							});
							__matchingGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.show();
							});
						};
					};
					
					//use this to set the action for a group pass. This is specific to the group and does not work on inputs that otherwise do not validate
					__self.setOnPass = function(groupName,func){
						__matchingGroups[groupName].onPass = function(){
							__matchingGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.unsetFailure('matching');
							});
							__matchingGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.add(box, 'hide');
							});
							__matchingGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.hide();
							});
						};
					};
					
					//** ALIAS FUNCTIONS - these functions are used to call specific fail/pass functions **//
						__self.onFail = function(groupName){
							__matchingGroups[groupName].onFail();
						};
					
						__self.onPass = function(groupName){
							__matchingGroups[groupName].onPass();
						};
					
					return __self;
				}()),
				groupRequired: (function(){//use spotter.form.validate.groupRequired(input,groupName) to add an input to a group
					var __requiredGroups = {};
					
					var __self = function(el, groupName, frmLvlVal, errorMsg){
						var msgBox
							,group = __requiredGroups[groupName];
				
						if(group === undefined){
							group = __requiredGroups[groupName] = {members:[], value:null, titleIsSet:false};
							
							group.checkAllFunc = spotter.form.validate.groupRequired.createCheckFunc(groupName);
							group.checkFunc = spotter.form.validate.groupRequired.hasValueFunc(groupName);
							group.setDefaultErrorMsg = spotter.form.validate.groupRequired.setDefaultErrorMsg(groupName);
							
							group.frmLvlVal = [frmLvlVal];
							
							group.msgBox = [msgBox = document.createElement('DIV')];
							msgBox.className = "hide";
							frmLvlVal.messageBox.appendChild(msgBox);
							
							spotter.form.validate.groupRequired.setOnFail(groupName, function(){this.style.borderColor = 'rgb(255,0,0)';});
							spotter.form.validate.groupRequired.setOnPass(groupName, function(){this.style.borderColor = null;});
						}
						
						if(errorMsg){ group.msgBox[0].innerHTML = errorMsg; group.titleIsSet = true; }
						group.members.push(el);

						return group;
					};

					//this function returns a function to check that only up to one member of a group has a value
					__self.createCheckFunc = function(groupName){//returns a function to be associated with the elements group
						var group = __requiredGroups[groupName];

						return function(){
							//console.log('group required check func -- ', 'groupName:', groupName, 'groupmembers:', group['members'].length);
							var members = group['members']
								,l = members.length
								,input
								,inputNames = [];

							while(--l > -1){
								input = members[l];
								//console.log('group required check func -- ', 'groupName:', groupName, 'value ('+input.name+'):', input.value);
								if(input.value != null && input.value.trim().length > 0){
									group.onPass();
									return {status:'pass', type:'groupRequired', associated:groupName};
								}
								inputNames.push(input.name);
							}
							group.msgBox.innerHTML = 'At least one input in '+inputNames.join(',')+' must be used';
							group.onFail();
							return {status:'fail', type:'groupRequired', message:'at least one input in '+groupName+' must be used', associated:groupName};
						};
					};
					
					__self.hasValueFunc = function(groupName){//can only pass the input - form submit where group required fails will cause a failure.
						var group = __requiredGroups[groupName];
						
						return function(){
							console.log('hasvaluefunc:', this);
							if(this.value !== null && this.value.trim().length > 0){
								group.onPass();
								return {status:'pass', type:'groupRequired', associated:groupName};
							}
						};
					};
					
					__self.setDefaultErrorMsg = function(groupName){
						var group = __requiredGroups[groupName];
						
						return function(){
							console.log('setDefaultErrorMsg: ', group);
							if(group.titleIsSet === false){
								var names = [];
								group.members.forEach(function(input){
									console.log(input);
									if(input.name) names.push(input.name);
								});
								group.msgBox[0].innerHTML = "At least one of "+names.slice(0,-1).join(',')+" or "+names.slice(-1)+" must be used";
							};
							console.log('setDefaultErrorMsg: ', group.msgBox.innerHTML);
						};
					};
					
					//use this to set the action for a group fail. This is specific to the group
					__self.setOnFail = function(groupName, func){
						__requiredGroups[groupName].onFail = function(){
							__requiredGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.setFailure('groupRequired');
							});
							__requiredGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.remove(box, 'hide');
							});
							__requiredGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.show();
							});
						};
					};
									
					//use this to set the action for a group pass. This is specific to the group and does not work on inputs that otherwise do not validate
					__self.setOnPass = function(groupName,func){
						__requiredGroups[groupName].onPass = function(){
							__requiredGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.unsetFailure('groupRequired');
							});
							__requiredGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.add(box, 'hide');
							});
							__requiredGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.hide();
							});
						};
					};
					
					//** ALIAS FUNCTIONS - these functions are used to call specific fail/pass functions **//
						__self.onFail = function(groupName){
							__requiredGroups[groupName].onFail();
						};
					
						__self.onPass = function(groupName){
							__requiredGroups[groupName].onPass();
						};
				
					return __self;
				}()),
				groupExclusive: (function(){//use spotter.form.validate.groupExclusive(input,groupName) to add an input to a group
					var __exclusiveGroups = {};
					
					var __self = function(el, groupName, frmLvlVal, errorMsg){
						var msgBox
							,group = __exclusiveGroups[groupName];
				
						if(group === undefined){
							group = __exclusiveGroups[groupName] = {members:[], value:null};
							group.checkFunc = spotter.form.validate.groupExclusive.createCheckFunc(groupName, 'activeMembers');
							group.checkAllFunc = spotter.form.validate.groupExclusive.createCheckFunc(groupName, 'members');
							group.msgBox = [msgBox = document.createElement('DIV')];
							group.frmLvlVal = [frmLvlVal];
							
							msgBox.innerHTML = errorMsg;
							msgBox.className = "hide";
							frmLvlVal.messageBox.appendChild(msgBox);
							
							spotter.form.validate.groupExclusive.setOnFail(groupName, function(){this.style.borderColor = 'rgb(255,0,0)';});
							spotter.form.validate.groupExclusive.setOnPass(groupName, function(){this.style.borderColor = null;});
						}
						else if(!~group.frmLvlVal.indexOf(frmLvlVal)){//each form has its own message box for each group
							group.msgBox.push(msgBox = document.createElement('DIV'));
							msgBox.innerHTML = errorMsg;
							frmLvlVal.messageBox.appendChild(msgBox);
							group.frmLvlVal.push(frmLvlVal);
						}
						
						group.members.push(el);
						
						return group;
					};
					
					//this function returns a function to check that only up to one member of a group has a value
					__self.createCheckFunc = function(groupName){//returns a function to be associated with the elements group
						var group = __exclusiveGroups[groupName];
						
						return function(){
							var input
								, l = group[members].length-1
								, nonEmptyValues = 0;
								
							while(--l > -1){
								input = group[members][l];
								if(input.value != null && input.value.length.trim() > 0){
									if(nonEmptyValues > 0){
										group.onFail();
										return {status:'fail', type:'groupExclusive', message:'no more than one input for '+groupName+' must be used', associated:groupName};
									}
									else{
										nonEmptyValues++;
									}
								}
							}
							group.onPass();
							return {status:'pass', type:'groupExclusive', associated:groupName};
						};
					};
					
					__self.addToActive = function(el, groupName){
						__exclusiveGroups[groupName].activeMembers.push(el);
					};
					
					//use this to set the action for a group fail. This is specific to the group
					__self.setOnFail = function(groupName, func){
						__exclusiveGroups[groupName].onFail = function(){
							__exclusiveGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.setFailure('groupExlusive');
							});
							__exclusiveGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.remove(box, 'hide');
							});
							__exclusiveGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.show();
							});
						};
					};
									
					//use this to set the action for a group pass. This is specific to the group and does not work on inputs that otherwise do not validate
					__self.setOnPass = function(groupName,func){
						__exclusiveGroups[groupName].onPass = function(){
							__exclusiveGroups[groupName].members.forEach(function(el){
								func.call(el);
								el.validate.unsetFailure('groupExlusive');
							});
							__exclusiveGroups[groupName].msgBox.forEach(function(box){
								spotter.toggle.class.add(box, 'hide');
							});
							__exclusiveGroups[groupName].frmLvlVal.forEach(function(val){
								val.messageBox.hide();
							});
						};
					};
					
					//** ALIAS FUNCTIONS - these functions are used to call specific fail/pass functions **//
						__self.onFail = function(groupName){
							__exclusiveGroups[groupName].onFail();
						};
					
						__self.onPass = function(groupName){
							__exclusiveGroups[groupName].onPass();
						};
				
					return __self;
				}())
			};
	
		// *********** HELPERS *********** //
			__self.initMsgBox = function(msgBox, parBox){
				msgBox.fail = function(msg){ 
					this.innerHTML = msg; 
					spotter.toggle.class.remove(this, 'hide'); 
					parBox.show();
				};
				msgBox.pass = function(){ 
					spotter.toggle.class.add(this, 'hide'); 
					parBox.hide();
				};
			};
			
			__self.setInputValues = function(o,frm){//o={elementName:newValue}
				frm=frm||document;
				var el, tagName, targ, l, type;
				for(var prop in o){
					el=frm.getElementsByName(prop);
					if(typeof el!=="undefined"){
						l=el.length;
						while(--l > -1){
							tagName = el[l].tagName;
							targ = el[l];
							switch (tagName){
								case "SELECT":
									l = targ.options.length;
									while(--l > -1){
										if(targ.options[l].value === o[prop]){
											targ.options[l].selected = "selected";
										}
									}
									break;
								case "INPUT":
									type = targ.type;
									if(type === "file"){
										console.error('set input values cannot set values for file type inputs',targ);
										break;
									}
									else if(type === "radio" || type == "checkbox"){
										targ.checked = (targ.value === o[prop]);
										break;
									}
									//else fall through to textare
								case "TEXTAREA":
									targ.value = o[prop];
									break;
								default:
									console.error('set input values did not recognize how to handle a target elem:',targ);
							}
						}
					}
				}
			};
			
			__self.imageInput = function(input){
				var __imageInput=function(){};	
	
				__imageInput.showImage=function(imgTarg){
					var func=function(){
						if (input.files && input.files[0]) {
							var reader = new FileReader();
				
								reader.onload = function (e) {
								imgTarg.src=e.target.result;
							};
				
							reader.readAsDataURL(input.files[0]);
						}
					};
					input.addEventListener('change',func,false);
				};
				
				return __imageInput;
			};
	
		// *********** PUBLIC METHODS *********** //
		/*
		__self.saveForms = (function(){
			// add an attribute to a form to save its current state to cookie ie <form data-some-attr="form-unique-value">...
			// Then call spotter.form.saveForms.saveAllFormStates('data-some-attr') to save the form(s) state to cookie.
			// Restore the form(s) by calling spotter.form.saveForms.restoreFormStates('data-some-attr')
			var __saveForms={pageName:window.location.pathname.replace(/[^\w]/g,"")},
				init=function(){}
			;
			
			init.saveFormState=function(frm){//name is the cookie key for later recall and is mandatory
				frm=frm;
				frm.spotter=frm.spotter||{};
				frm.spotter.saveFormState={};
				var fs=frm.spotter.saveFormState,
					inputs=frm.getElementsByTagName('INPUT'),
					textareas=frm.getElementsByTagName('TEXTAREA'),
					selects=frm.getElementsByTagName('SELECT'),
					el,
					si,
					type,
					regex_type,
					regex_state
				;
				inputs=spotter.concatNodeLists([inputs,textareas]);
				
				for(var x=0,l=inputs.length;x<l;x++){
					if(!inputs[x].name) continue;
					el=inputs[x],type=el.type.toLowerCase(),regex_type=new RegExp("^(radio|checkbox)$"),regex_state=new RegExp("^(checked|selected)$");
					if(regex_type.test(type)){
						if(typeof fs[el.name]==='undefined'){fs[el.name]=[];}
						fs[el.name].push({state:(regex_state.test(el.checked)?1:0),value:el.value,type:el.type})
					}
					else{
						fs[el.name]={value:(typeof el.value === 'undefined' ? '' : el.value)};
					}
				}
				
				for(var x=0,l=selects.length;x<l;x++){
					if(!selects[x].name) continue;
					var el=selects[x],si=el.selectedIndex;
					fs[el.name]={selectedIndex:si,value:el.options[el.selectedIndex].value};
				}
			};
			
			init.saveAllFormStates=function(attr){
				var frms=document.querySelectorAll("FORM["+attr+"]"),
					l=frms.length,
					json={},
					frm,
					name
				;
				while(--l > -1){
					frm=frms[l];
					name=frm.getAttribute(attr);
					init.saveFormState(frm);
					json[name]=frm.spotter.saveFormState;
				}
				var obj={};
				obj[__saveForms.pageName]={value:JSON.stringify(json),seconds:600};
				spotter.cookie.setValue(obj);
			};
			
			init.restoreFormState=function(attr){
			    var frms=document.querySelectorAll('FORM['+attr+']'),
					l=frms.length
				;
				if(typeof __saveForms.info==='undefined') __saveForms.info = spotter.cookie.getValue(__saveForms.pageName).value;
				if(typeof __saveForms.info!=='object') return;
				//__saveForms.info=JSON.parse(__saveForms.info);
				var name,
					info,
					value,
					el
				;
			    while(--l > -1){
			        name=frms[l].getAttribute(attr);
			        info=__saveForms.info[name];
					for(var prop in info){
						if(prop.length===0){continue;}
						if(Array.isArray(info[prop])){
							info[prop].forEach(function(val,index,array){
								var el=frms[l].querySelector('input[type="'+val.type+'"][value="'+val.value+'"][name="'+this.prop+'"]');
								if(val.state===1){el.setAttribute("checked","checked");}
								else{el.removeAttribute("checked");}
							},{prop:prop});
						}
						else{
							if(typeof (el=frms[l].elements[prop]) === 'undefined') continue;
							if(el.tagName==="SELECT"){
								if(el.options.length===0){console.log('beware a select box has 0 options');continue;}
								if(info[prop.value]===el.options[info[prop].selectedIndex].value){
									el.options[info[prop].selectedIndex].setAttribute("selected","selected");
									el.selectedIndex=info[prop].selectedIndex;
								}
								else{
									spotter.castToArray(el.options).forEach(function(opt,index,array){
										if(opt.value===this.value){
											opt.setAttribute("selected","selected");
										}
									},{value:info[prop].value});
								}
							}
							else if(frms[l].elements[prop].type !== "file" && frms[l].elements[prop].type !== "hidden"){
								frms[l].elements[prop].value=info[prop].value;
							}
						}
					}
			    }
			};
			return init;
		}());
		*/

		// ************* AJAX SUBMIT ******************
		__self.setupAjaxSubmit = function(frm, responseFuncs, data){//use data as an object to add extra params
			responseFuncs = responseFuncs || {};
			var __private = {active:false}
				,func = function(e){
					spotter.preventDefault(e);
					
					if(__private.active){console.log('wait for request to complete');return false;}
					if(frm.validator.disableSubmit){console.log('submit is currently disabled (for validator at least)'); return false;}
					if(!frm.validator.validate()){ console.log('validation failed'); return false; }
	
					__private.active = true;
					
					//save the cookie cache
					spotter.cookie.commit();
	
					if((frm.ajaxWaitingScreen = frm.getAttribute('data-ajax-waiting')) !== null){
						frm.ajaxWaitingScreen = document.getElementById(frm.ajaxWaitingScreen);
					}
					
					var async = true;
					if(frm.getAttribute('data-ajax-sync') !== null){
						async = false;
					}
					
					var ajaxArgs = {
						url: frm.action,
						data: frm,
						method: frm.method||"POST",
						async: async,
						cache: false
					};
					
					(function(frm){
						if(typeof responseFuncs.success === 'function'){
							ajaxArgs.success = function(response, frmData){ responseFuncs.success.call(this, response, frmData, frm); };
						}
						if(typeof responseFuncs.error === 'function'){
							ajaxArgs.error = function(response, frmData){ responseFuncs.error.call(this, response, frmData, frm); };
						}
						ajaxArgs.complete = function(response, frmData){
							if(frm.ajaxWaitingScreen !== 'undefined' && frm.ajaxWaitingScreen !== null){
								spotter.toggle.hide(frm.ajaxWaitingScreen);
							}
							__private.active = false;
							//console.log(JSON.parse(response));
							if(typeof responseFuncs.complete === 'function'){
								responseFuncs.complete.call(this, response, frmData, frm);//VIEW setupAjaxSubmit
							}
						}
						ajaxArgs.timeout = function(){
							__private.active = false;
						}
					}(this));
					
					spotter.ajax(ajaxArgs);
					
					if(frm.ajaxWaitingScreen !== 'undefined' && frm.ajaxWaitingScreen !== null){
						spotter.toggle.show(frm.ajaxWaitingScreen);
					}
					return false;
				}
			;
			spotter.events.setEventTrigger(frm, "submit");
			frm.submit = function(){ frm.eventTriggers["submit"](); };
			frm.addEventListener("submit",func,false);
			
			frm.displayAjaxError= (function(cont){
				document.body.appendChild(cont);
				cont.id = 'spotter-form-errors-display';
				var close = function(){this.style.display='none';};
				cont.addEventListener('click',close,false);
				return function(response){
					cont.style.display='block';
					var HTML ='', prop;
					for(prop in response){
						HTML += response[prop];
					}
					cont.innerHTML = HTML;
				};
			}(document.createElement('DIV')));
		};
		
		//helper - set (node)input to (str)value for types radio, checkbox, select
		__self.setInput = function(input,value){
			if(input.type === 'radio' && input.name){
				var others = input.form[input.name],l=others.length;
				while(--l > -1){
					if(String(others[l].value) === String(value)){
						others[l].checked = true;
					}						
					else{ others[l].checked = false; }
				}
			}
			else if(input.type === 'checkbox'){
				if(value.length > 0){ input.setAttribute('checked','true'); }
			}
			else if(input.tagName === 'SELECT'){
				var opts = input.options,l=opts.length;
				while(--l > -1){
					if(opts[l].value == value){
						opts[l].setAttribute('selected','true');
						input.selectedIndex = l;
					}
					else{
						opts[l].removeAttribute('selected');
					}
				}
			}
			else{
				input.value = value;
			}
		};

		return __self;
	}());
	
console.log('forms loaded');