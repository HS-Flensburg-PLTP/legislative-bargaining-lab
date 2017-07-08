/*
 * BoolParser.js
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

function BoolOr (left, right)
{
	this.left = left;
	this.right = right;
	this.toString = function () { return "("+this.left+" OR "+this.right+")"; };
	this.fold = function (visitor) { return visitor.foldOr(this.left, this.right); };
}

function BoolAnd (left, right)
{
	this.left = left;
	this.right = right;
	this.toString = function () { return "("+this.left+" AND "+this.right+")"; };
	this.fold = function (visitor) { return visitor.foldAnd(this.left, this.right); };
}

function BoolVar (name)
{
	this.name = name;
	this.toString = function () { return ""+name; };
	this.fold = function (visitor) { return visitor.foldVar(this.name); };
}



function expr_to_qobdd (exprRaw, max_nodes, console)
{
	var patt=/\d+/;
	var varmap = function (s) { return patt.exec (s); };
	
	/* Remove all whitespaces (\t,\n,spaces). The parser cannot handle them. */
	var expr = exprRaw.replace (/\s*/g, '');
	
	console.textContent = expr + "\n";
	
	/* Find the number of variables and derive the number of variables. */
	var patt_global = /\d+/g;
	console.textContent += expr.match(patt_global) + "\n";
	var highest = -1;
	var indices = expr.match(patt_global);
	for (var i in indices) {
		highest = Math.max(highest, parseInt(indices[i]));
	}
	var n = highest + 1; // 0-indexed
	console.textContent += "n=" + n + "\n";
	
	var tree = parser.parse(expr);
	var manager = new QOBDD.Manager (n);
	var visitor = new QOBDDVisitor (manager, varmap);
	var G = tree.fold (visitor);
	
	console.textContent += "QOBDD size: " + G.size() + "\n";
	console.textContent += "Sets:\n" + G.getRoot().toSet();
}