/*
 * SimpleGame.js
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


/*!
 * Used to uniquely identify the player classes.
 * 
 * \note Private.
 */
var _simple_game_js_next_class_id = 0;


/*!
 * Returns a function which is the composite of all function passed in the
 * array. The functions are composed using Boolean conjunction.
 * 
 * \see func_compose_or
 */
function func_compose_and (arr)
{
	return function () {
		for (var i in arr)
			if ( !arr[i].apply(null,arguments))
				return false;
		return true;
	};
}


/*!
 * Returns a function which is the composite of all function passed in the
 * array. The functions are composed using Boolean conjunction.
 * 
 * \see func_compose_and
 */
function func_compose_or (arr)
{
	return function () {
		for (var i in arr)
			if ( arr[i].apply(null, arguments))
				return true;
		return false;
	};
}



/**
 * @class Trade
 * 
 * Trades can depend on each other. They are executed in the order they were
 * added.
 * 
 * For the trade to be a witness
 * 
 * @constructor
 */
function Trade (_coals, is_winning, game)
{
	this.coals = [];
	
	this._setFactory = function (arr) {
		var set = new HashSet(function(x){return parseInt(x,10);}, 
				function(x,y){ return parseInt(x,10) === parseInt(y,10); });
		set.addAll(arr);
		return set;
	};
	
	/**
	 * @tparam array coals Set of coalitions to start the trade with.
	 * @param is_winning Function which tests if a coalition is winning.
	 * Optional.
	 */
	for (var i in _coals) 
		this.coals.push(this._setFactory(_coals[i]));
	this.trades = [];
	this.is_winning = is_winning;
	
	this.result = null; /*!< use _getResult */
	
	/**
	 * @fn Trade::add
	 * 
	 * Adds a trade the coalition. The trade is:
	 *    "Move players from coalition with index 'from' to the coalition with
	 *     index 'to'."
	 * Indices of the coalitons correspond to the indices in the array passed
	 * to the constructor.
	 */
	this.add = function (players, from, to) {
		this.trades.push ([this._setFactory(players), from, to]);
	};
	
	// Exchange players S in from for players T in to.
	this.exchange = function (S, from, T, to) {
		this.add (S, from, to);
		this.add (T, to, from);
	};
	
	this._getResult = function () {
		if (null === this.result) {
			var i;
			this.result = [];
			
			for (i in this.coals) /* Copy the coalitions. */
				this.result.push(this.coals[i].clone());
			
			for (i in this.trades) {
				var t = this.trades[i];
				var players = t[0], from = t[1], to = t[2];
				
				if ( !players.isSubsetOf(this.result[from])) {
					throw "Players {"+players.values().join(",")+"} are not a subset of {"
						+this.result[from].values().join(",")+"} in trade "
						+"[{"+players.values().join(",")+"},"+from+","+to+"].";
				}
				
				if (!players.intersection(this.result[to]).isEmpty()) {
					throw "Players {"+players.values().join(",")+"} are not disjoint with dest."
						+"{"+this.result[to].values().join(",")+"} in trade "
						+"[{"+players.values().join(",")+"},"+from+","+to+"].";
				}
				
				/* There is nothing such as "removeAll" */
				var vals = players.values();
				for (i in vals) this.result[from].remove(vals[i]);
				this.result[to].addAll(vals);
			}
		}
		return this.result;
	};
	
	this._coalToString = function (coal) {
		if (game)
			return game.getNamedCoalStr(coal);
		else return "{"+coal.join(",")+"}";
	};
	
	this.toString = function () {
		var i,j = 0;
		var s = "__Trade:___ \n"
			+"    Coalitions :\n";
		for (i in this.coals) {
			s += "           ["+j+"]  "+this._coalToString(this.coals[i].values());
			if (this.is_winning)
				s += " (win? "+this.is_winning(this.coals[i].values())+")";
			s+="\n";
			j++;
		}
		s += "        Trades :\n";
		for (i in this.trades) {
			var t = this.trades[i];
			s += "             move "+this._coalToString(t[0].values())+" from ["+t[1]+"] to ["+t[2]+"]\n"; 
		}
		
		var result = this._getResult(); 
		s += "        Result :\n";
		j=0;
		for (i in result) {
			s += "           ["+j+"]  "+this._coalToString(result[i].values())+"";
			if (this.is_winning)
				s += " (win? "+this.is_winning(result[i].values())+")";
			s+="\n";
			j++;
		}
		return s;
	};
};


/**
 * @constructor
 */
function PlayerClass (m, name)
{
	this.m = m;
	this.name = name;
	this.id = ++_simple_game_js_next_class_id;
	
	this.getName = function () { return this.name; };
	this.getId = function () { return this.id; };
	this.getPlayerCount = function () { return this.m; };
	
	this.toString = function () {
		var name = this.name;
		if ( !name) name = "(Unknown)";
		return this.m + "x " + name + " (id="+this.id+")";
	};
}


/**
 * @constructor
 * 
 * \note Private.
 * 
 * \param name Name of the rule. Optional.
 */
function RuleWVG (name, game)
{
	this.name = name;
	this.game = game;
	
	this.quota = null;
	
	/* Default weights 0. */
	this.weights = []; /* Maps class IDs to weights. */
	
	// Initialize the weight of each class with 0.
	var classes = this.game.getPlayerClasses();
	for (var i in classes)
		this.weights[classes[i].getId()] = 0;
	
	this.mutable = true;
	
	this.getName = function () { return this.name; };
	
	/*!
	 * \param wp List containing pairs consisting of a class and a weight. 
	 */
	this.set2 = function (quota, wp) {
		this.setQuota (quota);
		for (var i in wp) {
			this.setWeightForClass (wp[i][0], wp[i][1]);
		}
	};
		
	this.setQuota = function (q) {
		if ( !this.mutable) throw "Rule is immutable.";
		else this.quota = q;
	};
	this.getQuota = function () { return this.quota; };
	
	this.qobdd = null;
	
	/*!
	 * Accepts integer numbers.
	 */
	this.setWeightForClass = function (c,w) {
		if ( !this.mutable)	throw "Rule is immutable.";
		else this.weights[c.getId()] = w;
	};

	this.getWeightForClass = function (c) { return this.weights[c.getId()]; };
	
	/*!
	 * Returns the weight of the i-th player.
	 */
	this.getWeightForPlayer = function (i) {
		return this.getWeightForClass(this.game.getClassOfPlayer(i));
	};
	
	this.getQOBDD = function () {
		this.mutable = false;
		
		if ( !this.qobdd) {
			var manager = this.game.getManager();
			this.qobdd = wvg_to_qobdd (this._toWVG(),
					this.game.getMaxNodes(),
					function(label,t,e) { return manager.ite(label,t,e); });
		}
		return this.qobdd;
	};
	
	
	this.toString = function () {
		return this._toWVG().toString();
	};


	/*!
	 * Returns a function which return true if the i-th player is NOT more
	 * desirable than the j-th player. Implements the \ref Rule interface.
	 */
	this.getIsNotGreaterFunc = function () {
		var thisObject = this;
		return function (i,j) { 
			return thisObject._isNotGreater.call(thisObject,i,j); 
		};
	};
	
	/*!
	 * Returns a function which return true if the i-th and j-th player are not
	 * equally desirable. Implements the \ref Rule interface.
	 */
	this.getAreNotEqualFunc = function () {
		var thisObject = this;
		return function (i,j) {
			return thisObject._areNotEqual.call(thisObject,i,j);
		};
	};
	
	/*!
	 * Returns a function which return true if the i-th and the j-th player
	 * are equal. Implements the \ref Rule interface.
	 */
	this.getAreEqualFunc = function () { 
		var thisObject = this;
		return function (i,j) { 
			return thisObject._areEqual.call(thisObject,i,j); 
		};
	};
	
	
	/**************************************************************************
	 *                             Private Operations                         *
	 *************************************************************************/
	
	/*!
	 * \note Private.
	 */
	this._toWVG = function () {
		var w_unordered = [], w = [];
		var classes = this.game.getPlayerClasses();
		var pi = this.game.getPlayerOrder();
		var n = this.game.getPlayerCount();
		
		/* Collect the weights for the players in the original order. */
		for (var i in classes) {
			var c = classes[i];
			var x = this.getWeightForClass (c);
			
			for (var j = 0 ; j < c.getPlayerCount() ; ++j) {
				w_unordered.push(x);
			}
		}
		
		/* Create the weights for the players in the final order using the
		 * permutation. */
		for (var i = 0 ; i < n ; ++i)
			w.push(w_unordered[pi[i]]);
		
		return new WVG(this.quota, w);
	};
	
	
	/*!
	 * Returns true if the i-th is NOT more desirable than the j-th player.
	 */
	this._isNotGreater = function (i,j) {
		/* Equality cannot be used here because when there are multiple rules
		 * and the weight in this rule is equal player i could have more weight
		 * in another rule. */
		return this.getWeightForPlayer(j) > this.getWeightForPlayer(i);
	};
	
	/*!
	 * Returns true if the players are not equally desirable.
	 */
	this._areNotEqual = function (i,j) { return false; };
	
	/*!
	 * Returns true if the players are equally desirable.
	 */
	this._areEqual = function (i,j) {
		return this.getWeightForPlayer(i) === this.getWeightForPlayer(j);
	};
};


