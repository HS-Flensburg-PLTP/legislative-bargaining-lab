/*
 * InputConversion.js
 *
 *  Copyright (C) 2011,2012 Stefan Bolus, University of Kiel, Germany
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
 * Given a boolean expression, converts it into a equivalent description of a 
 * simple game using one constraint for each variable and an appropriate 'join'
 * command.
 * 
 * @param exprRaw A Boolean expression with operators '&' for conjunction and
 *    '|' for disjunction. For instance, "dog & (cat | (pig & x4))".
 */
function bool_expr_to_mwvg (exprRaw)
{
	/* Remove all whitespaces (\t,\n,spaces). The parser cannot handle them. */
	var expr = exprRaw.replace (/\s*/g, '');
	
	var tree = parser.parse(expr);
	var vars = []; /* var. name -> constraint index */
	var name;
	var i, j, m = 0;
	
	var lines = []; /* 1st line is the expr. and 2nd line is the join command. */

	/* First line is the original expression with line-feed replaced by spaces. */
	lines.push('# ' + exprRaw.replace(/\n/g, ' '));
	
	/* Obtain a list of variable names in the expression. */
	/* Second line is the join description. Variable names are removed by their
	 * corresponding constraint indices. */
	lines.push ('%join ' + tree.fold ({
		foldOr:  function (s,t) { return '(' + s.fold(this) + ' | ' + t.fold(this) + ')'; },
		foldAnd: function (s,t) { return '(' + s.fold(this) + ' & ' + t.fold(this) + ')'; },
		foldVar: function (name) { 
			if (undefined === vars[name])
				vars[name] = ++m; // Indices of constraints are 1-indexed.
			return vars[name]; }
	}));
	
	/* Now, m contains the number of variables. Add the lines for the quotas. 
	 * For each constraint the quota is 1 because a constraint only handles a
	 * single variable. */
	var quotas = [];
	for (i = 0 ; i < m ; ++i)
		quotas.push(1);
	lines.push(quotas.join(' '));	
	
	i = 0; /* Index of current variable. */
	for (name in vars) {	
		/* Add a dedicated constraint for each variable. */
		var line = '';
		for (j = 0 ; j < m ; ++j)
			line += ((i === j)?'1':'0') + ' '; 
		line += name;
		lines.push(line);
		++i;
	}
	
	return lines.join ('\n');
}


/**
 * Given a list of (minimal) winning coalitions, generates a multiple weighted
 * voting game from it. The parser handles the input as follows:
 *    1. Remove any whitespaces including line-feeds.
 *    2. For each list of player names enclosed by '{' and '}'
 *    2.1 Split the list of players using ','
 * 
 * Player's names may contain characters a-z, A-Z, 0-9 and underscores. Other
 * character should be avoided. The output contains a constraint for every
 * coalition in the input. The constraints are joined by disjunction.
 */
function min_win_coals_to_mwvg (coalsRawStr)
{
	var coal_pat = /{([^}]+)}/g;
	var n = 0; // number of variables.
	var coals = []; // Set of set of indices.
	var vars = []; // Maps variable names to indices 0..n-1
	var names = [];
	
	var name, c;
	var i,j,k;
	var s = '';
	
	/* Remove any whitespaces. */
	var coalsStr = coalsRawStr.replace(/\s+/g, '');
	
	/* For each coalition in the input. */
	while ((match = coal_pat.exec(coalsStr))) {
		var members = match[1].split(',');
		c = [];
		for (j in members) {
			name = members[j];
			if (undefined === vars[name]) {
				i = n++;
				vars[name] = i;
				names.push(name);
			}
			c.push(vars[name]);
		}
		if (c.length === 0)
			throw "Empty coalition is not allowed.";
		else {
			c.sort(function (a,b){ return a-b; });
			coals.push(c);
		}
	}
	
	var m = coals.length;
	
	/* The quotas are the coalition sizes. */
	/* Coalitions can be conceived as a matrix with m columns and n rows. */
	var quotas = [];
	var constraints = [];
	var ks = []; // index for each coalition.
	for (j = 0 ; j < m ; ++j) {
		constraints.push (j+1); // 1-indexed
		quotas.push(coals[j].length);
		ks.push(0);
	}
	
	s += '# ' + coalsRawStr.replace(/\n/g, ' ') + '\n'
		+ '%join ' + constraints.join(' | ') + '\n'
		+ quotas.join(' ') + '\n';
	
	for (i = 0 ; i < n ; ++i) {
		for (j = 0 ; j < m ; ++j) {
			if (coals[j][ks[j]] === i) {
				s += '1 ';
				ks[j]++;
			}
			else s += '0 ';
		}
		s += names[i] + '\n';
	}
	
	return s;
}


/**
 * Given a list of vectors of (minimal) winning coalitions, generates a
 * multiple weighted voting game from it. The parser handles the input as
 * follows:
 *    1. Remove any characters except oneChar and zeroChar and '\n'
 *    2. Each line is considered as a vector. The number of players is derived
 *       from then number of characters (except '\n') on the first line.
 *
 * Players in the result game will be unnamed. The output contains a constraint
 * for every coalition in the input. The constraints are joined by disjunction.
 * 
 * @param oneChar Character used as "in a coalition". (default is '1')
 * @param zeroChar Character used as "NOT in a coalition". (default is '0')
 */
function min_win_coals_vectors_to_mwvg (inpRawStr, oneChar, zeroChar)
{
	if (oneChar === undefined) oneChar = '1';
	if (zeroChar === undefined) zeroChar = '0';
	
	// Remove any characters except oneChar, zeroChar and '\n' and remove empty lines.
	var inpStr = inpRawStr.
		replace(new RegExp('[^'+oneChar+zeroChar+'\n]', 'g'),'').
		replace(/\r/g, ''); /* Remove any carriage-returns. */
	
	var vecStrs = inpStr.split (/\n/); 
	
	if (vecStrs.length === 0) throw "No vectors found in input.";
	
	var vecs = [];
	var memberCounts = []; // Number of 1s in i-th vector.

	var n = undefined; // Number of player. The first line might be empty.
	
	for (var i in vecStrs) {
		var s = vecStrs[i];
		
		if (s.length === 0) {
			// Skip empty lines.
			continue;
		}
		else if (undefined === n) {
			// First non-empty line
			n = s.length; 
		}
		else if (n !== s.length) {
			throw 'Vectors have different length. Vector "'+s+'" has length ' + s.length + ' but length ' + n + ' expected.';
		}
		
		var vec = new Array(n);
		var memberCount = 0;
		for (var k = 0 ; k < s.length ; ++k) {
			var ch = s.charAt(k);
			if (ch === oneChar) memberCount ++;
			vec[k] = (ch === oneChar);
		}
		vecs.push (vec);
		memberCounts.push (memberCount);
	}

	var m = vecs.length;
	
	/* The quotas are the number of true values in the vectors.
	 * Vectors can be conceived as a matrix with m columns and n rows. */
	var quotas = [];
	var constraints = [];
	for (var j = 0 ; j < m ; ++j) {
		constraints.push (j+1); // 1-indexed
		quotas.push(memberCounts[j]);
	}
	
	var s = '%join ' + constraints.join(' | ') + '\n'
		+ quotas.join(' ') + '\n';
	
	for (var i = 0 ; i < n ; ++i) {
		for (var j = 0 ; j < m ; ++j) {
			s += vecs[j][i] ? '1 ' : '0 '; 
		}
		s += '\n';
	}
	
	return s;
}