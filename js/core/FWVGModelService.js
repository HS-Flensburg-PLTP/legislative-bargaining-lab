/*
 * FWVGModelService.js
 *
 *  Copyright (C) 2011,2012 Stefan Bolus, University of Kiel, Germany
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



/*
console.clear();

var print = function (s) {
    console.log(s + "\n");
}

var factory = {
	createEncoder : function () {
	  return new DefaultBinaryEncoder();
	  //return new DualEncodedBinaryEncoder();
	}
};

var f = new Formula(factory, '1&(2|3)');
print(f);

var fNeg = f.getNegatedFormula ();
print(fNeg);
print("Original (again) " + f);

var bounds = {
    getMinQuotaForRule : function (t) { return 5; },
    getMaxQuotaForRule : function (t) { return 1000; },
    getMinModelWeightForRule : function (m, t) { return 6; },
    getMaxModelWeightForRule : function (m, t) { return 2000; }
};


var service = new FWVGModelService (game, f, bounds);
service.setTypePreserving(true);
//service.setWeightPreserving(true);

var model = service.getModel ();
var builder = new CPLEX_LPBuilder ();
model.build (builder);
print (builder.getResult());
*/

/**
 * @constructor
 * 
 * @param game The \ref SimeplGame.
 * @param fStr The \ref Formula.
 * @param bounds Has to implement getMin/MaxQuotaForRule(t),
 * 	getMin/MaxCoalWeightForRule(obj,t) and
 *  getMin/MaxModelWeightForRule(obj,t).
 */
