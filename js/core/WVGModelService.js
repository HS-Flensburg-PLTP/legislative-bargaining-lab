/*
 * WVGModelService.js
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


/**
 * @constructor
 * 
 * @code
console.clear ();
var buf = '';
function write (s) { buf += s + '\n'; }

var service = new WVGModelService (game);
service.setPreserveTypes(true);
service.setIntegerVars(false);
service.setCollapseSingleRefNodes(true);
service.setPresolve(false);

try {
    var model = service.getModel();
    var builder = new CPLEX_LPBuilder (write);
    model.build(builder);
    document.getElementById('input').value = buf;
} catch (e) {
    console.log("Not weighted! Reason:\n" + e);
}
undefined;
 * @endcode
 * 
 * 
 */
function WVGModelService (game)
{
	var n	 = game.getPlayerCount();
	var alad = game.getAlad();
	var W 	 = game.getWinQOBDD();
	var root = W.getRoot();

		
	// Private variables and defaults settings
	var preserveTypes   = true;
	var integerVars     = true;
	var objective       = WVGModelService.OBJ_MIN_QUOTA;
	var presolve		= true; 		
	
	var collapseSingleRefNodes = true;
	
	this.setPreserveTypes = function (yesno) { preserveTypes = yesno; };
	this.getPreserveTypes = function () { return preserveTypes; };
	
	this.setIntegerVars = function (yesno) { integerVars = yesno; };
	this.getIntegerVars = function () { return integerVars; };
	
	this.setObjective = function (obj) { objective = obj; };
	this.getObjective = function () { return objective; };

	this.setCollapseSingleRefNodes = function (yesno) { collapseSingleRefNodes = yesno; };
	this.getCollapseSingleRefNodes = function () { return collapseSingleRefNodes; };

	this.setPresolve = function (yesno) { presolve = yesno; };
	this.getPresolve = function () { return presolve; };
	
	this.getModel = function () {
		
		if (this.getPresolve()) {
			// If the result is true, return the result anyway.
			if ( game.isWeighted() === false) {
				throw new WVGModelService.NotWeighted (game.getNotWeightedWitness().toString());
			}
		}
		
		var preorder = alad.getPreorder();
		var equiv = null; // Union-Find
		if ( this.getPreserveTypes())
		    equiv = preorder.getEquivClasses();
		else {
			equiv = new UnionFind (n);
		}	

		var reps = equiv.getReps();

		var model = new LinearProgram.Model ();
		model.setModelSense (LinearProgram.LP_MINIMIZE);

		// Model variables.
		var weights = [], lowerBounds = [], upperBounds = [];

		/* Convenience function to access the weights. This function also 
		 * covers the types. */
		var w = function (level) { return weights[equiv.find(level)]; };

		// Convenience function to access the variables for the lower and upper bounds.
		var lb = function (v) { return lowerBounds[v.getId()]; };
		var ub = function (v) { return upperBounds[v.getId()]; };

		/* Create the variables for the weights. */
		var varType = LinearProgram.LP_CONTINUOUS;
		if (this.getIntegerVars()) varType = LinearProgram.LP_INTEGER;
	
		for (var i = 0 ; i < n ; ++i)
			weights.push (model.addVar ('w_'+i, varType));

		/* Lower and upper bounds for the QOBDD nodes. */
		var V = W.collectNodes(); /* nodes on levels */
		QOBDD.one.value  = 1;
		QOBDD.zero.value = 0;

		/* Create variables for ZERO and ONE */
		lowerBounds[QOBDD.one.getId()]  = model.addVar ('lb_ONE',  LinearProgram.LP_CONTINUOUS, 0.0, -Infinity);
		upperBounds[QOBDD.one.getId()]  = model.addVar ('ub_ONE',  LinearProgram.LP_CONTINUOUS, 0.0, 0.0, 0.0);
		lowerBounds[QOBDD.zero.getId()] = model.addVar ('lb_ZERO', LinearProgram.LP_CONTINUOUS, 0.0, 0.0, 0.0);
		upperBounds[QOBDD.zero.getId()] = model.addVar ('ub_ZERO', LinearProgram.LP_CONTINUOUS, 0.0);

		/* Create variables for the root node. */
		lowerBounds[root.getId()] = model.addVar ('lb_root');
		upperBounds[root.getId()] = model.addVar ('ub_root');

		var refs = W.countRefs ();
		
		/* Create model variables for the remaining nodes with a reference > 1. */
		W.traverseInner (function(u) { u.value = u.t.value + u.e.value; return true; });
		for (var i = n-1 ; i >= 1 ; --i) {		
			/* If the nodes are totally ordered w.r.t strict set inclusion
			 * that order is the same as if we ordered the nodes by their 
			 * #set(v) values. */
			V[i].sort(function(u,v){ return v.value - u.value; });

			for (var j = 0 ; j < V[i].length ; ++j) {
				var v = V[i][j];
				if (!this.getCollapseSingleRefNodes() || refs(v) > 1) {
					var id = v.getId();
					lowerBounds[id] = model.addVar ('lb_' + id);
					upperBounds[id] = model.addVar ('ub_' + id);
				}
			}
		}

		/* Set lower bounds of ONE_i which can be -Infinity. */
		for (var i = 0 ; i < n ; ++i)
			if (V[i][0].isRedundant() && lb(V[i][0]) !== undefined)
				lb(V[i][0]).setLowerBound (-Infinity);

		/* Set the variables in the model's objective function. */
		switch (this.getObjective()) {
		case WVGModelService.OBJ_MIN_WEIGHTS:
			for (var i in reps) {
				w(reps[i]).setObjective (equiv.getSetOf(reps[i]).length);
			}
			break;
		case WVGModelService.OBJ_MIN_QUOTA:
			/* Possible values for the quota are in the open interval
			 * (lb(root), ub(root)]. */
			lb(W.getRoot()).setObjective (1.0);
			break;
		default:
			throw "Unknown objective function in WVGModelService: " + this.getObjective() + ".";
		}
		
		var order = alad.getNonIncrOrder();
		/* Create constraints for the ordering of the equivalence classes. */
		var strongerPlayer = order[0];
		for (var i = 1 ; i < order.length ; ++i) {
			if (equiv.find(strongerPlayer) != equiv.find(order[i])) {
				var expr = new LinearProgram.LinExpr ();
				expr.addTerms ([-1, 1], [ w(strongerPlayer), w(order[i]) ]);
				strongerPlayer = order[i];
				model.addConstr (expr, LinearProgram.LP_LESS_EQUAL, -1.0);
			}
		}

		// Add constraint for l_root - u_root <= -1.
		model.addConstr ((new LinearProgram.LinExpr()).add(1.0,lb(root))
				.subtract(1.0,ub(root)), LinearProgram.LP_LESS_EQUAL, -1.0);
		
		
		if (this.getCollapseSingleRefNodes()) {
			
			function ConstrBuilder (varForNodeFunc, weightVars, weightIndexForLevelFunc, sense) {
				var startNode = undefined;

				var coeffs = [];
				for (var i = 0 ; i < weightVars.length ; ++i)
					coeffs.push (0);

				function f (v, handleNodeFunc) {
					if (v.isConst())
						throw "Bad! v is a terminal node.";

					var index = weightIndexForLevelFunc (v.getVar());

					// Because we have a <= constraint and the weights are always non-
					// negative, this case is covered by the 0-edge case.
					if ( !(v.isRedundant() && sense === LinearProgram.LP_LESS_EQUAL)) {
						coeffs[index] ++;
						handleNodeFunc (v.getThen());
						coeffs[index] --;
					}

					// Because we have a >= constraint and the weights are always non-
					// negative, this case is covered by the 1-edge case.
					if ( !(v.isRedundant() && sense === LinearProgram.LP_GREATER_EQUAL)) {
						handleNodeFunc (v.getElse());
					}
				} 

				function recurse (v) {
					if (v.isConst()) createConstr(v);
					else if (refs(v) > 1) createConstr(v);
					else f(v, recurse);
				}

				function createConstr (v) {
					// lower: add l_<start> >= l_v + coeffs^ * weightVars to the model.
					var expr = new LinearProgram.LinExpr ();
					expr.add (1.0, varForNodeFunc(startNode));
					expr.subtract (1.0, varForNodeFunc(v));
					expr.subtractTerms (coeffs, weightVars);
					var constr = model.addConstr (expr, sense, 0.0);
				}

				return {
					processNode : function (v) {
						startNode = v;
						f(v, recurse);
					}
				};
			};

			function weightIndexForLevel (level) { return equiv.find(level); }

			var lbBuilder = new ConstrBuilder (lb,
					weights, weightIndexForLevel, LinearProgram.LP_GREATER_EQUAL);
			var ubBuilder = new ConstrBuilder (ub,
					weights, weightIndexForLevel, LinearProgram.LP_LESS_EQUAL);

			/* Constraints for the inner nodes. */
			for (var lev = 0 ; lev < n ; ++lev) {
				var L = V[lev];

				/* First the general constraints on that level, i.e. l < u and u_prev <= l */
				for (var j = 0 ; j < L.length ; ++j) {

					if (refs(L[j]) === 0 || refs(L[j]) > 1) {
						lbBuilder.processNode (L[j]);
						ubBuilder.processNode (L[j]);
					}
				}
			}
		}
		else /* no collapse single ref nodes */ {
			W.traverseInner (function (v) {
				var lev = v.getVar();
				model.addConstr( (new LinearProgram.LinExpr()).addTerms([1,1,-1], [ lb(v.t), w(lev), lb(v) ]), LinearProgram.LP_LESS_EQUAL, 0.0 );
				model.addConstr( (new LinearProgram.LinExpr()).addTerms([1,-1], [ lb(v.e), lb(v) ]), LinearProgram.LP_LESS_EQUAL, 0.0 );
				
				model.addConstr( (new LinearProgram.LinExpr()).addTerms([1,-1,-1], [ ub(v), ub(v.t), w(lev) ]), LinearProgram.LP_LESS_EQUAL, 0.0 );
				model.addConstr( (new LinearProgram.LinExpr()).addTerms([1,-1], [ ub(v), ub(v.e)]), LinearProgram.LP_LESS_EQUAL, 0.0 );
				return true;
			}, function (v) {});
		}
		
		
		/* If we have created a type preserving linear program, it may have
		 * happened that some weights were not used. Tie these variables to
		 * the representing weight. This simplifies to read the result of the
		 * model afterwards if there is one. */
		if ( this.getPreserveTypes()) {
			for (var i in reps) {
				var symm = preorder.getEquivClassOf(reps[i]);
				for (var k in symm) {
					if (reps[i] != symm[k]) {
						// NOTE: w(..) cannot be used for a non-representative.
						model.addConstr( (new LinearProgram.LinExpr().addTerms([1, -1], [ w(reps[i]), weights[symm[k]] ])),
								LinearProgram.LP_EQUAL, 0.0);
						//s += indent + w(reps[i]) + MINUS + weights[symm[k]]  ' = 0\n';
					}
				}
			}
		}
		
		return model;
	};
}

WVGModelService.OBJ_MIN_QUOTA   = 1;
WVGModelService.OBJ_MIN_WEIGHTS = 2;

WVGModelService.NotWeighted = function (reason) {
	this.toString = function () { return reason; };
 };
