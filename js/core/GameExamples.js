/*
 * GameExamples.js
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

example_games = [];

  example_games["candconst1995"] = {
    name: "The System to Amend the Canadian Constitution (1995)",
    input: "# System to Amend the Canadian Constitution\n#    from \"Mathematics and Politics\", Taylor, 1995, Springer.\n#\n7 50\n1 34 Ontario\n1 29 Quebec\n1 9 British Columbia\n1 7 Alberta\n1 5 Saskatchewan\n1 5 Manitoba\n1 4 Nova Scotia\n1 3 New Brunswick\n1 3 Newfoundland\n1 1 Prince Edward Island\n"
    };
  example_games["candconst2008"] = {
	name: "The System to Amend the Canadian Constitution (2008)",
	input: "# System to Amend the Canadian Constitution\n#    from \"Mathematics and Politics\", Taylor & Pacelli, 2008, Springer, p. 50.\n#\n7 50\n1 39 Ontario\n1 23 Quebec\n1 13 British Columbia\n1 11 Alberta\n1 4 Manitoba\n1 3 Saskatchewan\n1 3 Nova Scotia\n1 2 New Brunswick\n1 2 Newfoundland\n1 0 Prince Edward Island\n"
	};
  example_games["catparl2010"] = {
    name: "Parliament of Catalonia (2010)",
    input: "# Parliament of Catalonia (2010)\n#\n# See http://en.wikipedia.org/wiki/Parliament_of_Catalonia\n#\n# Total number of votes: 135\n#\n68\n48 CiU\n37 PSC-CpC\n21 ERC\n14 PP\n12 ICV-EUiA\n3 C'S\n#\n# CiU:      Convergence and Union\n# PSP-CpC:  Socialists' Party of Catalonia\n# ERC:      Republican Left of Catalonia\n# PP:       People's Party\n# ICV-EUiA: Initiative for Catalonia Greens\n# C'S:	    "
    };
  example_games["dpnonmonexpl"] = {
    name: "Demonstrates non-monotonicity of the Deegan-Packel Index",
    input: "# Demonstrates non-monotonicity of the Deegan-Packel Index.\n# From: Forming Coalitions and Measuring Voting Power\n# Author: Manfred J. Holler\n# Year: 1982\n# Page(s): 263\n#\n51\n   35 Most Powerful\n   20 Least Powerful\nx3 15 Second most Powerful\n#\n# Indices should be 18/60, 9/60 and 11/60."
    };
  example_games["uselectcoll1960"] = {
    name: "Electoral College (United States, 1960)",
    input: "# Electoral College (United States, 1960)\n#\n# See http://en.wikipedia.org/wiki/Electoral_College_%28United_States%29\n# \n270\n43 New York\n40 California\n29 Pennsylvania\n26 Ohio\n26 Illinois\n25 Texas\n21 Michigan\n17 New Jersey\n14 Florida\n14 Massachusetts\n13 North Carolina\n13 Indiana\n12 Georgia\n12 Wisconsin\n12 Virginia\n12 Missouri\n11 Tennessee\n10 Maryland\n10 Louisiana\n10 Alabama\n10 Minnesota\n9 Iowa\n9 Washington\n9 Kentucky\n8 Oklahoma\n8 South Carolina\n8 Connecticut\n7 West Virginia\n7 Mississippi\n7 Kansas\n6 Colorado\n6 Oregon\n6 Arkansas\n5 Arizona\n5 Nebraska\n4 New Hampshire\n4 North Dakota\n4 Hawaii\n4 Idaho\n4 Montana\n4 South Dakota\n4 Rhode Island\n4 Utah\n4 New Mexico\n4 Maine\n3 Alaska\n3 Nevada\n3 Wyoming\n3 Vermont\n3 Delaware\n3 District of Columbia\n"
    };
  example_games["uselectcoll1990"] = {
    name: "Electoral College (United States, 1990)",
    input: "# Electoral College (United States, 1990)\n#\n# See http://en.wikipedia.org/wiki/Electoral_College_%28United_States%29\n# \n270\n54 California\n33 New York\n32 Texas\n25 Florida\n23 Pennsylvania\n22 Illinois\n21 Ohio\n18 Michigan\n15 New Jersey\n14 North Carolina\n13 Georgia\n13 Virginia\n12 Massachusetts\n12 Indiana\n11 Missouri\n11 Wisconsin\n11 Tennessee\n11 Washington\n10 Maryland\n10 Minnesota\n9 Louisiana\n9 Alabama\n8 Kentucky\n8 Arizona\n8 South Carolina\n8 Colorado\n8 Connecticut\n8 Oklahoma\n7 Oregon\n7 Iowa\n7 Mississippi\n6 Kansas\n6 Arkansas\n5 West Virginia\n5 Utah\n5 Nebraska\n5 New Mexico\n4 Maine\n4 Nevada\n4 New Hampshire\n4 Hawaii\n4 Idaho\n4 Rhode Island\n3 Montana\n3 South Dakota\n3 Delaware\n3 North Dakota\n3 District of Columbia\n3 Vermont\n3 Alaska\n3 Wyoming\n"
    };
  example_games["uselectcoll0408"] = {
    name: " Electoral College (United States, 2004-2008)",
    input: "# Electoral College (United States, 2004-2008)\n#\n# See http://en.wikipedia.org/wiki/Electoral_College_%28United_States%29\n# \n270\n55 California\n34 Texas\n31 New York\n27 Florida\n21 Pennsylvania\n21 Illinois\n20 Ohio\n17 Michigan\n15 North Carolina\n15 New Jersey\n15 Georgia\n13 Virginia\n12 Massachusetts\n11 Washington\n11 Tennessee\n11 Missouri\n11 Indiana\n10 Wisconsin\n10 Minnesota\n10 Maryland\n10 Arizona\n9 Louisiana\n9 Colorado\n9 Alabama\n8 South Carolina\n8 Kentucky\n7 Oregon\n7 Oklahoma\n7 Iowa\n7 Connecticut\n6 Mississippi\n6 Kansas\n6 Arkansas\n5 West Virginia\n5 Utah\n5 New Mexico\n5 Nevada\n5 Nebraska\n4 Rhode Island\n4 New Hampshire\n4 Maine\n4 Idaho\n4 Hawaii\n3 Wyoming\n3 Washington, D.C.\n3 Vermont\n3 South Dakota\n3 North Dakota\n3 Montana\n3 Delaware\n3 Alaska\n"
    };
  example_games["uselectcoll121620"] = {
	name: " Electoral College (United States, 2012-2020)",
	input: "# Electoral College (United States)\n#    ... for the 2012, 2016 and 2020 presidential elections.\n#\n# Based on the 2010 Census.\n# See http://www.thegreenpapers.com/Census10/HouseAndElectors.phtml\n#\n# Total electors: 538 (half is 269)\n270\n55	California\n38	Texas\n29	New York\n29	Florida\n20	Pennsylvania\n20	Illinois\n18	Ohio\n16	Michigan\n16	Georgia\n15	North Carolina\n14	New Jersey\n13	Virginia\n12	Washington\n11	Tennessee\n11	Massachusetts\n11	Indiana\n11	Arizona\n10	Wisconsin\n10	Missouri\n10	Minnesota\n10	Maryland\n9	South Carolina\n9	Colorado\n9	Alabama\n8	Louisiana\n8	Kentucky\n7	Oregon\n7	Oklahoma\n7	Connecticut\n6	Utah\n6	Nevada\n6	Mississippi\n6	Kansas\n6	Iowa\n6	Arkansas\n5	West Virginia\n5	New Mexico\n5	Nebraska\n4	Rhode Island\n4	New Hampshire\n4	Maine\n4	Idaho\n4	Hawaii\n3	Wyoming\n3	Vermont\n3	South Dakota\n3	North Dakota\n3	Montana\n3	District of-Columbia\n3	Delaware\n3	Alaska\n"
	};
  example_games["eec1958"] = {
    name: "European Economic Community (Treaty of Rome, 1958)",
    input: "# European Economic Community\n# (Treaty of Rome, 1958)\n#\n# See: http://en.wikipedia.org/wiki/Treaty_of_Rome\n#\n12\n4 Germany\n4 France\n4 Italy\n2 Belgium\n2 The Netherlands\n1 Luxembourg"
    };
  example_games["germbundesrat"] = {
    name: "German Bundesrat",
    input: "# German Bundesrat\n# (Upper House of the German Federal Legal System)\n# \n# See: http://en.wikipedia.org/wiki/Bundesrat_of_Germany\n# Total Number of Votes: 69\n35\n# Number of Votes depends on the Population\n6 North Rhine-Westphalia\n6 Bavaria\n6 Baden-Wuerttemberg\n6 Lower Saxony\n5 Hesse\n4 Saxony\n4 Rheinland-Pfalz\n4 Berlin\n4 Schleswig-Holstein\n4 Brandenburg\n4 Saxony-Anhalt\n4 Thuringia\n3 Hamburg\n3 Mecklenburg-Vorpommern\n3 Saarland\n3 Bremen"
    };
  example_games["germbundtag2009"] = {
    name: "German Bundestag (2009)",
    input: "# German Bundestag (2009)\n#\n# http://en.wikipedia.org/wiki/German_Bundestag\n#\n# Absolute Majority (\"Kanzlermehrheit\"). Total number of votes: 622.\n312\n239 CDU/CSU\n146 SPD\n93 FDP\n76 The Left\n68 Alliance '90/The Greens\n#\n# CDU/CSU: Christian Democratic Union and Christian Social Union of Bavaria\n# SPD:     Social Democratic Party of Germany\n# FDP:     Free Democratic Party\n#\n"
    };
  example_games["luxembourg2009"] = {
    name: "Chamber of Deputies of Luxembourg (2009)",
    input: "# Chamber_of_Deputies_of_Luxembourg (2009)\n#\n# See http://en.wikipedia.org/wiki/Chamber_of_Deputies_of_Luxembourg\n#\n# 60 Seats, Absolute Majority\n31\n26	Christian Social People's Party (CSV) \n13	Luxembourg Socialist Workers' Party (LSAP)\n9	Democratic Party (DP)\n7	The Greens\n4	Alternative Democratic Reform Party (ADR)\n1	The Left\n0	Communist Party (KPL)\n0	Citizens' List\n"
    };
  example_games["3x3magicsquare"] = {
    name: "3x3 Magic Square 15.",
    input: "# 3x3 Magic Square, sum is 15 in each row/col/diag.\n#\n# From \"Mathematics and Politics\", p.189\n#   by A. Taylor\n#\n# 4 3 8\n# 9 5 1\n# 2 7 6\n#\n# Players are the 9 fields. A coalition is winning, iff \n#   1) it has 4 or more players, or\n#   2) it's weight is strictly greater than 15, or\n#   3) it's weight is exactly 15 and it's a row.\n# Additionally, each coalition must have at least 3 players Otherwise, it is\n# losing.\n#\n%join 1 OR (2 AND 3) OR (5 OR 6 OR 7)\n4 3 16 15 3 3 3\n1 1  4  4 1 0 0 (1,1)\n1 1  3  3 1 0 0 (1,2)\n1 1  8  8 1 0 0 (1,3)\n1 1  9  9 0 1 0 (2,1)\n1 1  5  5 0 1 0 (2,2)\n1 1  1  1 0 1 0 (2,3)\n1 1  2  2 0 0 1 (3,1)\n1 1  7  7 0 0 1 (3,2)\n1 1  6  6 0 0 1 (3,3)"
    };
  example_games["nonweighted"] = {
    name: "A Small Non-weighted Game (4 players)",
    input: "# A small non-weighted game\n#\n2 3\n1 2 A\n2 1 B\n0 2 C\n1 1 D"
    };
  example_games["treatylisbon"] = {
    name: "Council of Ministers of the European Union (Treaty of Lisbon)",
    input: "# Council of Ministers of the European Union\n# (Treaty of Lisbon)\n#\n# See: http://en.wikipedia.org/wiki/Treaty_of_Lisbon\n# (Number of Votes AND Population) OR (Blocking Miniority)\n%join (1 AND 2) OR 3\n%type binary\n# 55% and 65% or at least at most four not supporting it\n15 32400 24\n1 8200 1 Germany\n1 6400 1 France\n1 6200 1 United Kingdom\n1 6000 1 Italy\n1 4500 1 Spain\n1 3800 1 Poland\n1 2100 1 Romania\n1 1700 1 Netherlands\n1 1100 1 Greece\n1 1100 1 Portugal\n1 1100 1 Belgium\n1 1000 1 Czech Republic\n1 1000 1 Hungary\n1  920 1 Sweden\n1  830 1 Austria\n1  760 1 Bulgaria\n1  550 1 Denmark\n1  540 1 Slovakia\n1  530 1 Finland\n1  450 1 Ireland\n1  330 1 Lithuania\n1  220 1 Latvia\n1  200 1 Slovenia\n1  130 1 Estonia\n1   87 1 Cyprus\n1   49 1 Luxembourg\n1   41 1 Malta\n"
    };
  example_games["treatynice"] = {
    name: "Council of Ministers of the European Union (Treaty of Nice)",
    input: "# Council of Ministers of the European Union\n# (Treaty of Nice)\n#\n# See: http://en.wikipedia.org/wiki/Treaty_of_Nice)\n#\n%type binary\n#\n255 14 620\n29 1 170 Germany\n29 1 123 United Kingdom\n29 1 122 France\n29 1 120 Italy\n27 1 82 Spain\n27 1 80 Poland\n14 1 47 Romania\n13 1 33 Netherlands\n12 1 22 Greece\n12 1 21 Czech Republic\n12 1 21 Belgium\n12 1 21 Hungary\n12 1 21 Portugal\n10 1 18 Sweden\n10 1 17 Bulgaria\n10 1 17 Austria\n7 1 11 Slovak Republic\n7 1 11 Denmark\n7 1 11 Finland\n7 1 8 Ireland\n7 1 8 Lithuania\n4 1 4 Latvia\n4 1 4 Slovenia\n4 1 3 Estonia\n4 1 2 Cyprus\n4 1 1 Luxembourg\n3 1 1 Malta"
    };
  example_games["unseccouncil2"] = {
    name: "United Nations Security Council",
    input: "# United Nations Security Council\n#\n# See http://en.wikipedia.org/wiki/Un_security_council\n#\n# The five permanent members have veto power.\n# Total votes: 15\n9 5\n1 1 China\n1 1 England\n1 1 France\n1 1 Russia\n1 1 United States\nx10 1 0 Nonpermanent Member"
    };
  example_games["unseccouncilwvg"] = {
    name: "United Nations Security Council (Weighted)",
    input: "# United Nations Security Council\n#\n# See http://en.wikipedia.org/wiki/Un_security_council\n#\n# The five permanent members have veto power.\n# Total votes: 15\n39\n7 China\n7 England\n7 France\n7 Russia\n7 United States\nx10 1 Nonpermanent Member"
    };
  example_games["usfederallegalsystem"] = {
	name: "US Federal Legal System",	  
	input: "# US Federal Legal System\n#\n# See http://en.wikipedia.org/wiki/Congress_of_the_United_States\n# for details.\n\n%join (1 AND 2 AND 3) OR (1 AND 4 AND 5 AND 3) OR (6 AND 7)\n     1  51 218  1  50  67  290\nx100 0   1   0  0   1   1    0 Member of the Senate\nx435 0   0   1  0   0   0    1 Member of the House of Rep.\n     1   0   0  0   0   0    0 President\n     0   0   0  1   0   0    0 Vice-President\n"
    };
  example_games["wbank-ibrdex-09"] = {
    name: "International Bank for Reconstruction and Development - Executive Directors (IBRD, 2009)",
    input: "# International Bank for Reconstruction and Development\n# (Executive Directors)\n# Sept. 2009\n#\n# Votes: http://siteresources.worldbank.org/BODINT/Resources/278027-1215524804501/IBRDEDsVotingTable.pdf\n# Names: http://siteresources.worldbank.org/BODINT/Resources/278027-1215526322295/BankExecutiveDirectors.pdf\n#\n# Total number of Votes: 1,616,804\n808402\n# Appointed by:\n265219  Whitney Debevoise (US)\n127250  Toru Shikibu (Japan)\n72649  Michael Hofmann (Germany)\n69647  Susanna Moorehead (UK)\n69647  Ambroise Fayolle (France)\n# Elected:\n77669  Konstantin Huber\n73146  Rudolf Treffers\n72786  Jose A. Rojas\n62217  Samy Watson\n58124 Carolina Renteria\n56705 Giovanni Majnoni\n55800 James Hagan\n54945 Pulok Chatterji\n54347 Toga McIntosh\n54039 Anna Brandt\n51544 Sid Ahmed Dib\n49192 Michel Mordasini\n47042 Merza H. Hasan\n45049 Shaolin Yang\n45045 Alexey G. Kvasov\n45045 Abdulrahman M. Almofadhi\n41096 Sun Vithespongse\n37499 Dante Contreras\n31102 Louis Philippe Ong Seng"
    };
  example_games["wbank-idaex-09"] = {
    name: "International Development Association - Executive Directors (IDA, 2009)",
    input: "# International Development Association (IDA)\n# (Executive Directors)\n# Sept. 2009\n#\n# Votes: http://siteresources.worldbank.org/BODINT/Resources/278027-1215524804501/IDAEDsVotingTable.pdf\n# Names: http://siteresources.worldbank.org/BODINT/Resources/278027-1215526322295/BankExecutiveDirectors.pdf\n#\n# Total number of Votes: 18,705,369\n9352685\n# Appointed by:\n2228252 E. Whitney Debevoise (US)\n1746238 Toru Shikibu (Japan)\n1154907 Michael Hofmann (Germany)\n741422  Ambroise Fayolle (France)\n984805 Susanna Moorehead (UK)\n# Elected:\n840390 Konstantin Huber\n621712 Giovanni Majnoni\n803929 Pulok Chatterji\n487972 Jose A. Rojas\n841280 Samy Watson\n802617 Rudolf Treffers\n959548 Anna Brandt\n57166  Alexey G. Kvasov\n667778 Carolina Renteria\n698917 James Hagan\n285743 Dante Contreras\n734646 Michel Mordasini           \n559959 Sun Vithespongse\n857592 Toga McIntosh\n458383 Sid Ahmed Dib    \n409504 Merza H. Hasan       \n616628 Abdulrahman M. Almofadhi\n383098 Shaolin Yang \n762883 Louis Philippe Ong Seng"
    };
  example_games["wbank-ifcex-09"] = {
    name: "International Finance Corporation - Executive Directors (IFC, 2009)",
    input: "# International Finance Corporation (IFC)\n# (Executive Directors)\n# Sept. 2009\n#\n# Votes: http://siteresources.worldbank.org/BODINT/Resources/278027-1215524804501/IFCEDsVotingTable.pdf\n# Names: http://siteresources.worldbank.org/BODINT/Resources/278027-1215526322295/BankExecutiveDirectors.pdf\n#\n# Total number of Votes: 2,411,210\n1205606\n# Appointed by:\n569629 E. Whitney Debevoise (US)\n141424 Toru Shikibu (Japan)\n129158 Michael Hofmann (Germany)\n121265 Ambroise Fayolle (France)\n121265 Susanna Moorehead (UK)\n# Elected:\n125221 Konstantin Huber\n101758 Giovanni Majnoni\n99234 Pulok Chatterji\n97478 Jose A. Rojas\n92944 Samy Watson\n89325 Rudolf Treffers\n86693 Anna Brandt\n81592 Alexey G. Kvasov\n75980 Carolina Renteria\n73309 James Hagan\n64144 Dante Contreras\n62601 Michel Mordasini           \n59912 Sun Vithespongse\n57688 Toga McIntosh\n45980 Sid Ahmed Dib    \n36376 Merza H. Hasan       \n30312 Abdulrahman M. Almofadhi\n24750 Shaolin Yang \n23172 Louis Philippe Ong Seng"
    };
