/*
 * MDDView.js
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


/**
 * @constructor
 * 
 * Multivalued decision diagram (MDD) implemented on the top of a QOBDD. These
 * are used to handle models.
 * 
 * @param r A QOBDD.
 * @param symm_vec Vector where N[i] is the number of players of type i, starting at 0.
 * 
 * @code
	var alad = game.getAlad();
	var N = alad.getNumericTypeVector();
	console.log ("Type vector: " + N);
	var view = new MDDView (game.getWinQOBDD(), N);
	console.log("#Nodes: " + view.size());
	console.log("#Models: " + view.countModels());
 * @encode
 */
function MDDView (r, symm_vec)
{
	this.n_types = symm_vec.length;
	this.symm_vec = symm_vec.slice(0); // copy
	
	this.qobdd = r;
	
	this.getQOBDD = function () { return this.qobdd; };
	
	/**
	 * Returns the root node of the MDD which is the same as for the QOBDD.
	 */
	this.getRoot = function () { return this.getQOBDD().getRoot(); };

	
	/**
	 * Returns the i-th successor of node v.
	 */
	QOBDD.Node.prototype.getSucc = function (i) {
		if (undefined === this.succs) {
			/* This is an optimization. See first(...) below. */
			if (0 === i) return this.e;
			else if (1 === i) return this.t;
			else throw "Index of successor out of bounds.";
		}
		else return this.succs[i];
	};
	
	
	/**
	 * Returns the number of successors for the given node.
	 */
	QOBDD.Node.prototype.getSuccCount = function () {
		if (undefined === this.succs) return 2;
		else return this.succs.length;
	};	
	
	var cache = new Hashtable ();
	var op_id = QOBDD.aquireOpId();
	
	var thisObject = this;
	
	function first (v, k /*type, 0-indexed*/) {
		if (k < thisObject.n_types && v.visited !== op_id) {
			v.visited = op_id;
			
			if (1 === thisObject.symm_vec[k]) {
				// Do not save unnecessary information.
				v.succs = undefined; // may have been set before.
				first (v.t, k+1);
				first (v.e, k+1);
			}
			else {			
				v.succs = [];
				next (v, k, thisObject.symm_vec[k], v, 0/*1-edge seen so far*/, true);
			}
		}
	}
	
	function next (v,k,left,origin,seen,take_0_edge) {
		if (0 === left) {
			// No type of current level left. Current node is of next type.
			origin.succs[seen] = v;
			first (v, k+1);
		}
		else {
			var ent = cache.get(v.id);
			
			if (null !== ent) /*cached*/ {
				// Notice: ent = [origin', seen']
				
				if (ent[0] !== origin) {
					for (var j = 0 ; j <= left ; ++j) {
						origin.succs[seen + j] = ent[0].succs[ent[1] + j];
					}
				}
				else {
					if (take_0_edge) {
						throw "Logic error in next (take_0_edge=true).";
					}
					origin.succs[seen + left] = origin.succs[ent[1] + left];
				}
			}
			else {
				cache.put (v.id, [origin, seen]);
				
				if (take_0_edge) {
					next (v.e, k, left-1, origin, seen, true);
				}
				next (v.t, k, left-1, origin, seen+1, false);
			}
		}
	}
	
	/* Prepare the successors. */
	first (r.getRoot(), 0 /*1-st type*/);
	
	
	/**
	 * Traverses each inner node of the MDD once and calls the given callback
	 * for it. The traversal is stopped if the callback returned false. The 
	 * call is made after the children were visited
	 * 
	 * The callback has to accept the node as its first and the edge's value
	 * (starting at 0) as its second argument.
	 * 
	 * \return Returns true if the callback never returned false and false
	 *         otherwise.
	 */
	this.traverseInner = function (func) {
		var op_id = QOBDD.aquireOpId();
		
		var _aux = function (u) {
			if (u.isConst() || u.visited === op_id) return true;
			else {
				u.visited = op_id;
				
				var n_succs = u.getSuccCount();
							
				for (var i = 0 ; i < n_succs ; ++i) {
					if ( !_aux(u.getSucc(i))) return false;
				}
				return func (u,i);
			}
		};
		
		return _aux(this.getRoot());
	};
	
	
	/**
	 * Returns the number of inner nodes used for the MDD. 
	 */
	this.size = function () {
		var sum = 0;
		this.traverseInner (function (v,i) { ++sum; return true; /*cont.*/ });
		return sum;
	};
	
	
	/**
	 * Return the number of elements in the MDD which are models now.
	 */
	this.countModels = function () {
		var cache = new Hashtable ();
		
		cache[QOBDD.zero.id] = 0;
		cache[QOBDD.one.id]  = 1;

		this.traverseInner(function (v,i) {
			var count = 0;
			var n_succs = v.getSuccCount();
			
			for (var j = 0 ; j < n_succs ; ++j) {
				count += cache[v.getSucc(j).id];
			}
			cache[v.id] = count;
			return true; // continue
		});
		return cache[this.getRoot().id];
	};
	
	
	/**
	 * Enumerates the elements in the MDD. The elements (models) are passed to
	 * the callback function as 0-indexed vectors.
	 * 
	 * @note The object passed to the callback is reused and may change after
	 * the callback has returned. Do not forget to copy the mode using, e.g.,
	 * slice(0) if it has to persist.
	 */
	this.enumerateModels = function (manager, f) {
		var zeros = manager.getZeros();
		
		var model = [];
		
		var _aux = function (k,v) {
			if (QOBDD.one === v) {
				f (model);
			}
			else if (v !== zeros[v.getVar()]) {
				for (var j = 0 ; j <= thisObject.symm_vec[k] ; ++j) {
					model[k] = j;
					_aux (k+1, v.getSucc(j));
				}
			}
		};
		
		_aux (0 /*first type*/, this.getRoot());
	};
}
