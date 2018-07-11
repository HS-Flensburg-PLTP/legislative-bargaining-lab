/*
 * Formula.js
 *
 *  Copyright (C) 2011 Stefan Bolus, University of Kiel, Germany
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 */


function binary_to_nary (root) {
	if (root instanceof BoolVar)
		return new RuleNode (root.name);
	
	var _type = function (binnode) {
		return (binnode instanceof BoolOr) ? NaryNode.TYPE_OR : NaryNode.TYPE_AND;
	};

	var _traverse = function (nary_node, bin_node) {
		if (bin_node instanceof BoolVar) {
			return new RuleNode (bin_node.name);
		}
		else {
			var type = _type(bin_node);
			
			if (nary_node.type !== type) {
				return _traverse (new NaryNode (type), bin_node);
			}
			else {
				var l = _traverse (nary_node, bin_node.left);
				var r = _traverse (nary_node, bin_node.right);
				
				if (l !== nary_node) nary_node.addChild (l);
				if (r !== nary_node) nary_node.addChild (r);
				
				return nary_node;
			}
		}
	};

	var nary_root = new NaryNode (_type(root));
	return _traverse (nary_root, root);
}


/**
 * @constructor
 * 
 * @param arg1 Can be a formula string, a \ref NaryTree or a \ref Formula.
 * 	In the latter case the formula is copied.
 */
var Formula = function (encoderFactory,arg1) {

	/**
	 * Verifies that the rule is valid. A rule is valid if it contains each
	 * rule just once and the rules are consecutive, that is, if r is the
	 * last rule, each number in the range {1,..,r} appears.
	 * 
	 * @return Returns TRUE if the rule is valid and FALSE otherwise.
	 */
	function _verify (tree) {
		var ruleNames = [];
		var f = function (v) {
			if (v instanceof RuleNode) ruleNames.push(parseInt(v.getName()));
			return true; // continue;
		};
		tree.getRoot().traverseDFS (f, function(v){});
		
		ruleNames.sort(function(a,b){ return a-b; });
		
		/* First rule name has to be 1. */
		if (ruleNames[0] !== 1)
			return false;
		
		/* Rule names must have the form 1,2,... */
		for (var i = 1 ; i < ruleNames.length ; ++i) {
			if (ruleNames[i-1]+1 !== ruleNames[i])
				return false;
		}
		
		return true;
	}
	
	var _tree; // The nary-tree.
	var _encoderFactory;
	var _encoder;
	
	function _collectVarsForRules () {
		var vars = []; // rules index => vars for the rule.
		
		var f = function (v, par_vars) {
			
			if (v instanceof NaryNode) {
			
				var children = v.getChildren();
				for (var i = 0 ; i < children.length ; ++i) {
					var cur_vars = undefined;
					
					if (v.getType() === NaryNode.TYPE_OR)
						cur_vars = par_vars.concat(v.getVarsForChild (i));
					else cur_vars = par_vars;
						
					f(v.getChild(i), cur_vars);
				}
			}
			else /* rule node */ {
				vars.push (par_vars);
			}
		};
		
		f(this.getRoot(),[]);
		return vars;
	}
	

	if (typeof(arg1) === "string") {
		_tree = new NaryTree (binary_to_nary (parser.parse (arg1)));
		if ( !_verify (_tree))
			throw "Given formula \"" + arg1 + "\" is not valid.";
	}
	else if (typeof(arg1) == "object" && arg1 instanceof NaryTree) {
		if ( !_verify(arg1))
			throw "Given tree \"" + arg1 + "\" is not valid.";
		_tree = arg1;
	}
	else { throw "Invalid argument."; }

	_encoderFactory = encoderFactory;
	_encoder = encoderFactory.createEncoder ();
	this.getBinaryEncoder = function () { return _encoder; };

	this.getTree = function () { return _tree; };

	/* Necessary before any other result is prepared. */
	_encoder.allocVarIndicesToORNodes (_tree);


	/**
	 * Counts and returns the number of rules in a formula.
	 */
	this.getRuleCount = (function(){
		var n_rules = 0;
		var f = function (v) {
			if (v instanceof RuleNode) n_rules ++;
			return true; // continue;
		};
		_tree.getRoot().traverseDFS (f, function(v){});
		return function() { return n_rules; };
	}());


	/**
	 * Returns the number of binary variables which are necessary to encode
	 * the formula in an integer linear program (ILP). The number depends
	 * on the current \ref FormulaBinaryEncoder.
	 */
	this.getNeededVarCount = function () {
		var n_vars = 0;
		var f = function (v) {
			n_vars += _encoder.getNeededVarCount(v);
			return true;
		};
		_tree.getRoot().traverseDFS(f,function(v){});
		return n_vars;
	};


	/**
	 * Adds necessary constraints to the given model using the given
	 * binary variables.
	 * 
	 * @param vars Array containing the binary variables of type
	 * 	\ref LinearProgram.Var. Must have length Formula.getNeededVarCount().
	 * @param model The model to which the constraints are to be added.
	 * 	Must be of type LinearProgram.Model. The variables must belong to
	 * 	that model.
	 */
	this.addAuxConstrs = function (vars, model) {
		_encoder.addAuxConstrs (_tree,vars,model);
	};


	/**
	 * Returns the indices of the variables (1-indexed) which occur in the
	 * binary encoding of the i-th rule (0-indexed). The sign of the index
	 * indicates if the variable occurs in negated (-) or unnegated (+)
	 * form.
	 * 
	 * @param i The index of the rule. The first rule has index 0.
	 * @return Returns an array that contains the indices (1-indexed) in
	 * 	negated (-) or unnegated (+) form.
	 */
	this.getVarsForRule = (function (){
		var vars = _encoder.collectVarsForRules(_tree);
		return function(i) { return vars[i]; };
	}());


	this.getNegatedFormula = function () {
		var negRoot = this.getTree().getRoot().clone();
		exchange_OR_and_AND_nodes (negRoot);
		var negTree = new NaryTree (negRoot);
		
		return new Formula (_encoderFactory, negTree);
	};

	this.toString = function () {
		var s = 'Formula:\n' +
		'   Boolean formula : ' + this.getTree().getRoot().toString() + '\n' +
		'            #rules : ' + this.getRuleCount() + '\n' +
		'      #vars needed : ' + this.getNeededVarCount() + '\n';
		for (var i = 0 ; i < this.getRuleCount() ; ++i) {
			s += '   Vars for rule '+i+' : '+this.getVarsForRule(i) + '\n';
		}
		return s;
	};
};


