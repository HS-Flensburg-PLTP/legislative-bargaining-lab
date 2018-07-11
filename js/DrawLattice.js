/**
 * @file DrawLattice.js
 * 
 * Draw a lattice into a HTML canvas element and let the user interact with it.
 * 
 * See http://estrada.cune.edu/facweb/john.snow/drawlat.html 
 * and http://estrada.cune.edu/facweb/john.snow/ .
 * 
 * \author John W. Snow
 */


//* Point Stuff **********************************************/
function dot(p){
	return (this.x*p.x+this.y*p.y+this.z*p.z);
}
function norm(){
	return Math.sqrt(this.dot(this));
}
function plus(b){
	c=new point(this.x+b.x, this.y+b.y, this.z+b.z);
	return(c);
}
function sub(b){
	c=new point(this.x-b.x, this.y-b.y, this.z-b.z);
	return(c);
}
function scale(s){
	c=new point(s*this.x, s*this.y, s*this.z);
	return(c);
}
function zero(){
	this.x=0;
	this.y=0;
	this.z=0;
}
function rand(n){
	this.x=Math.random() % n;
	this.y=Math.random() % n;
	this.z=Math.random() % n;

}
function printInfo(){
	return("("+this.x+", "+this.y+", "+this.z+")");
}
function point(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
	this.dot=dot;
	this.norm=norm;
	this.plus=plus;
	this.sub=sub;
	this.scale=scale;
	this.zero=zero;
	this.rand=rand;
	this.printInfo=printInfo;
}
//**************************************************************/
//* 3D drawing stuff *******************************************/
var theCanvas; // TODO: Not needed?
var theContext;
var theForm;
var width;
var height;
var reach=10;			//maximum coordinate in DRAWING plane
var reachScale=0.9;		//zooming factor
var Pi=Math.PI;
var angleSteps=20;		//half number of rotation steps in 
//one full revolution
var aStep=Pi/angleSteps;	//added to angle for rotation
var theta=0; 			//angle to eye from positive x-axis
var phi=0; 			//angle to eye from xy-plane
var projX;			//basis vectors for drawing plane
var projY;
var changed=0;			//flag to indicate if need redraw
var nodeLabels = null;

function setProjectionMatrix(){
//	set up basis for drawing plane
	projX.x=-Math.sin(theta);
	projX.y=Math.cos(theta);
	projX.z=0;
	projY.x=-Math.cos(theta)*Math.sin(phi);
	projY.y=-Math.sin(theta)*Math.sin(phi);
	projY.z= Math.cos(phi);
}

function initProjectionMatrix(){
//	begin with eye on positive x-axis
	projX=new point(0,0,0);
	projY=new point(0,0,0);
	theta=0;
	phi=0;
	setProjectionMatrix();
}

function projectAndScaleX(p){
//	find x-component of point on drawing plane
	return (width*(projX.dot(p)+reach)/(2*reach));
}

function projectAndScaleY(p){
//	find y-component of point on drawing plane
	return height-(height*(projY.dot(p)+reach)/(2*reach));
}
function drawLine(p,q){
	theContext.beginPath();
	theContext.moveTo(projectAndScaleX(p), projectAndScaleY(p));
	theContext.lineTo(projectAndScaleX(q), projectAndScaleY(q));
	theContext.stroke();
}

function drawSphere(p, r, x/*obj. index*/) {
	var cx = projectAndScaleX(p), cy = projectAndScaleY(p)
	
	//theContext.beginPath();
	//theContext.arc(cx, cy, width*(r/(2*reach)), 0, 2*Pi, false);
	//theContext.fill();
	
	theContext.save();
	theContext.font = "20px Sans";
	theContext.fillStyle = "Black";
	theContext.textAlign = "left";
	theContext.fillText (nodeLabels[x], cx, cy);
	theContext.restore();
}

