/*
 * Solver.js
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
 * @class Solver
 * 
 * Interface for the solver backend. The backend is a CGI script located 
 * somewhere on the web.
 * 
 * @note The interface uses AJAX requests to talk with the backend. Those
 *       requests are subject to restrictions established by the server. Thus,
 *       if you plan to use a backend from a place other than usually do not
 *       expect the server to answer. See, for instance,
 *       	https://developer.mozilla.org/en/http_access_control .
 * 
 * @ctor
 */
function Solver (url)
{
	this.url = url;
	this.solver_name;
	this.max_qobdd_size;
	this.is_online = false;
	
	this.isOnline = function () { return this.is_online; };
	this.getSolverName = function () { return this.solver_name; };
	this.getMaxQOBDDSize = function () { return this.max_qobdd_size; };
	
	/* Sends a POST request to the URL together with the given data.
	 * Callback is called for onreadystatechange but gets the XMLHttpRequest
	 * object as its first argument. */
	this._makePostRequest = function (url, data, clbk, async /*=true*/) {
		var httpRequest;
		
		if (async === undefined)
			async = true;
		
		// See https://developer.mozilla.org/en/AJAX/Getting_Started
		if (window.XMLHttpRequest) { // Mozilla, Safari, ...
			httpRequest = new XMLHttpRequest();
		} else if (window.ActiveXObject) { // IE
			try {
				httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
			} 
			catch (e) {
				try {
					httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
				} 
				catch (e) {}
			}
		}
		
		if ( !httpRequest) {
			throw "Unable to create XMLHttpRequest object.";
		}
		else {
			var thisObject = this;
			if (async)
				httpRequest.onreadystatechange = function () { clbk.call (thisObject, httpRequest); };
			httpRequest.open('POST', url, async);
			httpRequest.send(data);
			
			if ( !async)
				 clbk.call (thisObject, httpRequest);
			
			return httpRequest;
		}
	};
	
	/* See if the solver is online. If not, throw an exception. Otherwise
	 * initialize the version and other information we got from the server. 
	 * This call is made non-async! */
	this._makePostRequest (this.url, '', function (req) {
		if (req.readyState === 4 /*complete*/) {
			if (req.status === 200) {
				var info = JSON.parse (req.responseText);
				this.solver_name = info.solver;
				this.max_qobdd_size = parseInt(info.max_qobdd_size, 10);		
				this.is_online = true;
			}
			else if (req.status === 0)
				throw "Unable to reach the solver. Maybe the URL is wrong. Got no response from the server.";
			else 
				throw "Unable to reach the solver (status: "+req.status+"). Response from server: \"" + req.statusText+'"';
		}
	}, false /*non-async*/);
	
	this._buildPostData = function (form) {
		var s = '';
		var elems = form.elements;
		var first = true;
		for (var i in elems) {
			/* The form only contains hidden input elements. */
			if (elems[i].type === 'hidden') {
				if ( !first) { s += '&'; }
				else first = false;
				s += elems[i].name + '=' + encodeURIComponent(elems[i].value);
			}
		}
		return s;
	};
	
	this._createHtmlForm = function (gameStr, opts) {
		var form = document.createElement("form");
		form.method = "POST";
		form.action = this.url;
		
		var _add_to_form = function (form, name, value) { 
			var elem = document.createElement("input");
			elem.setAttribute ("name", name);
			elem.type = "hidden";
			//elem.name = name;
			elem.value = value;
			form.appendChild (elem);
		};
		
		_add_to_form (form, 'game', gameStr);
		
		var opt_names = ['integer', 'objective', 'action', 'preserveTypes'];
		for (var i in opt_names)
			_add_to_form (form, opt_names[i], opts[opt_names[i]]);
		
		return form;
	};
	
	/**
	 * @fund Solver::request
	 * 
	 * Do a request by using the settings in the given HTML form. If the action
	 * is to solve the instance (i.e. to find minimum repr.), then the callback 
	 * functions onSolved and onUnsolved are used depending on the result.
	 * 
	 * @return Returns nothing.
	 */
	this.request = function (input, opts, onSolved, onUnsolvable) {
		if ( !this.isOnline())
			throw "Solver is not reachable.";
		else {
			/* Create an auxiliary HTML form element. This is necessary in case
			 * the user want to download the linear program. */
			var form = this._createHtmlForm (input, opts);
			
			if (opts.action === 'solve') {
				var post_data = this._buildPostData(form);
				
				this._makePostRequest (this.url, post_data, 
					function (req) {
						/* We only care on successful requests. The solver is
						 * supposed to be online and available because we 
						 * reached it before. */
						if (req.readyState === 4 /*complete*/ && req.status === 200) {
							var resp = JSON.parse (req.responseText);
							if (resp.feasible) onSolved (resp);
							else onUnsolvable (resp);
						}
					});
			}
			else if (opts.action === 'download') {
				/* Some browser submit the form only if it was added to the
				 * body element before. */
				document.body.appendChild(form);
				form.submit();
				document.body.removeChild(form);
			}
			else {
				window.alert ('Solver: Invalid action: "'+opts.action+'".');
			}
			
			delete form;
		}
	};
}
