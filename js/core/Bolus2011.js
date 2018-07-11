/*
 * Bolus2011.js
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
 * Implements a coalition with fast access to the members.
 * 
 * @constructor
 */
function Coal (arg)
{
	if (typeof arg == 'number') {
		this._n = arg;
		this._v = [];
		for (var i = 0 ; i < this._n ; i ++) {
			this._v.push (false);
		}
	}
	else if (arg instanceof Coal) {
		this._n = arg._n;
		// Arrays are objects and hence, passed by reference.
		this._v = arg._v.slice();
	}
	else if (typeof arg === 'undefined') {
		this._n = 0;
		this._v = [];
	}
	else {
		throw "Invalid constructor argument for object Coal.";
	}

	this.addPlayer = function (k) { 
		this._n = Math.max (this._n, k+1);
		this._v[k] = true; return this;
	};
	this.addRange = function (a,b) { 
		for (var i = a ; i <= b ; i ++) {
			this._v[i] = true;
		}
		this._n = Math.max (this._n, b+1);
		return this;
	};
	this.removePlayer = function (k) {
		this._n = Math.max (this._n, k+1);
		this._v[k] = false; return this;
	};
	this.removeCoal = function (T) { 
		var n = Math.min(this._n, T._n);
		for (var i = 0 ; i < n ; i ++) {
			this._v[i] = T._v[i] ? false : this._v[i];
		}
		this._n = Math.max (this._n, T._n);
		return this;
	};

	this.isIn = function (k) { return this._v[k] === true; };

	this.max = function () {
		var i;
		for (i = this._n-1 ; i >= 0 && !this._v[i] ; --i) { }
		return i;
	};

	this.empty = function () { 
		for (var i in this._v) {
			if (this._v[i]) return false;
		}
		return true;
	};

	this.size = function () {
		var sum = 0;
		for (var i in this._v) {
			if (this._v[i]) { sum ++; }
		}
		return sum;
	};

	this.weight = function (w) {
		var sum = 0;
		for (var i in this._v) {
			if (this._v[i]) sum += w[i];
		}
		return sum;
	};
	
	/* Adjusts the coalition size. */
	this.adjust = function (n) {
		this._n = n;
		var delta = this._v.length - n;
		if (delta < 0) {
			while (delta++ < 0) { this._v.push(false); }
		}
		else {
			this._v = this._v.slice (0,n);
		}
		return this;
	};
	
	this.toString = function () {
		var s = '{';
		var first = true;
		for (var i in this._v) {
			if (!first) { s += ','; }
			s += this._v[i] ? '1' : '_';
			first = false;
		}
		return s + '}';
	};
}


/* Exceptions: */
PlayerIsNotASum = function () { };
NotHomogeneous = function () { 
	this.toString = function () { return "The simple game is NOT homogeneous."; };  
};


/*!
 * Given the QOBDD for the winning coalitions of a directed simple game, returns
 * the lexicographically maximal minimal winning coalition.
 *
 * \param W QOBDD for the winning coalitions. Label has to be 0.
 */
function firstS (W)
{
	var S = new Coal ();
	var v = W.getRoot();

	/* Add players until we reach ONE_i which would mean the
	 * remaining players are dummies. */
	for (var i = 0 ; ! v.isRedundant() ; ++i) {
		S.addPlayer (i);
		v = v.getThen();
	}

	return S;
}


/*!
 * The function rho as defined Sudhoelter (1989), p.438, Def.2.1. The only
 * difference is, that we use the minimal winning coalitions implicitly where
 * the named paper uses the minimal winning coalitions explicitly as the
 * input.
 *
 * \note The simple game has to be directed.
 *
 * \param W The QOBDD for the winning coalitions of a directed simple game.
 * \param S The minimal winning coalition in which k is to be replaced by some
 *          other players.
 * \param l_S The length of S, i.e. max S.
 * \param k The player to remove. {k,..,l_S} has to be a subset of S.
 * \return Returns the resulting minimal winning coalition. Throws an exception
 *         of type PlayerIsNotASum if player k cannot be replaced by some other
 *         players.
 */
