/*
 * NaryTree.js
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


function NaryNode (arg0)
{
	this.children = [];
	
	if (arg0 instanceof NaryNode) /* copy ctor */ {
		this.type = arg0.type;
		for (var i in arg0.children)
			this.children.push(arg0.children[i].clone());
	}
	else {
		this.type = arg0;
	}
	
	this.clone = function () { return new NaryNode(this); };
	
	this.getType = function () { return this.type; };
	this.setType = function (type) { this.type = type; };
	
	this.addChild = function (c) { this.children.push(c); };
	this.getChildren = function () { return this.children; };
	this.getChild = function (i) { return this.getChildren()[i]; };
	
	this.toString = function () {
		var op;
		if (this.getType() === NaryNode.TYPE_OR) op = ' | ';
		else op = ' & ';
		
		var s = [];
		var children = this.getChildren();
		for (var i = 0 ; i < children.length ; ++i)
			s[i] = children[i].toString();
		return '(' + s.join(op) + ')';
	};

	
	/**
	 * Set the first index of the variables allocated to the node. For
	 * instance, is index = 5, then the node uses the variables between 5 and
	 * 5+this.getNeededVarCount() (incl.).
	 */
	this.var_index = undefined;
	this.getVarIndex = function () { return this.var_index; };
	this.setVarIndex = function (index) { this.var_index = index; };
	
	
	/**
	 * Traverses the tree in depth-first order. If f returns false for a node
	 * the traversal is canceled and the function returns false. Otherwise true
	 * is returned.
	 */
	this.traverseDFS = function (f,init) {
		init(this);
		
		var children = this.getChildren();
		for (var i in children) {
			if (!children[i].traverseDFS (f,init))
				return false;
		}
		return f(this);
	};
}

NaryNode.TYPE_AND = 1;
NaryNode.TYPE_OR  = 2;


function RuleNode (arg0)
{
	if (arg0 instanceof RuleNode) {
		this.name = arg0.name;
	}
	else this.name = arg0;
	
	this.clone = function () { return new RuleNode(this); };
	
	this.getName = function () { return this.name; };
	this.toString = function () { return this.getName(); };
	
	this.traverseDFS = function (f,init) {
		init(this);
		return f(this);
	};
}


// in place.
/**
 * Exchanges the node type of AND and OR nodes. The types of all remaining
 * node remain untouched.
 * 
 * @return Returns nothing.
 */
function exchange_OR_and_AND_nodes (root)
{
	var _f = function (v) {
		if (v instanceof NaryNode) {
			var type = v.getType();
			if (type === NaryNode.TYPE_AND) v.setType (NaryNode.TYPE_OR);
			else v.setType(NaryNode.TYPE_AND);
		}
		else { /* RuleNode */ }

		return true; // continue
	};

	root.traverseDFS(_f, function(v){});
}


function NaryTree (arg0)
{
	var thisObject = this;
	
	this.root = undefined;
	
	if (arg0 instanceof NaryTree) /* copy ctor */ {
		this.root = arg0.root.clone();
	}
	else if (arg0 instanceof NaryNode || arg0 instanceof RuleNode) {
		this.root = arg0;
	}
	else { throw "Invalid argument."; }
	
	this.getRoot = function () { return this.root; };

	this.collectORNodes = function () {
		var nodes = [];
		var f = function (v) {
			if (v instanceof NaryNode && v.getType() === NaryNode.TYPE_OR)
				nodes.push (v);
			return true;
		};
		this.getRoot().traverseDFS(f,function(v){});
		return nodes;
	};
		
	
	this.getORNodes = (function (){
		var ret = thisObject.collectORNodes ();
		return function() { return ret; };
	}());
}