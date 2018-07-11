/*
 * QOBDD.js
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
 * Returns sum + arr[0] + ... + arr[arr.length-1].
 */
function accumulate (arr, sum)
{
	for (var i in arr) sum += parseInt(arr[i]);
	return sum;
}


/**
 * The manager is used only if root's label is not 0. In this case a QOBDD is
 * created that has winning coalitions exactly set(root).
 */
function QOBDD (n, /*optional*/ root, /*optional*/ manager) {
	this.n = n;

	if (root) {
		if (0 === root.getVar()) this.root = root;
		else {
			var u = root;
			if ( !manager) manager = new QOBDD.Manager (n);

			/* Create QOBDD which represents set(root). */
			for (var i = root.getVar()-1 ; i >= 0 ; --i)
				u = manager.ite (i, manager.getZero(i+1), u);
			this.root = u;
		}
	}

	this.getVarCount = function () { return this.n; };

	this.setRoot = function(root) { this.root = root; };
	this.getRoot = function() { return this.root; };

	this.getZero = function(i) { return this.zeros[i]; };
	this.getOne = function(i) { return this.zeros[i]; };

	this.zeros = [];
	this.ones = [];

	QOBDD_prepareZeros(this);
	QOBDD_prepareOnes(this);

	this.countMinterms = function (manip) {
		var max = Math.pow(2,this.n);
		var op_id = ++QOBDD.unique_op_id;

		var aux = function (v) {
			if (v.isConst()) {
				if (v.isOne()) return max;
				else return 0;
			}
			else {
				if (v.visited == op_id) return v.value;
				else {
					ret = (aux(v.getThen()) + aux(v.getElse())) / 2;
					v.visited = op_id;
					v.value = ret;
					return ret;
				}
			}
		};

		var aux_manip = function (v) {
			if (v.isConst()) {
				if (v.isOne()) return max;
				else return 0;
			}
			else {
				if (v.visited === op_id) return v.value;
				else {
					ret = (aux_manip(manip.getThen(v)) + aux_manip(manip.getElse(v))) / 2;
					v.visited = op_id;
					v.value = ret;
					return ret;
				}
			}
		};

		if (manip)
			return aux_manip (this.getRoot());
		else
			return aux (this.getRoot());
	};


	/**
	 * Returns an array a such that for each variable i=0,...,n it holds a[i]
	 * is #{S ; S in set(this), i in S}.
	 *
	 * \note ECMAScript's integer precision is limited, so that you should not
	 *       rely on exact results here for large n (e.g. greater 2^31).
	 */
	this.countMintermsContainingVar = function () {
		/* For each node v, compute an array of two values [a,b], where a is
		 * the number of paths to that node starting at the root and b is
		 * #set(v). */

		var ret = [];
		for (var i = 0 ; i < this.n ; ++i)
			ret[i] = 0;

		/* At the beginning we now nothing about the number of paths to the
		 * 1-sink and 0-sink, respectively.*/
		QOBDD.one.value  = 0;
		QOBDD.zero.value = 0;

		/* Compute the number of paths to each node. There is one (fictional)
		 * path to the root. Initialize the number of path of each inner node
		 * with 0. */
		this.getRoot().value = 1;
		this.traverseInnerBreadthFirst(function(v) {
			v.getThen().value += v.value; v.getElse().value += v.value;
			return true; },
			function /*init*/ (v) { v.value = 0; });

		/* For each node v compute #set(v). At this point, relocate the number
		 * of path into the second component of an array. */
		QOBDD.one.value  = [1,QOBDD.one.value];
		QOBDD.zero.value = [0,QOBDD.zero.value];
		this.traverseInner(function (v) {
			var tCount = v.getThen().value[0];
			var paths = v.value;
			ret[v.getVar()] += paths * tCount;
			v.value = [tCount + v.getElse().value[0], paths];
			return true;
		});

		/* Assertion */
		if (QOBDD.one.value[1] != this.getRoot().value[0])
			throw "Number of paths to the 1-sink and set(this.getRoot()) differ: "
			+QOBDD.one.value[1]+" != "+this.getRoot().value[0]+".";

		return ret;
	};


	/**
	 * Returns an array a such that for each variable i=0,...,n it holds a[i]
	 * is #{S ; S in set(this), i in S, S-i not in set(this)}. For this
	 * algorithm to work, set(this) has to be an up-set.
	 *
	 * \note ECMAScript's integer precision is limited, so that you should not
	 *       rely on exact results here for large n (e.g. greater 2^31).
	 */
	this.countSwingingMinterms = function () {
		/* For each node v, compute an array of two values [a,b], where a is
		 * the number of paths to that node starting at the root and b is
		 * #set(v). */

		var ret = [];
		for (var i = 0 ; i < this.n ; ++i)
			ret[i] = 0;

		/* At the beginning we now nothing about the number of paths to the
		 * 1-sink and 0-sink, respectively.*/
		QOBDD.one.value  = 0;
		QOBDD.zero.value = 0;

		/* Compute the number of paths to each node. There is one (fictional)
		 * path to the root. Initialize the number of path of each inner node
		 * with 0. */
		this.getRoot().value = 1;
		this.traverseInnerBreadthFirst(function(v) {
			v.getThen().value += v.value; v.getElse().value += v.value;
			return true; },
			function /*init*/ (v) { v.value = 0; });

		/* For each node v compute #set(v). At this point, relocate the number
		 * of path into the second component of an array. */
		QOBDD.one.value  = [1,QOBDD.one.value];
		QOBDD.zero.value = [0,QOBDD.zero.value];
		this.traverseInner(function (v) {
			var tCount = v.getThen().value[0], eCount = v.getElse().value[0];
			var paths = v.value;
			ret[v.getVar()] += paths * (tCount - eCount);
			v.value = [tCount + eCount, paths];
			return true;
		});

		/* Assertion */
		if (QOBDD.one.value[1] != this.getRoot().value[0])
			throw "Number of paths to the 1-sink and set(this.getRoot()) differ: "
			+QOBDD.one.value[1]+" != "+this.getRoot().value[0]+".";

		return ret;
	};


	/**
	 * Returns the number of inner QOBDD nodes.
	 */
	this.size_ = function () {
		var op_id = ++QOBDD.unique_op_id;
		var sum = 0;

		var aux = function (v) {
			if ( v.isConst() || v.visited == op_id) return;
			else {
				sum ++;
				v.visited = op_id;
				aux(v.getThen());
				aux(v.getElse());
			}
		};

		aux(this.getRoot());
		return sum;
	};

	this.size = function () { return this.size_(); };


	/**
	 *  @fn QOBDD::sizeAtMost
	 *
	 *  Retruns true if there are at most m inner nodes.
	 *
	 *  @tparam int m Number of inner nodes.
	 */
	this.sizeAtMost = function (m) {
		var op_id = ++QOBDD.unique_op_id;
		var left = m;

		var aux = function (v) {
			if ( v.isConst() || v.visited == op_id) return;
			else {
				left --;
				if (left <= 0)
					throw null;
				v.visited = op_id;
				aux(v.getThen());
				aux(v.getElse());
			}
		};

		try {
			aux(this.getRoot());
			return true;
		}
		catch (e) {	return false; }
	};


	/**
	 * @fn QOBDD::sizeAtLeast
	 *
	 * Returns true if there are at least m inner nodes.
	 *
	 * @tparam int m Number of inner nodes.
	 */
	this.sizeAtLeast = function (m) { return !this.sizeAtMost(m-1); };


	/**
	 * Returns true exactly if the given set is in the set represented by the
	 * QOBDD. The set has to be an array where the values represent the
	 * elements in the set.
	 *
	 * \note Running time is O(n), where n is the number of variables.
	 *
	 * \note This function is sometimes called \e evaluate in the context of
	 *       BDDs.
	 */
	this.isIn = function (set) {
		/* First convert the set to a path which maps the labels to true
		 * and false, respectively. */
		var path = [];
		for (var i = 0 ; i < this.getVarCount() ; ++ i)	path[i] = false;
		for (var i in set) path[set[i]] = true;

		/* Traverse the QOBDD starting at the root until we reach a terminal
		 * node. The terminal node determines the result. */
		var u = this.getRoot();
		while ( !u.isConst())
			u = path[u.getVar()] ? u.getThen() : u.getElse();

		return u.isOne();
	};


	/**
	 * Returns the labels of the variables the QOBDD depends on. A QOBDD
	 * depends on a variable i if there is a set S without i that is not in the
	 * QOBDD such that \f$S\cup\{i\}\f$ is in the QOBDD.
	 */
	this.getSupport = function () {
		var op_id = ++QOBDD.unique_op_id;

		/* A variable is in the support <=> it has a non-redundant node. */
		var in_support = [];
		for (var i = 0 ; i < this.getVarCount() ; ++i)
			in_support[i] = false;

		var in_support_up_to_level = n; // this ... n-1 are in the support.

		var _aux = function (u) {
			if (u.isConst() || u.visited === op_id) return;
			else {
				var i = u.getVar();
				if (in_support_up_to_level === i) return;
				if ( !u.isRedundant()) in_support[i] = true;

				u.visited = op_id;
				_aux(u.getThen());
				_aux(u.getElse());

				if (in_support[i] && in_support_up_to_level == i-1)
					in_support_up_to_level = i;
			}
		};

		_aux(this.getRoot());

		var support = [];
		for (var i = 0 ; i < this.n ; ++i)
			if(in_support[i]) support.push(i);
		return support;
	};


	/**
	 * Traverses each inner node of the QOBDD once and calls the given callback
	 * for it. The traversal is stopped if the callback returned false. The
	 * call is made after the children were visited
	 *
	 * \return Returns true if the callback never returned false and false
	 *         otherwise.
	 */
	this.traverseInner = function (func) {
		var op_id = ++QOBDD.unique_op_id;

		var _aux = function (u) {
			if (u.isConst() || u.visited === op_id) return true;
			else {
				u.visited = op_id;
				return _aux(u.getThen()) && _aux(u.getElse()) && func(u);
			}
		};

		return _aux(this.getRoot());
	};


	/**
	 * Traverses each inner node of the QOBDD once and calls the given callback
	 * for it. The traversal is stopped if the callback returned false. The
	 * nodes are visited in breadth-first search order.
	 *
	 * \param init_func Called for a node v before that node appeared as the
	 *                  1- or 0-successor passed to func. (optional)
	 * \return Returns true if the callback never returned false and false
	 *         otherwise.
	 */
	this.traverseInnerBreadthFirst = function (func, init_func) {
		var op_id = ++QOBDD.unique_op_id;
		var queue = [this.getRoot()];
		var v;

		if (!init_func) init_func = function () { };

		/* Here the 'visited' property has the meaning of "Is on the queue".
		 * Don't visit the sinks. */
		init_func(QOBDD.one);
		QOBDD.one.visited  = op_id;
		init_func(QOBDD.zero);
		QOBDD.zero.visited = op_id;

		while ((v = queue.shift())) {
			var u = v.getThen();
			if (u.visited !== op_id) {
				init_func(u);
				queue.push (u);
				u.visited = op_id;
			}
			u = v.getElse();
			if (u.visited !== op_id) {
				init_func(u);
				queue.push (u);
				u.visited = op_id;
			}

			if ( !func (v))
				return false;
		}

		return true;
	};


	/**
	 * Returns true if and only if the the QOBDD is equivalent to the given
	 * one. Both QOBDD's can have different node sets. The case of a shared
	 * node set is handles efficiently.
	 *
	 * \note Running time is O(min{size(this),size(other)}).
	 */
	this.equals = function (other) {
		var op_id = ++QOBDD.unique_op_id;

		var _aux = function (u,v) {
			if (u === v) return true;
			/* Only handles the case of different const. nodes. */
			else if (u.isConst()) return false;
			else if (u.visited === op_id) return u.value === v;
			else {
				u.visited = op_id;
				u.value = v;
				return _aux (u.getThen(), v.getThen())
					&& _aux(u.getElse(), v.getElse());
			}
		};

		return _aux(this.getRoot(), other.getRoot());
	};


	/**
	 * @fn QOBDD::collectNodes
	 *
	 * Collects the inner nodes on each level and returns them.
	 *
	 * @treturn array<array<QOBDD::Node>> Returns the nodes.
	 */
	this.collectNodes = function () {
		var i = 0;
		var V = [];
		for (i = 0 ; i < this.n ; ++i) V.push([]);

		var op_id = ++QOBDD.unique_op_id;

		var _aux = function (u) {
			if (u.isConst() || u.visited === op_id) return;
			else {
				V[u.getVar()].push(u);
				u.visited = op_id;

				_aux(u.t);
				_aux(u.e);
			}
		};

		_aux(this.getRoot());
		return V;
	};



	/**
	 * @fn QOBDD::areLevelsTotallyOrdered
	 *
	 * Returns true if and only if for each non-terminal level the inner nodes
	 * on that level can be totally ordered w.r.t. strict set inclusion.
	 *
	 * \note Strict equality === has to be used to test if the true is returned.
	 *
	 * \treturn mixed Returns true if the property is true, but returns a
	 * witness for the property not to be true otherwise, that is, a triple
	 * [i,u,v] where i is a level not totally ordered and u,v are two
	 * incomparable nodes on that level such that both set(u)\set(v) and
	 * set(v)\set(u) are not empty.
	 */
	this.areLevelsTotallyOrdered = function (manager) {
		var is_total = true;
		var witness = null;

		if ( !manager) manager = new QOBDD.Manager(this.getVarCount());

		/* Collect the nodes on each level. */
		var V = this.collectNodes();

		/* After that call, the value property of each inner node v corresponds
		 * to #set(v). */
		QOBDD.one.value  = 1;
		QOBDD.zero.value = 0;
		this.traverseInner (function(u) { u.value = u.t.value + u.e.value; return true; });

		/* There is just a sinlge not on level 0, viz. the root. We process the
		 * level bottom-up to find a simple witness when present. */
		for (var i = this.getVarCount()-1 ; i >= 1 && is_total ; --i) {
			/* If the nodes are totally ordered w.r.t to strict set inclusion
			 * that order is the same as if we ordered the nodes by they
			 * #set(v) values. */
			V[i].sort(function(u,v){ return u.value - v.value; });

			/* V[i][0] < ... < V[i][m]? */
			var m = V[i].length;
			for (var k = 0 ; k < m-1 && is_total ; ++k) {
				/* We use <= here because less is more expensive and the quasi-
				 * reducedness quarantees unequal sets. */
				if ( !manager.less_equal (V[i][k], V[i][k+1])) {

					witness = [i,V[i][k],V[i][k+1]];
					is_total = false;
				}
			}
		}

		if (is_total) return true;
		else return witness;
	};


	/**
	 * @fn QOBDD::getAnyPathToNode
	 *
	 * Returns a path \f$(x_0,\ldots,x_{i-1})\in\mathbb{B}^i\f$ for the given
	 * node on level i where \f$x_k\f$ indicates which edge to take on level k.
	 * An exception is thrown if no path could be found. That would means, the
	 * node is not reachable from the root does not belong to the QOBDD.
	 *
	 * \note In the worst-case all nodes on the levels up to the level of the
	 * node have to be visited.
	 *
	 * \tparam QOBDD::Node node The node to find a path to. May be terminal.
	 * \treturn array<bool> Path to the node.
	 */
	this.getAnyPathToNode = function (node) {
		var path = [];
		var op_id = ++QOBDD.unique_op_id;
		var have_path = false;
		var level = node.getVar();

		var _aux = function (u) {
			var i = u.getVar();

			if (node === u)	throw true; /* we found it. */
			else if (i >= level || u.visited === op_id) return;
			else {
				/* Trying the 0-sink first favours paths with less 1-edges at
				 * the cost of more running time in case of simple games. */
				path[i] = false;
				_aux(u.e);
				path[i] = true;
				_aux(u.t);
				/* This node is a dead end. */
				u.visited = op_id;
			}
		};

		try { _aux(this.getRoot());	}
		catch (e /*is true*/) {
			have_path = true;
		}

		if (have_path) return path;
		else throw "Node not found in QOBDD.";
	};


	/**
	 * @fn QOBDD::getAnySetToNode
	 *
	 * \see QOBDD::getAnyPathToNode
	 * \see QOBDD::pathToSet
	 */
	this.getAnySetToNode = function (node) {
		return QOBDD.pathToSet (this.getAnyPathToNode(node));
	};


	/**
	 * @fn QOBDD::getAnyPath
	 *
	 * Returns any path from the root to the 1-sink if there is on. If not,
	 * that is, the represented set is empty, an exception is thrown.
	 *
	 * \see QOBDD::getAnySet
	 */
	this.getAnyPath = function () {
		try { return this.getAnyPathToNode (QOBDD.one); }
		catch (e) {
			throw "QOBDD is empty.";
		}
	};

	/**
	 * @fn QOBDD::getAnySet
	 *
	 * Returns any set from the root to the 1-sink if there is on. If not,
	 * that is, the represented set is empty, an exception is thrown.
	 *
	 * \see QOBDD::getAnyPath
	 */
	this.getAnySet = function () { return QOBDD.pathToSet(this.getAnyPath()); };


	/**
	 * @fn QOBDD::computeBounds
	 *
	 * Computes the bounds (lb,ub] for each inner node and the sinks. Given
	 * node v, lb is the maximum weight of all losing coalitions in set(v) or
	 * \f$-\infty\f$ if there is no such coalition and ub is the minimum weight
	 * of all winning coalitions in set(v) or \f$\infty\f$ if there is no
	 * winning coalition.
	 *
	 * After the call, the bounds are available in the node's 'value' property
	 * as an array [lb,ub].
	 *
	 * @tparam array<int> w Array of weights.
	 */
	this.computeBounds = function (w) {
		QOBDD.one.value  = [-Infinity, 0];
		QOBDD.zero.value = [0, Infinity];
		this.traverseInner(function (u) {
			var i = u.getVar();
			var lb = Math.max(u.t.value[0] + w[i], u.e.value[0]);
			var ub = Math.min(u.t.value[1] + w[i], u.e.value[1]);
			u.value = [lb,ub];
			return true;
		});
	};


	/**
	 * @fn QOBDD::toSet
	 *
	 * Returns an array of sets representing the cubes covered by the QOBDD.
	 */
	this.toSet = function () { return this.getRoot().toSet(); };


	/**
	 * @ fn QOBDD::enumerateSets
	 *
	 * Enumerates the sets represented by the QOBDD. The given function f is
	 * called for every such set. The enumeration stops of f returns not true.
	 * Returns true if all calls to f returned true.
	 *
	 * The array (set) passed to the callback is reused so that it has to be
	 * copied (using slice(0)) if necessary.
	 */
	this.enumerateSets = function (manager, f) {
		var set = [];

		var _aux = function (v) {
			var i = v.label;

			if (v === QOBDD.one) {
				return f (set);
			}
			else if (v !== manager.getZero(i)) {
				var ret = _aux (v.e);

				if (ret) {
					set.push (i);
					ret = _aux (v.t);
					set.pop ();
				}

				return ret;
			}
			else return true;
		};

		_aux (this.getRoot());
	};
}

