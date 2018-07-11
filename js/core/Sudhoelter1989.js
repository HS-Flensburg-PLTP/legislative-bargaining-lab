/*
 * Sudhoelter1989.js
 *
 *  Copyright (C) 2010, 2011 Stefan Bolus, University of Kiel, Germany
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
 * Computes omega_k. Uses l_1, .., l_k.
 */
function compute_omega (l, k)
{
	var pi = Infinity;
	var omega = Infinity;

	for (var j = 0 ; j <= k ; j ++)
		if (k <= l[j] && l[j] < pi) {
			pi = l[j];
			omega = j;
		}

	return omega;
}