/*abstract*/ Formula.AbstractBinaryEncoder = function() {
	return {
		allocVarIndicesToORNodes : function (tree) {
			var next_index = 1; // NOTE: -0 == 0
			var thisObject = this;
			var f = function (v) {
				if (v instanceof NaryNode && v.getType() === NaryNode.TYPE_OR) {
					v.setVarIndex(next_index);
					next_index += thisObject.getNeededVarCount(v);
				}
				return true;
			};
			tree.getRoot().traverseDFS(f,function(v){});
		},


		collectVarsForRules : function (tree) {
			var vars = []; // rules index => vars for the rule.
			var thisObject = this;

			var f = function (v, par_vars) {

				if (v instanceof NaryNode) {

					var children = v.getChildren();
					for (var i = 0 ; i < children.length ; ++i) {
						var cur_vars = undefined;

						if (v.getType() === NaryNode.TYPE_OR)
							cur_vars = par_vars.concat(thisObject.getVarIndicesForIthChild (v,i));
						else cur_vars = par_vars;

						f(v.getChild(i), cur_vars);
					}
				}
				else /* rule node */ {
					vars[parseInt(v.getName())-1] = par_vars;
				}
			};

			f(tree.getRoot(),[]);
			return vars;
		},


		/**
		 * Returns the number of binary variables that are necessary to express
		 * the given node v in a linear constraint.
		 * 
		 * @param v A node of an \ref NaryTree.
		 */
		getNeededVarCount : function (v) { throw "Pure virtual function called!"; },


		/**
		 * @note The indices are 1-indexed. An positive index indicates an
		 * 	unnegated variable while a negative one indicates a negated
		 * 	varibale.
		 */
		getVarIndicesForIthChild : function (v,i) { throw "Pure virtual function called!"; },


		/**
		 * Adds auxiliary constraints for the given \ref NaryTree and the
		 * given variables to the model. If no such constraint is needed then
		 * the model remains unchanged.
		 * 
		 * @param tree The \ref NaryTree of the formula.
		 * @param vars The binary variables. It has to hold:
		 * @code
		 * 		this.getNeededVarCount() === vars.length.
		 * @endcode
		 * 	The variables are expected to be of type LinearProgram.Var.
		 */
		addAuxConstrs : function (tree, vars, model) { throw "Pure virtual function called!"; }
	};
};


/**
 * A disjunction of constraints ai^*xi <= bi, i=1..r, can be modeled by
 * using ceil(log2(r)) binary variables plus an additional constraint if
 * r is not a power of 2. We call this an encoding. The alternative is to
 * use r binary variables plus an additional constraint. Here, the binary
 * variable decides (is 1)  which constraint has to be satisfied. E.g.
 *    ai^*xi + M*(1-si) <= bi where i=1..r
 * and
 *    s1+...+sr = 1
 * where s1..sr are binary variables. The default is to use encoded
 * branches.
 */