/**
 * Is an exception. Is thrown if in \ref wvg_to_qobdd the maximum number of
 * nodes is exceeded.
 */
QOBDD.TooManyNodes = function ()
{
	this.toString = function () { return "Too many nodes."; };
};


QOBDD.next_id = 1;
QOBDD.unique_op_id = 1;

QOBDD.aquireOpId = function () { return ++QOBDD.unique_op_id; };


/**
 * @func lex_reverse_less_equal
 *
 * Compares arrays a and b lexicographically in reverse order. The arrays a
 * and b must have the same length.
 */
function lex_reverse_less_equal (a,b)
{
	for (var i = a.length - 1 ; i >= 0 ; --i) {
		if (a[i] < b[i]) return -1;
		else if (a[i] > b[i]) return +1;
	}
	return 0;
}


/**
 * @func array_union_sorted
 *
 * Given two sorted arrays a and b (w.r.t. the comparator 'comp'), the function
 * returns an array that is sorted w.r.t comp and contains all the elements in
 * a and b exactly once. The name is due to the operation 'union' on sets and
 * this is exactly what the function is doing.
 */
function array_union_sorted (a,b,comp)
{
	var ret = [];
	var i=0,j=0;
	var cur, prev;

	while (i < a.length && j < b.length) {
		if (comp(a[i],b[j]) < 0) cur = a[i++];
		else cur = b[j++];

		if (prev == undefined || 0 !== comp(prev,cur))
			ret.push (cur);
		prev = cur;
	}

	if (i < a.length) {
		if (prev !== undefined && 0 === comp(prev,a[i])) i++;
		while (i < a.length) ret.push(a[i++]);
	}

	if (j < b.length) {
		if (prev !== undefined && 0 === comp(prev,b[j])) j++;
		while (j < b.length) ret.push(b[j++]);
	}

    return ret;
}


