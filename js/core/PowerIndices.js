/*
 * PowerIndices.js
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
 * Computes the operation res=(t>>1)+e, i.e. if t=(t0,..tm-1), then
 * res=(0,t0,..,tm-1)+e.
 *
 * \pre res has size (at least) max_size+1 and t,e has size (at least)
 * 		 max_size.
 *
 * \author stb
 * \param max_size Maximum size of a coalition for res.
 * \param res Result vector, i.e. res=(t>>1)+e
 * \param t Shifted vector.
 * \param e Non-shifted vector.
 */

function shift (max_size, res, t, e)
{
	res[0] = e[0];
	for (var k = 1 ; k < max_size ; k ++) {
		res[k] = t[k-1] + e[k];
	}
	res[max_size] = t[max_size-1];
}


/**
 * Computes res += v>>1, i.e. if v=(v0,..,vn-1), then res+=(0,v0,..,vn-1).
 *
 * \pre res has size (at least) n and v has size (at least) n-1.
 *
 * \author stb
 * \param res Result vector, i.e. res+=v>>1.
 * \param n Size of res.
 * \param v Vector to shift.
 */

function add_shift_by_one (res, n, v)
{
	for (var i = 1 ; i <= n ; i ++)
		res[i] += v[i-1];
}


function add_without_shift (res, n, v)
{
	for (var i = 0 ; i < n ; i ++)
		res[i] += v[i];
}

/**
 * Computes the operation res += u (.) v, called the \odot operation. (.) can
 * be computed as non-commutative operation:
 * 		\f$ res = res + \sum_{j=0}^{m-1} u_j\cdot(v\gg j)\,. \f$
 *
 * \author stb
 * \param res Result vector. Must have at least m+n-2 elements.
 * \param u Left-hand side operand.
 * \param m Size of u.
 * \param v Right-hand side operand.
 * \param n Size of n.
 */
function plus_odot (res, u, v)
{
	for (var j = 0 ; j < u.length; j ++)
		for (var i = 0 ; i < v.length ; i ++)
			if (u[j] != 0 && v[i] != 0)
				res[i+j] += u[j] * v[i];
}


/**
 * Used for the Deegan-Packel-Index. v is shifted one position to the
 * right-hand side, before the odot operation, i.e. res = u (.) (v >> 1)
 *
 * \see plus_odot
 *
 * \author stb
 */
function plus_odot_with_one_shift (res, u, v)
{
	for (var j = 0 ; j < u.length; j ++)
		for (var i = 1 ; i <= v.length ; i ++)
			if (u[j] != 0 && v[i-1] != 0)
				res[i+j] += u[j] * v[i-1];
}


/**
 * @fn binom_first
 * 
 * Computes C(n,1) (n over 0) and returns the constant result of 1.
 */
function binom_first () { return 1; }


/**
 * @fn binom_next
 *
 * Given C(n,i-1) in val, retuns C(n,i).
 */
function binom_next (val, n, i) { return (val * (n+1-i)) / i; }


/**
 * @fn shapley_shubik
 * 
 * Given the QOBDD of the winning coalitions, computes the Deegan-Packel
 * of all players and returns them in an array.
 * 
 * @param W QOBDD of the winning coalitions.
 */
