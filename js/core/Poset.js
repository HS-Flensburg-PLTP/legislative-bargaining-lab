/*
 * Poset.js
 *
 *  Copyright (C) 2012 Stefan Bolus, University of Kiel, Germany
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


// DEPENDS: Uses mergeSort as a stable sorting algorithm. 


// TODO: Implement:
//   Daskalakis, Constantinos, Richard M Karp, Elchanan Mossel, Samantha Riesenfeld, and Elad Verbin. “Sorting
//      and Selection in Posets.” arXiv:0707.1532 (July 10, 2007). http://arxiv.org/abs/0707.1532.


/*
 * Ternary logic disjunction.
 * 
 *    x | y | x or y
 *    --------------
 *    ? | 1 |   1
 *    ? | 0 |   0
 *    ? | ? |   ?
 *    
 * If x,y != ?, then like Boolean disjunction; commutative.
 */
function ternary_or (x,y)
{
	if (x === null && y === null) return null;
	else return x || y;
}


/**
 * Implements a \e partial ordered set (poset). A \e partial order is reflexive,
 * symmetric and transitive.
 * 
 * \param n Number of elements.
 * \param is_greater_func Function (i,j) |-> {true,false} which returns true if i is
 * 		greater than j and false otherwise.
 */
function Poset (n, is_greater_func)
{
	this.n = n;
	this.is_greater_func = is_greater_func;
	
	this.is_total = null;
	this.not_total_witnesses = null; /* Only valid if is_total is false. If so,
									  * contains a pair of incomparable players. */
	this.order = []; // Only valid is is_total is true.
	
	this.G = []; /* strict part; irreflexive, asymmetric and transitive,
				  * poset on equiv. classes. */
	
	var i,j;
	
	/* At the beginning we know nothing. */
	for (i = 0 ; i < this.n ; ++i) {
		this.G[i] = [];
		for (j = 0 ; j < n ; ++j) {
			this.G[i][j] = null; // MAYBE
		}
		
		/* Strict part is irreflexive; */
		this.G[i][i] = false;
	}
	
	
	/**************************************************************************
	 *                             Private Operations                         *
	 *************************************************************************/
	
	this._mergeCol = function (mat,j1,j2) {
		if (j1 > j2)
		for (var i = 0 ; i < this.n ; i ++)
			mat[i][j1] = mat[i][j2] = ternary_or(mat[i][j1], mat[i][j2]);
	};
	
	this._mergeRow = function (mat,i1,i2) {
		for (var j = 0 ; j < this.n ; j ++)
			mat[i1][j] = mat[i2][j] = ternary_or(mat[i1][j], mat[i2][j]);
	};
	
	/* ----------------------------------------------------- Strict part --- */
	
	/*! 
	 * i,j are assumed to be the representatives of their corresponding
	 * equivalence classes. Returns if i is greater than j.
	 */
	this._isGreater = function (i,j) {
		if (i === j) return false;
		else return this.G[i][j];
	};
	
	/*!
	 * Returns true if and only if player i is more desirable than player j.
	 */
	this._isGreaterImpl = function (i,j) { return this.is_greater_func(i,j); };
	
	
	/*!
	 * for elements x,y do
	 *    if (x ">" i && j ">" y)
	 *       set x ">" y
	 */
	this._transitiveStep = function (i,j) {
		for (var x = 0 ; x < this.n ; ++ x) {
			for (var y = 0 ; y < this.n ; ++ y) {
				var x_i = this.G[x][i]; // x > i?
				var j_y = this.G[j][y]; // j > y?
				
				if (x_i) this.G[x][j] = true; // x > i => x > j
				if (j_y) this.G[i][y] = true; // j > y => i > y
				if (x_i && j_y) this.G[x][y] = true; // x > i && j > y => x > y
			}
		}
	};
	
	
	/*! 
	 * Returns nothing. Assumes i != j.
	 */
	this._setGreater = function (i,j,yesno) {
		if (yesno) {
			this.G[i][j] = true;
			this.G[j][i] = false;
			
			// Transitivity. If x > i and j > y then x > j, i > y 
			// and x > y.
			this._transitiveStep (i,j);
		}
		else {
			this.G[i][j] = false;
		}
	};
	
	
	this.isGreater = function (i,j) {	
		if (this._isGreater(i,j) === null) {
			this._setGreater (i, j, this._isGreaterImpl(i,j));
		}
		return this._isGreater(i,j);
	};
	
	
	/**************************************************************************
	 *                                 Operations                             *
	 *************************************************************************/
	
	/*!
	 * If the poset is total, then the order of the elements with respect to 
	 * the relation is returned, that is, if i > j then i appear in front of
	 * j in the order.
	 * 
	 * \throw Error Throws an error if the poset is not total.
	 * 
	 * \see Poset.isTotal
	 */
	this.getDecrOrder = function () {
		if ( !this.isTotal()) throw "The poset is not total.";
		else return this.order;
	};

	
	/*!
	 * Returns true if and only if the relation is total. With respect to
	 * simple games, this is equivalent to be swap robust and to be complete.
	 * 
	 * \see Poset.getNonIncrOrder
	 */
	this.isTotal = function () {
		if (this.is_total === null) {
			var i;
			var order = [];
			for (i = 0 ; i < this.n ; ++i)
				order[i] = i;
			var thisObject = this;

			/* With respect to ECMA-265 (5th Ed.), Sec. 15.4.4.11, Array.sort
			 * is not _stable_. But we need a stable sorting algorithm for the
			 * non-increasing order of the elements. */
			order = mergeSort(order, function (i,j) {
				return thisObject.isGreater.call (thisObject, i,j);
			});
			
			this.is_total = true;
			for (i = 1 ; i < this.n ; ++i) {
				if ( !this.isGreater(order[i-1], order[i])) {
					this.is_total = false;
					this.not_total_witnesses = [order[i-1],order[i]];
					break;
				}
			}
			
			this.order = order;
		}
		return this.is_total;
	};
	
	
	/*!
	 * If the poset is not total, returns a pair [i,j] of incomparable
	 * players. If the relation is total returns null.
	 */
	this.getNotTotalWitnesses = function () {
		if (this.isTotal()) return null;
		else return this.not_total_witnesses;
	};
	
	
	this.direct_succs = []; // element -> {direct successors}
	
	/*!
	 * Returns the direct successors of the given element w.r.t. to >, that is,
	 * j is a direct successor of i if i>j and there is no k such that i>k>j.
	 * The direct successors are the same for each element in a equivalence
	 * class.
	 */
	this.getDirectSuccessorsOf = function (h) {		
		if ( undefined === this.direct_succs[h]) {
			if (this.isTotal()) {
				/* This case is trivial. We prepare the direct successors for
				 * all players in one run. */
				var order = this.getDecrOrder();
				
				for (var i = 1 ; i < this.n ; ++i) {
					this.direct_succs[order[i-1]] = [order[i]];
				}
				
				// The weakest player has no successors.
				this.direct_succs[order[this.n-1]] = [];
			}
			else /* not total */ {
				this.direct_succs[h] = [];
				
				for (var i = 0 ; i < this.n ; ++i) {
					if (this.isGreater(h, i)) {
						var is_direct = true;
						
						for (var k = 0 ; k < this.n ; ++k) {
							if (this.isGreater(h,k) && this.isGreater(k,i)) {
								is_direct = false; // k is a counterexample
								break;
							}
						}
						
						if (is_direct)
							this.direct_succs[h].push (i);
					}
				}
			}
		}
		return this.direct_succs[h];
	};
	
	
	
	/*!
	 * Should not be used. Dumps a lot of internal information which is useless
	 * for the end user. Does not apply any tests but instead dumps the info
	 * gathered so far.
	 */
	this.toString = function () {
		var i,j;
		
		var s = "___Poset:___\n"
			+"             n : " + this.n + "\n"
			+"      is_total : " + this.is_total + "\n"
			+"         order : " + (this.is_total ? this.order : "maybe not total") + "\n"
			+"  direct_succs : \n";
		
		for (i in this.direct_succs) {
			s += "             "+ i +" > {"+this.direct_succs[i].join(",")+"}\n";
		}
		
		s += "             G : (more desirable)\n";
		for (i = 0 ; i < this.n ; ++i) {
			s += "               ";
			for (j = 0 ; j < this.n ; ++j)
				s += this.G[i][j] ? ">" : ((this.G[i][j] === null) ? "?" : ".");
			s += "\n";
		}
		return s;
	};
}