/**
 * Main object to represent a QOBDD.
 *
 * \param label The variable index starting at 0.
 * \param t The 1-edge successor.
 * \param e The 0-edge successor.
 * \param value The user data. [optional]
 */
QOBDD.Node = function (label, t, e, value, id, next)
{
	/*public:*/
	if (label === Infinity)
		this.label = label;
	else
		this.label = parseInt(label); // variable index
	this.t = t; // 1-edge, "then"
	this.e = e; // 0-edge, "else"
	this.value = value; // user data
	this.id = QOBDD.next_id++; // Unique node ID for a label.
	//this.visited = null; // initially undefined


//	/* All inner node values have to be null for this to work. */
//	this.equals = function (node) {
//
//
//		if (node.label != this.label) return false;
//		else {
//			var _equals_rec = function (u,v) {
//				if (u == v) return true;
//				else if (u.isConst()) return u == v;
//				else if (u.value != null)
//					return u.value == v;
//				else {
//					u.value = v;
//					return _equals_rec(u.t,v.t) && _equals_rec(u.e,v.e);
//				}
//			}
//			return _equals_rec (this, node);
//		}
//	}

	/**
	 * Sets the value of all nodes reachable from the node to the given value.
	 * There must be no node with the given label. Otherwise there is no
	 * guarantee all node's value is set.
	 *
	 * \node The value of the terminal nodes is set, too.
	 */
//	this.setValueRec = function (valueFunc) {
//		var value = valueFunc(value);
//
//		if (this.isConst()) this.value = value;
//		else if (this.value != value) {
//			this.value = value;
//			this.t.setValueRec (valueFunc);
//			this.e.setValueRec (valueFunc);
//		}
//	}
};