function shapley_shubik (W)
{
	var i,j,k;
	
	var n = W.getVarCount();
	var zeros = [[0]];
	for (i = 1 ; i <= n ; ++i) {
		zeros[i] = zeros[i-1].slice(0);
		zeros[i].push(0);
	}
	
	var swings = [];
	for (i = 0 ; i <= n ; ++i)
		swings[i] = zeros[n].slice(0); // copy
	
	/* Compute the number of paths to each node. There is one (fictional)
	 * path to the root. Initialize the number of path of each inner node
	 * with 0. */
	W.getRoot().value = [1];
	W.traverseInnerBreadthFirst (function (u) {
		var i = u.getVar();
		add_shift_by_one  (u.t.value, i+1, u.value); /* u.t.paths += u.paths >> 1 */
		add_without_shift (u.e.value, i+1, u.value); /* u.e.paths += u.paths */
		return true;
	}, function /*init*/ (u) { 
		if (u.isConst()) u.value = zeros[n];
		else u.value = zeros[u.getVar()].slice(0); /*copy*/ 
	});
	
	/* The paths of the terminal nodes is not used and can be dropped. */
	QOBDD.one.value  = [1];
	QOBDD.zero.value = [0];
	W.traverseInner (function (u) {
		var i = u.getVar();
		/* The path is used only in this function. Hence, we dispose of it. */
		var paths = u.value;
		u.value = []; // count
		shift (n-i, u.value, u.t.value, u.e.value);
		
		/* We have to regard the one-edge between the current level and
		 * the level of t and e, i.e.
		 *      res = paths (.) [(t.count-e.count)>>1].
		 */
		
		t_minus_e = [0];
		for (var k = 0; k < n-i/*+1-1*/ ; ++k)
			t_minus_e[k+1] = u.t.value[k] - u.e.value[k];

		plus_odot (swings[i], paths, t_minus_e);
		return true;
	});

	/* ------------------------- Computation of the Shapley-Shubik index --- */
	
	/* We use a more efficient approach, as presented in the paper:
	 *    binom(n over i) = n!/(!i*(n-i)!)
	 *    ss[i] = 1/n! * \sum_{j=0..n-1} j!(n-j-1)!*d[j+1]
	 *          = \sum_{j=0..n-1} d[j+1]/[(n over j)*(n-j)] */
	
	var divisors = [n];
	var n_over_j = binom_first(); // C(n,0)
	for (j = 1 ; j < n ; ++j) {
		n_over_j = binom_next (n_over_j,n,j);
		divisors.push( n_over_j * (n-j));
	}
	
	var ss = [];
	for (var i = 0 ; i < n ; ++i) {
		var d = swings[i];
		
		if (d[0] > 0)
			throw "shapley_shubik: {} is a winning coalition.";
		
		var sum = 0;
		for (j = 0 ; j < n ; ++j)
			sum += d[j+1] / divisors[j];
		ss.push(sum);
	}
	
	return ss;
}


/**
 * @fn deegan_packel
 * 
 * Given the QOBDD of the minimal winning coalitions, computes the Deegan-Packel
 * of all players and returns them in an array.
 * 
 * @param W_min QOBDD of the minimal winning coalitions.
 */
function deegan_packel (W_min)
{
	var i,j,k;
	
	var n = W_min.getVarCount();
	var zeros = [[0]];
	for (i = 1 ; i <= n ; ++i) {
		zeros[i] = zeros[i-1].slice(0);
		zeros[i].push(0);
	}
	
	var with_player = [];
	for (i = 0 ; i <= n ; ++i)
		with_player[i] = zeros[n].slice(0); // copy
	
	/* Compute the number of paths to each node. There is one (fictional)
	 * path to the root. Initialize the number of path of each inner node
	 * with 0. */
	W_min.getRoot().value = [1];
	W_min.traverseInnerBreadthFirst (function (u) {
		var i = u.getVar();
		add_shift_by_one  (u.t.value, i+1, u.value); /* u.t.paths += u.paths >> 1 */
		add_without_shift (u.e.value, i+1, u.value); /* u.e.paths += u.paths */
		return true;
	}, function /*init*/ (u) { 
		if (u.isConst()) u.value = zeros[n];
		else u.value = zeros[u.getVar()].slice(0); /*copy*/ 
	});
	
	/* The paths of the terminal nodes is not used and can be dropped. */
	QOBDD.one.value  = [1];
	QOBDD.zero.value = [0];
	W_min.traverseInner (function (u) {
		var i = u.getVar();
		/* The path is used only in this function. Hence, we dispose of it. */
		var paths = u.value;
		u.value = []; // count
		shift (n-i, u.value, u.t.value, u.e.value);
		
		/* We have to regard the one-edge between the current level and
		 * the level of t and e, i.e.
		 *      res = paths (.) (t.count>>1).
		 */
		plus_odot_with_one_shift (with_player[i], paths, u.t.value);
		return true;
	});
	
	/* -------------------------- Computation of the Deegan-Packel index --- */
	
	/* Number of minimal winning coalitions. */
	var total = accumulate (W_min.getRoot().value, 0);
	
	var dp = [];
	for (var i = 0 ; i < n ; ++i) {
		var d = with_player[i];
		
		if (d[0] > 0)
			throw "deegan_packel: {} is a winning coalition.";
		
		var sum = 0;
		for (j = 0 ; j < n ; ++j)
			sum += d[j+1] / (j+1);
		dp.push(sum / total);
	}
	
	return dp;
}