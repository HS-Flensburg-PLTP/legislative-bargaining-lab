/*
 * Probabilities.js
 *
 *  Copyright (C) 2017 Jan Christiansen, Flensburg University of
 *                                       Applied Sciences, Germany
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
