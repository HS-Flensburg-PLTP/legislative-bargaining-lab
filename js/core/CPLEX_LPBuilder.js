/*
 * CPLEX_LPBuilder.js
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
 * See http://lpsolve.sourceforge.net/5.0/CPLEX-format.htm for details of the format.
 * 
 * @param println Function with a single string parameter to print a line.
 * 	If not given the output is collected and can be queried by getResult.
 */
function CPLEX_LPBuilder (println) // implements LinearProgram.Builder
{
	this._vs = []; // maps var's name -> var
	this._sense = null;

	var _println = println;
	
	/**
	 * Implements \ref LinearProgram.Builder.setModelSense. Called before any
	 * variable is added.
	 */
	this.setModelSense = function (sense) { this._sense = sense; };

	this._isFirstConstr = true;
	this._isFirstBound = true;

	this._indent = '\t';

	var _buf = '';
	if (_println === undefined) {
		_println = function (l) { _buf += l + '\n'; };
	}

	/**
	 * Converts a \ref LinearProgram.LinExpr into a string for the output in
	 * CPLEX format. This is used in the objective and the constraints.
	 */
	this._render = function (e) {
		var s = '';
		
		if (e instanceof LinearProgram.LinExpr) {
			var pairs = e.getPairs();
			var isFirstCoeff = true;
			for (var name in pairs) {
				var coeff = pairs[name];
				if (parseFloat(coeff) === 0.0)
					continue;
				if (!isFirstCoeff) {
					if (coeff < 0.0) s += ' - ';
					else s += ' + ';
				}
				else {
					isFirstCoeff = false;
					if (coeff < 0.0) s += '-';
				}

				/* Ignore coefficients which are 1.0 or -1.0. */
				if (Math.abs(coeff) !== 1.0)
					s += Math.abs(coeff) + ' ';
				s += name;
			}
		}
		
		return s;
	};
	
	/**
	 * Adds the objective function to the buffer after all variables where
	 * added and before the first constraint is added.
	 */
	this._addObjective = function () {
		if (this._sense === LinearProgram.LP_MINIMIZE) _println ("Minimize");
		else _println ("Maximize");

		var e = new LinearProgram.LinExpr ();
		for (var name in this._vs) {
			var v = this._vs[name];
			if (v.getObjective() !== 0)
				e.add (v.getObjective(), v);
		}
		
		_println (this._indent + this._render(e));
	};

	/**
	 * Implements \ref LinearProgram.Builder.addVar. Called before any
	 * constraint is added.
	 */
	this.addVar = function (v) { this._vs[v.getName()] = v; };

	
	/**
	 * Implements \ref LinearProgram.Builder.addContr .
	 */
	this.addConstr = function (c) {
		if (this._isFirstConstr) {
			this._isFirstConstr = false;
			this._addObjective();

			_println("Subject To");
		}

		var s = this._indent;

		/* TODO: Only allowed names. */
		if (c.hasName())
			s += c.getName() + ': ';

		s += this._render (c.getLhsExpr());

		switch (c.getSense()) {
		case LinearProgram.LP_GREATER_EQUAL: s += ' >= '; break;
		case LinearProgram.LP_EQUAL: s += ' = '; break;
		case LinearProgram.LP_LESS_EQUAL: s += ' <= '; break;
		default: throw 'Unknown sense for constraint: "'+c.getSense()+'"';
		}

		s += c.getRhsConstant ();

		_println (s);
	};


	/**
	 * Only adds bound if necessary.
	 */
	this._addBound = function (v) {
		var lb = v.getLowerBound(), ub = v.getUpperBound();

		/* Default values in CPLEX are 0 for the lower bound and +Infinity for
		 * the upper bound. */
		if (v.isBinary() || lb === 0.0 && ub === Infinity)
			return;
		else {
			if (this._isFirstBound) {
				this._isFirstBound = false;
				_println ("Bounds");
			}

			var s = this._indent;

			var toVal = function (x) {
				return (x === Infinity) ? '+inf' : (x === -Infinity) ? '-inf' : x;
			}; 
			
			/* Only add the necessary bounds which are not covered by default. */
			if (lb === ub) 
				s += v.getName() + ' = ' + toVal(lb);
			else if (ub === Infinity)
				s += toVal(lb) + ' <= ' + v.getName();
			else if (lb === 0)
				s += v.getName() + ' <= ' + toVal(ub);
			else
				s += toVal(lb) + ' <= ' + v.getName() + ' <= ' + toVal(ub);

			_println (s);
		}
	};

	/**
	 * Implements \ref LinearProgram.Builder.close. Called after the last
	 * constraint were added.
	 */
	this.close = function () {
		var intVars = [];
		var binVars = [];

		/* Add bounds for the variables that need bounds and collect 
		 * binary and integer variables. */
		for (var name in this._vs) {
			var v = this._vs[name];
			this._addBound (v);

			if (v.isInteger()) intVars.push(name);
			else if (v.isBinary()) binVars.push(name); 
		}

		/* Declare integer and binary variables. */
		if (intVars.length > 0) {
			_println ("General");
			_println (this._indent + intVars.join(' '));
		}

		if (binVars.length > 0) {
			_println ("Binary");
			_println (this._indent + binVars.join(' '));
		}

		_println ("End");
	};

	this.getResult = function () { return _buf; };
}


//var model = new LinearProgram.Model ();
//
//model.setModelSense (LinearProgram.LP_MAXIMIZE);
//
//var x1 = model.addVar('x1', LinearProgram.LP_CONTINUOUS, -1.0, -Infinity, 40);
//var x2 = model.addVar('x2', LinearProgram.LP_CONTINUOUS, 2.0);
//var x3 = model.addVar('x3', LinearProgram.LP_BINARY, 3.0);
//var x4 = model.addVar('x4', LinearProgram.LP_INTEGER, 1.0, 2, 3);
//
//var e = new LinearProgram.LinExpr ();
//e.subtract (1, x1);
//e.add (1, x2);
//e.add (1, x3);
//e.add (10, x4);
//e.setConstantCoeff (-10);
//
//model.addConstr (e, LinearProgram.LP_LESS_EQUAL, 10 /* 10 + (-10) = 20 */, "first_constr");
//
//var e2 = new LinearProgram.LinExpr ();
//e2.addTerms ([1,-3,1], [x1,x2,x3]);
//
//model.addConstr (e2, LinearProgram.LP_GREATER_EQUAL, 30);
//
//var e3 = new LinearProgram.LinExpr ();
//e3.add (1, x2);
//e3.addTerms ([-3.5], [x4]);
//
//model.addConstr(e3, LinearProgram.LP_EQUAL, 0);
//
//var inputElem = document.getElementById ('input');
//inputElem.value = '';
//var builder = new CPLEX_LPBuilder (function (s) { inputElem.value += s; });
//model.build (builder);
//
//
///* Dump the model in CPLEX format. */
////print (builder.getResult());