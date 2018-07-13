
function BoolOrMod (left, right)
{
    this.kind = "or";
	  this.left = left;
	  this.right = right;
	  this.toString = function () { return "("+this.left+" OR "+this.right+")"; };
	  this.fold = function (visitor) { return visitor.foldOr(this.left, this.right); };
}

function JsonPrepVisitor ()
{
    this.foldOr = function (right, left) {return new BoolOrMod(right.fold(this), left.fold(this)); };
    this.foldAnd = function (right, left) {return new BoolAnd(right.fold(this), left.fold(this)); };
    this.foldVar = function (name) {return new BoolVar(name); };
}


