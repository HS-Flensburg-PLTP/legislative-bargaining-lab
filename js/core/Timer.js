/*
 * Timer.js
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


function Timer ()
{
	this._start = null, this._prev_reading = null;	
	this._readings = [];
	
	this.start = function () { this._start = (new Date()).getTime(); };
	this.restart = function () { this.start(); };
	this.ellapsed = function () { return (new Date()).getTime()-this._start; };
	
	this.takeReading = function (name) {
		var t;
		if (this._prev_reading === null)
			t = this.ellapsed();
		else
			t = (new Date()).getTime() - this._prev_reading;
		this._prev_reading = (new Date()).getTime();
		this._readings.push([name,t,this.ellapsed()]);
	};
	
	this.toString = function () {
		var s = "Readings:\n";
		var overall = this.ellapsed();
		for (var i in this._readings) {
			var cur = this._readings[i];
			var perc = cur[1] / overall; 
			
			s += "   " + (new Number(cur[1]/1000.0)).toFixed(1) + "s   "
				+"Ended after: "+(new Number(cur[2]/1000.0)).toFixed(1)+"s   "
				+"Share: "+(new Number(perc*100).toFixed(1))+"%   Mark \""+cur[0]+"\"\n";
		}
		s += "Overall time: "+(new Number(overall/1000.0)).toFixed(1)+"s\n";
		return s;
	};
}