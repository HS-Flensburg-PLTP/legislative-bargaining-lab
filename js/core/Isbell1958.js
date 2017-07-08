/*
 * Isbell1958.js
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


function is_less_desir (manager, r, i, j)
{
	if (i === j) return false;
	else {
		// { S-i ; S in set(r), j not in S } \subsetneq { S-j ; S in set(r) } 
		return less_manip(r, new Without(manager, j, new Remove(manager, i)), 
				r, new Without(manager,i, new Remove(manager, j)));
	}
}


function are_equal_desir (manager, r, i, j)
{
	if (i === j) return true;
	else {
		//	{ S-i ; S in set(r), j not in S } = { S-j ; S in set(r), i not in S }
		return equal_manip (r, new Without(manager, j, new Remove(manager, i)),
				r, new Without(manager, i, new Remove(manager, j)));
	}
}


/**
 * @class Type
 * 
 * The type of a player. Always belongs to a desirability relation.
 * 
 * @ctor
 */
function Type (index, alad) {
	this.index = index;
	this.alad = alad;
	
	/**
	 * Returns the number of players of that type.
	 */
	this.size = function () { 
		return this.alad.getPreorder().getPartition().getClassSizeByIndex(this.index);
	};
};


/**
 * Isbell's at-least-as-desirable-as relation.
 * 
 * \param W The QOBDD of the winning coalitions.
 * \param not_greater_func If true for i,j player i is NOT more desirable than
 * 	 	j. If false, implies nothing. Optional, can be null or undefined.
 * \param not_equal_func If true for i,j, both player are NOT symmetric. If
 *      false implies nothing otherwise. Optional, can be null or undefined.
 * \param equal_func If true for i,j, both players ARE symmetric. If false, 
 *      implies nothing. Optional, can be null or undefined.
 *      
 * @ctor
 */
function AtLeastAsDesirable (manager, W, not_greater_func, not_equal_func, equal_func)
{
	this.n = W.getVarCount();
	this.W = W;
	this.manager = manager;
	
	var thisObject = this;
	
	this.preorder = new Preorder (this.n, 
			function /*is_greater*/ (i,j) { 
					if (not_greater_func(i,j)) return false;
					else return is_less_desir (manager, W, j, i);
			},
			function /*are equal*/ (i,j) {
					if (not_equal_func(i,j)) return false;
					if (equal_func(i,j)) return true;
					return are_equal_desir (manager, W, i, j);
			});	

	/**
	 * Returns the type index for player i.
	 * 
	 * \note The indices of the classes in the partition of the preorder
	 * are the same as those for the types.
	 */
	function _playerToType (i) { this.preorder.getPartition().getClassIndexByElem(); };
	
	
	/**************************************************************************
	 *                          Public Operations                             *
	 *************************************************************************/
	
	this.isTotal = function () { return this.preorder.isTotal(); };
	this.getNonIncrOrder = function () { return this.preorder.getNonIncrOrder(); };
	
	// It is assumed by FWVGReprModelService, that if the game is consecutive, the players
	// in the i-th class precede the players in the (i+1)-th class.
	this.getSymmetryClasses = function () { return this.preorder.getEquivClasses(); };
	this.getDirectSuccessorsOf = function (i) { return this.preorder.getDirectSuccessorsOf(i); };
	
	this.areSymmetric = function (i,j) { return this.preorder.areEqual(i, j); };
	this.isMoreDesirable = function (i,j) { return this.preorder.isGreater(i, j); };
	this.isAtLeastAsDesirable = function (i,j) { return this.preorder.isGreaterEqual(i, j); };
	
	this.getNotTotalWitnesses = function () { return this.preorder.getNotTotalWitnesses(); };
	
	this.getPreorder = function () { return this.preorder; };

	this.getTypeCount = function () { return this.preorder.getEquivClassCount(); };
	this.getTypes = (function(){
		var types = undefined;
		
		return function () {
			if (undefined === types) {
				types = [];
				
				var t = this.getTypeCount();
				for (var k = 0 ; k < t ; ++k) {
					types.push (new Type (k, thisObject));
				}
			}
			return types;
		};
	}()); 
	
	
	/**
	 * Returns the type object associated with the given player.
	 */
	this.getTypeOfPlayer = function (i) { 
		return this.getTypes()[this._playerToType(i)];
	};

	
	/**
	 * Returns an array that maps the i'th player ot the index of its type,
	 * i.e. this.getTypes()[this.getPlayerToTypeMap(i)] would return in the
	 * actual type object of player i.
	 */
	this.getPlayerToTypeMap = function () {
		return this.preorder.getPartition().getElemToClassIndexMap();
	};
	
	
	/**
	 * Returns a vector of vectors [A1,..,Am] where Ai contains the players
	 * of a symmetry class. The classes are not necessarily ordered.
	 */
	this.getTypeVector = function () {
		return this.preorder.getEquivClasses();
	};
	
	
	/**
	 * Returns a vector of vectors [n_1,..,n_m] where n_j is the number of
	 * players of type j.
	 */
	this.getNumericTypeVector = function () {
		var t = this.getTypeCount();
		var types = this.getTypes ();
		var N = [];
		for (var i = 0 ; i < t ; ++i) {
			N.push(types[i].size());
		}
		return N;
	};
	
	
	/**
	 * Returns the ordering on the equally desirable players. The use of the
	 * indices is the same as for the types.
	 */
	this.getTypeOrder = function () {
		return this.preorder.getPoset();
	};
	
}
