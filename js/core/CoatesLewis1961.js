/*
 * CoatesLewis1961.js
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
 * @file
 * 
 * Implements the first state of the algorithm of Coates & Lewis (1961) which
 * can be seen as a heuristic to test if a directed simple game is weighted.
 * 
 * Requires QOBDD.js.
 */

/**
 * @param n Number of players.
 * @param W A QOBDD representing the winning coalitions of a directed simple
 *    game.
 *          
 * @return Returns an object whose members depend on whether a solution was
 *    found. In every case, there is a member success which indicates the
 *    outcome. If a solution was found, members quota and weights are set.
 *    Member quota is an array that contains the upper and lower bound for the
 *    quota. It holds Q is a valid quota iff quota[0] < Q <= quota[1]. Member
 *    weights is an array that contains the weights. in case no solution was
 *    found, member failed_on_level contains the level on that a contradiction
 *    was found. weights contains the weight found so far, that is, w[i] is 
 *    set for any i > failed_on_level.
 */
function coates_lewis_heuristic (n, W)
{
	var V = W.collectNodes ();
	V[n] = [QOBDD.one, QOBDD.zero];
	
	var Gap = function (l,u) {
			this.l = l;
			this.u = u;
			this.getLength = function () { return this.u - this.l; };
	};
	
	/* Computes the node's range from the gaps of its 1-/0-successor. */
	var _computeRange = function (v) {
		var uT = v.t.value.gap.u;
		var lT = v.t.value.gap.l;
		
		var uE = v.e.value.gap.u;
		var lE = v.e.value.gap.l;
		
		v.value = {};
		v.value.range = { l: lE - uT, u: uE - lT };
	};
	
	/* The gaps of the terminal nodes are known and constant. */
	QOBDD.one.value  = { gap : new Gap (-Infinity, 0) };
	QOBDD.zero.value = { gap : new Gap (0, Infinity) };
	
	var common_gap_length, common_lower, common_upper;
	var w = [];
	var first_non_dummy = true;
	var v; // Using in for-loops.
	
	for (var k = n-1 ; k >= 0 ; --k) {
			
		/* Is this player dummy? Has it only two nodes each of which is
		 * redundant (1_k and 0_k). The game has to be directed for this
		 * to work. */
		if (V[k].length === 2 && V[k][0].isRedundant() && V[k][1].isRedundant()) {
			w[k] = 0;
			
			/* Compute the range for each node. */
			for (var l in V[k])
				_computeRange (V[k][l]);
		}
		else {
			common_lower = -Infinity;
			common_upper = Infinity;
			common_gap_length = Infinity;
			
			for (var l in V[k]) {
				v = V[k][l];
				
				/* Compute the range for the node and update the common range. */
				_computeRange (v);
				
				common_lower = Math.max (common_lower, v.value.range.l);
				common_upper = Math.min (common_upper, v.value.range.u);
				
				/* Because nodes are shared, some nodes are used multiple times here. */
				var gT = v.t.value.gap.getLength();
				var gE = v.e.value.gap.getLength();
				
				common_gap_length = Math.min (common_gap_length, Math.min(gT,gE));
			}

			if (common_upper <= common_lower) {
				/* No solution found. */
				return { success : false, failed_on_level : k, weights : w.slice(k+1) };
			}
			
			/* Because there are no dummy players, each player has a non-zero
			 * weight. This is important for the formula in the else branch.
			 * The weight for the last player n-1 (0-indexed) can be chosen
			 * arbitrarily. See Coates & Lewis for details. */
			if (first_non_dummy) {
				w[k] = 1;
				first_non_dummy = false;
			}
			else {
				w[k] = Math.min (common_lower + common_gap_length,
						0.5 * (common_upper + common_lower));
			}
		} // is dummy?
		
		/* Based on the weight w[k], now compute the gaps for each node on
		 * level k. */
		for (var l in V[k]) {
			v = V[k][l];

			var uT = v.t.value.gap.u;
			var lT = v.t.value.gap.l;

			var uE = v.e.value.gap.u;
			var lE = v.e.value.gap.l;

			v.value.gap = new Gap (Math.max(lT + w[k], lE), Math.min(uT + w[k], uE));
		}
	} // levels; bottom-up
	
	return { success : true, quota : [W.getRoot().value.gap.l, W.getRoot().value.gap.u],
			 weights : w };
}