QOBDD.Node.prototype.isConst = function () { return this.label === Infinity; };

QOBDD.Node.prototype.isOne   = function () { return this === QOBDD.one; };
QOBDD.Node.prototype.isZero  = function () { return this === QOBDD.zero; };
QOBDD.Node.prototype.isRedundant = function () { return this.t === this.e; };

QOBDD.Node.prototype.getThen = function () { return this.t; };
QOBDD.Node.prototype.getElse = function () { return this.e; };
QOBDD.Node.prototype.getVar = function () { return this.label; };
QOBDD.Node.prototype.getId = function () { return this.id; };

QOBDD.Node.prototype.setThen = function (v) { this.t = v; };
QOBDD.Node.prototype.setElse = function (v) { this.e = v; };

QOBDD.Node.prototype.toSet = function () {
	if (this.isOne()) return [[]];
	else if (this.isZero()) return [];
	else {
		var tl = this.t.toSet(), retl = this.e.toSet();
		for (var i in tl) {
			retl.push([this.label].concat(tl[i]));
		}
		return retl;
	}
};

// First argument is the number of types.
// Second argument maps player indices to type indices.
QOBDD.Node.prototype.toModels = function (m, map) {
	if (this.isOne()) {
		var nullvec = [];
		for (var i = 0 ; i < m ; ++i) nullvec.push(0);
		return [nullvec];
	}
	else if (this.isZero()) return [];
	else {
		var tl = this.t.toModels(m,map), retl = this.e.toModels(m,map);
		for (var k in tl) {
			tl[k][map[this.label]] ++;
		}

		var ret = array_union_sorted (tl,retl,lex_reverse_less_equal);
		return ret;
	}
};

QOBDD.Node.prototype.toString = function () {
	return "QOBDD.Node(label="+this.label
	+",!!t="+(!!this.t)
	+",!!e="+(!!this.e)
	+",value="+this.value
	+",id="+this.id
	+",visited="+this.visited
	+")";
};


/**
 *  Terminal nodes. Same for all QOBDDs
 */
// changed for parsing purposes
// QOBDD.one = new QOBDD.Node(Infinity, null, null, undefined);
QOBDD.one = new QOBDD.Node(Infinity, null, null, 1);
QOBDD.one.t = QOBDD.one;
QOBDD.one.e = QOBDD.one;
// changed for parsing purposes
// QOBDD.zero = new QOBDD.Node(Infinity, null, null, undefined);
QOBDD.zero = new QOBDD.Node(Infinity, null, null, 0);
QOBDD.zero.t = QOBDD.zero;
QOBDD.zero.e = QOBDD.zero;

// TODO: Remove in future versions.
QOBDD.getZero = function() { return QOBDD.zero; };
QOBDD.getOne = function() { return QOBDD.one; };


function QOBDD_prepareZeros (self)
{
	self.zeros[self.n] = QOBDD.zero;
	for (var i = self.n-1 ; i>=0 ; --i)
		self.zeros[i] = new QOBDD.Node(i,self.zeros[i+1], self.zeros[i+1], undefined, QOBDD.next_id++);
}

function QOBDD_prepareOnes (self)
{
	self.ones[self.n] = QOBDD.one;
	for (var i = self.n-1 ; i>=0 ; --i)
		self.ones[i] = new QOBDD.Node(i,self.ones[i+1], self.ones[i+1], undefined, QOBDD.next_id++);
}


/**
 * @fn QOBDD::pathToSet
 *
 * Converts a path to a set. A path is a sequence of Boolean values that
 * determines which players are in a set and which are not.
 *
 * \see QOBDD::setToPath
 *
 * @treturns array Returns the set of players corresponding to the path.
 */
QOBDD.pathToSet = function (path)
{
	var set = [];
	for (var i in path) if (path[i]) set.push(i);
	return set;
};


/**
 * @fn QOBDD::setToPath
 *
 * Converts a set to a path. A path is a sequence of Boolean values that
 * determines which players are in a set and which are not.
 *
 * \see QOBDD::pathToSet
 *
 * @tparam array<int> set The set of players.
 * @tparam int n The length of the path. If there are elements in set >= n they
 * are ignored. For instance, set=[0,1,3] with n=3 results in [true,true,false]
 * instead of [true,true,false,true]. Optional.
 * @treturns array Returns the path corresponding to the set of players.
 */
QOBDD.setToPath = function (set, n)
{
	var path = [], i;

	if (!(n > 0)) /* n not present */ {
		n = -Infinity;
		for (i in set)
			n = Math.max(n, set[i]);
		n ++;
	}

	for (i = 0 ; i < n ; ++i)
		path[i] = false;

	for (i in set) {
		if (set[i] >= n) break;
		path[set[i]] = true;
	}
	return path;
};


