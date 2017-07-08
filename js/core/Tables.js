/*
 * ComputedTable.js
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


function _unique_hash (key) {
	return (key.t.id + key.e.id << 16) % 63997;
}

// ignores the labels.
function _unique_key_equal (a,b) { 
	return a.t.id == b.t.id && a.e.id == b.e.id;
}

function UniqueTable (n)
{
	this.n = n;
	this.hashes = [];
	
	this.key = new QOBDD.Node(0,null,null); /*!< Used in all lookups. */
	
	for (var i = 0 ; i < this.n ; ++i)
		this.hashes[i] = new Hashtable (_unique_hash, _unique_key_equal);
	
	// Is there a node on level i with successors t and e?
	this.lookup = function (i,u,v) {
		/* u or v may be terminal. */
		//var key = new QOBDD.Node(i,u,v);
		var key = this.key;
		key.label = i;
		key.t = u;
		key.e = v;
		return this.hashes[i].get(key);
	};
	
	this.insert = function (i,u,v,r) {
		/* u or v may be terminal. */
		return this.hashes[i].put(r,r);
	};
	
	this.size = function () {
		var sum = 0;
		for (var i = 0 ; i < this.n ; ++i)
			sum += this.hashes[i].size();
		return sum;
	};
}


function _comp_table_hash (key) {
	return (key[0].id + key[1].id << 16) % 63997;
}

//ignores the labels.
function _comp_table_key_equal (a,b) { 
	return a[0].id === b[0].id && a[1].id === b[1].id;
}

function ComputedTable (n)
{
	this.n = n;
	this.hashes = [];
	
	for (var i = 0 ; i < this.n ; ++i)
		this.hashes[i] = new Hashtable (_comp_table_hash, _comp_table_key_equal);
	
	// pre: u.getVar() == v.getVar()
	this.lookup = function (u,v) {	return this.hashes[u.label].get([u,v]); };
	
	// pre: u.getVar() == v.getVar()
	this.insert = function (u,v,val) { return this.hashes[u.label].put ([u,v], val); };
	
	this.clear = function () {
		for (var i in this.hashes)
			this.hashes[i].clear();
	};
}


//function _comp_table1_hash (key) {
//	return key.getId();
//}
//
////ignores the labels.
//function _comp_table1_key_equal (a,b) { 
//	return a.getId() == b.getId();
//}
//
//function ComputedTable1 (n)
//{
//	this.n = n;
//	this.hashes = [];
//	
//	for (var i = 0 ; i < this.n ; ++i)
//		this.hashes[i] = new Hashtable (_comp_table1_hash, _comp_table1_key_equal);
//	
//	this.lookup = function (u) {
//		return this.hashes[u.getVar()].get(u);
//	};
//	
//	this.insert = function (u,val) {
//		return this.hashes[u.getVar()].put (u, val);
//	};
//}