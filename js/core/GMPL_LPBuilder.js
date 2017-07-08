/*
 * GMPL_LPBuilder.js
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
 * Implements \ref LinearProgram.Builder for the GNU MathProg Language (GMPL).
 * 
 * Documentation is available in /usr/share/doc/glpk-doc/gmpl.pdf .
 * 
 * @param println Function with a single string parameter to print a line.
 */
function GMPL_LPBuilder (println)
{
	var _vs = []; // List of variables.
	var _sense = undefined;
	
	var _println, _buf = '';
	if (println === undefined) {
		_println = function (l) { this._buf += l + '\n'; };
	}
	else {
		_println = println;
	}
	
	/**
	 * Implements \ref LinearProgram.Builder.setModelSense. Called before any
	 * variable is added.
	 */
	this.setModelSense = function (sense) { _sense = sense; };
	
	/**
	 * Implements \ref LinearProgram.Builder.addVar. Called before any
	 * constraint is added.
	 */
	this.addVar = function (v) {
		_vs.push (v); // for the objective function later.
		
		var attrs = [];
		
		if (v.isBinary()) attrs.push ('binary');
		else if (v.isInteger()) attrs.push ('integer');
		
		if (v.getLowerBound() == v.getUpperBound()) {
			attrs.push ('=' + v.getLowerBound());
		}
		else {
			if (v.getLowerBound() !== -Infinity) {
				attrs.push ('>=' + v.getLowerBound());
			}
			if (v.getUpperBound() != Infinity) {
				attrs.push ('<=' + v.getUpperBound());
			}
		}
		
		if (attrs.length > 0) {
			_println ('var ' + v.getName() + ' ' + attrs.join(',') + ';');
		}
		else {
			_println ('var ' + v.getName() + ';');
		}
	};

	/**
	 * Converts a \ref LinearProgram.LinExpr into a string for the output in
	 * GMPL format. This is used in the objective and the constraints.
	 */
	function _render (e) {
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
					s += Math.abs(coeff) + '*';
				s += name;
			}
		}
		
		return s;
	};
	
	/**
	 * Implements \ref LinearProgram.Builder.addContr .
	 */
	this.addConstr = (function () {
		var nextId = 1; // if no constraint name is given.
		return function (c) {
			var name = c.getName();
			if (name === undefined) {
				name = 'c' + nextId ++;
			}
			
			var sense;
			switch (c.getSense()) {
			case LinearProgram.LP_GREATER_EQUAL: sense = ' >= '; break;
			case LinearProgram.LP_EQUAL: sense = ' = '; break;
			case LinearProgram.LP_LESS_EQUAL: sense = ' <= '; break;
			default: throw 'Unknown sense for constraint: "'+c.getSense()+'"';
			}
			
			_println (name + ': ' + _render(c.getLhsExpr()) + sense + c.getRhsConstant() + ';');
		};
	}()); 
	
	this._renderObjective = function () {
		var senseStr;
		if (_sense === LinearProgram.LP_MINIMIZE) {
			senseStr = 'minimize';
		}
		else if (_sense === LinearProgram.LP_MAXIMIZE) {
			senseStr = 'maximize';
		}
		else throw "Unknown model sense: " + _sense;
		
		var e = new LinearProgram.LinExpr ();
		for (var i in _vs) {
			var v = _vs[i];
			if (v.getObjective() !== 0)
				e.add (v.getObjective(), v);
		}
	
		// 'obj' is the arbitrarily chosen name for the objective.
		_println (senseStr + ' obj: ' + _render(e) + ';');
	};
	
	/**
	 * Implements \ref LinearProgram.Builder.close. Called after the last
	 * constraint were added.
	 */
	this.close = function () {
		this._renderObjective ();
		_println ('solve;');
	};
	
	this.getResult = function () { return _buf; };
}