var DefaultBinaryEncoder = function () {

	var that = new Formula.AbstractBinaryEncoder ();
	
	/**
	 * @overload Formula.AbstractBinaryEncoder.getNeededVarCount
	 */
	that.getNeededVarCount = function (v) {
		if (v instanceof NaryNode && v.getType() === NaryNode.TYPE_OR)
			return v.getChildren().length;
		else return 0;
	};
	
	/**
	 * @overload Formula.AbstractBinaryEncoder.getVarIndicesForIthChild
	 */
	that.getVarIndicesForIthChild = function (v,i) {
		return [-(parseInt(v.getVarIndex()) + i)];
	};
	
	/**
	 * @overload Formula.AbstractBinaryEncoder.addAuxConstrs
	 */
	that.addAuxConstrs = function (tree, vars, model) {
		var nodes = tree.getORNodes ();
		
		for (var k in nodes) {
			var v = nodes[k];
			var index = v.getVarIndex();
			var n_children = v.getChildren().length;
			
			var expr = new LinearProgram.LinExpr ();
			for (var j = 0 ; j < n_children ; ++j) {
				expr.add (1.0, vars[index-1+j]); // index starts at 1
			}
			
			model.addConstr (expr, LinearProgram.LP_EQUAL, 1);
		};
	};
	
	return that;
};


/**
 * Similar to DefaultBinaryEncoder, but uses inverted binary variables. 
 */
var InvertedDefaultBinaryEncoder = function () {
	var that = new DefaultBinaryEncoder ();

	/* Overwrite the method but use the parent's method. */
	that.getVarIndicesForIthChild = (function(){
		var parentFunc = that.getVarIndicesForIthChild;
		return function (v,i) {
			var ret = parentFunc(v,i);
			ret[0] = -ret[0];
			return ret;
		};
	}());
	
	that.addAuxConstrs = function (tree, vars, model) {
		var nodes = tree.getORNodes ();
		for (var k in nodes) {
			var v = nodes[k];
			var index = v.getVarIndex();
			var n_children = v.getChildren().length;
			
			var expr = new LinearProgram.LinExpr ();
			for (var j = 0 ; j < n_children ; ++j) {
				expr.add (1.0, vars[index-1+j]); // index starts at 1
			}
			
			model.addConstr (expr, LinearProgram.LP_EQUAL, n_children-1);
		}
	};
	
	return that;
};


var DualEncodedBinaryEncoder = function () {

	var that = new Formula.AbstractBinaryEncoder ();

	/**
	 * Returns the bit presentation of n and and n_bits. as an array.
	 */
	function to_bits (n, n_bits, var_args) {
		var bits = [];
		var i;
		if (n_bits === undefined)
			i = Math.ceil(Math.log(n) * Math.LOG2E);
		else
			i = n_bits - 1;
		var r = n; // remainder

		for ( ; i >= 0 ; --i) /* internal repr. of ints. */ {
			var x = Math.pow(2, i);

			if (r >= x) { // (i+1)-th bit is set (1-indexed). 
				bits[i] = true;
				r -= x;
			}
			else bits[i] = false;
		}

		return bits;
	};


	/**
	 * @overload Formula.BinaryEncoder.getNeededVarCount
	 */
	that.getNeededVarCount = function (v) {
		if (v instanceof NaryNode && v.getType() === NaryNode.TYPE_OR)
			return Math.ceil(Math.log(v.getChildren().length) * Math.LOG2E);
		else return 0;

	};

	/**
	 * @overload Formula.BinaryEncoder.getVarsForChild
	 */
	that.getVarIndicesForIthChild = function (v,i) {
		var bits = to_bits (i, this.getNeededVarCount(v));
		var ret = [];
		var index = v.getVarIndex();
		for (var k = 0 ; k < bits.length ; ++k, ++index) {
			if (bits[k]) ret.push(-index); // negated
			else ret.push(index);
		}
		return ret;
	};

	that.addAuxConstrs = function (tree, vars, model) {
		var nodes = tree.getORNodes ();
		for (var k in nodes) {
			var v = nodes[k];
			var index = v.getVarIndex();
			var n_needed = this.getNeededVarCount(v);
			var n_children = v.getChildren().length;

			if (Math.pow(2,n_needed) != n_children) {
				var expr = new LinearProgram.LinExpr ();
				for (var j = 0 ; j < n_needed ; ++j) {
					var coeff = Math.pow(2, j);
					expr.add (coeff, vars[index-1+j]); // index starts at 1
				}
				model.addConstr (expr, LinearProgram.LP_LESS_EQUAL, n_children-1);
			}
		}
	};

	return that;
};