function drawAxis(){
	var p,q;
	p=new point(-reach,0,0)
	q=new point(reach,0,0);
	drawLine(p,q);

	p.x=0;p.y=-reach;p.z=0;
	q.x=0;q.y=reach;q.z=0;
	drawLine(p,q);

	p.x=0;p.y=0;p.z=-reach;
	q.x=0;q.y=0;q.z=reach;
	drawLine(p,q);
}

//*****************************************************************/
//* Controls ******************************************************/
function rotateLeft(){
	theta+=aStep;
	setProjectionMatrix();
	changed=1;
}
function zoomIn(){
	reach=reach*reachScale;
	changed=1;
}
function zoomOut(){
	reach=reach/reachScale;
	changed=1;
}

function rotateRight(){
	theta-=aStep;
	setProjectionMatrix();
	changed=1;
}

function rotateUp(){
	if (phi<Pi/4){
		phi+=aStep;
		setProjectionMatrix();
		changed=1;
	}
}

function rotateDown(){
	if (phi>-Pi/4){
		phi-=aStep;
		setProjectionMatrix();
		changed=1;
	}
}

function handleKeyDown(event){
	var k=event.keyCode;

	if (theContext && (39 === k || 79 === k || 73 === k || 37 === k)) {
	
	if	(k==39)
		rotateRight();
	else if	(k==79)
		zoomOut();
	else if	(k==73)
		zoomIn();
	else if	(k==37)
		rotateLeft();
	
	drawScene();
	}
//	uncomment the next 4 lines if you want to be able to rotate
	//up and down.  This is dangerous for ordered sets
	//because the maximal and minimal elements may rotate out
	//of those positions.
//	else if	(k==38)
//	rotateUp();
//	else if (k==40)
//	rotateDown();
}
//* drawLat Stuff ********************************************/

var tStep=0.01;		//time step
var N;				//number of elements in ordered set
var thePoints; 			//arrays for points, velocities, forces
var theVelocities
var theForces;
var theGraph;			//graph of covering relation
var theOrder;			//order relation
var theHeights; 		//height
var theDepths;			//max height - depth
var sorted;			//elements are bubble sorted to find height
var radius=0.1;			//radius of ball drawn for each point
var improve=0;			//flag to indicate when forces applied
var repulsion=1;		//constants for proportional forces
var attraction=1;
var coverAttraction=1;

function drawGraph(){
	var x,y,i;

	theContext.fillStyle="gray";
	theContext.fillRect(0,0,width,height);
	theContext.fillStyle="black";

	for (x=0;x<N;x++)
		for (y=0;y<N;y++)
			if (theGraph[x][y])
				drawLine(thePoints[x], thePoints[y]);
	for (x=0;x<N;x++)
		drawSphere(thePoints[x], radius, x);
	changed=0;
}

function findForces(){
	r=2;
	a=1;
	one = new point(1,1,0);
	for (i=0;i<N;i++)
		theForces[i].zero();
	for (i=0;i<N;i++)
		for (j=0;j<N;j++)
			if (i != j) {
				d=thePoints[j].sub(thePoints[i]);
				l=d.dot(d);
				//Attraction for comparables
				if ((theGraph[i][j])){
					theForces[j].x-=((coverAttraction)*d.x);
					theForces[j].y-=((coverAttraction)*d.y);
					theForces[i].x+=((coverAttraction)*d.x);
					theForces[i].y+=((coverAttraction)*d.y);
				}
				//Attraction for covers
				if ((theOrder[i][j])){
					theForces[j].x-=((attraction/l)*d.x);
					theForces[j].y-=((attraction/l)*d.y);
					theForces[i].x+=((attraction/l)*d.x);
					theForces[i].y+=((attraction/l)*d.y);
				}
				//Repulsion for incomparables
				else if (!(theOrder[i][j] || theOrder[i][j]) ){
					theForces[j].x+=((repulsion/l)*d.x);
					theForces[j].y+=((repulsion/l)*d.y);
					theForces[i].x-=((repulsion/l)*d.x);
					theForces[i].y-=((repulsion/l)*d.y);
				}
			}
}

