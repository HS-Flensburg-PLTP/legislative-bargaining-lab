/*
 * Manip.js
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


function Ident () {
	this.getThen = function (v) { return v.getThen(); };
	this.getElse = function (v) { return v.getElse(); };	
}


/*!
 * Given A, computes {S\in A ; i\not \in S}
 */
function Without (manager,i,next)
{
	this.manager = manager;
	this.i = i;
	this.next = next ? next : new Ident();
	
	this.getThen = function (v) {
		if (v.getVar() === this.i) return this.manager.getZero(this.i+1);
		else return this.next.getThen(v);
	};
	//this.getElse = this.next.getElse;
	this.getElse = function (v) { return this.next.getElse(v); };
}

/*!
 * Given A, computes {S\in A ; i \in S}
 */
function With (manager,i,next)
{
	this.manager = manager;
	this.i = i;
	this.next = next ? next : new Ident();
	
	//this.getThen = this.next.getThen;
	this.getThen = function(v) { return this.next.getThen(v); };
	this.getElse = function (v) {
		if (v.getVar() === this.i) return this.manager.getZero(this.i+1);
		else return this.next.getElse(v);
	};
}


function Remove (manager,i,next)
{
	this.manager = manager;
	this.i = i;
	this.next = next ? next : new Ident();
	
	this.getThen = function (v) {
		if (v.getVar() === this.i) return this.manager.getZero(this.i+1);
		else return this.next.getThen(v);
	};
	this.getElse = function (v) {
		if (v.getVar() === this.i) return this.next.getThen(v);
		else return this.next.getElse(v);
	};
}


function Add (manager,i,next)
{
	this.manager = manager;
	this.i = i;
	this.next = next ? next : new Ident();
	
	this.getThen = function (v) {
		if (v.getVar() === this.i) return this.next.getElse(v);
		else return this.next.getThen(v);
	};
	this.getElse = function (v) {
		if (v.getVar() === this.i) return this.manager.getZero(this.i+1);
		else return this.next.getElse(v);
	};
}


function Not(next)
{
	this.next = next ? next : new Ident();
	
	var _exchange = function (v) {
		if (v.isConst()) {
			if (v.isOne()) return QOBDD.getZero();
			else return QOBDD.getOne();
		} else return v;
	};
	
	this.getThen = function (v) { return _exchange( this.next.getThen(v)); };
	this.getElse = function (v) { return _exchange( this.next.getElse(v)); };
}


function Compl (next)
{
	this.next = next ? next : new Ident();
	
	this.getThen = function (v) { return this.next.getElse(v); };
	this.getElse = function (v) { return this.next.getThen(v); };
}
