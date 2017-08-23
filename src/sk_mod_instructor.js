/**
 * Skulpt Module for holding the Instructor API.
 *
 * This module is loaded in by getting the functions' source code from toString.
 * Isn't that crazy?
 *
 * @param {String} name - The name of the module (should always be 'instructor')
 *
 */
var $sk_mod_instructor = function(name) {
    // Main module object that gets returned at the end.
    var mod = {};
    
    /**
     * Skulpt Exception that forces the program to exit, but gracefully.
     * 
     * @param {Array} args - A list of optional arguments to pass to the Exception.
     *                       Usually this will include a message for the user.
     */
    Sk.builtin.GracefulExit = function (args) {
        var o;
        if (!(this instanceof Sk.builtin.GracefulExit)) {
            o = Object.create(Sk.builtin.GracefulExit.prototype);
            o.constructor.apply(o, arguments);
            return o;
        }
        Sk.builtin.Exception.apply(this, arguments);
    };
    Sk.abstr.setUpInheritance("GracefulExit", Sk.builtin.GracefulExit, Sk.builtin.Exception);
    
    /**
     * Give complimentary feedback to the user
     */
    mod.compliment = new Sk.builtin.func(function(message) {
        Sk.builtin.pyCheckArgs("compliment", arguments, 1, 1);
        Sk.builtin.pyCheckType("message", "string", Sk.builtin.checkString(message));
        
        Sk.executionReports.instructor.compliments.push(Sk.ffi.remapToJs(message));
    });
    /**
     * Mark problem as completed
     */
    mod.set_success = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("set_success", arguments, 0, 0);
        Sk.executionReports.instructor.complete = true;
        throw new Sk.builtin.GracefulExit();
    });
    /**
     * Let user know about an issue
     */
    mod.explain = new Sk.builtin.func(function(message, priority, line) {
        Sk.builtin.pyCheckArgs("explain", arguments, 1, 3);
        Sk.builtin.pyCheckType("message", "string", Sk.builtin.checkString(message));
        if (priority != undefined){
            Sk.builtin.pyCheckType("priority", "string", Sk.builtin.checkString(priority));
            priority = Sk.ffi.remapToJs(priority);
        } else {
            priority = 'medium';
        }
        if (line !== undefined) {
            Sk.builtin.pyCheckType("line", "integer", Sk.builtin.checkInt(line));
        } else {
            line = null;
        }
        if (!Sk.executionReports.instructor.complaint){
            Sk.executionReports.instructor.complaint = [];
        }
        var newComplaint = {
            'name': 'Instructor Feedback',
            'message': Sk.ffi.remapToJs(message),
            'priority': priority,
            'line': line
        }
        Sk.executionReports.instructor.complaint.push(newComplaint);
    });
    
    mod.gently = new Sk.builtin.func(function(message, line) {
        return Sk.misceval.callsimOrSuspend(mod.explain, message, Sk.ffi.remapToPy('student'), line);
    });
    
    /**
     * Prevent a certain kind of error from percolating where type is the phase that's being suppressed and
     * subtype is a specific error in the report of that phase.
     */
    mod.suppress = new Sk.builtin.func(function(type, subtype) {
        Sk.builtin.pyCheckArgs("suppress", arguments, 1, 2);
        Sk.builtin.pyCheckType("type", "string", Sk.builtin.checkString(type));
        type = Sk.ffi.remapToJs(type);
        if (subtype !== undefined) {
            Sk.builtin.pyCheckType("subtype", "string", Sk.builtin.checkString(subtype));
            subtype = Sk.ffi.remapToJs(subtype);
            if (Sk.feedbackSuppressions[type] === false) {
                Sk.feedbackSuppressions[type] = {};
                Sk.feedbackSuppressions[type][subtype] = true;
            } else if (Sk.feedbackSuppressions[type] !== false) {
                Sk.feedbackSuppressions[type][subtype] = true;
            }
        } else {
            Sk.feedbackSuppressions[type] = true;
        }
    });
    
    /**
     * Logs feedback to javascript console
     */
    mod.log = new Sk.builtin.func(function(message) {
        Sk.builtin.pyCheckArgs("log", arguments, 1, 1);
        console.log(Sk.ffi.remapToJs(message));
    });
    
    // get_ast()
    // get_trace()
    // get_types()
    // get_types_raw()
    
    var create_logger = function(phase, report_item) {
        return new Sk.builtin.func(function() {
            Sk.builtin.pyCheckArgs('log_'+report_item, arguments, 0, 0);
            var report = Sk.executionReports[phase];
            if (report.success) {
                console.log(report[report_item]);
            } else {
                console.log('Execution phase "'+phase+'" failed, '+report_item+' could not be found.');
            }
        });
    };
    mod.log_ast = create_logger('parser', 'ast');
    mod.log_variables = create_logger('analyzer', 'variables');
    mod.log_behavior = create_logger('analyzer', 'behavior');
    mod.log_issues = create_logger('analyzer', 'issues');
    mod.log_trace = create_logger('analyzer', 'student');

    // Provides `student` as an object with all the data that the student declared.
    mod.StudentData = Sk.misceval.buildClass(mod, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            //self.data = Sk.builtin.dict();
            var newDict = Sk.builtin.dict();
            Sk.abstr.sattr(self, 'data', newDict, true);
            self.module = Sk.executionReports['student'].module;
            if (self.module !== undefined) {
                self.module = self.module.$d;
                for (var key in self.module) {
                    if (self.module.hasOwnProperty(key)) {
                        newDict.mp$ass_subscript(Sk.ffi.remapToPy(key), 
                                                 self.module[key]);
                    }
                }
            } else {
                self.module = {};
            }
        });
        $loc.get_names_by_type = new Sk.builtin.func(function(self, type, exclude_builtins) {
            Sk.builtin.pyCheckArgs("get_names_by_type", arguments, 2, 3);
            if (exclude_builtins === undefined) {
                exclude_builtins = true;
            } else {
                Sk.builtin.pyCheckType("exclude_builtins", "boolean", Sk.builtin.checkBool(exclude_builtins));
                exclude_builtins = Sk.ffi.remapToJs(exclude_builtins);
            }
            var result = [];
            for (var property in self.module) {
                if (self.module[property].tp$name == type.tp$name) {
                    console.log(exclude_builtins);
                    if (exclude_builtins && property.startsWith("__")) {
                        continue;
                    }
                    result.push(Sk.ffi.remapToPy(property));
                }
            }
            return Sk.builtin.list(result);
        });
    
        $loc.get_values_by_type = new Sk.builtin.func(function(self, type, exclude_builtins) {
            Sk.builtin.pyCheckArgs("get_values_by_type", arguments, 2, 3);
            if (exclude_builtins === undefined) {
                exclude_builtins = true;
            } else {
                Sk.builtin.pyCheckType("exclude_builtins", "boolean", Sk.builtin.checkBool(exclude_builtins));
                exclude_builtins = Sk.ffi.remapToJs(exclude_builtins);
            }
            var result = [];
            for (var property in self.module) {
                if (self.module[property].tp$name == type.tp$name) {
                    if (exclude_builtins && property.startsWith("__")) {
                        continue;
                    }
                    result.push(self.module[property]);
                }
            }
            return Sk.builtin.list(result);
        });
    });
    mod.student = Sk.misceval.callsimOrSuspend(mod.StudentData);
    
    //Enhanced feedback functions and objects starts here
    //variable used for easy reidentification of nodes so we don't have to recreate every node type
    var flatTree = [];
    //variable used for accumulating interrupting feedback AS A LIST OF PYTHON OBJECTS
    var accInterruptFeedback = [];
    //variable used for accumulating complementary feedback AS A LIST OF PYTHON OBJECTS
    var accCompFeedback = [];
    /**
     * Generates a flat ast tree and store it in the local variable.
     * This function is meant to be used to avoid extra coding by recreating every AST node type
     *
     **/
    function generateFlatTree(){
        var parser = Sk.executionReports['parser'];
        //Tree's already been built, don't do anything else
        if(flatTree.length > 0){
            return;
        }
        var ast;
        if (parser.success) {
            ast = parser.ast;
        } else {
            return;
        }
        var visitor = new NodeVisitor();
        visitor.visit = function(node){
            flatTree.push(node);
            /** Visit a node. **/
            var method_name = 'visit_' + node._astname;
            //console.log(flatTree.length - 1 + ": " + node._astname)
            if (method_name in this) {
                return this[method_name](node);
            } else {
                return this.generic_visit(node);
            }
        }
        visitor.visit(ast);
    }
    /**
     * This function checks if the given object is one of the Sk.builtin objects
     * TODO: make this so we don't have to explicitly put out eveyr option
     *          one possible thing we could do is get a string version of the 
     *          of the constructor and look for the substring "return new Sk.builtin"
     *          But I don't know how reliable that is.  Rather, it's kind of hackish.
     * @param {object} obj - the object to be examined
     * @return {boolean} true if the object is one of the Sk.builtin types
    **/
    function isSkBuiltin(obj){
        return (obj instanceof Sk.builtin.dict) ||
            (obj instanceof Sk.builtin.list) ||
            (obj instanceof Sk.builtin.tuple) ||
            (obj instanceof Sk.builtin.bool) ||
            (obj instanceof Sk.builtin.int_) ||
            (obj instanceof Sk.builtin.float_) ||
            (obj instanceof Sk.builtin.str) ||
            (obj instanceof Sk.builtin.lng);
        //var cons_str = obj.constructor + "";
        //return cons_str.indexOf("return new Sk.builtin") !== -1;
    }
    /**
     * Should theoretically belong in Sk.ffi, but I put it here instead to not mess up the skulpt files
     * like the normal Sk.ffi.remapToPy, it doesn't work for functions or more complex objects, but it handles
     * cases where the types in obj ore a mix of python SIMPLE objects and SIMPLE normal javascript objects
     * @param {object} obj - the object to be converted
     * @return {Sk.builtin.???} - returns the corresponding python object, dropping all functions and things it can't convert
    **/
    function mixedRemapToPy(obj){
        var k;
        var kvs;
        var i;
        var arr;
        //@TODO: should theoretically check if the object is a pyhon dict or array with js objects
        if (isSkBuiltin(obj)){
            //object is already python ready
            return obj;
        } else if (Object.prototype.toString.call(obj) === "[object Array]") {
            //object is actually a javascript array
            arr = [];
            for (i = 0; i < obj.length; ++i) {
                //for each object, convert it to a python object if it isn't one already
                var subval = obj[i];
                if(!isSkBuiltin(subval)){
                    arr.push(mixedRemapToPy(subval));
                }else{
                    arr.push(subval)
                }
            }
            return new Sk.builtin.list(arr);
        } else if (obj === null) {//null object
            return Sk.builtin.none.none$;
        } else if (typeof obj === "object") {
            if(!isSkBuiltin(obj)){
                //assuming it's a standard dictionary
                kvs = [];//Sk.builtin.dict uses an array of key-value,key-value...
                for (k in obj) {
                    //convert the key if it needs to be converted
                    kvs.push(mixedRemapToPy(k));
                    //covert corresponding value if it needs to be converted
                    kvs.push(mixedRemapToPy(obj[k]));
                }
                //create the new dictionary
                return new Sk.builtin.dict(kvs);
            }else{
                return obj;
            }
        } else if (typeof obj === "string") {
            return new Sk.builtin.str(obj);
        } else if (typeof obj === "number") {
            return Sk.builtin.assk$(obj);
        } else if (typeof obj === "boolean") {
            return new Sk.builtin.bool(obj);
        } else if(typeof obj === "function") {
            return new Sk.builtin.str(obj.toString());
        }
    }
    
    /**
     * This function coverts the output in the student report to a python 
     * list and returns it.
    **/
    mod.get_output = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("get_output", arguments, 0, 0);
        if (Sk.executionReports['student'].success) {
            return mixedRemapToPy(Sk.executionReports['student']['output']());
        } else {
            return Sk.ffi.remapToPy([]);
        }
    });
    
    /**
     * This function resets the output, particularly useful if the student
     * code is going to be rerun.
     */
    mod.reset_output = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("reset_output", arguments, 0, 0);
        if (Sk.executionReports['student'].success) {
            Sk.executionReports['student']['output'].removeAll();
        }
    });

    /**
     * This function is called by instructors to construct the python version of the AST
    **/
    mod.parse_program = new Sk.builtin.func(function() {
        generateFlatTree(Sk.executionReports['verifier'].code);
        console.log(flatTree);
        return Sk.misceval.callsimOrSuspend(mod.AstNode, 0);
    });

    mod.def_use_error = new Sk.builtin.func(function(py_node) {
       var id = py_node.id;
       var node = flatTree[id];
       if((node instanceof Object) && ("_astname" in node) && node._astname == "Name"){
            var undefVars = Sk.executionReports['analyzer'].issues["Undefined variables"];
            var hasError = false;
            var name = Sk.ffi.remapToJs(node.id);
            for(var i = 0; i < undefVars.length; i += 1){
                if(undefVars[i].name == name){
                    hasError = true;
                    break;
                }
            }
            return Sk.ffi.remapToPy(hasError);
        }else{
            return Ski.ffi.remapToPy(false);
        }
    });

    /**
     * This function takes an AST node and if it's a name node, finds the type of the object
     * @param {Skulpt AST node} node - the node to check
    **/
    function checkNameNodeType(node){
        if((node instanceof Object) && ("_astname" in node) && node._astname == "Name"){
            var analyzer = Sk.executionReports['analyzer'];
            var typesList = analyzer.variables;
            var name = Sk.ffi.remapToJs(node.id);
            if (typesList[name] === undefined) {
                return Sk.ffi.remapToPy(null);
            } else {
                return Sk.ffi.remapToPy(typesList[name]["type"]);
            }
        }else{
            return Sk.ffi.remapToPy(null);
        }
    }
    /**
     * When passed a python AST node, returns the next node that isn't in this node's
     * subtree.  If such a node does not exist, returns Sk.ffi.remapToPy(null)
    **/
    function getNextTree(self){
        var visitor = new NodeVisitor();
        var currentId = self.id;//-1 to offset first iteration
        visitor.visit = function(node) {
            currentId += 1;
            /** Visit a node. **/
            var method_name = 'visit_' + node._astname;
            return this.generic_visit(node);
        }
        visitor.visit(flatTree[currentId]);
        if(currentId > flatTree.length){
            return Sk.ffi.remapToPy(null);
        }
        return Sk.misceval.callsimOrSuspend(mod.AstNode, currentId);
    }

    /**
     * Returns javascript equivalent string representation of python operator given a function that represents
     * a python operator
    **/
    function transPyOps(field){
        var op = field.name;
        console.log("op is: " + op);
        var transOp = null;
        switch(op){
            case "Add":
                transOp = "+";
                break;
            case "Div":
                transOp = "/";
                break;
            case "Mult":
                transOp = "*";
                break;
            case "Sub":
                transOp = "-";
                break;
            case "Gt":
                transOp = ">";
                break;
            case "Lt":
                transOp = "<";
                break;
            case "LtE":
                transOp = "<=";
                break;
            case "GtE":
                transOp = ">=";
                break;
            case "And":
                transOp = "&&";
                break;
            case "Or":
                transOp = "||";
                break;
            case "Not":
                transOp = "!";
                break;
            case "Eq":
                transOp = "==";
                break;
            case "NotEq":
                transOp = "!=";
                break;
            default:
                break;
        }
        return transOp;
    }

    /**
     * Python representation of the AST nodes w/o recreating the entire thing. This class assumes that parse_program
     * is called first
     * @property {number} self.id - the javascript id number of this object
     * @property {string} self.type - the javascript string representing the type of the node (_astname)
     * @property {Sk.abstr.(s/g)attr} id - the python version of self.id
     * @property {Sk.abstr.(s/g)attr} type - the python version of self.type
    **/
    mod.AstNode = Sk.misceval.buildClass(mod, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self, id) {
            self.id = Sk.ffi.remapToJs(id);//note that id is passed from PYTHON as a default type already
            self.type = flatTree[self.id]._astname;
            //Sk.abstr.sattr(self, 'type', Sk.ffi.remapToPy(self.type), true);
        });

        $loc.__eq__ = new Sk.builtin.func(function(self, other){
            return Sk.ffi.remapToPy(self.id == other.id);
        });

        /**
         * If this node is a Compare or BoolOp node, sees if the logic in expr (a javascript string being a logical statement)
         * matches the logic of self.  This assumes that we are only comparing numerical values to a single variable
         * @property {number} mag - the order of magnitude that should be added to numbers to check logic, 1 is usually
         * a good value, especially when working with the set of integers.
        **/
        $loc.numeric_logic_check = new Sk.builtin.func(function(self, mag, expr){
            if(self.type != "Compare" && self.type != "BoolOp"){
                console.log("incorrect node type: " + self.type);
                return Sk.ffi.remapToPy(null);
            }
            expr = Sk.ffi.remapToJs(expr);
            var actualAstNode = flatTree[self.id];
            //test values for the boolean expression
            var consArray = [];
            var expConsArray = []
            var consRegex = /-?(?:\d{1,})\.?(?:\d{1,})?/;
            var varRegex = /[a-zA-Z_]\w{1,}/;
            var extracts = expr.match(consRegex);
            for(var i = 0; i < extracts.length; i += 1){
                var cons = extracts[i] * 1;
                consArray.push(cons);
                expConsArray.push(cons);
                expConsArray.push(cons + mag * -1);
                expConsArray.push(cons + mag);
            }
            var compVar = expr.match(varRegex);
            if(compVar.length != 1){
                console.log("too many variables");
                return Sk.ffi.remapToPy(null);
            }else{
                compVar = "varPlaceHolder";
            }
            expr = expr.replace(varRegex, "varPlaceHolder");
            //build sudent expression
            var otherExpr = "";
            var prevWasOp = false;
            var boolOpstack = [];
            var studentVars = [];
            var fastFail = false;
            var visitor = new NodeVisitor();
            visitor.visit_BoolOp = function(node){
                otherExpr += "(";
                var values = node.values;
                for(var i = 0; i < values.length; i += 1){
                    this.visit(values[i]);
                    if(i < values.length - 1){
                        otherExpr += transPyOps(node.op);
                    }
                }
                otherExpr += ")";
            }
            visitor.visit_Name = function(node){
                if(studentVars.length == 0){
                    studentVars.push(node.id);
                }
                if(studentVars.indexOf(node.id) == -1){
                    var fastFail = true;
                }
                otherExpr += compVar + " ";
            }
            visitor.visit_Num = function(node){
                otherExpr += Sk.ffi.remapToJs(node.n) + " ";
            }
            visitor.visit_Compare = function(node){
                //left op comp op comp
                otherExpr += "(";
                this.visit(node.left);
                var comparators = node.comparators;
                var ops = node.ops;
                for(var i = 0; i < comparators.length; i += 1){
                    if(i % 2 == 1){
                        otherExpr = " && ";
                        this.visit(comparators[i-1]);
                    }
                    otherExpr += transPyOps(ops[i]);
                    this.visit(comparators[i]);

                }
                otherExpr += ")";
            }
            visitor.visit(actualAstNode);
            var varPlaceHolder = 0;
            if(fastFail){
                console.log("fast fail!");
                return Sk.ffi.remapToPy(null);
            }
            console.log(expr);
            console.log(otherExpr);
            var otherCons = otherExpr.match(consRegex);
            for(var i =0 ; i < otherCons.length; i += 1){
                if(consArray.indexOf(otherCons[i] * 1) == -1){
                    return Sk.ffi.remapToPy(false);
                }
            }
            for(var i = 0; i < expConsArray.length; i += 1){
                varPlaceHolder = expConsArray[i];
                if(eval(expr) != eval(otherExpr)){
                    return Sk.ffi.remapToPy(false);
                }
            }
            return Sk.ffi.remapToPy(true);
        });
        /**
         * This function dynamically looks to see if the ast node has a given property and does
         * remapping where it can
         * @param {obj} self - the javascript object representing the python AST node (which is also a python object)
         * @param {string} key - the property the user is trying to look up
        **/
        $loc.__getattr__ = new Sk.builtin.func(function(self, key) {
            var actualAstNode = flatTree[self.id];
            key = Sk.ffi.remapToJs(key);
            if(key == "data_type"){
                //if it's a name node, returns the data type, otherwise returns null
                return checkNameNodeType(actualAstNode);
            }
            if(key == "next_tree"){
                return getNextTree(self);
            }
            if(key == "ast_name"){
                key = "_astname";
            }
            if(key in actualAstNode){
                var field = actualAstNode[key];
                //@TODO: check for flag to see if chain assignments are allowed, otherwise return first item
                if (actualAstNode._astname == "Assign" && key == "targets"){//this means its an assignment node
                    var childId = flatTree.indexOf(field[0]);//get the relevant node
                    //console.log("Assign and targets case!" + childId);
                    return Sk.misceval.callsimOrSuspend(mod.AstNode, childId);
                } else if (field.constructor === Array && key != "ops"){
                    var astNodeCount = 0
                    var fieldArray = [];
                    //this will likely always be a mixed array
                    for(var i = 0; i < field.length; i++){
                        var subfield = field[i];
                        //if AST node, use callism and push new object
                        if(subfield instanceof Object && "_astname" in subfield){//an AST node)
                            var childId = flatTree.indexOf(subfield);//get the relevant node
                            fieldArray.push(Sk.misceval.callsimOrSuspend(mod.AstNode, childId));
                        }else{//else smart remap
                            var tranSubfield = mixedRemapToPy(subfield);
                            if(tranSubfield != undefined){
                                fieldArray.push(tranSubfield);
                            }
                        }
                    }
                    return new Sk.builtin.list(fieldArray);
                } else if (isSkBuiltin(field)){//probably already a python object
                    return field;
                } else if (field instanceof Object && "_astname" in field){//an AST node
                    var childId = flatTree.indexOf(field);//get the relevant node
                    return Sk.misceval.callsimOrSuspend(mod.AstNode, childId);
                } else {
                    switch(key){//looking for a function
                        case "ctx"://a load or store
                        case "ops"://an operator
                        case "op"://an operator
                            //the above 3 cases are functions, extract the function name
                            field = field.name;
                            return Sk.ffi.remapToPy(field);
                        default:
                            break;
                    }
                    console.log(field)
                    console.log(mixedRemapToPy(field));
                    //hope this is a basic type
                    return mixedRemapToPy(field);
                }
            }
            return Sk.ffi.remapToPy(null);
        });

        /**
         * Given the python Name ast node (variable) and self (which is automatically filled), checks
         * the AST on the javascript side to see if the node has the specified variable using the name
         * @TODO: change this so it can handle any data type as opposed to just numbers and ast nodes
         * @param {???} self - the javascript reference of this object, which is self in python.
         * @param {mod.AstNode} pyAstNode - the python object representing the variable node to look for
        **/
        $loc.has = new Sk.builtin.func(function(self, pyAstNode) {
            var rawVariableName = null;
            var rawNum = null;
            var nodeId = self.id;
            var thisNode = flatTree[nodeId];
            //got a number instead of an AST node
            if (Sk.builtin.checkNumber(pyAstNode)){
                rawNum = Sk.ffi.remapToJs(pyAstNode);
            } else {//assume it's an AST node
                //@TODO: should handle exceptions/do type checking
                var otherId = Sk.ffi.remapToJs(pyAstNode.id);
                var otherNode = flatTree[otherId];
                if(otherNode._astname != "Name"){
                    return Sk.ffi.remapToPy(false);
                }
                rawVariableName = Sk.ffi.remapToJs(otherNode.id);
            }

            var hasVar = false;
            var visitor = new NodeVisitor();
            if (rawVariableName != null){
                visitor.visit_Name = function(node){
                    var otherRawName = Sk.ffi.remapToJs(node.id);
                    if (rawVariableName == otherRawName){
                        hasVar = true;
                        return;
                    }
                    return this.generic_visit(node);
                }
            }

            if (rawNum != null){
                visitor.visit_Num = function(node){
                    var otherNum = Sk.ffi.remapToJs(node.n);
                    if (rawNum == otherNum){
                        hasVar = true;
                        return;
                    }
                    return this.generic_visit(node);
                }
            }

            visitor.visit(flatTree[nodeId]);
            return Sk.ffi.remapToPy(hasVar);
        });

        /**
         * Given a type of ast node as a string, returns all in the ast that are nodes of the specified "type"
         * valid options include BinOp, For, Call, If, Compare, Assign, Expr, note that these ARE case sensitive
         * @param {???} self - the javascript reference of this object, which is self in python.
         * @param {Sk.builtin.str} type - the python string representing the "type" of node to look for
        **/
        $loc.find_all = new Sk.builtin.func(function(self, type) {
            var items = [];
            var currentId = self.id - 1;
            var funcName = 'visit_' + Sk.ffi.remapToJs(type);
            var visitor = new NodeVisitor();
            visitor.visit = function(node) {
                currentId += 1;
                /** Visit a node. **/
                var method_name = 'visit_' + node._astname;
                if (method_name in this) {
                    return this[method_name](node);
                } else {
                    return this.generic_visit(node);
                }
            }
            visitor[funcName] = function(node){
                var skulptNode = Sk.misceval.callsimOrSuspend(mod.AstNode, currentId);
                items.push(skulptNode);
                return this.generic_visit(node);
            }
            var nodeId = self.id;
            visitor.visit(flatTree[nodeId]);
            //Don't use Sk.ffi because the objects in the array are already python objects
            return new Sk.builtin.list(items);
        });
    });
    return mod;
}