/**
 * @constructor
 */
function RuleWVGFactory ()
{
	this.createRule = function (name, game) { return new RuleWVG (name, game); };
}

/**
 * @constructor
 */
function _Joiner (game)
{
	this.manager = game.getManager();
	this.game = game;
	
	this.foldVar = function (name) {
		return this.game.rules[name].getQOBDD();
	};
	this.foldAnd = function (G,H) { 
		var ret = this.manager.and(G.fold(this),H.fold(this));
		return ret;
	};
	this.foldOr = function (G,H) { 
		var ret = this.manager.or(G.fold(this),H.fold(this));
		return ret;
	};
}


/**
 * @class SimpleGame
 * 
 * Class to create and represent a simple game. This class builds the core
 * of the library. It allows an easy but powerful interface to analyze a
 * simple game.
 * 
 * @constructor
 */
function SimpleGame (manager)
{
	/**
	 * @ctor
	 * 
	 * @tparam QOBDD.Manager manager A manager for QOBDDs. Optional.
	 */
	
	this.n = 0; /*!< Number of players. */
	this.classes = [];
	this.classes_names = []; // class -> name
	this.rules = [];
	this.ruleCount = 0;
	this.pi = null;
	
	this.joinTree = null;
	
	this.maxNodes = Infinity;
	this.manager = null;
	
//	this.qobdd = null; /*!< Winning coalitions. */
//	this.qobdd_min = null; /*!< Minimal winning coalitions. */
//	this.qobdd_losing = null; /*!< Maximal losing coalitions. */
//	this.qobdd_max_losing = null; /*!< Maximal losing coalitions. */
//	this.qobdd_shift_min = null; /*!< Shift-minimal winning coalitions. */
//	this.qobdd_blocking = null; /*!< Blocking coalitions. */
//	
//	this.win_count = null; /*<! Number of winning coalitions. */
//	this.min_win_count = null; /*<! Number of minimal winning coalitions. */
//	this.shift_min_win_count = null; /*<! Number of shift-minimal winning coalitions. */
	
	/* Once the players were added the set of players becomes immutable. */
	this.players_mutable = true;

	this.rules_mutable = true;	

	/*
	 * The game is always passed as the first argument.
	 * 
	 * haveWinQOBDD
	 * haveMinWinQOBDD
	 * haveLosingQOBDD
	 * haveMaxLosingQOBDD
	 * haveShiftMinWinQOBDD
	 * haveShiftMaxLosingQOBDD
	 * haveBlockingQOBDD
	 * 
	 * havaAlad
	 * haveIsComplete
	 * haveIsDirected
	 * haveIsConsecutive
	 * haveIsHomogeneous
	 * haveIsWeighted
	 * haveIsProper
	 * haveIsStrong
	 * haveIsDecisive
	 * 
	 * haveDummies
	 * haveVetoers
	 * haveDictator
	 * 
	 * haveBanzhaf
	 * haveShapleyShubik
	 * haveHollerPackel
	 * haveDeeganPackel
	 * haveShiftPower
	 */
	this.observers = [];
	
	this._notifyObservers = function (op) {
		for (var i in this.observers)
			if (this.observers[i][op])
				this.observers[i][op](this);
	};
	
	/**************************************************************************
	 *                                 Operations                             *
	 *************************************************************************/
	
	this.registerObserver = function (o) {
		this.observers.push(o);
	};
	
	this.addPlayerClass = function (c) {
		if ( !this.players_mutable)
			throw "Player classes must not be added after adding the first rule.";
		
		//if ( !c.hasName()) {
			//c.setName(this.classes.length); /* 0-indexed */
		this.classes.push(c);
		if (c.getName())
			this.classes_names[c] = c.getName();
		else {
			var alt_name = "";
			if (c.getPlayerCount() > 1)
				alt_name = "Class " + this.classes.length;
			else alt_name = "Player " + (this.n+1) + " (Class " + this.classes.length+")";
			this.classes_names[c] = alt_name;
		}
		this.n += c.getPlayerCount();
	};
	
	this.getPlayerClasses = function () { return this.classes; };
	
	/**
	 * @fn SimpleGame::addPlayerClass
	 * 
	 * Returns the Name of the given class of players. If the class itself has
	 * no name, an alternative name is returned.
	 */
	this.getClassName = function (c) {
		return this.classes_names[c];
	};
	
	/*!
	 * Creates a rule using the given factory and returns it.
	 */
	this.createRule = function (ruleFactory, name) {
		if ( !this.rules_mutable)
			throw "Rules must not be added after the join description was set.";
		else {
			var rule = ruleFactory.createRule (name, this);
			
			var key = rule.getName();
			if ( !key) {
				/* For some reason, rules.length cannot be used here. */
				key = ++this.ruleCount; /* 1-indexed */
			}
			this.rules[key] = rule;
			return rule;
		}
	};
	
	this.getRules = function () {
		return this.rules;
	};
	
	/*!
	 * Set the join description of the game. If not set, all games are joined
	 * using the AND operator.
	 * 
	 * \param expr String containing a Boolean expression.
	 */
	this.setJoin = function (exprRaw) {
		this.rules_mutable = false;

		/* Remove all whitespaces (\t,\n,spaces). The parser cannot handle them. */
		var expr = exprRaw.replace (/\s*/g, '');
		
		this.joinTree = parser.parse(expr);
	};
	
	this.getJoin = function () {
		if ( !this.joinTree) {
			/* Create the default join tree. */
			var expr = null;
			for (var key in this.rules) {
				if (expr) expr += "&" + key;
				else expr = key.toString();
			}
			this.setJoin (expr);
		}
		return this.joinTree.toString();
	};
	
	/*!
	 * \param pi Permutation of the players. i-th player in the final game
	 *           is the pi[i]-th player in the original game. 
	 */
	this.setPlayerOrder = function (pi) {
		this.players_mutable = false;
		this.pi = pi;
	};
	
	this.getPlayerOrder = function (pi) {
		/* If there is no order, create the canonical order and return it */
		if ( !this.pi) {
			this.players_mutable = false;
			this.pi = [];
			for (var i = 0 ; i < this.n ; ++i)
				this.pi[i] = i; 
		}
		return this.pi;
	};
	
	/*!
	 * Returns the number of players in the game.
	 */
	this.getPlayerCount = function () { 
		return this.n;
	};
	
	
	this.player_names = null;
	
	/*!
	 * Returns the list of names for the players with respect to the ordering
	 * of the players.
	 */
	this.getPlayerNames = function () {
		if (null === this.player_names) {
			this.player_names = [];
			for (var i = 0 ; i < this.getPlayerCount() ; ++i)
				this.player_names.push(this.getClassName(this.getClassOfPlayer(i)));
		}
		return this.player_names;
	};
	
	/**
	 * 
	 */
	this.getNamedCoalStr = function (coal) {
		var map = [], c;
		for (var i in coal) {
			c = this.getClassOfPlayer(coal[i]);
			if (undefined === map[c])
				map[c] = 0;
			map[c] ++;
		}
		var ret = "";
		var first = true;
		for (c in map) {
			if (!first) ret += ", ";
			else first = false;
			if (map[c] > 1)
				ret += map[c] + "x";
			ret += this.getClassName(c);
		}
		return '{' + ret + '}';
	};
	
	/*!
	 * Returns the name of the i-th player with respect to the variable 
	 * ordering.
	 */
	this.getPlayerName = function (i) {
		return this.getPlayerNames()[i];
	};
	
	this.setManager = function (manager) {
		if (this.manager)
			throw "There is already a QOBDD.Manager.";
		else if ( manager.getVarCount() != this.n)
			throw "Given QOBDD.Manager has a different number of variables.";
		
		this.manager = manager;
	};
	
	this.getManager = function () {
		if ( !this.manager) {
			this.manager = new QOBDD.Manager (this.n);
		}
		return this.manager;
	};
	
	this.setMaxNodes = function (n) { this.maxNodes = n; };
	this.getMaxNodes = function () { return this.maxNodes; };
	
	/*!
	 * Returns the QOBDD of the winning coalition.
	 * 
	 * \deprecated Don't use in newly written code. Use \ref getWinQOBDD 
	 *             instead.
	 * 
	 * \see getWinQOBDD
	 * \see getMinWinQOBDD
	 */
	this.getQOBDD = function () { return this.getWinQOBDD(); };
	
	this.toString = function () {
		var i,k;
		var pi = this.getPlayerOrder();
		var max_in_line = 20;
		
		var s = "__Simple_Game:__\n"
			+"         #Players : " + this.n + "\n"
			+"  Players Classes : \n";
		for (i in this.classes)
			s += "\t\t" + this.classes[i] + "\n";
		
		s += "            Rules : \n";
		for (i in this.rules)
			s += "\t\t" + this.rules[i] + " (internal name: \""+i+"\")" + "\n";
		
		s += "             Join :\n"
			+"\t\t" + this.getJoin() + "\n";
		
		
		s += "     Player Order : (only non-trivial)\n"
			+"\t\t";
		for (i = 0, k = 0 ; i < this.n ; ++i) {
			if (pi[i] != i) {
				s += i + "->" + pi[i];
				if (k>0 && k % max_in_line == 0)
					s += "\n\t\t";
				else s += ", ";
				
				k++;
			}
		}
		if (0 == k) s += "(canonical order)";
		if (k == 0 || (k-1) % max_in_line != 0)	s += "\n";
		
		return s;
	};
	
	// TODO: Dazu muessten alle Regeln WVG Regeln sein.
/*	this.toParseable () {
		var s = "";
		if (this.rules.length > 1)
			s += "%join " + this.joinTree + "\n";
		
		for ()
	}*/
	
	
	this.alad = null;
	
	/*!
	 * Returns the at-least-as-desirable-relation for the game. The object
	 * is created only on request.
	 * 
	 * \note The advantage to let the \ref SimpleGame object manage the 
	 *       at-least-as-desirable-as relation is that the simple game can
	 *       provide additional information to the object when it is created.
	 */
	this.getAlad = function () {	
		if ( !this.alad) {
			var not_greater_funcs = [], not_equal_funcs = [], 
				equal_in_rule_funcs = [], equal_funcs = [];
			var thisObject = this;
			
			if (1 === this.ruleCount) {
				for (var i in this.rules) {
					not_greater_funcs.push(this.rules[i].getIsNotGreaterFunc());
					not_equal_funcs.push(this.rules[i].getAreNotEqualFunc());
					equal_in_rule_funcs.push(this.rules[i].getAreEqualFunc());
				}
			} 
			else {
				/* isNotGreaterEqual from the weights cannot be used if more
				 * than one rule is present. As an example consider the game
				 * [(2,3);(1,2),(1,1),(1,1),(0,2)] which has minimal winning
				 * coalitions AB, AC and BCD. Even though the weight of (0,2)
				 * in the second game is strictly greater than that of (1,1),
				 * (1,1) is more desirable than (0,2). For instance, in AB,
				 * B cannot be substituted by D but the only winning coalition
				 * without B which contains D is ACD and ACB is winning. */	
				
				for (var i in this.rules) {
					not_equal_funcs.push(this.rules[i].getAreNotEqualFunc());
					equal_in_rule_funcs.push(this.rules[i].getAreEqualFunc());
				}
			}
		
			/* Players in a common class are also equally desirable. This is
			 * covered by the other functions  */ 
			var same_class_func = function (i,j) {
				return thisObject.getClassOfPlayer.call(thisObject, i) 
					=== thisObject.getClassOfPlayer.call(thisObject, j);
			};
			equal_funcs.push (same_class_func);

			/* A pair of players has to be equally desirable in every rule in
			 * order to equally desirable in the game. */
			equal_funcs.push (func_compose_and(equal_in_rule_funcs));
			
			this.alad = new AtLeastAsDesirable (this.getManager(), 
					this.getWinQOBDD(),
					func_compose_or(not_greater_funcs),
					func_compose_or(not_equal_funcs),
					func_compose_or(equal_funcs));
			
			this._notifyObservers ('haveAlad');
		}
		return this.alad;
	};
	
	
	this.hasAlad = function () { return this.alad !== null; };
	
	
	this.is_hom = undefined; // null means maybe
	this.nat_repr = null; /*!< \ref WVG or null */
	this.sums = null;
	this.steps = null;
	
	/*!
	 * Returns true if the \ref SimpleGame is homogeneous, that is, if it has
	 * a weighted representation [Q;w1,..,wn] in which every minimal winning
	 * coalition has weight exactly Q.
	 * 
	 * \see getNaturalRepr
	 * \see SimpleGame.getSums
	 * \see SimpleGame.getSteps
	 */
	this.isHomogeneous = function () {
		if (undefined === this.is_hom) {
	
			if ( !this.isDirected()) {
				this.is_hom = null; // maybe
			}
			else  try {
				var n = this.getPlayerCount();
				var qobdd = this.getWinQOBDD();
				
				/* The maximum number of nodes of a QOBDD representing a
				 * directed and homogeneous simple game is (n^2+5n)/2. */
				if (qobdd.size() > (n*n + 5*n)/2) {
					this.is_hom = false;
				}
				else {
					var dummies = this.getDummyPlayers();
					var res = get_homogeneous_measure (n, qobdd, dummies.length);
					this.nat_repr = res[0];
					this.sums = res[1];
					this.steps = res[2];
					this.is_hom = true;
				}
			}
			catch (e) {
				if (e instanceof NotHomogeneous) {
					this.is_hom = false;
				} else throw e;
			}
			
			this._notifyObservers ('haveIsHomogeneous');
		}
		return this.is_hom;
	};
	
	
	/*!
	 * Returns the natural representation for the the \ref SimpleGame in case
	 * the game is homogeneous. See \ref isHomogeneous for details. The
	 * natural representation is defined in Ostmann (1987).
	 * 
	 * \see SimpleGame.isHomogeneous
	 * \see SimpleGame.getSums
	 * \see SimpleGame.getSteps
	 * 
	 * \return Returns null if the game is not homogeneous.
	 */
	this.getNaturalRepr = function () {
		if (this.isHomogeneous() === true) return this.nat_repr;
		else return null;
	};
	
	
	/*!
	 * If the game is homogeneous (\ref SimpleGame.isHomogeneous returns true),
	 * returns the set of sums in the game. A non-dummy player i is called sum
	 * if there is a minimal winning coalitions in which i can be replaced by
	 * some at most as desirable player j1,..,jk not in S such that the 
	 * resulting coalition is winning again.
	 * 
	 * \see SimpleGame.isHomogeneous
	 * \see SimpleGame.getNaturalRepr
	 * \see SimpleGame.getSteps
	 * 
	 * \return Returns null if the \ref SimpleGame.isHomogeneous returns false.
	 */
	this.getSums = function () {
		if (this.isHomogeneous() === true) return this.sums;
		else return null;
	};
	
	
	/*!
	 * If the game is homogeneous (\ref SimpleGame.isHomogeneous returns true),
	 * returns the set of steps in the game. A non-dummy player is called a
	 * step if it is not a sum.
	 * 
	 * \see SimpleGame.isHomogeneous
	 * \see SimpleGame.getNaturalRepr
	 * \see SimpleGame.getSums
	 * 
	 * \return Returns null if the \ref SimpleGame.isHomogeneous returns false.
	 */
	this.getSteps = function () {
		if (this.isHomogeneous() === true) return this.steps;
		else return null;
	};
	
	this.is_directed = null;
	
	/*!
	 * Returns true if the \ref SimpleGame is directed with respect to the
	 * given ordering of the players.
	 * 
	 * \see isComplete
	 */
	this.isDirected = function () {
		if (this.is_directed === null) {
			if ( !this.isComplete())
				this.is_directed = false;
			else {
				var order = this.getAlad().getNonIncrOrder ();
				
				this.is_directed = true;
				// 0 < 1 < ... < n-1?
				for (var i = 1 ; i < order.length ; ++i) {
					if ( ! (order[i-1] < order[i])) {
						this.is_directed = false;
						break;
					}
				}
			}
			
			this._notifyObservers ('haveIsDirected');
		}
		return this.is_directed;
	};
	
	
	this.is_complete = null;
	this.not_complete_witness = null;
	
	/*!
	 * Returns true if and only if the \ref SimpleGame is complete, that is,
	 * the at-least-as-desirable-as relation is total.
	 * 
	 * \see SimpleGame.getNotCompleteWitness
	 */
	this.isComplete = function () {
		if (this.is_complete === null) {	
			this.is_complete = this.getAlad().isTotal();
			this._notifyObservers ('haveIsComplete');
		}
		return this.is_complete;
	};
	
	
	/*!
	 * Synomym for \ref SimpleGame.isComplete .
	 */
	this.isSwapRobust = function () {
		return this.isComplete();
	};
	
	
	/*!
	 * If the game is not complete (\ref SimpleGame.isComplete returned false),
	 * returns a tuple (i,j,S,T) which is a witness for the game not to be
	 * complete. Here, S,T are winning coalitions, i,j are different players
	 * and it holds S-i+j and T-j+i are losing. Throws and exception if the
	 * game is complete.
	 * 
	 * \see SimpleGame.isComplete
	 */
	this.getNotCompleteWitness = function () {
		if (this.not_complete_witness === null) {
			if (this.isComplete())
				throw "The game is complete!";
			else {
				var incomp = this.getAlad().getNotTotalWitnesses();
				var i = incomp[0], j = incomp[1];
				var manager = this.getManager();
				var W = this.getWinQOBDD();
				
				var X_manip = new Without(manager, j, new Remove(manager, i));
				var Y_manip = new Without(manager, i, new Remove(manager, j));
				
				// TODO: Can this be simplified?
				
				// j not in S, S+i is winning, S+j is losing.
				var A = manager.minus_manip(W, X_manip, W, Y_manip);
				var S = A.getAnySet();
				S.push(i);
				
				// i not in T, T+j is winning, S+j is losing.
				var B = manager.minus_manip(W, Y_manip, W, X_manip);
				var T = B.getAnySet();
				T.push(j);
				
				this.not_complete_witness = [i,j,S,T];
			}
		}
		return this.not_complete_witness;
	};

	
	var that = this;
	
	/* Memoizer object that stores the result of functions we have already
	 * computed. */
	var memo = {};
	
	/**
	 * Creates a set of standard function for a QOBDD, for instance the QOBDD
	 * of the winnind or minimal winning coalitions. The methods are:
	 * 		- get<name>QOBDD  : Returns the QOBDD.
	 * 		- have<name>QOBDD : Returns TRUE if the QOBDD was computed, FALSE otherwise.
	 * 		- get<name>Count  : Number of minterms of the QOBDD.
	 * 		- get<name>Coals  : Returns the list of coalitions represented by the QOBDD.
	 * 		- enum<name>Coals  : Enumerates the coalitions represented by the QOBDD.
	 * 		- get<name>Models : Returns the list of models represented by the QOBDD.
	 * 		- get<name>ModelCount : Returns the number of models represented by the QOBDD.
	 * 	  	- enum<name>Models : Enumerates the models represented by the QOBDD.
	 * 
	 * @param name The name stub of the methods that are to be created.
	 * @param compQOBDDFunc A functions that returns the QOBDD. This function
	 * 	is called only once. The function is called by
	 *  @code
	 * 	 compQOBDDFunc.apply(that,arguments)
	 *  @endcode 
	 * 	such that the thos object points to the \ref SimpleGames object.
	 */
	function addQOBDDMethods (name, compQOBDDFunc) {
		var getQOBDD = function () {
			if (memo[name+'QOBDD'] === undefined) {
				memo[name+'QOBDD'] = compQOBDDFunc.apply(that,arguments);
				that._notifyObservers ('have'+name+'QOBDD');
			}
			return memo[name+'QOBDD'];
		};
		
		that['get'+name+'QOBDD'] = getQOBDD;
		that['have'+name+'QOBDD'] = function () { return memo[name+'QOBDD'] !== undefined; };
		
		that['get'+name+'Count'] = function () {
			if (undefined === memo[name+'Count']) {
				memo[name+'Count'] = getQOBDD().countMinterms();
				that._notifyObservers ('have'+name+'Count');
			}
			return memo[name+'Count'];
		};
		that['get'+name+'Coals'] = function () { return getQOBDD().getRoot().toSet(); };
		that['enum'+name+'Coals'] = function (f) {
			return getQOBDD().enumerateSets (that.getManager(), f);
		};
		
		that['get'+name+'Models'] = function () {
			if (that.isConsecutive ()) {
				if ( undefined === memo[name+'Models']) {
					var view = new MDDView (getQOBDD(), that.getAlad().getNumericTypeVector());
					var models = [];
					view.enumerateModels (that.getManager(), function (m) { models.push(m.slice(0)); });
					memo[name+'Models'] = models; 
					that._notifyObservers ('have'+name+'Models');
				}
				return memo[name+'Models'];
			}
			else {
				throw "SimpleGame.get"+name+"Models() not implemented for non-consecutive games.";
			}
		};
		that['enum'+name+'Models'] = function (f) {
			var view = new MDDView (getQOBDD(), that.getAlad().getNumericTypeVector());
			return view.enumerateModels(that.getManager(manager), f);
		};
		that['get'+name+'ModelCount'] = function () {
			if (that.isConsecutive ()) {
				if (undefined === memo[name+'ModelCount']) {
					var view = new MDDView (getQOBDD(), that.getAlad().getNumericTypeVector());
					memo[name+'ModelCount'] = view.countModels(); 
					that._notifyObservers ('have'+name+'ModelCount');
				}
				return memo[name+'ModelCount'];
			}
			else {
				throw "SimpleGame.get"+name+"ModelCount() not implemented for non-consecutive games.";
			}
		};
	};
	
	addQOBDDMethods ('Win', function () {
		/* Create the join-tree if not already done. This is a workaround. */
		this.getJoin();
		
		return this.joinTree.fold (new _Joiner(this));
	});
	
	addQOBDDMethods ('MinWin', function () {
		/* If we don't know if the game is complete we do not test that
		 * property because this should be more expensive in most 
		 * situations than using the slower way to compute the QOBDD for
		 * the minimal winning coalitions. */
		if (this.is_complete !== null && this.isDirected()) {
			return minwin_directed (this.getWinQOBDD(),this.getManager());
		}
		else {
			return minwin (this.getWinQOBDD(),this.getManager());
		}
	});
	
	addQOBDDMethods ('ShiftMinWin', function () {
		if (this.isHomogeneous()) {
			/* If the game is homogeneous, all minimal winning coalitions 
			 * are shift-minimal winning. */
			return this.getMinWinQOBDD();
		}
		else {
			return shift_min_win (this.getMinWinQOBDD(), this.getAlad(), this.getManager());
		}
	});
	
	addQOBDDMethods ('Blocking', function () {
		return blocking(this.getWinQOBDD(), this.getManager());
	});
	
	addQOBDDMethods ('Losing', function () {
		return losing (this.getWinQOBDD(), this.getManager());
	});
	
	addQOBDDMethods ('MaxLosing', function () {
		/* If we don't know if the game is complete we do not test that
		 * property because this should be more expensive in most 
		 * situations than using the slower way to compute the QOBDD for
		 * the maximal losing coalitions. */
		if (this.is_complete !== null && this.isDirected()) {
			return maxlosing_directed (this.getWinQOBDD(),this.getManager());
		}
		else return maxlosing (this.getWinQOBDD(),this.getManager());

	});
	
	addQOBDDMethods ('ShiftMaxLosing', function () {
		// Hom =?=> (shift-max losing = max losing) 
		return shift_max_losing (this.getMaxLosingQOBDD(), this.getAlad(), this.getManager());
	});
	
	
	this.player_to_class = null; /* player->class */
	
	/*!
	 * Returns the class of the i-th player. Throws an exception if no class
	 * can be found.
	 */
	this.getClassOfPlayer = function (i) {
		if (i < 0 || i >= this.n)
			throw "SimpleGame.getClassOfPlayer(i="+i+"): Player is out of bound.";
		else {
			if ( null === this.player_to_class) {
				this.player_to_class = [];
				for (var c in this.classes) {
					var m = this.classes[c].getPlayerCount();
					
					for (var k = 0 ; k < m ; ++k)
						this.player_to_class.push(this.classes[c]);
				}
			}
			return this.player_to_class[this.pi[i]];
		}
	};
	
	
	this.is_proper = null;
	this.not_proper_witness = null; /*!< wrt to the ordering of the players. */
	this.is_strong = null;
	this.not_strong_witness = null; /*!< wrt to the ordering of the players. */
	
	/*!
	 * Returns true exactly if the \ref SimpleGame is proper, that is, for
	 * each winning coalitions S, it holds that the complement N\S is losing,
	 * where N is the set of players.
	 * 
	 * \see SimpleGame.getNonProperWitness
	 * \see SimpleGame.getBlockingQOBDD
	 * \see SimpleGame.isStrong
	 * \see SimpleGame.isDecisive
	 */
	this.isProper = function () {
		if (null === this.is_proper) {
			var W = this.getWinQOBDD();
			/* proper <=> W \subseteq W^d, where W^d is the set of blocking
			 * coaltions. The computation of the QOBDD seems more expensive. */
			this.is_proper = leq_manip(W, new Ident(), W, new Compl(new Not()));
			this._notifyObservers ('haveIsProper');
		}
		return this.is_proper;
	};
	
	
	/*!
	 * If the \ref SimpleGame is not proper (\ref SimpleGame.isProper), returns
	 * a coalition that is a witness for the property not to hold. In this case
	 * a winning coalition is returned for which N\S is winning, where N is the
	 * set of players. If the game is proper, returns null.
	 * 
	 * \see SimpleGame.isProper
	 */
	this.getNotProperWitness = function () {
		if (this.isProper()) return null;
		else {
			if (null === this.not_proper_witness) {
				/* proper <=> W \subseteq W^d, where W^d is the set of blocking
				 * coaltions. From that, we can derive that any coalition in 
				 * W \cap (2^N \ W^d) is a counterexample for being proper. */
				
				/* TODO: The computation of the QOBDD could be avoided with a
				 *       little effort. */
				var W = this.getWinQOBDD();
				this.not_proper_witness 
					= this.getManager().and_manip(W, new Ident(), W, new Compl()).getAnySet();
			}
			return this.not_proper_witness;
		}
	};
	

	/*!
	 * Returns true exactly if the \ref SimpleGame is strong, that is, for
	 * each losing coalitions S, it holds that the complement N\S is winning,
	 * where N is the set of players.
	 * 
	 * \see SimpleGame.getBlockingQOBDD
	 * \see SimpleGame.isProper
	 * \see SimpleGame.isDecisive
	 */
	this.isStrong = function () {
		if (null === this.is_strong) {
			var W = this.getWinQOBDD();
			/* strong <=> W^d \subseteq W, where W^d is the set of blocking
			 * coaltions. The computation of the QOBDD seems more expensive. */
			this.is_strong = leq_manip(W, new Compl(new Not()), W, new Ident());
			this._notifyObservers ('haveIsStrong');
		}
		return this.is_strong;
	};
	
	
	/*!
	 * If the \ref SimpleGame is not strong (\ref SimpleGame.isStrong), returns
	 * a coalition that is a witness for the property not to hold. In this case
	 * a losing coalition is returned for which N\S is losing, where N is the
	 * set of players. If the game is strong, returns null.
	 * 
	 * \see SimpleGame.isStrong
	 */
	this.getNotStrongWitness = function () {
		if (this.isStrong()) return null;
		else {
			if (null === this.not_strong_witness) {
				/* strong <=> W^d \subseteq W, where W^d is the set of blocking
				 * coaltions. From that, we can derive that any coalition in 
				 * W^d \cap (2^N \ W) is a counterexample for being strong. */
				
				/* TODO: The computation of the QOBDD could be avoided with a
				 *       little effort. */
				var W = this.getWinQOBDD();
				this.not_strong_witness 
					= this.getManager().and_manip(W, new Compl(new Not()), 
							W, new Not()).getAnySet();
			}
			return this.not_strong_witness;
		}
	};
	
	
	this.is_decisive = null; /* this is only necessary for the observer */
	
	/*!
	 * Returns true exactly if the \ref SimpleGame is decisive, that is, it is
	 * proper and strong.
	 * 
	 * \see SimpleGame.getBlockingQOBDD
	 * \see SimpleGame.isProper
	 * \see SimpleGame.isStrong
	 */
	this.isDecisive = function () {
		if (null === this.is_decisive) {
			this.is_decisive = this.isProper() && this.isStrong();
			this._notifyObservers('haveIsDecisive');
		}
		return this.is_decisive;
	};
	
	
	/*!
	 * Returns true exactly if the given coalition is winning. The coalition
	 * has to be an array containing the players in the coalition, e.g. [1,3,4]
	 * for the players 1,3,4.
	 * 
	 * \note Running time O(n) if the QOBDD for the winning coalitions is
	 *       known. Calls \ref SimpleGame.getWinQOBDD.
	 */
	this.isWinningCoal = function (set) { return this.getWinQOBDD().isIn(set); };
	
	
	/*!
	 * Returns N \ S where N is the set of players and S is the set represented
	 * by the array in the parameter set. The values of set represent the 
	 * players.
	 */
	this.getComplementCoal = function (set) {
		var compl = [], ret = [];
		for (var i = 0 ; i < this.getPlayerCount() ; ++i) compl[i] = true;
		for (var i in set) compl[set[i]] = false;
		
		for (var i = 0 ; i < this.getPlayerCount() ; ++i)
			if (compl[i])
				ret.push(i);
		
		return ret;
	};
	
	
	this.dummies = null; /*!< Values are the dummy players' indices. */
	
	/*!
	 * Return the set of dummy players. For \ref SimpleGame.isDummy for 
	 * details. The set is returned as the values of an array. The players
	 * are ordered by decreasing indices with respect to the ordering on the
	 * players. For instance, [1,6,10] indicates that the 1st, 6th and 10th
	 * players are dummies.
	 * 
	 * \see SimpleGame.isDummyPlayer
	 */
	this.getDummyPlayers = function () {
		if (null === this.dummies) {
			this.dummies = this.getComplementCoal(this.getWinQOBDD().getSupport());
			this._notifyObservers('haveDictator'); // see its impl.
			this._notifyObservers('haveDummies');
		}
		return this.dummies;
	};
	
	
	/*!
	 * Returns true exactly if the given i-th player is a dummy player. A
	 * player is called \e dummy if it is not a member of any minimal winning
	 * coalition.
	 * 
	 * \see SimpleGame.getDummyPlayers
	 * 
	 * \note Running time is O(n) where n is the number of players if the
	 *       dummies are known. Otherwise traverses the QOBDD of the winning
	 *       coalitions.
	 */
	this.isDummyPlayer = function (i) {
		var dummies = this.getDummyPlayers();
		for (var k in dummies)
			if (i === dummies[k])
				return true;
		return false;
	};
	
	
	this.vetoer = null; /*! Values are the veto players' indices. */
	
	/*!
	 * Returns the indices of the veto players. For details see 
	 * \ref SimpleGame.isVetoPlayer.
	 * 
	 * \see SimpleGame.isVetoPlayer
	 */
	this.getVetoPlayers = function () {
		if (null === this.vetoer) {
			/* A player i is veto player <=> each node u with label i has 
			 * u.getElse()=0_{i+1}. For now, assume each player is a veto 
			 * player. */
			var is_veto = [];
			for (var i = 0 ; i < this.getPlayerCount() ; ++ i)
				is_veto[i] = true;
			
			var vetoerCount = this.getPlayerCount();
			
			/* Cache the 0_i nodes so we can access them as fast as possible. */
			var zeros = [];
			for (var i = 1 ; i < this.getPlayerCount() ; ++i)
				zeros[i] = this.getManager().getZero(i);
			
			this.getWinQOBDD().traverseInner(function(u) {
				var i = u.getVar();
				if (u.getElse() !== zeros[i+1]) {
					if (is_veto[i]) {
						is_veto[i] = false;
						vetoerCount --;
					}
					/* If we identified all players as non-veto player, stop.*/
					return vetoerCount > 0;
				}
				else return true; /* continue */
			});
			
			this.vetoer = [];
			for (var i = 0 ; i < this.getPlayerCount() ; ++i)
				if(is_veto[i]) this.vetoer.push(i);
			
			this._notifyObservers('haveVetoers');
		}
		return this.vetoer;
	};
	
	
	/*!
	 * Returns true if and only if the i-th players is a veto players. A player
	 * if called vetoer if it is a member of every winning coalition.
	 * 
	 * \see SimpleGame.getVetoPlayer
	 * 
	 * \note Running time is O(n) where n is the number of players if the
	 *       dummies are known. Otherwise traverses the QOBDD of the winning
	 *       coalitions.
	 */
	this.isVetoPlayer = function (i) {
		var vetoer = this.getVetoPlayers();
		for (var k in vetoer)
			if (i === vetoer[k])
				return true;
		return false;
	};
	
	
	/*!
	 * Returns true if there is a dicatator in the game. 
	 * \see SimpleGame.getDictator for details.
	 * 
	 * \see SimpleGame.getDictator
	 */
	this.hasDictator = function () { return null !== this.getDictator(); };
	
	
	/*!
	 * Returns the index of the dictator if there is one and \e null otherwise.
	 * A player i is called dictator if {i} is the only minimal winning 
	 * coalition. There is at most one dictator.
	 * 
	 * \see SimpleGame.hasDictator
	 * 
	 * \return Returns the index of the dictator or null if there is no 
	 *         dictator.
	 */
	this.getDictator = function () {
		/* There is a dictator <=> there are n-1 dummies where n is the number
		 * of players. If so, the only non-dummy player is the dictator. */
		var dummies = this.getDummyPlayers();
		if (dummies.length === this.getPlayerCount()-1)
			return this.getComplementCoal(dummies)[0];
		else return null;
	};

	
	this.abs_hp = null;
	this.norm_hp = null;
	
	/*!
	 * Returns an array arr where arr[i], i=0,..,n-1 is the absolute 
	 * Holler-Packel index of the i-th player with respect to the variable
	 * ordering.
	 * 
	 * \see SimpleGame.getNormHollerPackel
	 */
	this.getAbsHollerPackel = function () {
		if (this.abs_hp === null) {
			var W_min = this.getMinWinQOBDD();
			var count = this.getMinWinCount();
			var count_with_player = W_min.countMintermsContainingVar();
			
			this.abs_hp = [];
			for (var i = 0 ; i < this.getPlayerCount() ; ++i)
				this.abs_hp[i] = count_with_player[i] / count;
			
			this._notifyObservers('haveHollerPackel');
		}
		return this.abs_hp;
	};
	
	
	/*!
	 * Returns an array arr where arr[i], i=0,..,n-1 is the normalized 
	 * Holler-Packel index of the i-th player with respect to the variable
	 * ordering.
	 */
	this.getNormHollerPackel = function () {
		if (this.norm_hp === null) {
			var abs_hp = this.getAbsHollerPackel();
			var n = this.getPlayerCount();
			this.norm_hp = [];
			var sum = 0.0;
			for (var i = 0 ; i < n ; ++i)
				sum += abs_hp[i];
			for (var i = 0 ; i < n ; ++i)
				this.norm_hp[i] = this.abs_hp[i] / sum;
		}
		return this.norm_hp;
	};
	
	
	this.abs_bz = null;
	this.norm_bz = null;
	
	/*!
	 * Returns an array arr where arr[i], i=0,..,n-1 is the absolute 
	 * Banzhaf index of the i-th player with respect to the variable
	 * ordering.
	 * 
	 * \see SimpleGame.getNormBanzhaf
	 */
	this.getAbsBanzhaf = function () {
		if (this.abs_bz === null) {
			var W = this.getWinQOBDD();
			var swings_for_player = W.countSwingingMinterms();
			var n = this.getPlayerCount();
			var denom = Math.pow(2,n-1);
			
			this.abs_bz = [];
			for (var i = 0 ; i < n ; ++i)
				this.abs_bz[i] = swings_for_player[i] / denom;
			
			this._notifyObservers('haveBanzhaf');
		}
		return this.abs_bz;
	};
	
	
	/*!
	 * Returns an array arr where arr[i], i=0,..,n-1 is the normalized 
	 * Banzhaf index of the i-th player with respect to the variable
	 * ordering.
	 * 
	 * \see SimpleGame.getAbsBanzhaf
	 */
	this.getNormBanzhaf = function () {
		if (this.norm_bz === null) {
			var abs_bz = this.getAbsBanzhaf();
			var n = this.getPlayerCount();
			this.norm_bz = [];
			var sum = 0.0;
			for (var i = 0 ; i < n ; ++i)
				sum += abs_bz[i];
			for (var i = 0 ; i < n ; ++i)
				this.norm_bz[i] = this.abs_bz[i] / sum;
		}
		return this.norm_bz;
	};
	
	
	this.dp = null;
	
	/**
	 * @fn SimpleGame::getDeeganPackel
	 * 
	 * Computes the Deegan-Packel indices of all players and returns them as an
	 * array.
	 */
	this.getDeeganPackel = function () {
		if (this.dp === null) {
			this.dp = deegan_packel (this.getMinWinQOBDD());
			this._notifyObservers('haveDeeganPackel');
		}
		return this.dp;
	};
	
	
	this.ss = null;
	
	/**
	 * @fn SimpleGame::getShapleyShubik
	 * 
	 * Computes the Shapley-Shubik indices of all players and returns them as
	 * an array.
	 */
	this.getShapleyShubik = function () {
		if (this.ss === null) {
			this.ss = shapley_shubik (this.getWinQOBDD());
			this._notifyObservers('haveShapleyShubik');
		}
		return this.ss;
	};
	
	
	this.shift_power = null;
	
	/*!
	 * Returns an array arr where arr[i], i=0,..,n-1 is the Shift Power index
	 * of the i-th player with respect to the variable ordering.
	 */
	this.getShiftPower = function () {
		if (this.shift_power === null) {
			var s = this.getShiftMinWinQOBDD().countMintermsContainingVar();
			var sum = accumulate (s,0);
			
			this.shift_power = [];
			for (var i = 0 ; i < this.getPlayerCount() ; ++i)
				this.shift_power[i] = s[i] / sum;
			
			this._notifyObservers('haveShiftPower');
		}
		return this.shift_power;
	};
	
	/**
	 * @fn SimpleGame::equals
	 * Compares two simple games.
	 * 
	 * @tparam SimpleGame other Simple game to compare with.
	 * @treturn bool Returns true if and only if both simple games are equal,
	 * that is, they their QOBDDs for the winning coalitions are equal.
	 */
	this.equals = function (other) {
		return this.getWinQOBDD().equals(other.getWinQOBDD());
	};
	
	
	this.is_weighted = undefined; // true, null (maybe) or false.
	this.not_weighted_witness = null; // A trade.
	this.weights = null;
	
	/**
	 * @fn SimpleGame::isWeighted
	 * Test the simple game to be a weighted voting game.
	 * 
	 * @return Returns true if the game is weighted, false if not and null if
	 * it cannot easily determined.
	 */
	this.isWeighted = function () {
		if (undefined === this.is_weighted) {
			var thisObject = this;
			this.is_weighted = null; /* maybe */
			
			if (1 === this.ruleCount) {
				var rule; 
				for(var key in this.rules) { rule = this.rules[key]; break; }
				if (rule instanceof RuleWVG) {
					this.is_weighted = true;
					this.weights = [];
					for (var i = 0 ; i < this.getPlayerCount() ; ++i)
						this.weights.push(rule.getWeightForPlayer(i));
				}
			}
			
			if (this.is_weighted === null && true === this.isHomogeneous()) {
				this.is_weighted = true;
				this.weights = this.getNaturalRepr().weights;
			}
			
			if (null === this.is_weighted) {
				if ( !this.isComplete()) {
					var witness = this.getNotCompleteWitness();
					var trade = new Trade ([witness[2], witness[3]], function (S) {
						return thisObject.isWinningCoal.call (thisObject, S);
					}, this);
					trade.exchange ([witness[0]], 0, [witness[1]], 1);
					this.not_weighted_witness = trade;
					this.is_weighted = false;
				}
				else {
					var manager = game.getManager();
					var W = game.getWinQOBDD();
					var ret = W.areLevelsTotallyOrdered();
					
					if (ret !== true) {
						var n = game.getPlayerCount();
						var u = ret[1], v = ret[2];
						
						var root_u = W.getAnySetToNode(u);
						var root_v = W.getAnySetToNode(v);
						
						var up = new QOBDD(n, manager.minus_raw(u,v), manager).getAnyPath();
						var vp = new QOBDD(n, manager.minus_raw(v,u), manager).getAnyPath();			
						
						var S = root_u.concat(QOBDD.pathToSet(up));
						var T = root_v.concat(QOBDD.pathToSet(vp));
						
						var diff1 = [], diff2 = [];
						for (i = 0 ; i < n ; ++i) {
							if (up[i] && !vp[i]) diff1.push(i);
							else if (!up[i] && vp[i]) diff2.push(i);
						}
						
						var trade = new Trade ([S,T], function (S) {
							return thisObject.isWinningCoal.call (thisObject, S);
						}, this);
						trade.exchange (diff1, 0, diff2, 1);
						this.not_weighted_witness = trade;
						this.is_weighted = false;
					}
				}
			}
			
			this._notifyObservers ('haveIsWeighted');
		}
		return this.is_weighted;
	};
	
	
	/**
	 * @fn SimpleGame::getNotWeightedWitness
	 * 
	 * Returns a witness that proves the simple game not weighted in case
	 * \ref SimpleGame::isWeighted returned false. If not an exception is
	 * thrown.
	 * 
	 * The witness is an arbitrary \ref Trade object.
	 * 
	 * @treturn Trade Returns a trade that proves the game not weighted.
	 */
	this.getNotWeightedWitness = function () {
		if ( false === this.isWeighted()) return this.not_weighted_witness;
		else throw "SimpleGame.isWeighted() did not return false.";
	};
	
	
	/**
	 * @fn SimpleGame::getWeights
	 *
	 * In case this.isWeighted() returned true, returns the game's weights if
	 * they are none. If not, returns null. The weights are ordered with
	 * respect to the variable ordering.
	 */
	this.getWeights = function () {
		if (this.isWeighted()) return this.weights;
		else return null;
	};	
	
	
	/**
	 * @fn SimpleGame::isConsecutive
	 * 
	 * A simple game is consecutive if symmetric players i<j there is no
	 * player k such that i,k are not symmetric and i<k<j. Another definition
	 * is, that for each class S of symmetric players it holds
	 * @\f[
	 * \{\min(S),\ldots,\max(S)\} = S\.
	 * @f]
	 * 
	 * \see is_consecutive
	 */
	this.isConsecutive = (function() {
		var notified = false;
		return function () {
			if ( !notified) {
				notified = true;
				this._notifyObservers('haveIsConsecutive');
			}				
			return is_consecutive (this.getAlad().getTypeVector());
		};
	}());
}