function findVelocities(){
//	Used F=MV rather than F=MA.  Assume all M are 1, so F=V.
	var i;
	for (i=0;i<N;i++){
		theVelocities[i].x=theForces[i].x;
		theVelocities[i].y=theForces[i].y;
	}
}

function updatePositions(){
//	new position = old position + velocity * tStep
	var i;
	for (i=0;i<N;i++){
		thePoints[i].x+=tStep*theVelocities[i].x;
		thePoints[i].y+=tStep*theVelocities[i].y;
	}	
}

function recenter(){
//	translate points so CM is at orgin for zooming and rotation
	var i,j, c;
	c=new point(0,0,0);
	for (i=0;i<N;i++)
		c=c.plus(thePoints[i]);
	c=c.scale(1/N);
	for (i=0;i<N;i++)
		thePoints[i]=thePoints[i].sub(c);
}

function updatePoints(){
	findForces();
	findVelocities();
	updatePositions();
	recenter();
	changed=1;
}

function transitiveClosure(){
	var i, x,y,z;
	for (i=0;i<N+1;i++)
		for (x=0;x<N;x++)
			for (y=0;y<N;y++)
				for (z=0;z<N;z++)
					theOrder[x][z]=theOrder[x][z] || (theOrder[x][y] && theOrder[y][z]);
}

function bubbleSort(){
//	bubble sort elements to find heights
	var x,y,t;
	for (x=0;x<N;x++)
		sorted[x]=x;
	for (x=0;x<N;x++)
		for (y=x+1;y<N;y++)
			if (theOrder[sorted[y]][sorted[x]]){
				t=sorted[y];
				sorted[y]=sorted[x];
				sorted[x]=t;
			}
}

function findHeights(){
	var x,y;
	for (x=0;x<N;x++)
		theHeights[x]=0;
	for (x=0;x<N;x++)
		for (y=x+1;y<N;y++)
			if (theGraph[sorted[x]][sorted[y]])
				theHeights[sorted[y]]=theHeights[sorted[x]]+1;
}

function findDepths(){
	var m, x, y;
	m=0;
	for (x=0;x<N;x++)
		if (m<theHeights[x])
			m=theHeights[x];
	reach=Math.max(m, N/m);
	for (x=0;x<N;x++)
		theDepths[x]=m;
	for (y=N-1;y>=0;y--)
		for (x=y-1;x>=0;x--)
			if (theGraph[sorted[x]][sorted[y]])
				theDepths[sorted[x]]=theHeights[sorted[y]]-1;
}

function findZs(){
	var x;
	for (x=0;x<N;x++)
		thePoints[x].z=(theHeights[x]+theDepths[x])/2;
}

function centerSingles(){
//	if there is exactly on maximal (minimal) element then
//	its initial position is on the z-axis to help symmetry
	var i,j,h,n,max, min;

	for (i=0;i<N;i++){
		h=thePoints[i].z;
		n=0;
		max=1;
		min=1;
		for (j=0;j<N;j++){
			if (thePoints[j].z == h)
				n++;
			else if ((thePoints[j].z>h))
				max=0;
			else if ((thePoints[j].z<h))
				min=0;
		}
		if ((n==1) && ((max) || (min))){
			thePoints[i].x=0;
			thePoints[i].y=0;
		}
	}
}

function initializeArrays(){
	var i,j,x,y;
	initProjectionMatrix();
	thePoints=new Array(N);
	theVelocities=new Array(N);
	theForces=new Array(N);
	theHeights=new Array(N);
	theDepths=new Array(N);
	sorted = new Array(N);
	for(i=0;i<N;i++){
		thePoints[i]=new point(0,0,0);
		theVelocities[i]=new point(0,0,0);
		theForces[i]=new point(0,0,0);
	}
	theGraph=new Array(N);
	for (i=0;i<N;i++)
		theGraph[i]=new Array(N);

	theOrder=new Array(N);
	for (i=0;i<N;i++)
		theOrder[i]=new Array(N);

	for (i=0;i<N;i++)
		for (j=0;j<N;j++){
			theGraph[i][j]=0;
			theOrder[i][j]=0;
			theOrder[i][i]=1;
		}
}

