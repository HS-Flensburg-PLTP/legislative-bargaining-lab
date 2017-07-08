/*
 * Preorder.js
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



/**
 * Implements a \e preorder relation. A relation R is called preorder if it is
 * reflexive and transitive.
 * 
 * \param n Number of elements.
 * \param is_greater_func Function (i,j) |-> {true,false} which returns true if i is
 * 		greater than j and false otherwise.
 * \param are_equal_func Function (i,j) |-> {true,false} which returns true if i is
 * 		as equal as j and false otherwise.
 */
function Preorder (n, is_greater_func, are_equal_func)
{
	this.n = n;
	this.is_greater_func = is_greater_func;
	this.are_equal_func = are_equal_func;

	var thisObject = this;
	
	/**************************************************************************
	 *                         Private Operations                             *
	 *************************************************************************/
	
	/**
	 * Returns \e any element in the i-th equivalence class.
	 */
	this._classToAnyElem = function (i) {
		return this.getPartition().getRepByIndex(i);
	};
	
	/**
	 * Returns a set containing \e all elements in the i-th equivalence class.
	 */
	this._classToAllElems = function (i) {
		return this.getPartition().getClassByIndex(i);
	};
	
	/**
	 * Returns the equivalence class index for the i-th element.
	 */
	this._elemToClass = function (i) {
		return this.getPartition().getClassIndexByElem(i);
	};
	
	
	this._getPoset = (function(){
		var poset = undefined;
		
		return function () {
			if (undefined === poset) {
				/* The is_greater_func is defined for elements only. We have to
				 * translate between equivalence classes and elements. */
				
				poset = new Poset (thisObject.getPartition().getClassCount(), 
						function (a,b) {
							return is_greater_func (thisObject._classToAnyElem(a), thisObject._classToAnyElem(b));
						});
			}
			return poset;
		};
	}());
	
	/**************************************************************************
	 *                          Public Operations                             *
	 *************************************************************************/
	
	this.getPartition = (function(){
		var P = undefined;
		
		return function () {
			if (undefined === P) {
				P = new Partition (thisObject.n, are_equal_func); 
			}
			return P;
		};
	}());
	
	
	/**
	 * Returns the poset on the equivalence classes. The elements in the poset
	 * are correspond to the equivalence classes in the partition.
	 * 
	 * \note To use the induced poset on the equivalence class is error prone
	 * and should therefore be omitted whenever possible.
	 * 
	 * \see Preorder.getPartition
	 */
	this.getPoset = function () { return this._getPoset(); };
	

	
	/**
	 * Returns true iff elements i and j are equal w.r.t. to the equality
	 * function.
	 */
	this.areEqual = function (i,j) { return this.getPartition().areEqual(i,j); };
	
	
	/**
	 * Returns true iff element i is greater than j w.r.t. to the is-greater
	 * function. 
	 */
	this.isGreater = function (i,j) {
		return this._getPoset().isGreater(this._elemToClass(i), this._elemToClass(j));
	};
	
	
	/**
	 * Returns true iff element i and j are equal or if i is greater then j.
	 */
	this.isGreaterEqual = function (i, j) {
		return this.areEqual(i,j) || this.isGreater(i,j);
	};
	
	
	/**
	 * Returns true if and only if the relation is total. With respect to
	 * simple games, this is equivalent to be swap robust and to be complete.
	 * 
	 * \see isDirected
	 */
	this.isTotal = function () { return this._getPoset().isTotal(); };
	
	
	/*!
	 * If the game is total, the order of the elements with respect to the
	 * desirability relation is returned, that is, i comes in front of j
	 * exactly if i is at least as desirable as j. If both elements are equally
	 * desirable, the element with the lower index comes first.
	 * 
	 * The returned order has consecutive equivalence classes.
	 * 
	 * \throw Error Throws an error if the game is not total.
	 */
	this.getNonIncrOrder = function () {
		try {
			// Order of the equivalence classes.
			var pi = this._getPoset().getDecrOrder();
			
			var order = [];
			
			for (var pos in pi) {
				order.push.apply (order, this._classToAllElems(pi[pos])); // append
			}
			return order;
		}
		catch (e) {
			throw "The preorder is not total.";
		}
	};
	
	
	/**
	 * If the preorder is not total, returns a pair [i,j] of incomparable
	 * elements. If the relation is total returns null.
	 */
	this.getNotTotalWitnesses = function () {
		if ( this.isTotal()) return null;
		else {
			var witness = this._getPoset().getNotTotalWitnesses ();
			var a = witness[0];
			var b = witness[1];
			
			return [this._classToAnyElem(a), this._classToAnyElem(b)];
		}
	};
	

	/**
	 * Returns the direct successors of the given element w.r.t. to >, that is,
	 * j is a direct successor of i if i>j and there is no k such that i>k>j.
	 * The direct successors are the same for each element in a equivalence
	 * class.
	 */
	this.getDirectSuccessorsOf = function (i) {
		var succs = this._getPoset().getDirectSuccessorsOf (this._elemToClass(i));
		var ret = [];
		
		for (var i in succs) {
			ret.push.apply (ret, this._classToAllElems (succs[i]));
		}
		
		return ret;
	};
	
	
//	this.direct_succ_reps = []; // representative -> {direct successors}  
//	
//	 // h don't have to be a rep.
//	this.getDirectSuccessingRepsOf = function (h) {
//		this.getEquivClasses();
//		var r = this.equiv_classes.find(h);
//		
//		if ( !this.direct_succ_reps[r]) {
//			/* Sort the equivalence classes by non-increasing desirability. */
//			var reps = this.equiv_classes.getReps();
//			var order = reps.slice(0); // copy
//			order.sort (function(x,y){return x-y;}); // ascending
//			var thisObject = this;
//			order = mergeSort (order, function(x,y){ return thisObject.isGreater.call(thisObject,x,y); }); 
//			// order contains the order representatives.
//			
//			var i,j,k;
//			var m /*eq. class count*/ = order.length; 
//			
//			/* Initialize the sets of successors for each equiv. class. */
//			for (i in reps)
//				this.direct_succ_reps[reps[i]] = [];
//			
//			if (this.isTotal()) {
//				for (i = 0 ; i < m-1 ; ++i)
//					this.direct_succ_reps[order[i]] = [order[i+1]];
//			}
//			else /* not total */ {
//				for (i = 0 ; i < m-1 ; ++i) {
//					for (j = i+1 ; j < m; ++j) {
//						/* Is j a successor of i? */
//						if (this.isGreater(order[i], order[j])) {
//							var is_direct = true;
//							/* Is j a DIRECT successor of i? */
//							for (k = i+1 ; k < j && is_direct ; ++k)
//								if (this.isGreater(order[i],order[k]) && this.isGreater(order[k],order[j]))
//									is_direct = false;
//							
//							if (is_direct)
//								this.direct_succ_reps[order[i]].push(order[j]);
//						}
//					}
//				}
//			}
//		}
//		return this.direct_succ_reps[r];
//	};

	
	/**
	 * Returns the number of equivalence classes.
	 */
	this.getEquivClassCount = function () { return this.getPartition().getClassCount(); };
	
	
	/**
	 * Returns the set of elements equivalent to the given element.
	 */
	this.getEquivClassOf = function (i) { 
		return this.getPartition().getClassByElem(i);
	};
	
	
	/**
	 * Returns the classes of symmetric (equally desirable) elements. The
	 * classes are ordered by non-increasing desirability.
	 */
	this.getEquivClasses = function () { return this.getPartition().getClasses(); };
	
	
	
	
	
	/**
	 * Should not be used. Dumps a lot of internal information which is useless
	 * for the end user. Does not apply any tests but instead dumps the info
	 * gathered so far.
	 */
	this.toString = function () {	
		var s = "___Preorder:___\n"
			+"                       n : " + this.n + "\n"
			+"                isTotal : " + this.isTotal() + "\n"
			+"        getNonIncrOrder : " + (this.isTotal() ? this.getNonIncrOrder() : "(not total)") + "\n"
			+" getDirectSuccessors(i) :\n";
		for (var i = 0 ; i < this.n ; ++i) {
			s += "\t" + i + " -> {" + this.getDirectSuccessorsOf(i).join(", ") + "}\n"; 
		}
		s += "              Partition :\n"
			+this.getPartition()
			+"                  Poset :\n"
			+this._getPoset();
		return s;
	};
}


