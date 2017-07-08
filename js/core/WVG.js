/*
 * WVG.js
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
 * Implements a weighted voting game. 
 */
function WVG (Q,w)
{
	this.quota = Q;
	this.weights = new Array(w.length);

	for (i in w) this.weights[i] = parseInt(w[i]);

	this.getPlayerCount = function () { return this.weights.length; };
	this.getTotalWeight = function () { return accumulate (this.weights, 0); };

	/*!
	 * Sorts the players using the given comparator. Default is greater than.
	 */
	this.sort = function (comp) {
		if (typeof comp == 'undefined')
			comp = function (a,b) { return b-a; };
		this.weights.sort(comp); 
	};

	this.shuffle = function () { shuffleArray(this.weights); };
	this.halfOfWeights  = function () { this.quota = Math.floor(this.getTotalWeight()/2.0); };
	this.nonDecreasing = function () { this.weights.sort(function (a,b) { return a-b; }); };
	this.nonIncreasing = function () { this.weights.sort(function (a,b) { return b-a; }); };
	this.reverse = function () { this.weights.reverse(); };
	
	this.toString = function () { return "[" + this.quota + ";" + this.weights + "]";  };
}


//e.g. [q;w_1,...,w_n], q w_1 ... w_n
function parse_wvg (descr) {
	var arr = trim(descr.replace (/[\[\]\(\)]/g, '').replace(/[;,]/g,' ')).split(/\s+/);
	return new WVG(arr[0], arr.slice(1));
}