/**
 * Loads a poset from the HTML <form>.
 */
//function loadGraph(){
//	var i,j, x,y;
//
//	//get size
//	N = parseInt(theForm.nElements.value);
//	initializeArrays();
//	//get cover pairs
//	var coverText = theForm.covers.value;
//
//	//strip all non-digit characters and convert to an array
//	coverText=coverText.replace(new RegExp(/\D/g)," ");
//	coverText=coverText.replace(new RegExp(/^\s+/),"");
//	coverText=coverText.replace(new RegExp(/\s+$/),"");
//	a=coverText.split(/\s+/);
//	var l=a.length/2;
//
//	//load cover graph
//	for (i=0;i<l;i++){
//		x=2*i;
//		y=2*i+1;
//		theGraph[parseInt(a[x])][parseInt(a[y])]=1;
//		theOrder[parseInt(a[x])][parseInt(a[y])]=1;
//	}
//
//	//initial positions are random
//	for (i=0;i<N;i++)
//		thePoints[i].rand(N);
//
//	transitiveClosure();
//	bubbleSort();
//	findHeights();
//	findDepths();
//	findZs();
//	centerSingles();
//	improve=0;
//}


function myLoadGraph (n, pairs) {
	N = parseInt(n);
	initializeArrays();
	
	for (var i in pairs) {
		theGraph[parseInt(pairs[i][0])][parseInt(pairs[i][1])] = 1;
		theOrder[parseInt(pairs[i][0])][parseInt(pairs[i][1])] = 1;
	}
	
	for (var j = 0 ; j < N ; ++j)
		thePoints[j].rand(N);
	
	transitiveClosure();
	bubbleSort();
	findHeights();
	findDepths();
	findZs();
	centerSingles();
	improve = 0;
}

function myLoadAlad (alad)
{	
	var i;
	
	var preorder = alad.getPreorder();
	var classes = preorder.getEquivClasses();
	
	//alert (classes.length + ", " + classes.join('|'));
	
	var rep_to_class = [];
	for (i in classes)
		rep_to_class[classes[i][0]] = i;
	
	nodeLabels = [];
	var pairs = [];
	for (i in classes) {
		/* Obtain the successors of the players in the class. Use the first
		 * player as an representative. */
		var succs = preorder.getDirectSuccessorsOf(classes[i][0]);
		nodeLabels[i] = game.getClassName(game.getClassOfPlayer(classes[i][0]));
		for (var j in succs) {
			/* May create duplicate entries, >_I */
			pairs.push([rep_to_class[preorder.getEquivClassOf(succs[j])[0]], i]);
		}
	}
	
	//alert (pairs.join('|'));
	
	myLoadGraph (classes.length, pairs);
	
	recenter();
	drawGraph();
}


//function reload(){
//	loadGraph();
//	recenter();
//	drawGraph();
//	go();
//}

function drawScene(){
	//update if improve button clicked
		updatePoints();
	//draw only if a change has happened
	if (changed)	
		drawGraph();
}

//************************************************************/

var draw_lattice_interval = null;


function startImprove () {
	draw_lattice_interval = setInterval ('drawScene()', 10);
}

function stopImprove () {
	clearInterval (draw_lattice_interval);
}

function bodyInit() {
	var canvas = document.getElementById("aladCanvas");
	if (canvas.getContext) {
		theForm=document.getElementById("graphInputForm");
		//exampleForm=document.getElementById("exampleForm");
		theContext = canvas.getContext("2d");
		width=canvas.width;
		height=canvas.height;
		initProjectionMatrix();
	}
	else
		window.alert ("Missing canvas element for drawing lattices.");
}