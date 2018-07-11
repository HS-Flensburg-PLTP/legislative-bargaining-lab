/*
 * draw.js
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
 * @fn draw_qobdd
 * 
 * @tparam int n Number of variables.
 * @tparam array<string> names Names of the nodes. May be null or undefined.
 * Maps variables (indices, starting at 0) to strings. If for a label i, 
 * names[i] is evaluated to false, it is not used.
 * @tparam bool withBounds If true, the algorithm expects the (lb.ub] bounds in
 * the node's 'value' property as an array of the form [lb,ub]. Optional.
 * @tparam bool drawValues If true, the node's values will be drawn. Ignored if
 *         withBounds is true. Optional.
 */
function draw_qobdd (n, names, V, canvas, maxCanvasWidth, maxCanvasHeight, withBounds, 
		drawValues, drawValueFunc) 
{
	var context = canvas.getContext('2d');
	
	if (withBounds) {
		for (var i in V)
			V[i].sort(function (u,v) { return u.value[1] - v.value[1]; });
		
		drawValues = false;
	}
	else if (drawValues) {
		if ( !drawValueFunc)
			drawValueFunc = String;
	}
	
	var max_name_len = 10;
	
	/* Unit square with edge length 1. */
	var nodeRadiusX, nodeRadiusY;
	var minDistX, minDistY;
	if (withBounds) {
		nodeRadiusX = 27;
		nodeRadiusY = parseInt(2/3.0 * nodeRadiusX);
		minDistX = 20;
		minDistY = 40;
	}
	else {
		nodeRadiusX = 21;
		nodeRadiusY = parseInt(2/3.0 * nodeRadiusX);
		minDistX = 10;
		minDistY = 20;
	}
	var terminalNodeWidth = 54, terminalNodeHeight = 36;
	
	var bddWidth = 2; /*terminal level*/
	for (level in V) bddWidth = Math.max(bddWidth, V[level].length);

	/* Left space for the labels and weights. */
	var xOff = 50;

	var canvasWidth = parseInt(xOff)+Math.max(300, 2*bddWidth*nodeRadiusX + minDistX*(bddWidth+1)), 
	    canvasHeight = Math.max(300, minDistY * n + 2*n*nodeRadiusY); 

	var canvasOverFacX = maxCanvasWidth / canvasWidth;
	var canvasOverFacY = maxCanvasHeight / canvasHeight;

	canvas.setAttribute('width', Math.min(maxCanvasWidth,canvasWidth)); // clears the canvas
	canvas.setAttribute('height', Math.min(maxCanvasHeight, canvasHeight)); // clears the canvas
	
	if (canvasOverFacX < 1 || canvasOverFacY < 1) {
	    var fac = Math.min (canvasOverFacX, canvasOverFacY);
	    context.scale(fac,fac);
	}

	var levelHeight = (canvasHeight - terminalNodeHeight - nodeRadiusY) / n;
	
	function draw_node (v) {
		var cx = v.draw_info[0], cy = v.draw_info[1];
		delete v.draw_info;
	
		//context.beginPath();
		context.strokeStyle = "Black";
		context.fillStyle = "White";
		//context.fillStyle = v.color;
		context.save();
		context.scale(nodeRadiusX, nodeRadiusY);
		context.beginPath();
		context.arc (cx/nodeRadiusX, cy/nodeRadiusY, 1, 0, 2*Math.PI, false);
		context.restore();
		context.fill();
		context.stroke();

		if (withBounds) {
			context.save();
			context.fillStyle = "Black";
			context.textAlign = "center";
	
			context.fillText ('('+(v.value[0]==-Infinity?'-oo':v.value[0])
					  +','+((v.value[1]==Infinity)?'oo':v.value[1])+']', cx,cy);
			context.restore();
		}
		else if (drawValues) {
			context.save();
			context.fillStyle = "Black";
			context.textAlign = "center";
	
			context.fillText (drawValueFunc(v.value), cx,cy);
			context.restore();
		}
		else /* draw ID */ {
			context.save();
			context.fillStyle = "Black";
			context.textAlign = "center";
	
			context.fillText (v.getId(), cx,cy);
			context.restore();
		}
	}	
	
	function draw_edge (from, to) {
	    context.beginPath();
	    dashedLineTo(context, from[0],from[1], to[0], to[1], [5,5]);
	    context.closePath();
	    context.stroke();
	}
	
	function draw_0_edge (fromNode, toNode) {
	    draw_edge (fromNode.draw_info, toNode.draw_info);
	}
	
	function draw_1_edge (fromNode, toNode) {
	    var from = fromNode.draw_info;
	    var to = toNode.draw_info;

	    context.beginPath();
	    context.moveTo(from[0],from[1]);
	    context.lineTo(to[0], to[1]);
	    context.closePath();
	    context.stroke();
	}

	// for redundant node
	function draw_01_edges (fromNode, toNode) {
	    var from = fromNode.draw_info;
	    var to = toNode.draw_info;
	    var ydelta = (to[1] - from[1]) / 4; // there are just 3
	    var xdelta = (to[0] - from[0]) / 3;

	    context.save();
	    context.beginPath();
	    context.strokeStyle="Black";
	    context.moveTo(from[0], from[1]);
	    context.bezierCurveTo(from[0]-10+xdelta, parseInt(from[1])+ydelta, 
				  to[0]-10-xdelta, to[1]-ydelta,
				  to[0],to[1]);
	    context.stroke();
	    context.restore();

	    draw_0_edge (fromNode, toNode);
	}

	function draw_terminal (cx, cy, which) {
	    var x = cx-terminalNodeWidth/2, y=cy-terminalNodeHeight/2;
	    context.save ();
	    context.strokeStyle = "Black";
	    context.fillStyle = "White";
	    context.fillRect(x,y,terminalNodeWidth,terminalNodeHeight);
	    context.strokeRect(x,y,terminalNodeWidth,terminalNodeHeight);
	    context.textAlign = "center";
	    context.fillStyle = "Black";		
	    context.fillText (which, cx,cy);
	    context.restore();
	}
	
	/* Prepare positions of terminal nodes. */
	var p = (canvasWidth - xOff)/3;
	QOBDD.one.draw_info = [parseInt(xOff) + p, levelHeight*n];
	QOBDD.zero.draw_info = [parseInt(xOff) + 2*p, levelHeight*n];
	
	/* Prepare positions of inner nodes and draw edges. Edges have to be drawn
	 * before any node is drawn. */
	for (var level = n-1 ; level >= 0 ; --level) {
	    /* Draw the label */
	    context.save();
	    context.fillStyle = 'Black';
	    context.textAlign = 'left';
	    
	    var text = ""+(level+1);
	    if (names && names[level]) {
	    	text += " (";
	    	/* Add ellipsis if necessary */
	    	if (names[level].length > max_name_len)
	    		text += names[level].substr(0,max_name_len-3) + "...)";
	    	else
	    		text += names[level] + ")";
	    }
	    
	    context.fillText(text, 10, nodeRadiusY+level*levelHeight);
	    context.restore();

		if (V[level].length > 1) {
			var nodeDistanceX = (canvasWidth - xOff) / (V[level].length -1 +2/*left/right margin*/); 

			for (node in V[level]) {
				var v = V[level][node];
				v.draw_info = [parseInt(xOff)+((parseInt(node)+1)*nodeDistanceX), nodeRadiusY+level*levelHeight];
			if (v.t != v.e) {
			    draw_1_edge (v, v.t);
			    draw_0_edge (v, v.e);
			}
			else 
			 draw_01_edges (v, v.t);
			
			}
		}
		else {
			var v = V[level][0];
			v.draw_info = [parseInt(xOff) + (canvasWidth - xOff) / 2, nodeRadiusY+level*levelHeight];
			if (v.t != v.e) {
			    draw_1_edge (v, v.t);
			    draw_0_edge (v, v.e);
			}
			else draw_01_edges (v, v.t);
			
		}
		
		/* After we have all ingoing edges, draw the nodes on the next level. */
		for (node in V[level+1])
			draw_node (V[level+1][node]);
	}
	
	/* Don't forget the root node. */
	draw_node (V[0][0]);
	
	draw_terminal (QOBDD.one.draw_info[0], QOBDD.one.draw_info[1], '1');
	draw_terminal (QOBDD.zero.draw_info[0], QOBDD.zero.draw_info[1], '0');

	delete QOBDD.one.draw_info;
	delete QOBDD.zero.draw_info;
	
}