QOBDD.Manager = function (n)
{
	this.n = n;
	this.unique = new UniqueTable (n);
	this.ith_cached = []; // QOBDD
	this.one_cached = []; // nodes
	this.zero_cached = []; // nodes

	this.and_recs = 0;
	this.and_non_cached_recs = 0;
	this.or_recs = 0;
	this.or_non_cached_recs = 0;
	this.or_manip_recs = 0;
	this.or_manip_non_cached_recs = 0;

	this.caches = [];
	this.caches["and"] = new ComputedTable (n);
	this.caches["or"] = new ComputedTable (n);
	this.caches["minus"] = new ComputedTable (n);
	//this.caches["less"] = new ComputedTable (n);
	this.caches["less_equal"] = new ComputedTable (n);

	// Uses its own caches.
	this.or_manip = function (r, rmanip, s, smanip) {
		var n = r.getVarCount();
		var cache = new ComputedTable (n);
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var ret = new QOBDD (n);
		var manager = this;

		var _aux = function (u,v) {
			if (u.isConst()) return (u === one || v === one) ? one : zero;
			/* u === v MUST NOT be used because it could produce
			 * wrong results. The reason is, that the manipulators can break
			 * canonicity such that u and v w.r.t manipulators are now
			 * different! */
			//else if (u === v) return u;
			else {
				manager.or_manip_recs++;
				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					manager.or_manip_non_cached_recs++;
					var t = _aux (rmanip.getThen(u), smanip.getThen(v));
					var e = _aux (rmanip.getElse(u), smanip.getElse(v));

					//r = new QOBDD.Node (u.getVar(), t,e); // much slower
					r = manager.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, _aux(r.getRoot(), s.getRoot()));
	};


	// Uses its own caches.
	this.and_manip = function (r, rmanip, s, smanip) {
		var n = r.getVarCount();
		var cache = new ComputedTable (n);
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var ret = new QOBDD (n);
		var self = this;

		var aux = function (u,v) {
			if (u.isConst()) {
				return (u.isOne() && v.isOne()) ? one : zero;
			}
			else {
				//document.write ("or_manip: u="+u+", v="+v+"<br/>");

				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					var t = aux (rmanip.getThen(u), smanip.getThen(v));
					var e = aux (rmanip.getElse(u), smanip.getElse(v));

					r = self.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, aux(r.getRoot(), s.getRoot()));
	};


	// Uses its own caches.
	this.minus_manip = function (r, rmanip, s, smanip) {
		var n = r.getVarCount();
		var cache = new ComputedTable (n);
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var ret = new QOBDD (n);
		var self = this;

		var aux = function (u,v) {
			if (u.isConst()) {
				return (u === one && v === zero) ? one : zero;
			}
			//else if (u === v) return self.getZero(u.getVar());
			else {
				//document.write ("or_manip: u="+u+", v="+v+"<br/>");

				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					var t = aux (rmanip.getThen(u), smanip.getThen(v));
					var e = aux (rmanip.getElse(u), smanip.getElse(v));

					r = self.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, aux(r.getRoot(), s.getRoot()));
	};


	// Uses its own caches.
	this.minus_norm_manip = function (r, s, smanip) {
		var n = r.getVarCount();
		var cache = new ComputedTable (n);
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var self = this;

		var aux = function (u,v) {
			if (u.isConst()) {
				return (u === one && v === zero) ? one : zero;
			}
			else {
				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					var t = aux (u.t, smanip.getThen(v));
					var e = aux (u.e, smanip.getElse(v));

					r = self.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, aux(r.getRoot(), s.getRoot()));
	};


	this.ite = function (i,t,e) {
		//document.write ("ite: i="+i+",t="+t+",e="+e+"<br/>");
		var ret = this.unique.lookup(i,t,e);
		if (ret) return ret;
		else {
			ret = new QOBDD.Node (i,t,e,null,QOBDD.next_id++);
			this.unique.insert (i,t,e,ret);
			return ret;
		}
	};

	this.and = function (r, s) {
		var n = r.getVarCount();
		var cache = this.caches["and"];
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var ret = new QOBDD (n);
		var self = this;

		var aux = function (u,v) {
			if (u.isConst())
				return (u.isOne() && v.isOne()) ? one : zero;
			else {
				self.and_recs ++;
				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					self.and_non_cached_recs ++;
					var t = aux (u.getThen(), v.getThen());
					var e = aux (u.getElse(), v.getElse());

					r = self.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, aux(r.getRoot(), s.getRoot()));
	};

	this.or = function (r, s) {
		var n = r.getVarCount();
		var cache = this.caches["or"];
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var ret = new QOBDD (n);
		var self = this;

		var aux = function (u,v) {
			if (u.isConst())
				return (u.isOne() || v.isOne()) ? one : zero;
			else {
				self.or_recs ++;
				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					self.or_non_cached_recs ++;
					var t = aux (u.getThen(), v.getThen());
					var e = aux (u.getElse(), v.getElse());

					r = self.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return new QOBDD (n, aux(r.getRoot(), s.getRoot()));
	};

	/**
	 * Computes r AND NOT(s) where r and s are QOBDD nodes with a common
	 * label. Returns a \ref QOBDD.Node.
	 */
	this.minus_raw = function (r, s) {
		var cache = this.caches["minus"];
		var one = QOBDD.getOne(), zero = QOBDD.getZero();
		var manager = this;

		var aux = function (u,v) {
			if (u.isConst())
				return (u === one && v === zero) ? one : zero;
			else {
				var r = cache.lookup (u,v);
				if (r) return r;
				else {
					var t = aux (u.getThen(), v.getThen());
					var e = aux (u.getElse(), v.getElse());

					r = manager.ite (u.getVar(), t,e);
					cache.insert (u,v,r);
					return r;
				}
			}
		};

		return aux(r,s);
	};

	/**
	 * Computes r AND NOT(s) for QOBDDs r and s.
	 */
	this.minus = function (r,s) {
		return new QOBDD(r.getVarCount(), this.minus_raw(r.getRoot(), s.getRoot()));
	};


	/**
	 * \fn QOBDD::Manager::less_equal
	 *
	 * Compares QOBDDs or QOBDD nodes to be less or equal.
	 *
	 * @param r A \ref QOBDD or a \ref QOBDD::Node.
	 * @param s A \ref QOBDD or a \ref QOBDD::Node.
	 * @treturns bool r <= s
	 */
	this.less_equal = function (r,s) {
		var cache = this.caches["less_equal"];

		var _aux = function (u,v) {
			if (u.isConst()) return !u.isOne() || v.isOne(); // u=1 => v=1
			else {
				if (cache.lookup (u,v)) return true;
				else {
					var ret = _aux(u.t, v.t) && _aux(u.e, v.e);
					cache.insert (u,v,true);
					return ret;
				}
			}
		};

		if (r instanceof QOBDD.Node) {
			if (r.getVar() != s.getVar()) return false;
			else return _aux(r,s);
		}
		else return _aux (r.getRoot(), s.getRoot());
	};


	// returns a node, not a QOBDD.
	this.getZero = function (i) {
		if ((typeof i) === 'undefined' || i>=this.n)
			return QOBDD.zero;
		else {
			var ret = this.zero_cached[i];

			if ( !ret) {
				if (i == this.n-1)
					ret = this.ite (i,QOBDD.zero, QOBDD.zero);
				else {
					var u = this.getZero(i+1);
					ret = this.ite(i, u,u);
				}
				this.zero_cached[i] = ret;
			}
			return ret;
		}
	};

	/**
	 * Returns an array containing the zeros including QOBDD.zero at
	 * index n.
	 *
	 * The returned array must NOT be altered.
	 */
	this.getZeros = function () {
		this.getZero(0); // creates all zeros.
		return this.zero_cached;
	};

	// returns a node, not a QOBDD.
	this.getOne = function (i) {
		if ((typeof i) === 'undefined' || i>=this.n)
			return QOBDD.one;
		else {
			var ret = this.one_cached[i];

			if ( !ret) {
				if (i == this.n-1)
					ret = this.ite (i, QOBDD.one, QOBDD.one);
				else {
					var u = this.getOne(i+1);
					ret = this.ite(i, u, u);
				}
				this.one_cached[i] = ret;
			}
			return ret;
		}
	};

	/**
	 * Returns a QOBDD representing \f$ {S\in 2^N ; i\in S } \f$
	 */
	this.ith = function (i) {
		if ( !this.ith_cached[i]) {
			var u = this.ite (i, this.getOne(i+1), this.getZero(i+1));
			for (var k = i-1 ; k >= 0 ; --k)
				u = this.ite (k, u,u);
			this.ith_cached[i] = new QOBDD(this.n, u);
		}
		return this.ith_cached[i];
	};

	this.getVarCount = function () { return this.n; };

	this.clearCaches = function () {
		for (var i in this.caches)
			this.caches[i].clear();
	};
};



/**
 * Creates a QOBDD from an \ref WVG and returns it. If optional argument
 * max_nodes is given an exception of type QOBDD.TooManyNodes is thrown
 * if the max_nodes+1th is to be created.
 *
 * \param max_nodes Use <=0 or omit for infinity. [optional]
 */
function wvg_to_qobdd (game, max_nodes, ite)
{
	var n = game.getPlayerCount();
	var cache = new ThresholdCache (n);
	var w = game.weights;
	var node_count = 0;

	if(typeof max_nodes != "number" || max_nodes <= 0)
		max_nodes = Infinity;

	if ( !ite)
		ite = function (i,t,e) { return new QOBDD.Node (i, t, e, null); };

	function _rec (b, i, left) {
		var lb, ub, ent;

		if (b <= 0 && i == n) {
			return [-Infinity, 0, QOBDD.one];
		}
		else if (left < b && i == n) {
			return [left, Infinity, QOBDD.zero];
		}
		else {
			ent = cache.lookup (i, b);
			if (ent != null)
				return [ent.lb, ent.ub, ent.value];
			else {
				var e,t, lbT, lbE, ubT, ubE, el, tl;

				el = _rec(b,     i+1, left-w[i]);
				lbE = el[0];
				ubE = el[1];
				e   = el[2];

				tl = _rec(b-w[i],i+1, left-w[i]);
				lbT = tl[0];
				ubT = tl[1];
				t   = tl[2];

				var ub = Math.min(ubT+w[i], ubE); /* min. winning */
				var lb = Math.max(lbT+w[i], lbE); /* max. losing */

				node_count ++;
				if (node_count > max_nodes)
					throw new QOBDD.TooManyNodes ();

				var r = ite(i,t,e);

				cache.insert (i, lb, ub, r);
				return [lb, ub, r];
			}
		}
	}

	var root, res;
	res = _rec (game.quota, 0, game.getTotalWeight());
	//document.write ("QOBDD for "+game+" has " + node_count + " nodes.<br/>");
	return new QOBDD(n,res[2]);
}



/**
 * Returns the negated QOBDD in place.
 *
 * \note This is a constant time function because the number of inner nodes
 *       on the bottom most level is at most three.
 */
function inverse_inplace (/*inout*/ r)
{
	var n = r.getVarCount();
	var one = QOBDD.getOne(), zero = QOBDD.getZero();
	var op_id = ++QOBDD.unique_op_id;

	var aux = function (v) {
		if (v.isConst() || v.visited === op_id) return;
		else {
			if (v.getVar() == n-1) {
				if (v.getThen() == one) v.setThen(zero); else v.setThen(one);
				if (v.getElse() == one) v.setElse(zero); else v.setElse(one);
			}
			else {
				aux(v.getThen());
				aux(v.getElse());
			}

			v.visited = op_id;
		}
	};

	aux (r.getRoot());
	return r;
}


/**
 *
 */
function leq_manip (r,rmanip,s,smanip)
{
	var n = r.getVarCount();

	if (n != s.getVarCount() || r.getRoot().getVar() || s.getRoot().getVar())
		return false;
	else {
		var cache = new ComputedTable (n);

		var _aux = function (u,v) {
			if (u.isConst()) {
				return !u.isOne() || v.isOne();
			}
			else {
				if (cache.lookup (u,v)) {
					return true;
				}
				else {
					var ret = _aux(rmanip.getThen(u), smanip.getThen(v))
						&& _aux(rmanip.getElse(u), smanip.getElse(v));
					cache.insert (u,v,true);
					return ret;
				}
			}
		};

		var less_equal = _aux (r.getRoot(),s.getRoot());
		delete cache;
		return less_equal;
	}
};

function less_manip (r,rmanip,s,smanip)
{
	var n = r.getVarCount();

	if (n != s.getVarCount() || r.getRoot().getVar() || s.getRoot().getVar())
		return false;
	else {
		var cache = new ComputedTable (n);
		var not_equal = false;

		/* Implements less equal */
		var _aux = function (u,v) {
			if (u.isConst()) {
				/* For being less, there has to be at least one pair for which
				 * the terminal nodes are different (u=zero and v=one). */
				not_equal = not_equal || (u !== v);
				return !u.isOne() || v.isOne();
			}
			else {
				if (cache.lookup (u,v)) {
					return true;
				}
				else {
					var ret = _aux(rmanip.getThen(u), smanip.getThen(v))
						&& _aux(rmanip.getElse(u), smanip.getElse(v));
					cache.insert (u,v,true);
					return ret;
				}
			}
		};

		//delete cache;
		var less_equal = _aux (r.getRoot(),s.getRoot());
		delete cache;
		return not_equal && less_equal;
	}
};


function equal_manip (r,rmanip,s,smanip)
{
	var n = r.getVarCount();

	if (n != s.getVarCount() || r.getRoot().getVar() || s.getRoot().getVar())
		return false;
	else {
		var cache = new ComputedTable (n);

		var _aux = function (u,v) {
			if (u.isConst()) {
				return u.isOne() === v.isOne();
			}
			else {
				if (cache.lookup (u,v)) {
					return true;
				}
				else {
					var ret = _aux(rmanip.getThen(u), smanip.getThen(v))
						&& _aux(rmanip.getElse(u), smanip.getElse(v));
					cache.insert (u,v,true);
					return ret;
				}
			}
		};

		var are_equal = _aux (r.getRoot(),s.getRoot());
		delete cache;
		return are_equal;
	}
};


/**
 * Given the QOBDD representing the winning coalitons of a directed simple
 * game, the QOBDD representation of the minimal winning coalitions is
 * returned.
 *
 * \param W QOBDD representing a directed simple game.
 * \param manager Has to have the same number of variables than A. (optional)
 */
function minwin_directed (W, manager)
{
	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;

	if (!manager)
		manager = new QOBDD.Manager(n);

	var _aux = function (u) {
		if (u.isConst()) return u;
		else if (u.visited == op_id) return u.value;
		else {
			var t,e,r;
			var i = u.getVar();

			if (u.isRedundant()) t = manager.getZero(i+1);
			else t = _aux(u.getThen());

			e = _aux(u.getElse());

			r = manager.ite (i,t,e);
			u.visited = op_id;
			u.value = r;
			return r;
		}
	};

	return new QOBDD (n, _aux(W.getRoot()));
}


function minwin (W, manager)
{
//	MinWin(v)
//	if v = O or v = I then return v
//	elsif T(v) = E(v) then return ite(var(v);O_{var(v)+1}; MinWin(E(v)))
//	else return ite(var(v); MinWin(T(v)) \ e); e)
//		where e := MinWin(E(v))
	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;

	if (!manager)
		manager = new QOBDD.Manager(n);

	var _aux = function (u) {
		if (u.isConst()) return u;
		else if (u.visited === op_id) return u.value;
		else {
			var i = u.getVar();
			var t,e,r;

			e = _aux(u.getElse());
			if (u.isRedundant()) {
				t = manager.getZero(i+1);
			}
			else {
				/* Note: It is important, that setminus does not interfere
				 * with the 'visited' property of the nodes. */
				t = manager.minus_raw(_aux(u.getThen()), e);
			}

			r = manager.ite (i,t,e);
			u.visited = op_id;
			u.value = r;
			return r;
		}
	};

	return new QOBDD(n,_aux(W.getRoot()));
}


/**
 * Computes the QOBDD of the losing coalitions given the QOBDD if the winning
 * coalitions.
 *
 * @param W The QOBDD of the winning coalitions.
 * @param manager Has to have the same number of variables than A. (optional)
 * @returns {QOBDD}
 */
function losing (W, manager)
{
	/* Creates a new QOBDD in which the sinks are interchanged. */

	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;

	if (!manager)
		manager = new QOBDD.Manager(n);

	var _aux = function (u) {
		if (u.isConst())
			/* Complement. */
			return (u === QOBDD.one) ? QOBDD.zero : QOBDD.one;
		else if (u.visited == op_id) return u.value;
		else {
			var t,e,r;

			t = _aux(u.getThen());
			e = _aux(u.getElse());
			r = manager.ite (u.getVar(),t,e);
			u.visited = op_id;
			u.value = r;

			return r;
		}
	};

	return new QOBDD (n, _aux(W.getRoot()));
}


/**
 * Given the QOBDD representing the winning coalitions of a directed simple
 * game, the QOBDD representation of the maximal losing coalitions is returned.
 *
 * Using the QOBDD for the losing coalitions (without a manipulator) would be
 * useless effort because the maximal losing coalitions can easily be computed
 * from the QOBDD of the winning coalitions.
 *
 * @see maxlosing
 * @see minwin
 * @see minwin_directed
 *
 * @param W QOBDD representing a directed simple game.
 * @param manager Has to have the same number of variables than A. (optional)
 * @returns {QOBDD}
 */
function maxlosing_directed (W, manager)
{
	/* Complement the QOBDD (in mind) and in that QOBDD redirect the 0-edge of
	 * ONE_i to ZERO_{i+1} for each i for which ONE_i exists. */

	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;

	if (!manager)
		manager = new QOBDD.Manager(n);

	var _aux = function (u) {
		if (u.isConst())
			/* Complement. */
			return (u === QOBDD.one) ? QOBDD.zero : QOBDD.one;
		else if (u.visited == op_id) return u.value;
		else {
			var t,e,r;
			var i = u.getVar();

			/* ZERO_i becomes ONE_i in the QOBDD of the losing coalitions. */
			if (u.isRedundant()) e = manager.getZero(i+1);
			else e = _aux(u.getElse());

			t = _aux(u.getThen());

			r = manager.ite (i,t,e);
			u.visited = op_id;
			u.value = r;
			return r;
		}
	};

	return new QOBDD (n, _aux(W.getRoot()));
}


/**
 * Given the QOBDD representing the winning coalitons of a simple game, the
 * QOBDD representation of the maximal losing coalitions is returned.
 *
 * @see maxlosing_directed
 * @see minwin
 * @see minwin_directed
 *
 * @param W QOBDD representing a simple game.
 * @param manager Has to have the same number of variables than A. (optional)
 * @returns {QOBDD}
 */
function maxlosing (W, manager)
{
	/* Input: node v with label i, up-set.
	 *
	 * MaxLosing(i,v)
	 *   if v = ONE return ZERO
	 *   else v = ZERO return ONE
	 *   else if T(V) = E(v) then return ite(i, MaxLosing(i+1,T(v), ZERO_{i+1}))
	 *   else return ite(i, t, MaxLosing(i+1,E(v)) \ t)
	 *      where t = MaxLosing(i+1,T(v))
	 */

	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;
	var one = QOBDD.one, zero = QOBDD.zero;

	if (!manager)
		manager = new QOBDD.Manager(n);

	/* We pass the level and hope that this is faster than using the
	 * u.getVar(). */
	var _aux = function (i,u) {
		/* First two line do the complement from winning to losing coals. */
		if (u === one) return zero;
		else if (u === zero) return one;
		else if (u.visited === op_id) return u.value;
		else {
			var t,e,r;

			t = _aux(i+1,u.getThen());
			if (u.isRedundant()) {
				e = manager.getZero(i+1);
			}
			else {
				/* Note: It is important, that setminus does not interfere
				 * with the 'visited' property of the nodes. */
				e = manager.minus_raw(_aux(parseInt(i,10)+1, u.getElse()), t);
			}

			r = manager.ite (i,t,e);
			u.visited = op_id;
			u.value = r;
			return r;
		}
	};

	return new QOBDD(n,_aux(0,W.getRoot()));
}


/**
 * Given the \ref QOBDD of the minimal winning coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-minimal winning coalitions.
 *
 * @note This implementation is much slower than the new one and should only
 * be used as a reference implementation.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 *
 * @see shift_min_win
 * @see shift_min_win_new
 */
function shift_min_win_old (W_min, alad, manager)
{
	var n = W_min.getVarCount();
	if ( !manager)
		manager = new QOBDD.Manager(n);
	else if (manager.getVarCount() !== n)
		throw "Incompatible manager! Different number of variables.";

	var X = new QOBDD(n, manager.getZero(0)); // empty set

	for (var i = 0 ; i < n ; ++i) {
		var Gamma_i = alad.getDirectSuccessorsOf (i);

		for (var k in Gamma_i) {
			var j = Gamma_i[k];
			/* Y:=and(r_min,-ith(i)) and and(Y,ith(j)) can be ignored. They
			 * are implicitly regarded by 'add' and 'remove', respectively. */

			/* The manager uses a new cache for each operation with
			 * manipulators. */
			X = manager.or_manip (X, new Ident(), W_min, new Add(manager,i, new Remove(manager,j)));
			manager.or_manip_recs = 0;
			manager.or_manip_non_cached_recs = 0;
		}
	}

	return manager.minus (W_min, X);
}


/**
 * Given the \ref QOBDD of the minimal winning coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-minimal winning coalitions.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 */
function shift_min_win_new (W_min, alad, manager)
{
	var n = W_min.getVarCount();
	if ( !manager)
		manager = new QOBDD.Manager(n);
	else if (manager.getVarCount() !== n)
		throw "Incompatible manager! Different number of variables.";

	var Ns = alad.getTypeVector();
	var n_types = Ns.length;

	var Ret = W_min;

	for (var k = 0 ; k < n_types ; ++k) {
		var i = Ns[k][0]; // any player in the current type class k.
		var Lambda_i = alad.getDirectSuccessorsOf (i);

		var X = new QOBDD(n, manager.getZero(0)); // empty set
		for (var h in Lambda_i) {
			var j = Lambda_i[h];
			X = manager.or_manip (X, new Ident(), W_min, new Remove(manager,j));
		}

		for (var h in Ns[k]) {
			var i = Ns[k][h];
			Ret = manager.minus_norm_manip (Ret, X, new Add(manager,i));
		}
	}

	return Ret;
}


/**
 * Given the \ref QOBDD of the maximal losing coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-maximal losing coalitions.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 */
function shift_min_win (W_min, alad, manager)
{
	return shift_min_win_new (W_min, alad, manager);
}


/**
 * Given the \ref QOBDD of the maximal losing coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-maximal losing coalitions.
 *
 * @note This implementation is much slower than the new one and should only
 * be used as a reference implementation.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 *
 * @see shift_max_losing
 * @see shift_max_losing_new
 */
function shift_max_losing_old (L_max, alad, manager)
{
	var n = L_max.getVarCount();
	if ( !manager)
		manager = new QOBDD.Manager(n);
	else if (manager.getVarCount() !== n)
		throw "Incompatible manager! Different number of variables.";

	var X = new QOBDD(n, manager.getZero(0)); // empty set

	for (var j = 0 ; j < n ; ++j) {
		var Gamma_j = alad.getDirectSuccessorsOf (j);

		for (var k in Gamma_j) {
			var i = Gamma_j[k];
			/* The manager uses a new cache for each operation with manipulators. */
			X = manager.or_manip (X, new Ident(), L_max, new Add(manager,i, new Remove(manager,j)));
		}
	}
	return manager.minus (L_max, X);
}


/**
 * Given the \ref QOBDD of the maximal losing coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-maximal losing coalitions.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 */
function shift_max_losing_new (L_max, alad, manager)
{
	var n = L_max.getVarCount();
	if ( !manager)
		manager = new QOBDD.Manager(n);
	else if (manager.getVarCount() !== n)
		throw "Incompatible manager! Different number of variables.";

	var Ns = alad.getTypeVector();
	var n_types = Ns.length;

	var Ret = L_max;

	for (var k = 0 ; k < n_types ; ++k) {
		var i = Ns[k][0]; // any player in the current type class k.
		var Lambda_i = alad.getDirectSuccessorsOf (i);

		var X = new QOBDD(n, manager.getZero(0)); // empty set
		for (var h in Lambda_i) {
			var j = Lambda_i[h];
			X = manager.or_manip (X, new Ident(), L_max, new Add(manager,j));
		}

		for (var h in Ns[k]) {
			var i = Ns[k][h];
			Ret = manager.minus_norm_manip (Ret, X, new Remove(manager,i));
		}
	}

	return Ret;
}


/**
 * Given the \ref QOBDD of the maximal losing coalitions of a simple game and
 * the \ref AtLeastAsDesirable relation for that game, computes the \ref QOBDD
 * representing the shift-maximal losing coalitions.
 *
 * \param manager a \ref QOBDD.Manager object. (optional)
 */
function shift_max_losing (L_max, alad, manager)
{
	return shift_max_losing_new (L_max, alad, manager);
}



/**
 * Given the \ref QOBDD of the shift-minimal winning coalitions of a complete
 * simple game, computes the \ref QOBDD representing the minimal winning
 * coalitions.
 *
 * \param W_shift \ref QOBDD of the shift-minimal winning coalitions.
 * \param N Number of players by type. N[0] are the strongest, N[t-1] the
 * 		weakest players.
 * \param manager a \ref QOBDD.Manager object. (optional)
 */
function shift_min_win_to_min_win_complete (W_shift, N, manager)
{
	// TODO: Untested!

	var n = W_shift.getVarCount();
	//var t = N.length;
	if ( !manager)
		manager = new QOBDD.Manager(n);
	else if (manager.getVarCount() !== n)
		throw "Incompatible manager! Different number of variables.";

	var k,l,i,j;

	// Transform N into something more handy.
	var types = [];
	j = 0; // Index of the current player.
	for (k = 0 ; k < N.length ; ++k) {
		types[k] = [];
		for (i = 0 ; i < N[k] ; ++i, ++j)
			types[k].push(j);
	}

	var X = new QOBDD(n, manager.getZero(0)); // empty set

	for (k = N.length-1 ; k > 1 ; --k) {
		for (j in types[k]) {
			for (l = k-1 ; l >= 0 ; --l) {
				for (i in types[l]) /* i >_I j */ {
					X = manager.or_manip (X, new Ident(),
							W_shift, new Add(manager,types[l][i], new Remove(manager,types[k][j])));
				}
			}
		}
	}

	return manager.or(W_shift, X);
}


/**
 * Given the QOBDD representing the winning coalitions of a directed simple
 * game, returns the QOBDD representing the blocking coalitions of that game.
 * A coalition S is blocking iff N\S is losing, where N is the set of players.
 *
 * \param W QOBDD representing a directed simple game.
 * \param manager Has to have the same number of variables than A. (optional)
 */
function blocking (W, manager)
{
	var n = W.getVarCount();
	var op_id = ++QOBDD.unique_op_id;

	var one = QOBDD.one, zero = QOBDD.zero;

	if (!manager)
		manager = new QOBDD.Manager(n);

	var _aux = function (u) {
		if (u === one) return zero; /* NOT */
		else if (u === zero) return one;
		else if (u.visited === op_id) return u.value;
		else {
			/* Exchange the 1-edge for the 0-edge and vice versa. */
			var t = _aux(u.e);
			var e = _aux(u.t);

			var r = manager.ite (u.getVar(), t, e);
			u.visited = op_id;
			u.value = r;

			return r;
		}
	};

	return new QOBDD (n, _aux(W.getRoot()));
}


/**
 * Writes the QOBDD out in a plain format. The format is as follows. Each node
 * has a unique ID. IDs are consecutive and start at 0. The 0-sink has the ID 0
 * and the 1-sink has the ID 1. The algorithm iterates through each level of
 * inner nodes from bottom to top and outputs the IDs of the successors
 * of each node on the current level:
 *    <then-ID> " " <else-ID>
 * After the last node on a level, levelDelim is written. The IDs are written
 * as decimal numbers.
 *
 * @param writeFunc Function that is used to write the QOBDD.
 * @param levelDelim A whitespace character which is used after a level has
 * 	ended. Optional. Default value is "\n".
 * @return Returns nothing.
 */
QOBDD.prototype.writePlain = function (writeFunc, levelDelim)
{
	var n = this.getVarCount ();
	var V = this.collectNodes ();

	var nextId = 2; // 0: 0-sink, 1: 1-sink
	var map = {}; // maps QOBDDs to IDs

	map[QOBDD.zero.getId()] = 0;
	map[QOBDD.one.getId()] = 1;

	if (levelDelim === undefined) {
		levelDelim = "\n";
	}
	else if (typeof levelDelim !== 'string' || levelDelim.length === 0) {
		throw "InvalidArgument: levelDelim has to be a non-empty string.";
	}

	for (var i = n-1 ; i >= 0 ; --i) {

		var first = true;
		for (var k in V[i]) {
			if (!first)	writeFunc (" ");
			else first = false;

			var v = V[i][k];
			map[v.getId()] = nextId++;
			writeFunc (map[v.getThen().getId()] + " " + map[v.getElse().getId()]);
		}
		writeFunc(levelDelim);
	}
};


/**
 * Counts the number of references for each node in the \ref QOBDD. The root is
 * the only node without a reference.
 *
 * @returns Returns a function which maps a node of the QOBDD to its number of
 * 	references.
 */
QOBDD.prototype.countRefs = function () {
	var refs = [];

	refs[QOBDD.zero.getId()] = 0;
	refs[QOBDD.one.getId()] = 0;

	this.traverseInner(function (v) {
		refs[v.getId()] = 0;
		refs[v.getThen().getId()] ++;
		refs[v.getElse().getId()] ++;
		return true;
	});

	return function (v) { return refs[v.getId()]; };
};
