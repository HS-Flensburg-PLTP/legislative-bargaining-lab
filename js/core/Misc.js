/*
 * Misc.js
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
 * A simple game is consecutive if symmetric players i<j there is no
 * player k such that i,k are not symmetric and i<k<j. Another definition
 * is, that for each class S of symmetric players it holds
 * @\f[
 * \{\min(S),\ldots,\max(S)\} = S\.
 * @f]
 * 
 * @param eqs The equivalence classes of the game.
 */
function is_consecutive (eqs)
{
	var E = eqs.slice();
	for (var k in E) {
		if (E[k].length > 1) {
			var S = E[k];
			
			S.sort(function (a,b) { return a-b; });
			for (var i = 1 ; i < S.length ; ++i)
				if (S[i-1]+1 != S[i])
					return false;
		}
	}
	return true;
}