/**
 * @class ParserException
 * 
 * @ctor
 */
function ParserException (msg)
{
	this.msg = msg;
	this.toString = function () { return this.msg; };
}


/**
 * @func parse_mwvg_lines
 * 
 * Parses the given string as a multiple weighted voting game. The parser calls
 * the callback functions passed in the builder object if a corresponding line
 * has been parsed. Line types are: empty lines, comment lines, command
 * lines, the line containing the quotas and the lines for the classes of
 * players. No error handling is performed!
 * 
 * See the following snippet for an example how the builder is used. For an
 * application see @ref parse_mwvg.
 * 
 * @code
var builder = {
    onEmptyLine : function (l) { console.log("empty line: '" + l + "'\n"); },
    onCommentLine : function (l) { console.log("comment: '" + l + "'\n"); },
    onCommandLine : function (l) { console.log("command: '" + l + "'\n"); },
    onQuotasLine : function (l) { console.log("quotas: '" + l + "'\n"); },
    onPlayerClassLine : function (l) { console.log("player class: '" + l + "'\n"); },
};

parse_mwvg_lines(document.getElementById('input').value, builder);
 * @endcode
 * 
 * @see parse_mwvg
 * @see parse_mwvg_objects
 * 
 * @note Carriage return characters are removed from the lines. The lines do
 * not contain the trailing newline character.
 * 
 * @param builder Object which holds the callback functions. May be null or
 * undefined. Any of the callback functions may be undefined. The callback
 * functions are: onEmptyLine, onCommentLine, onCommandLine, onQuotasLine,
 * onPlayerClassLine. The line is passed as the first argument and the line
 * count (1-indexed) as the second argument.
 */