function rho (W, S, l_S, k)
{
	var n = W.getVarCount();
	var v = W.getRoot();
	var i = 0;

	for ( ; i < k ; ++i) {
		v = S.isIn(i) ? v.getThen() : v.getElse();
	}

	v = v.getElse(); // Player k is removed.
	++i;

	var t;
	for ( ; i < n ; ++i) {
		/* Remember the last non-redundant label. This is necessary to return
		 * a minimal winning coalition. */
		if ( !v.isRedundant()) {
			t = i;
		}
		v = v.getThen();
	}

	if (v.isOne()) {
		var T = new Coal (S);
		T.removePlayer (k);
		T.addRange (l_S+1,t); /* We could have also used here {k+1,..,t} but
		 * the length makes it more obvious and is as in
		 * the paper. */
		return T;
	}
	else {
		throw new PlayerIsNotASum ();
	}
}


/*!
 * Implements the test for a simple game to be homogeneous or not presented
 * in P. Sudhoelter (1989), p.463-464. The game is supposed to be directed,
 * i.e. 1 is the most desirable player and players are ordered by non-increasing
 * desirability.
 *
 * \note The test doesn't use the size of the QOBDD as a hint for non-homogeneity.
 *
 * \param n Number of players. At least three players are expected.
 * \param d Number of dummy players.
 * \return Returns a triple (wvg,sums,steps) or throws an instance of 
 *         NotHomogeneous. The sums and steps are returned as arrays whose
 *         values are the sums and steps respectively.
 */
function get_homogeneous_measure (n, W, d)
{
	var n0 = n-d;
	if (n0 < 1) {
		throw "At least one non-dummy player expected.";
	}

	/* Sums and steps, respectively. */
	var sums = [], steps = [];
	
	/* Characterizing incidence submatrix of ({1..n},set(W)). */
	var S = [];
	var l = []; /* "length", weakest player in S[i] if S[i] non-empty */
	var omega = [];
	
	var k,i; // used in for loops.
	
	S[0] = firstS (W);
	S[0].adjust (n0+1);
	l[0] = S[0].max();
	omega[0] = 0;
	for (k = 0 ; k < n0 ; k++) {
		var i0 = omega[k];

		try {
			S[k+1] = rho(W, S[i0], l[i0], k);
			sums.push(k); // k is a sum
		}
		catch (e) {	
			if (e instanceof PlayerIsNotASum) {
				// S_{k+1} := S_i0 - k u { len(S_i0)+1,..,n } (0-indexed)
				S[k+1] = new Coal (S[i0]).removePlayer(k).addRange(l[i0]+1, n0);
				steps.push(k); // k is a step
			}
			else throw e;
		}

		l[k+1] = S[k+1].max();
		omega[k+1] = compute_omega (l, k+1);
	}

	/* Compute the weights. */
	var m = [];
	m[n0] = 1; // last player (step) in auxiliary game.
	for (k = n0-1 ; k >= 0 ; --k) {
		m[k] = 0;
		for (i = k+1 ; i < n0+1 ; ++i) {
			if (S[k+1].isIn(i)) {      m[k] += m[i]; }
			if (S[omega[k]].isIn(i)) { m[k] -= m[i]; }
		}
	}
	
	var iota = new WVG (S[0].weight(m), m.slice (0,n0));
	
	// Add missing dummy players.
	for (var i = n0 ; i < n ; i ++) {
		iota.weights.push (0);
	}

	/*
	 * Compare the winning coalitions. Only if they are correct, the game is
	 * homogeneous and we found the natural representation. */
	var W_iota = wvg_to_qobdd (iota);
	if (W.equals (W_iota)) {
		return [iota,sums,steps];
	}
	else {
		throw new NotHomogeneous ();
	}
}

