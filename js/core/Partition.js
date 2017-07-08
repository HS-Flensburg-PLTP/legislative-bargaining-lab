/*
 * Partition.js
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
 * Stores the \e partition of {0,..,n-1}. Each class of elements has an index.
 * 
 * \note It is guaranteed that if the classes are consecutive, all the players
 * in the i-th class have lower indices than the players in the (i+1)-th class.  
 */
function Partition (n, equal_func)
{
	this.n = n;
	this.equal_func = equal_func;
	this.classes = new UnionFind (n);
	this.repsByIndex = []; // index -> any element in class
	this.classIndexByElem = []; // elem -> class index
	
	for (var i = 0 ; i < n ; ++i) {
		var inserted = false;
		for (var k in this.repsByIndex) {
			var j = this.repsByIndex[k];
			
			if (this.equal_func(i, j)) {
				this.classes.union(i,j);
				this.classIndexByElem[i] = k;
				inserted = true;
			}
		}
		
		// Element does not belong to any existing class. Thus, create a
		// new class.
		if ( !inserted) {
			this.repsByIndex.push(i);
			this.classIndexByElem[i] = this.repsByIndex.length-1;
		}
	}

	
	/**
	 * Returns true if elements i and j are equal.
	 */
	this.areEqual = function (i,j) {
		if (i < 0 || j < 0 || i >= this.n || j >= this.n)
			throw "Index out of bounds."; 
		else {
			return this.classes.find(i) === this.classes.find(j);
		}
	};

	
	/**
	 * Returns the number of classes in the partition. 
	 */
	this.getClassCount = function () { return this.repsByIndex.length; };
	
	
	/**
	 * Returns any element of the class with the given index. Such an element
	 * is called a \e representative.
	 */
	this.getRepByIndex = function (i) { return this.repsByIndex[i]; };

	
	/**
	 * Returns the class (set of elements) containing the given element.
	 */
	this.getClassByIndex = function (i) {
		return this.classes.getSetOf(this.getRepByIndex(i));
	};
	
	
	/**
	 * Returns the class (set of elements) with the given index.
	 */
	this.getClassByElem = function (i) {
		return this.classes.getSetOf(i);
	};
	
	
	/**
	 * Returns an array containing the classes (sets of elements).
	 */
	this.getClasses = function () { 
		var ret = [];
		var m = this.getClassCount();
		
		for (var i = 0 ; i < m ; ++i) {
			ret.push (this.getClassByIndex(i));
		}
		return ret;
	};
	
	this.getClassIndexByElem = function (i) { return this.classIndexByElem[i]; };
	
	
	/**
	 * Returns the number of elements in the i-th class.
	 * 
	 * \note Running time is O(n).
	 */
	this.getClassSizeByIndex = function (i) {
		var sum = 0;
		for (var k = 0 ; k < this.n ; ++k) {
			if (parseInt(this.classIndexByElem[k]) === parseInt(i)) ++sum;
		}
		return sum;
	};
	
	
	/**
	 * Returns a map which maps to an element the index of the its class. 
	 */
	this.getElemToClassIndexMap = function (i) { return this.classIndexByElem; };
	
	this.toString = function () {
		var s = "___Parition of {0.."+this.n+"}:\n\t(Rep -> {...})___\n";
		var sets = this.classes.getSetsOfReps ();
		for (var rep in sets) {
			s += "\t" + rep + " -> {" + sets[rep].join(", ") + "}\n";
		}
		return s;
	};
};