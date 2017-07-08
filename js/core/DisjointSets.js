/*
 * DisjointSets.js
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

/*!
 * \file DisjointSets.js
 * 
 * Implements union-find data structure to manage disjoint sets. Provides
 * union-by-rank as well as path compression so the running time is nearly
 * constant for both operations.
 * 
 * See http://en.wikipedia.org/wiki/Union_find for details.
 */


/*!
 * Union find data structure for managing disjoint sets. Given integer n>0 the
 * universe is the set {0,...,n-1} of _indices_. Each disjoint set has a
 * representative which is a index. Initially, each index i forms a set {i} of
 * its own and i is its representative.
 * 
 * The running time of the union and find operation is nearly O(1). The 
 * construction takes O(n).
 * 
 * \see UnionFind.union
 * \see UnionFind.find
 */
function UnionFind (n)
{
	UnionFind.Node = function (i) {
		this.i = i;
		this.parent = this;
		this.rank = 0;
	};

	this.n = n;
	this.nodes = [];
	for (var i = 0 ; i < this.n ; ++i)
		this.nodes.push(new UnionFind.Node(i));
	
	/*!
	 * Union the sets of i and j, respectively.
	 */
	this.union = function (i,j) {
		var u = this._findNode(this.nodes[i]);
		var v = this._findNode(this.nodes[j]);
		if (u.rank > v.rank)
			v.parent = u;
		else if (u != v) {
			u.parent = v;
			if (u.rank == v.rank)
				v.rank ++;
		}
			
	};

	/*!
	 * Returns the set (index of the representer) index k belongs to.
	 */
	this.find = function (k) {
		return this._findNode(this.nodes[k]).i;
	};
	
	
	/*!
	 * Returns an array of arrays representing the disjoint sets.
	 * 
	 * \see UnionFind.getSetsOfReps
	 */
	this.getSets = function () {
		var i;
		
		var setsRaw = []; /* Representative -> { Represented set } */
		for (i = 0 ; i < this.n ; ++i) {
			var k = this.find(i);
			if ( !setsRaw[k]) setsRaw[k] = [i];
			else setsRaw[k].push(i);
		}
		
		var set = [];
		for (i in setsRaw) {
			set.push(setsRaw[i]);
		}
		return set;
	};
	
	
	/*!
	 * Returns an associative array having the representatives as the keys and
	 * the represented sets are the values.
	 * 
	 * \see UnionFind.getSets
	 */
	this.getSetsOfReps = function () {
		var sets = this.getSets ();
		var ret = [];
		for (var i in sets)
			ret[this.find(sets[i][0])] = sets[i];
		return ret;
	};
	
	/*!
	 * Returns an array whose values are the representatives of the disjoint
	 * sets. There are as many representatives as there are disjoint sets.
	 * 
	 * \note Running time is O(n).
	 */
	this.getReps = function () {
		var as_keys = [] /* Representative -> true */, as_values = [];
		var i;
		
		for (i = 0 ; i < this.n ; ++i)
			as_keys[this.find(i)] = true;
		
		for (i in as_keys)
			as_values.push(i);
		return as_values;
	};
	
	
	/*!
	 * Returns an array whose values are the elements in the set of the given
	 * element.
	 * 
	 * \note Running time is O(n);
	 */
	this.getSetOf = function (i) {
		var r = this.find(i);
		var set = [];
		for (var j = 0 ; j < this.n ; ++j)
			if (r === this.find(j)) set.push(j);
		return set;
	};
	
	/**************************************************************************
	 *                             Private Operations                         *
	 *************************************************************************/
	
	/*!
	 * Returns the representing node for the set the node u belongs to.
	 */
	this._findNode = function (u) {	
		if (u == u.parent)
			return u;
		else {
			u.parent = this._findNode(u.parent);
			return u.parent;
		}
	};
	
	this.toString = function () {
		var s = "";
		var sets = this.getSets ();
		var first = true;
		for (i in sets) {
			if ( !first) s += ", ";
			else first = false;
			
			s += this.find(sets[i][0]) + "->{"+sets[i].join(",")+"}";
		}
		return s;
	};
}

/*
var A = new UnionFind (5);
print ("initial(0,1)\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
A.union (0,1);
print ("union(3,4)\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
A.union (3,4);
print ("union(1,0)\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
A.union(1,0);
print ("union(1,0)\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
A.union(0,4);
print ("union(0,4):\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
A.union (1,2);
print ("union(1,2)\n"+A+"\n---\n");
print ("sets: " + A.getSets().join(" | ") + "\n");
*/