var FWVGModelService = function F(game,f,bounds) {

	var _game    = game;
	var _f		 = f;
	var _fNeg 	 = _f.getNegatedFormula();
	var _bounds  = bounds ;

	var _typePreserving   = false; // use coals OR models
	var _weightPreserving = false; // use shift-min-win/-max-losing? OR min-win/max-losing.

	var _modelFactory = function () { return new LinearProgram.Model (); };
	
	/**
	 * weights[n_rules][m]
	 */
	function _addWeightPreservingConstrs (preorder, model, weights) {
		var m = weights[0].length;
		var n_rules = weights.length;
		
		if (false && preorder.isTotal()) /* easy */ {
			// TODO: Game has to be directed for this. Use Preorder.getNonIncrOrder?
			
			for (var i = 0 ; i < m-1 ; ++i) {
				for (var t = 0 ; t < n_rules ; t ++) {
					var expr = new LinearProgram.LinExpr ();
					expr.addTerms ([1.0, -1.0], [weights[t][i],weights[t][i+1]]);
					model.addConstr (expr, LinearProgram.LP_GREATER_EQUAL, 0.0);
				}
			}
		}
		else {
			for (var i = 0 ; i < m ; ++i) {
				var succs = preorder.getDirectSuccessorsOf(i); // i >_I every j in succs.
				for (j in succs) {
					for (var t = 0 ; t < n_rules ; t ++) {
						// w[t][i] >= w[t][succs[j]]
						var expr = new LinearProgram.LinExpr ();
						expr.addTerms ([1.0, -1.0], [weights[t][i],weights[t][succs[j]]]);
						model.addConstr (expr, LinearProgram.LP_GREATER_EQUAL, 0.0);
					}
				}
			}
		}
	};
	
	
	/**
	 * Version for winning coals/models. varIndices has contain a
	 * negative/positive value for each auxiliary variable in vars.
	 * 
	 * @param M The large value used in the expression.
	 * 
	 * \return Returns the right-hand side.
	 */
	function _addFormulaVarsToLinExpr_W (expr, M, varIndices, vars) {
		var rhs = 0.0;
		
		if (M < 0)
			throw "_addFormulaVarsToLinExpr_W: M is negative: " + M;
		
		for (var j in varIndices) {
			var index = Math.abs(varIndices[j]) - 1 /*1-indexed*/;
			
			if (varIndices[j] < 0) { /* negated , i.e. (1-s) */ 
				// A+M(1-s)>=0 iff A-M>=-M iff (A>=0 or s=0)
				expr.add (-M, vars[index]); //
				rhs += -M;
			}
			else {
				expr.add (M, vars[index]); // A + M*s >= 0 iff (A>=0 or s=1)  
			}
		}
		return rhs;
	}
	
	
	/**
	 * Version for losing coals/models.varIndices has contain a
	 * negative/positive value for each auxiliary variable in vars.
	 * 
	 * @param M The large value used in the expression.
	 * 
	 * \return Returns the right-hand side.
	 */
	function _addFormulaVarsToLinExpr_L (expr, M, varIndices, vars) {
		var rhs = 0.0;

		if (M < 0)
			throw "_addFormulaVarsToLinExpr_L: M is negative: " + M;
		
		for (var j in varIndices) {
			var index = Math.abs(varIndices[j]) - 1 /*1-indexed*/;
			if (varIndices[j] < 0) { /* negated, i.e. (1-s) */
				// A-M(1-s) <= 0 iff (A<=0 or s=0)
				expr.add (+M, vars[index]);
				rhs += M;
			}
			else {
				expr.add (-M, vars[index]); // A-M*s <= 0 iff A<=0 or s=1)
			}
		}
		return rhs;
	};

	
	function _coeffsFromModel (m, n_types /*ignored*/) {
		return m.slice(0);
	};
	
	
	function _coeffsFromCoal (coal, n_players) {
		var coeffs = [];
		for (var i = 0 ; i < n_players ; ++i) coeffs[i] = 0.0;
		for (var j in coal)
			coeffs[coal[j]] = 1.0;
		return coeffs;
	};
	
	
	function _getModelSkeleton (
			n /*players or types*/,
			weightObjectives,
			WObjCount, LObjCount,
			addWeightConstrs,
			getWObjs, getLObjs,
			enumWObjs, enumLObjs,
			getCoeffsFromObj,
			getMinObjWeightForRule,
			getMaxObjWeightForRule) {
		
		var model = _modelFactory ();
		model.setModelSense (LinearProgram.LP_MINIMIZE);
		
		var n_rules = _f.getRuleCount();
		var n_Wbins = _f.getNeededVarCount(); // per object
		var n_Lbins = _fNeg.getNeededVarCount(); // per object	
		
		var weights = [], quotas = [], Wbinaries = [], Lbinaries = [];
		
		/* Create the variables for the weights. */
		for (var t = 0 ; t < n_rules ; ++t) {
			weights[t] = [];
			for (var i = 0 ; i < n ; ++i) {
				var name = "w_" + (1+i) + "_" + (1+t);
				var coeff;
				if (typeof(weightObjectives) === 'function')
					coeff = weightObjectives(i);
				else coeff = weightObjectives[i];
				weights[t][i] = model.addVar (name, LinearProgram.LP_INTEGER, coeff);
			}
		}
		
		/* Create the variables for the quotas. */
		for (var t = 0 ; t < n_rules ; ++t) {
			quotas[t] = model.addVar ("Q_" + (1+t), LinearProgram.LP_INTEGER, 0.0, 1.0, Infinity);
		}
		
		/* Create the variables for the formula. */
		for (var k = 0 ; k < WObjCount ; ++k) {
			Wbinaries[k] = [];
			for (var j = 0 ; j < n_Wbins ; ++j) {
				Wbinaries[k][j] = model.addVar("sW_" + k + '_' + j, LinearProgram.LP_BINARY);
			}
		}
		
		for (var k = 0 ; k < LObjCount ; ++k) {
			Lbinaries[k] = [];
			for (var j = 0 ; j < n_Lbins ; ++j) {
				Lbinaries[k][j] = model.addVar("sL_" + k + '_' + j, LinearProgram.LP_BINARY);
			}
		}

		if (addWeightConstrs && n > 1)
			addWeightConstrs (model, weights);

		/* Prepare the values for the max/min quotas for the rules. These do
		 * not depend on the actual objects and hence, it is a good idea to do
		 * some caching for sake of speed. */
		var Qmin = [], Qmax = [];
		for (var t = 0 ; t < n_rules ; ++t) {
			Qmin.push (_bounds.getMinQuotaForRule(t));
			Qmax.push (_bounds.getMaxQuotaForRule(t));
		}
			
		/* Add constraints for the winning objects. */
		var k = 0; // used inside the function that enumerate W-/Lobjs
		
		enumWObjs (function (obj) {
			print (".");
			
			var coeffs = getCoeffsFromObj (obj, n);
			
			for (var t = 0 ; t < n_rules ; ++t) {
				var expr = new LinearProgram.LinExpr ();
				expr.addTerms (coeffs, weights[t]);
				expr.add (-1.0, quotas[t]);
				
				var M = Qmax[t] - getMinObjWeightForRule (obj, t);
				var rhs = _addFormulaVarsToLinExpr_W  (expr, M,
						_f.getVarsForRule (t), Wbinaries[k]);
				model.addConstr (expr, LinearProgram.LP_GREATER_EQUAL, rhs);
			}

			_f.addAuxConstrs (Wbinaries[k], model);
			
			++k;
			return true; // continue;
		});
		
		k = 0; // used inside. See above for more information.
		
		/* Add constraints for the losing objects. */
		enumLObjs (function (obj) {		
			var coeffs = getCoeffsFromObj (obj, n);
			
			for (var t = 0 ; t < n_rules ; ++t) {
				var expr = new LinearProgram.LinExpr ();
				expr.addTerms (coeffs, weights[t]);
				expr.add (-1.0, quotas[t]);
				
				var M = getMaxObjWeightForRule (obj, t) - Qmin[t];
				var rhs = -1.0 + _addFormulaVarsToLinExpr_L (expr, M,
						_fNeg.getVarsForRule (t), Lbinaries[k]);
				model.addConstr (expr, LinearProgram.LP_LESS_EQUAL, rhs);
			}

			_fNeg.addAuxConstrs (Lbinaries[k], model);
			
			++k;
			return true; // continue
		});
		
		return model;
	};
	
	
	/**
	 * Preserves types and weights. Use Models of shift-minimal winning and
	 * shift-maximal losing coalitions.
	 */
	function _getModel_T_W () {
		/* Prepare the coefficients for the objective function. */
		var eqs = _game.getAlad().getSymmetryClasses();
		var weightObjectives = [];
		for (var j in eqs) weightObjectives.push(eqs[j].length);
		
		return _getModelSkeleton (
				game.getAlad().getTypeCount(),
				weightObjectives,
				_game.getShiftMinWinModelCount(),
				_game.getShiftMaxLosingModelCount(),
				function (model, weights) {
					_addWeightPreservingConstrs (_game.getAlad().getTypeOrder(), model, weights);
				},
				function() { return _game.getShiftMinWinModels(); },
				function() { return _game.getShiftMaxLosingModels(); },
				function(f) { return _game.enumShiftMinWinModels(f); },
				function(f) { return _game.enumShiftMaxLosingModels(f); },
				_coeffsFromModel,
				function (obj,t) { return _bounds.getMinModelWeightForRule(obj,t); },
				function (obj,t) { return _bounds.getMaxModelWeightForRule(obj,t); }
		);
	};
	
	
	/**
	 * Preserves types. Use Models of minimal winning and maximal losing
	 * coalitions.
	 */
	function _getModel_T () {		
		return _getModelSkeleton (
				_game.getAlad().getTypeCount(),
				function (i) { return _game.getAlad().getSymmetryClasses()[i].length; },
				_game.getMinWinModelCount(),
				_game.getMaxLosingModelCount(),
				undefined /*addWeightConstrs*/,
				function () { return _game.getMinWinModels(); },
				function () { return _game.getMaxLosingModels(); },
				function(f) { return _game.enumMinWinModels(f); },
				function(f) { return _game.enumMaxLosingModels(f); },
				_coeffsFromModel,
				function (obj,t) { return _bounds.getMinModelWeightForRule(obj,t); },
				function (obj,t) { return _bounds.getMaxModelWeightForRule(obj,t); });
	};
	
	
	/**
	 * Preserves weights. Uses shift-minimal winning and shift-maximal losing
	 * coalitions.
	 */
	function _getModel_W () {
		return _getModelSkeleton (
				_game.getPlayerCount(),
				function (i) { return 1.0; },
				_game.getShiftMinWinCount(),
				_game.getShiftMaxLosingCount(),
				function (model, weights) {
					_addWeightPreservingConstrs (_game.getAlad().getPreorder(), model, weights);
				},
				function() { return _game.getShiftMinWinCoals(); },
				function() { return _game.getShiftMaxLosingCoals(); },
				function(f) { return _game.enumShiftMinWinCoals(f); },
				function(f) { return _game.enumShiftMaxLosingCoals(f); },
				_coeffsFromCoal,
				function (obj,t) { return _bounds.getMinCoalWeightForRule(obj,t); },
				function (obj,t) { return _bounds.getMaxCoalWeightForRule(obj,t); });
	};

	
	/**
	 * Preserves neither types and weights. The minimal winning and the maximal
	 * losing coalitions are used.
	 */
	function _getModel () {
		return _getModelSkeleton (
				_game.getPlayerCount(),
				function (i) { return 1.0; },
				_game.getMinWinCount(),
				_game.getMaxLosingCount(),
				undefined /*addWeightConstrs*/,
				function() { return _game.getMinWinCoals(); },
				function() { return _game.getMaxLosingCoals(); },
				function(f) { return _game.enumMinWinCoals(f); },
				function(f) { return _game.enumMaxLosingCoals(f); },
				_coeffsFromCoal,
				function (obj,t) { return _bounds.getMinCoalWeightForRule(obj,t); },
				function (obj,t) { return _bounds.getMaxCoalWeightForRule(obj,t); });
	};
	
	this.setTypePreserving = function (yesno) { _typePreserving = yesno; };
	this.getTypePreserving = function () { return _typePreserving; };

	this.setWeightPreserving = function (yesno) { _weightPreserving = yesno; };
	this.getWeightPreserving = function () { return _weightPreserving; };

	this.getGame 	= function () { return _game; };
	this.getFormula = function () { return _f; };
	this.getBounds 	= function () { return _bounds; };

	
	/**
	 * Sets the model factory which has to return a LinearProgram.Model 
	 * compatible model. The default factory returns a new instance of that
	 * type.
	 */
	this.setModelFactory = function (factory) { _modelFactory = factory; };
	
	
	/**
	 * @param fStr Formular which describes how the rules are connected.
	 * @param game \ref SimpleGame object.
	 */
	this.getModel = function (modelFactory) {	
		if (_typePreserving && _weightPreserving)
			return _getModel_T_W ();
		else if (_typePreserving)
			return _getModel_T ();
		else if (_weightPreserving)
			return _getModel_W ();
		else
			return _getModel ();
	};
};
