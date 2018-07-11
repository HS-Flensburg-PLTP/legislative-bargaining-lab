/*
 * Metric.js
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

function Metric (elem, name, compFunc, showFunc)
{
	this._elem = elem;
	this._name = name;
	this._compFunc = compFunc;
	this._showFunc = showFunc;
	
	this._result = undefined;
	this._error_msg = undefined; // is !undefined an error occurred.
	
	this._init = function () {
		var that = this;
		
		var elem = this.getElement();
		var aElem = document.createElement ("a");
		aElem.className = 'compute';
		aElem.href = '#'; // show link; do not reload page
		aElem.onclick = function () {
			that.computeUI ();
			that.disclose ();
			return false; // necessary
		};
		
		aElem.appendChild(document.createTextNode("?"));
		elem.appendChild (aElem);
	};
	
	this._init ();
}

Metric.prototype.getElement  = function () { return this._elem; };
Metric.prototype.getName 	 = function () { return this._name; };
Metric.prototype.getCompFunc = function () { return this._compFunc; };
Metric.prototype.getShowFunc = function () { return this._showFunc; };

Metric.prototype.computeUI   = function () {
	var elem = this.getElement();
	
	// Show an icon that indicates the computation ... .
    elem.className = "wait";
    elem.innerHTML = "";
    
    try {
    	// Compute the value ... this may take a while.
    	this._result = this.getCompFunc()();
    }
    catch (e) {
    	this._error_msg = e.toString();
    }
    
    elem.className = "";
};

Metric.prototype.disclose 	 = function () {
	var elem = this.getElement();
	
	elem.innerHTML = '';	

	// Compute the value if necessary. This can happen if the disclose()
	// method is called by the \ref SimpleGame observer. 
	if (undefined === this._result && undefined === this._error_msg) {
		try {
	    	// Compute the value ... this may take a while.
	    	this._result = this.getCompFunc()();
	    }
	    catch (e) {
	    	this._error_msg = e.toString();
	    }
	}
	
	if (undefined === this._error_msg) {
		elem.appendChild (document.createTextNode(formatBigNumber (this._result.toString())));

		var supElem = document.createElement("sup");

		var aElem = document.createElement("a");
		var that = this;
		aElem.onclick = function () {
			that.getShowFunc()();
			return false; // necessary
		};
		aElem.href = "#"; // show link; do not reload page
		aElem.style.fontSize = '87%';
		aElem.appendChild (document.createTextNode("show"));

		supElem.appendChild (aElem);
		elem.appendChild (supElem);
	}
	else /* error */ {
		elem.appendChild (document.createTextNode("?"));

		var supElem = document.createElement("sup");

		var aElem = document.createElement("a");
		var that = this;
		aElem.onclick = function () {
			window.alert ("Unable to compute value. Reason: " + that._error_msg);
			return false; // necessary
		};
		aElem.href = "#"; // show link; do not reload page
		aElem.style.fontSize = '87%';
		aElem.appendChild (document.createTextNode("details"));

		supElem.appendChild (aElem);
		elem.appendChild (supElem);
	}
};


Metric.prototype.reset = function () { 
	this.getElement().innerHTML = '';
	this._result = undefined;
	this._error_msg = undefined;
	this._init ();
};

var MetricsSingleton = (function () {
	var _l = {  };
	
	return {
		register : function (m) {
			_l[m.getName()] = m;
		},
		getByName : function (name) { return _l[name]; },
		getAll : function () { return _l; }
	};
}());