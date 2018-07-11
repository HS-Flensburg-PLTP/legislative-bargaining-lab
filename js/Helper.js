

function dashedLineTo(ctx, fromX, fromY, toX, toY, pattern) {
  // Our growth rate for our line can be one of the following:
  //   (+,+), (+,-), (-,+), (-,-)
  // Because of this, our algorithm needs to understand if the x-coord and
  // y-coord should be getting smaller or larger and properly cap the values
  // based on (x,y).
  var lt = function (a, b) { return a <= b; };
  var gt = function (a, b) { return a >= b; };
  var capmin = function (a, b) { return Math.min(a, b); };
  var capmax = function (a, b) { return Math.max(a, b); };

  var checkX = { thereYet: gt, cap: capmin };
  var checkY = { thereYet: gt, cap: capmin };

  if (fromY - toY > 0) {
    checkY.thereYet = lt;
    checkY.cap = capmax;
  }
  if (fromX - toX > 0) {
    checkX.thereYet = lt;
    checkX.cap = capmax;
  }

  ctx.moveTo(fromX, fromY);
  var offsetX = fromX;
  var offsetY = fromY;
  var idx = 0, dash = true;
  while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
    var ang = Math.atan2(toY - fromY, toX - fromX);
    var len = pattern[idx];

    offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
    offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

    if (dash) ctx.lineTo(offsetX, offsetY);
    else ctx.moveTo(offsetX, offsetY);

    idx = (idx + 1) % pattern.length;
    dash = !dash;
  }
};


// See http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}


//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]    
shuffleArray = function(o){ //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};


// Function to allow one JavaScript file to be included by another.
// Copyright (C) 2006-08 www.cryer.co.uk
function IncludeJavaScript(jsFile) {
	document.write('<script type="text/javascript" src="' + jsFile + '"></scr' + 'ipt>'); 
}