function parse_mwvg_lines (s, builder)
{
	if (typeof(builder) !== 'object') {
		builder = {};
	}
	
	var comment_patt = /^\s*#/;
	var command_patt = /^\s*%\s*([a-zA-Z0-9_-]+)\s*([^\n]*)/;
	var empty_line_patt = /^\s*$/;
		
	var haveQuotas = false;
	
	var lines = s.split ("\n");
	for (var i = 0 ; i < lines.length ; ++i) {
		/* Remove any carriage-returns. */
		var l = lines[i].replace(/\r/g, '');
		
		if (empty_line_patt.test(l)) {
			if (builder.onEmptyLine) builder.onEmptyLine(l, i+1);
			continue;
		}
		else if (comment_patt.test (l)) {
			if (builder.onCommentLine) builder.onCommentLine(l, i+1);
			continue;
		}
		else {			
			if (command_patt.exec (l)) {
				if (builder.onCommandLine) builder.onCommandLine(l, i+1);
			}
			else if (! haveQuotas) {
				haveQuotas = true;
				if (builder.onQuotasLine) builder.onQuotasLine(l, i+1);
			}
			else /* class of players */ {
				if (builder.onPlayerClassLine) builder.onPlayerClassLine(l, i+1);
			}
		}
	}
}


/**
 * @func parse_mwvg_objects
 * 
 * Parses the given string as a multiple weighted voting game. The parser calls
 * the callback functions passed in the builder object if a corresponding line
 * and/or object has been parsed. Line types are: empty lines, comment lines, 
 * command lines, the line containing the quotas and the lines for the classes
 * of players. Objects are commands, the quotas (exactly once) and the classes
 * of players.
 * 
 * Error handling is performed. In case of an error an exception of type
 * ParserException is thrown.
 * 
 * See the following snippet for an example how the builder is used. For an
 * application see @ref parse_mwvg.
 * 
 * @code
var builder = {
		onEmptyLine : function (l) { console.log("empty line: '" + l + "'\n"); },
		onCommentLine : function (l) { console.log("comment: '" + l + "'\n"); },
		onCommandLine : function (l) { console.log("command line: '" + l + "'\n"); },
		onCommand : function (name,value) { console.log("command: '"+name+"' => '"+value+"'\n"); },
		onQuotasLine : function (l) { console.log("quotas line: '" + l + "'\n"); },
		onQuotas : function (quotas) { console.log("quotas: " + quotas + "\n"); },
		onPlayerClassLine : function (l) { console.log("player class line: '" + l + "'\n"); },
		onPlayerClass : function (mult, weights, name) { console.log("player class: mult="+mult+", weight="+weights+", name='"+name+"'\n"); },
};

parse_mwvg_objects(document.getElementById('input').value, builder);
 * @endcode
 * 
 * @see parse_mwvg
 * 
 * @note Carriage return characters are removed from the lines. The lines do
 * not contain the trailing newline character.
 * 
 * @param builder Object which holds the callback functions. May be null or
 * undefined. Any of the callback functions may be undefined. The callback
 * functions are: onEmptyLine, onCommentLine, onCommandLine, onQuotasLine,
 * onPlayerClassLine. The line is passed as the first argument and the line
 * count (1-indexed) as the second argument. The the objects the callbacks
 * are:
 *    * onCommand(name,value)
 *    * onQuotas(quotas) where quotas is the array of quotas.
 *    * onPlayerClass(mult,weights,name) where 'mult' is the multiplicity,
 *      weights is the array of weight and name is the class' name. If a class
 *      has no name, undefined is passed for the name.
 * The callbacks for the objects are called _after_ the callbacks for the
 * lines.
 */