/**
 * Draws a rectangular grid given the bits and the optional labels. The visual
 * appearance can be changed using a fixed set of parameters. Colors have to
 * be in CSS3 values and dimensions have to be pixels. Options contain:
 * 
 *   - maxCanvasWidth 	[Infinity]
 *   - maxCanvasHeight 	[Infinity]
 *   - cellSize 		[16]
 *   - cellYesColor		[black]
 *   - cellNoColor		[white]
 *   - cellColorFunc(val) (cellYesColor and cellNoColor are ignored if set)
 *   - gridColor		[grey]
 *   - gridLineWidth	[1]
 *   - backgroundColor	[white]
 *   - fontSize			[10]
 *   - fontFamily		[Arial]
 *   - labelColor		[black]
 *   
 * The canvas' size is changed if necessary.
 */
function draw_grid (n, m, bits, canvas, rowLabels, colLabels, settings)
{
	// See http://developer.mozilla.org/en/drawing_text_using_a_canvas for reference.
	
	var i,j;
		
	var defaults = {
		maxCanvasWidth: Infinity,
		maxCanvasHeight: Infinity,
		cellSize: 16 /*px*/,
		cellYesColor: 'black',
		cellNoColor: 'white',
		cellColorFunc: undefined,
		gridColor: 'grey',
		gridLineWidth: 1 /*px*/,
		backgroundColor: 'white',
		fontSize: 10 /*px*/,  
		fontFamily: 'Arial', // 
		textAlign: 'right', // Should not be changed
		textBaseline: 'middle', // Should not be changed
		labelColor: 'black',
		rowLabelPaddingLeft: 5 /*px*/,
		rowLabelPaddingRight: 5, /*px*/
		colLabelRotate: 45 /*deg*/, 
		colLabelPaddingTop: 7 /*px*/,
		colLabelPaddingBottom: 5 /*px*/,
		paddingRight: 5 /*px*/
	};

	/* Use default settings if the user has not parsed a specific property. */
	if ( !settings) settings = {};
	for (key in defaults) 
		if (!settings[key]) settings[key] = defaults[key];
	
	if ( !settings.cellColorFunc)
		settings.cellColorFunc = function (val) { return val ? settings.cellYesColor : settings.cellNoColor; };
	
	var context = canvas.getContext('2d');
	
	context.save ();
	context.font = settings.fontSize + 'pt ' + settings.fontFamily;
	
	var matrixWidth  = (m+1) * settings.gridLineWidth + m*settings.cellSize;
	var matrixHeight = (n+1) * settings.gridLineWidth + n*settings.cellSize;
	
	var leftMargin = 0;
	for (i in rowLabels)
		leftMargin = Math.max (leftMargin, context.measureText(rowLabels[i]).width);
	leftMargin += settings.rowLabelPaddingLeft + settings.rowLabelPaddingRight;
	
	var topMargin = 0, rightMargin = 0;
	var angle = settings.colLabelRotate * Math.PI / 180.0;
	for (i in colLabels) {
		/* We use an approximation. */
		var d = Math.sqrt (Math.pow(context.measureText(colLabels[i]).width, 2) 
					+ Math.pow(settings.fontSize, 2));
		topMargin = Math.max (topMargin, Math.ceil(d * Math.sin(angle)));
		
		/* The rotated text may reach beyond the matrix on the right side. */
		var distToRightBorder = matrixWidth - (parseInt(i,10)+0.5)*(settings.gridLineWidth + settings.cellSize);
		rightMargin = Math.max (rightMargin, Math.ceil (d * Math.cos (angle) - distToRightBorder));
	}
	topMargin += settings.colLabelPaddingTop + settings.colLabelPaddingBottom;
	
	var width = leftMargin + matrixWidth + rightMargin + settings.paddingRight, 
			height = topMargin + matrixHeight;
	
	/* Set scale factor if necessary. */
	var phyWidth  = width;
	var phyHeight = height;
	var factor = 1.0;
	if (width > settings.maxCanvasWidth || height > settings.maxCanvasHeight) {
		factor = Math.min (settings.maxCanvasWidth / width,
				settings.maxCanvasHeight / height);
		context.scale (factor, factor);
		
		phyWidth  = factor * width;
		phyHeight = factor * height;
	}
	
	/* Set Canvas size and draw background. Resets the canvas's state! */
	canvas.width  = phyWidth;
	canvas.height = phyHeight;
	
	if (phyWidth !== width || phyHeight !== height)
		context.scale (factor, factor);
	
	context.fillStyle = settings.backgroundColor;
	context.fillRect(0,0, width, height);
	
	var x,y;
	
	/* Draw the grid. */
	context.save ();
	context.fillStyle   = settings.gridColor;
	for (i = 0 ; i <= n ; ++i) /* horz. grid */ {
		y = topMargin + i*(settings.gridLineWidth + settings.cellSize);
		context.fillRect (leftMargin, y, matrixWidth, settings.gridLineWidth);
	}
	
	for (j = 0 ; j <= m ; ++j) /* vert. grid */ {
		x = leftMargin + j*(settings.gridLineWidth + settings.cellSize);
		context.fillRect (x, topMargin, settings.gridLineWidth, matrixHeight);
	}
	context.restore ();
	
	/* Draw the labels if there are some. Rows labels first. */
	context.save ();
	context.fillStyle 	 = settings.labelColor;
	context.textBaseline = settings.textBaseline;
	context.font         = settings.fontSize + 'pt ' + settings.fontFamily;
	context.textAlign    = settings.textAlign;
	for (i = 0 ; i < n ; ++i) {
		if ( !rowLabels[i]) continue;
		y = topMargin + (i+0.5)*(settings.gridLineWidth + settings.cellSize);
		context.fillText (rowLabels[i], leftMargin - settings.rowLabelPaddingRight, y);
	}
	
	context.textAlign    = 'start';
	context.textBaseline = 'alphabetic';
	context.translate (0, topMargin - settings.colLabelPaddingBottom);
	for (j = 0 ; j < m ; ++j) {
		if ( !colLabels[j]) continue;
		x = leftMargin + (j+0.5)*(settings.gridLineWidth + settings.cellSize);
		context.translate (x, 0);
		context.rotate (-angle);
		context.fillText (colLabels[j], 0, 0);
		context.rotate (angle);
		context.translate (-x, 0);
		
	}
	context.restore ();
	
	/* Draw the cells. */
	for (i = 0 ; i < n ; ++i)
		for (j = 0 ; j < m ; ++j) {
			context.fillStyle = settings.cellColorFunc(bits[i][j]);
			context.fillRect (leftMargin + (j+1)*settings.gridLineWidth + j*settings.cellSize,
					topMargin + (i+1)*settings.gridLineWidth + i*settings.cellSize,
					settings.cellSize, settings.cellSize);
		}
	
	context.restore ();
	return;
}