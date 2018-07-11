/*
 * LinearProgram.js
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
 * Following the Gurobi C++ interface.
 */
var LinearProgram = {

		/* Possible types for a variable. */
		LP_CONTINUOUS 	: 1, 
		LP_INTEGER		: 2,
		LP_BINARY		: 3,

		/**
		 * @constructor
		 * 
		 * Constructor is private and should only be called by the \ref Model.
		 * 
		 * @param type Type of variable. Possible types are See
		 * 	LinearProgram.LP_* for a list of possible type. If no type is given
		 * 	the variable is considered as continuous. [optional]
		 * @param obj Coefficient of the expression inside the objective
		 *  function. Default value is 0.0. [optional]
		 * @param lb Lower bound of the variable. Default value is 0.0. [optional]
		 * @param ub Upper bound for the variable. Default value is Infinity for
		 *  continuous and integer variables. For binary variables the default
		 *  value is 1.0. [optional]
		 */
		Var : function (name,type,obj,lb,ub) {
			this._name 	= name;
			this._type 	= (type === undefined) ? LinearProgram.LP_CONTINUOUS : type;
			this._obj 	= (obj === undefined) ? 0.0 : obj;
			this._lb 	= (lb === undefined) ? 0.0 : lb;
			this._ub 	= (ub === undefined) ? Infinity : ub;

			this.getName 		= function () { return this._name; };
			this.getType 		= function () { return this._type; };
			
			this.getObjective 	= function () { return this._obj; };
			this.setObjective   = function (val) { return this._obj = val; };
			
			this.getLowerBound 	= function () { return this._lb; };
			this.setLowerBound  = function (val) { return this._lb = val; };
			
			this.getUpperBound 	= function () { return this._ub; };
			this.setUpperBound  = function (val) { return this._ub = val; };

			this.isBinary     = function () { return this.getType() === LinearProgram.LP_BINARY; };
			this.isInteger    = function () { return this.getType() === LinearProgram.LP_INTEGER; };
			this.isContinuous = function () { return this.getType() === LinearProgram.LP_CONTINUOUS; };
		},


		/**
		 * @constructor
		 * 
		 * Constructor is private and should only be called by the \ref Model.
		 * 
		 * The constant part of linExpr is removed and added to the right-hand
		 * side.
		 * 
		 * @param name The name of the constraint. [optional]
		 */
		Constr : function (linExpr, sense, rhs, name) {
			this._linExpr = new LinearProgram.LinExpr(linExpr);
			this._sense = sense;
			this._rhs = rhs - this._linExpr.getConstantCoeff();
			this._name = name;

			this._linExpr.setConstantCoeff(0.0);

			this.getSense = function () { return this._sense; };
			this.getLhsExpr = function () { return this._linExpr; };
			this.getRhsConstant = function () { return this._rhs; };

			this.getName = function () { return this._name; };
			this.hasName = function () { return this._name !== undefined; };
		},

		/**
		 * @constructor
		 * 
		 * @param v A variable. [optional]
		 * @param coeff A coefficient for the variable. Default is +1.0. [optional]
		 */
		LinExpr : function (var_args) {
			this._coeff = 0.0;
			this._pairs = []; // Maps var's name -> coeff

			/**
			 * Adds a term to the linear expression. If v is not given the
			 * coefficient is added to the constant part of the expression.
			 * 
			 * @param v The variable. [optional]
			 * @return Returns the linear expression.
			 * 
			 * \see subtract
			 * \see addTerms
			 */
			this.add = function (coeff, v) {
				if (v === undefined) {
					this._coeff += coeff;
				}
				else {
					if ( this._pairs[v.getName()] === undefined)
						this._pairs[v.getName()] = 0.0;

					this._pairs[v.getName()] += coeff;
				}
				return this;
			};

			/**
			 * Similar to \ref add.
			 * 
			 * @return Returns the linear expression.
			 * 
			 * \see add
			 * \see addTerms
			 */
			this.subtract = function (coeff, v) { this.add (-coeff, v); return this; };

			/**
			 * 
			 * @param coeffs
			 * @param vs
			 * 
			 * @return Returns the linear expression.
			 */
			this.addTerms = function (coeffs, vs) { 
				var n = vs.length;
				for (var i = 0 ; i < n ; ++i)
					this.add (coeffs[i], vs[i]);
				return this;
			};
			
			/**
			 * 
			 * @param coeffs
			 * @param vs
			 * 
			 * @return Returns the linear expression.
			 */
			this.subtractTerms = function (coeffs, vs) { 
				var n = vs.length;
				for (var i = 0 ; i < n ; ++i)
					this.add (-coeffs[i], vs[i]);
				return this;
			};

			this.getCoeffOf = function (v) {
				if (this._pairs[v.getName()] === undefined) return 0.0;
				else return this._pairs[v.getName()];

			};

			this.getConstantCoeff = function () { return this._coeff; };
			this.setConstantCoeff = function (coeff) { this._coeff = coeff; };

			/**
			 * Returns pairs of the form var's name => coeff for the non-constant part
			 * of the linear expression. For the constant part use \ref getConstantCoeff.
			 */
			this.getPairs = function () { return this._pairs; };

			this.toString = function () { 
				var s = '';
				var isFirst = true;
				for (var name in this._pairs) {
					var coeff = this._pairs[name];
					if (coeff === 0.0) continue;
					if ( !isFirst)  {
						if (coeff < 0.0) s += ' - ';
						else s += ' + ';
					} else {
						isFirst = false;
						if (coeff < 0.0) s += '-';
					}
					s += Math.abs(coeff) + ' ' + name;
				}

				if (this.getConstantCoeff() !== 0.0) {
					var coeff = this.getConstantCoeff();
					if ( !isFirst)  {
						if (coeff < 0.0) s += ' - ';
						else s += ' + ';
					} else {
						isFirst = false;
						if (coeff < 0.0) s += '-';
					}
					s += Math.abs(coeff);
				}			    

				return s;
			};

			/* Copy constructor. */
			if (typeof(arguments[0]) === 'object' && arguments[0] instanceof LinearProgram.LinExpr) {
				var x = arguments[0];
				this._coeff = x._coeff;

				/* slice(0) cannot be used here because we have non-integer keys. Using
				 * hasOwnProperty is not strictly necessary at this point. However, it
				 * also does not hurt. */
				for (var key in x._pairs) {
					if (x._pairs.hasOwnProperty(key))
						this._pairs[key] = x._pairs[key];
				}}
		},

		/* Senses for a model. */
		LP_MINIMIZE : +1,
		LP_MAXIMIZE : -1,

		/* Senses for a linear constraint. */
		LP_LESS_EQUAL    : -1,
		LP_EQUAL         : 0,
		LP_GREATER_EQUAL : 1,

		Model : function () {
			this._sense = LinearProgram.LP_MINIMIZE;

			/* Maps var's name to var's object. Contains all variables in the 
			 * model. */
			this._vs = []; 

			/* A list of all constraints in the model. */
			this._cs = [];

			/**
			 * Sets the model's sense of the model. Use +1 to minimize and -1
			 * to maximize. Default is +1;
			 */
			this.setModelSense = function (sense) { this._sense = sense; };
			this.getModelSense = function () { return this._sense; };

			/**
			 * Adds a variable to the model and returns the newly created
			 * variable. All arguments except name are optional.  
			 */
			this.addVar = function (name,type,obj,lb,ub) {
				var v = new LinearProgram.Var (name,type,obj,lb,ub);
				this._vs[name] = v;
				return v;
			};

			/**
			 * rhs has to be a double
			 */
			this.addConstr = function (lhsExpr, sense, rhs, name) {
				var c = new LinearProgram.Constr(lhsExpr, sense, rhs, name);
				this._cs.push(c);
				return c;
			};

			/**
			 * Builder has to implement the LinearProgram.Builder interface.
			 */
			this.build = function (builder) {
				builder.setModelSense (this.getModelSense());

				/* Create the variables. */
				for (var name in this._vs) builder.addVar(this._vs[name]);

				/* Create the constaints. */
				for (var i in this._cs) builder.addConstr(this._cs[i]);

				builder.close();
			};
		},

		/**
		 * @constructor
		 * 
		 * A builder is used to transform the internal representation of a
		 * linear program into another representation. For instance, a string
		 * in CPLEX format.
		 * 
		 * To use the builder, write a concrete implementation and call 
		 * \ref LinearProgram.Model.build and pass the builder as the first
		 * argument.
		 * 
		 * The class is considered as an interface.
		 */
		/*interface*/ Builder : {
			/**
			 * Sets the sense of the model which is either 
			 * \ref LinearProgram.LP_MINIMIZE of \ref LinearProgram.LP_MAXIMIZE.
			 * 
			 * This method is called once before any call to addVar is made.
			 * 
			 * @param \ref LinearProgram.LP_MINIMIZE or \ref LinearProgram.LP_MAXIMIZE.
			 * @return Returns nothing.
			 */
			setModelSense : function (sense) { /* abstract */ },
			
			
			/**
			 * Instructs the builder to build a variable. This method is called
			 * once for every variable of the model.
			 * 
			 * @param v The variable of type \ref LinearProgram.Var to build.
			 * @return Returns nothing. 
			 */
			addVar : function (v) { /* abstract */ },
			
			
			/**
			 * Instructs the builder to build a constraint. This method is
			 * called once for every constraint of the model. No more variables
			 * are added after the constraint is added.
			 * 
			 * @note The left-hand side expression always has a constant of
			 * 	0.0 and hence, it can be omitted.
			 * 
			 * @param c The constraint which has the type
			 *  \ref LinearProgram.Constr.
			 * @return Returns nothing.
			 */
			addConstr : function (c) { /* abstract */ },
			
			
			/**
			 * Called after the last constraint of the model were added.
			 * 
			 * @return Returns nothing.
			 */
			close : function () { /* abstract */ }
		}
};