function parse_mwvg_objects (s, builder)
{
	if (typeof(builder) !== 'object') {
		builder = {};
	}	
	
	var command_patt = /^\s*%\s*([a-zA-Z0-9_-]+)\s*([^\n]*)/;
	var mult_patt = /^\s*x(\d+)/g; // Without g modifier, lastIndex is invalid.
	var name_patt = /\s+([^\n]+)/;
	var weight_patt = /\d+/g; // Without g modifier, lastIndex is invalid.
	
	var quotas = [];

	var myBuilder = {
		onEmptyLine : function (l, lineNo) { if (builder.onEmptyLine) builder.onEmptyLine(l,lineNo); },
		onCommentLine : function (l, lineNo) { if (builder.onCommentLine) builder.onCommentLine(l,lineNo); },
		onCommandLine : function (l, lineNo) {
			var match;
			
			if ((match = command_patt.exec (l))) {
				if (builder.onCommandLine) builder.onCommandLine (l, lineNo);
				if (builder.onCommand) builder.onCommand (match[1], match[2]);
			}
		},
		onQuotasLine : function (l, lineNo) {
			if ( quotas.length == 0) {
				/* First non-comment line has to be the quotas. Also determines
				 * the number of rules in the game. Remove the trailing white-
				 * spaces and then split the line. */
				var tmp = l.replace(/^\s+/, '').split(/\s+/);
				if ( !tmp || tmp.length == 0)
					throw new ParserException("In line "+(i+1)+". Expected quotas, got \""+tmp+"\".");
				
				for (var k in tmp) {
					var q = parseInt(tmp[k],10);
					if (isNaN(q)) {
						throw new ParserException('Integer number excepted as '+(parseInt(k,10)+1)
								+'-th quota. Got "'+tmp[k]+'" instead.');
					}
					quotas.push(q);
				}
				
				if (builder.onQuotasLine) builder.onQuotasLine (l, lineNo);
				if (builder.onQuotas) builder.onQuotas (quotas);
			}
		},
		onPlayerClassLine :  function (l,lineNo) {
			var mult = 1, weights = [], name = undefined;
			var tmp;
			var match;
			
			/* Reset the pattern and try to parse the multiplicity. */
			mult_patt.lastIndex = 0;
			if ((match = mult_patt.exec(l))) {
				mult = parseInt(match[1],10);
				l = l.slice (mult_patt.lastIndex);
			}
			
			/* Reset the pattern and parse the weights. */
			weight_patt.lastIndex = 0;
			for (var k = 0 ; k < quotas.length; ++k) {
				tmp = weight_patt.exec(l);
				if (tmp === null)
					throw new ParserException("Missing "+(k+1)+"-th weight on line "+(i+1)+".");
				weights.push (parseInt(tmp,10));
			}
			
			match = name_patt.exec(l.slice(weight_patt.lastIndex));
			if (match) {
				name = match[1];
			}
			
			if (builder.onPlayerClassLine) builder.onPlayerClassLine(l,lineNo);
			if (builder.onPlayerClass) builder.onPlayerClass(mult,weights,name);
		}
	};
	
	parse_mwvg_lines (s, myBuilder);
	
	if ( !quotas) {
		throw new ParserException("Missing quotas.");
	}
}


