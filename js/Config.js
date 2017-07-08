/*
 * Config.js
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


var Config = {
	/**
	 * Path of the closure-library. May be absolute or relative. Should not
	 * contain a trailing slash.
	 */
	closure_library_path: 'closure-library',
		
	/**
	 * Path of the RGraph library. May be asbolute of relative. Should not
	 * contain a trailing slash.
	 */
	rgraph_path: 'RGraph',
	
	/**
	 * Path of the JSHashTable library. May be absolute or relative. Should
	 * not contain a trailing slash.
	 * 
	 * @note JSHashTable is part of the distribution.
	 */
	jshashtable_path: 'jshashtable-2.1',
	
	/**
	 * Colors used in Pie diagrams.
	 */
	pie_colors: ['#CC0000','#FFCC00','#009900','#006666','#0066FF','#0000CC','#663399','#CC0099',
	             '#FF0000','#FFFF00','#00CC00','#009999','#0099FF','#0000FF','#9900CC','#FF0099',
	             '#990000','#CC9900','#006600','#336666','#0033FF','#000099','#660099','#990066',
	             '#CC3333','#FFFF33','#00FF00','#00CCCC','#00CCFF','#3366FF','#9933FF','#FF00FF',
	             '#660000','#996633','#003300','#003333','#003399','#000066','#330066','#660066',
	             '#FF6666','#FFFF66','#66FF66','#66CCCC','#00FFFF','#3399FF','#9966FF','#FF66FF',
	             '#FF9999','#FFFF99','#99FF99','#66FFCC','#99FFFF','#66CCFF','#9999FF','#FF99FF',
	             '#FFCCCC','#FFFFCC','#CCFFCC','#99FFCC','#CCFFFF','#99CCFF','#CCCCFF','#FFCCFF'],

	/**
	 * Maximum length of a label in a Pie diagram. Includes '...' if the name is
	 * abbreviated. Labels are usually names of players.
	 */
	pie_max_label_length: 8,
	
	
	/**
	 * Number of digits after the decimal point when showing power indices in a
	 * table.
	 */
	power_index_precision: 4,


	/**
	 * Size for which the user is warned before the shift-minimal winning 
	 * coalitions of a game are computed. This operation can take a long while and
	 * make the system inoperable.
	 */	
	warn_shift_min_win_size: 500,
	
	
	/**
	 * Dimension of the 'Help' window in pixels. 
	 */
	help_window_width: 900,
	help_window_min_height: 600,

	
	/**
	 * If a QOBDD has more than the given number of inner nodes, the user has
	 * to confirm his action before the QOBDD is drawn. Drawing of large QOBDDs
	 * can take a lot of time and can make the browser irresponsible.
	 */
	ask_show_qobdd_limit: 1000,
	
	/**
	 * Address for the solver backend. The solver is used to find minimum
	 * weighted representations of a game (if there is one).
	 */
	solver_url : 'http://korsika.informatik.uni-kiel.de/~stb/cgi-bin/lab/backend.cgi'
};