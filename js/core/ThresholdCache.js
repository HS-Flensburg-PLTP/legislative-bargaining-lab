/*
 * ThresholdCache.js
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

goog.require('goog.structs.AvlTree');


/*!
 * Lookup up if there is a node in the tree for which comp(value,node) 
 * evaluates to true. The value argument is always passed as the first
 * argument to comp.
 * 
 * \note This code used the private \ref goog.structs AvlTree.traverse_
 *       function and thus, should be used with care.
 *
 * \param tree An object of type \ref goog.structs.AvlTree.
 * \return Returns the value of the node in the tree.
 */
function avl_tree_lookup (tree, value, comp) {
	// Assume the value is not in the tree and set this value if it is found
	var resultNode = null;
	
	// Depth traverse the tree and set resultNode if we find the node
	tree.traverse_(function(node) {
		var retNode = null;
		if (comp(value, node.value) < 0) {
			retNode = node.left;
		} else if (comp(value, node.value) > 0) {
			retNode = node.right;
		} else {
			resultNode = node;
		}
		return retNode; // If null, we'll stop traversing the tree
	});

	if (resultNode !== null) return resultNode.value;
	else return null;
};


function ThresholdCache (n)
{
	// Compares two ThresholdCache.Node objects.
	function comp (a,b) {
		return a.ub - b.ub;
	};

	// Used to lookup an existing value for a given remaining quota x.
	function lookup_comp (x, node) {
		if (x <= node.lb) return -1;
		else if (x <= node.ub) return 0;
		else return 1;
	};

	var _n = n;
	var _trees = [];
	var _hashes = []; // remaining quota -> ThresholdCache.Node
	for (var i = 0 ; i < _n ; ++i) {
		_trees.push (new goog.structs.AvlTree (comp));
		_hashes.push ([]);
	}
	
	/* Is there a node for a remaining quota of x at level i. */
	this.lookup = function (i,x) {
		var elem = _hashes[i][parseInt(x)];
		if (elem !== undefined) {
			return elem;
		}
		else {
			return avl_tree_lookup (_trees[i], x, lookup_comp);
		}
	};
	
	/*!
	 * Inserts a new node to the cache. The caller has to ensure that no such
	 * node already exists.
	 */
	this.insert = function (i, lb, ub, value) {
		if (1+parseInt(lb) === ub) {
			_hashes[i][parseInt(ub)] = new ThresholdCache.Node(lb,ub,value);
		}
		else {
			_trees[i].add (new ThresholdCache.Node(lb,ub,value));
		}
	};
}


ThresholdCache.Node = function (lb, ub, value)
{
	/*public:*/
	this.lb = lb;
	this.ub = ub;
	this.value = value;
};