/**
 * @func parse_mwvg
 * 
 * Parses the given game description as a string and returns the simple game.
 * In case of an error, an exception of type ParserException is thrown.
 */
function parse_mwvg (s)
{
	/* Command names are used as the keys. To avoid conflict with internal
	 * functions such as "join", each command name is preceded by "__"
	 * (double underscore). */
	var cmds = [];
	
	var quotas = [];
	
	var game = new SimpleGame ();
	var n = 0; // number of players
	var classes = [];
	var class_info = []; // { name, first, last, mult }
	var class_weights = [];
	
	var builder = {
		onCommand : function (name, value) {
			var key = "__"+name;
			if ( !cmds[key])
				cmds[key] = [];
			cmds[key].push(value);
		},
		onQuotas : function (_quotas) {
			quotas = _quotas;
		},
		onPlayerClass :  function (mult, weights, name) {		
			class_info.push ({ name: name, mult: mult, first: n, last: n+mult-1 });
			n += mult;
			
			classes.push(new PlayerClass(mult,name));
			game.addPlayerClass(classes[classes.length-1]);
			
			/* Store the weights for the class so we can add them after we 
			 * added all classes. */
			class_weights.push(weights);
		}
	};
	
	parse_mwvg_objects (s, builder);
	
	/* Add the rules to the game. */
	var ruleCount = quotas.length;
	var factory = new RuleWVGFactory ();
	for (var i = 0 ; i < ruleCount ; ++i) {
		var rule = game.createRule(factory);
		rule.setQuota (quotas[i]);
		for (var k = 0 ; k < classes.length ; ++k)
			rule.setWeightForClass (classes[k], class_weights[k][i]);
	}
	
	/* Set the join description if there is one. Replace occurences of 'AND'
	 * and 'OR' by '&' and '|' respectively. */
	var joins = cmds["__join"];
	if (joins) {
		// Use the last appearance.
		var s = joins[joins.length-1].replace(/AND/gi,"&").replace(/OR/gi,"|");
		game.setJoin(s);
	}
	
	// Find an element in an array using the given equality function f.
	var find = function (arr, f) { 
		for(var i=0; i<arr.length; i++)
			if (f(arr[i])) return arr[i];
		return null;
	};
	
	/* Set the position of the players mentioned in the input. All remaining
	 * players are seated as they are. */
	var placeCmds = cmds["__place"];
	if (placeCmds) {
		// "%place <position> <class-name>" and
		// "%place <position> #<id>", where <position> and <id> are 1-indexed.
		var name_pat = /^(\d+)\s+(.+)/, id_pat = /^(\d+)\s+\#(\d+)/;
		
		var unplaced = []; // player id -> {true,false}
		for (i = 0 ; i < n ; ++i)
			unplaced[i] = true;
		
		/* Parse all commands */
		var places = []; // [pos(0-indexed), id]
		for (var p in placeCmds) {
			var curCmd = placeCmds[p];
			
			if ((match = id_pat.exec(curCmd))) {
				var i = parseInt(match[2],10)-1;
				places.push ([parseInt(match[1],10)-1, i]);
				unplaced[i] = false;
			}
			else if ((match = name_pat.exec(curCmd))) {
				var pos0 = parseInt(match[1],10) - 1;
				var name = match[2];
				var c = find (class_info, function (x) { return x.name === name; });
				if ( !c)
					throw new ParserException('There is no class/player with name "'+name+'". Command was "%place '+curCmd+'".');
				else {
					/* Place all players in that class */
					for (k = 0 ; k < c.mult ; ++k) {
						i = c.first+k;
						places.push ([pos0+k, i]);
						unplaced[i] = false;
					}
				}
			}
			else throw new ParserException("Invalid 'place' command: \"%place "+curCmd+"\". It should have the form " +
					"\"%place <position> <name>\" or \"%place <position> #<id>\".");
		}
		
		/* Sort the places decreasingly, so we can sort in the remaining
		 * player efficiently. */
		places.sort (function (a,b) { return a[0] - b[0]; });
		
		/* Insert unplaced players by the order in which they appeared in 
		 * the input. */
		var pi = [], pos;
		places.push ([Infinity, null]); // makes life easier.
		for (pos = 0, k = 0, i = 0 ; pos < n ; ++pos) {
			for ( ; i < n && pos < places[k][0]; ++i) {
				if (unplaced[i]) pi[pos++] = i;
				else continue;
			}
			if (k < n)
				pi[pos] = places[k++][1];
		}
		
		game.setPlayerOrder(pi);
	}
	
	return game;
}


/**
 * Renames the classes of players in the given multiple weighted voting game.
 * The players are renamed in accordance with given callback function. That is,
 * for the i-th class of players (0-indexed), the return value of renameFunc is
 * used as its new name.
 * 
 * @param s The string of the multiple weighted voting game.
 * @param renameFunc Callback function. Has to return the new name of the i-th
 * class of players (0-indexed). Can return undefined in which case no name is
 * used. 
 * @returns {String} Returns the new description of the game.
 */
function renamePlayerClasses (s, renameFunc)
{
	var buf = '';
	var playerNo = 0; // 0-indexed

	function println (s) { buf += s + '\n'; }

	var builder = {
			onEmptyLine : function (l, lineNo) { println(l); },
			onCommentLine : function (l, lineNo) { println(l); },
			onCommandLine : function (l, lineNo) { println(l); },
			onQuotasLine : function (l, lineNo) { println(l); },
			onPlayerClass :  function (mult,weights,name) {
				var line = '';

				if (mult > 1) line += 'x'+mult + ' ';
				line += weights.join(' ');
				var name = renameFunc(playerNo);
				if (undefined !== name) {
					line += ' ' + renameFunc(playerNo);
				}
				playerNo ++;

				println (line);
			}
	};

	parse_mwvg_objects (s, builder);

	return buf;
}