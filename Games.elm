module Games exposing (..)

import Dict
import Json.Decode as Json


type Game
    = EU27
    | EU28
    | Squares
    | Canadian95
    | Test
    | Test2
    | HenningTest
    | BolusTest


games : List Game
games =
    [ EU27, EU28, Squares, Canadian95, Test, Test2, HenningTest, BolusTest ]


showGame : Game -> String
showGame g =
    case g of
        EU27 ->
            "EU-27"

        EU28 ->
            "EU-28"

        Squares ->
            "Magic Squares"

        Canadian95 ->
            "Canadian 95"

        Test ->
            "Simple Game"

        Test2 ->
            "Simple Game 2"

        HenningTest ->
            "Henning Simple Game"

        BolusTest ->
            "Bolus Simple Game"


fromString : String -> Maybe Game
fromString str =
    Dict.get str (Dict.fromList (List.map (\g -> ( Debug.toString g, g )) games))


gameDefinition : Game -> String
gameDefinition g =
    case g of
        EU27 ->
            eu27

        EU28 ->
            eu28

        Squares ->
            magicSquares

        Canadian95 ->
            canadian95

        Test ->
            test

        Test2 ->
            test2

        HenningTest ->
            henningTest

        BolusTest ->
            bolusTest


gameDecoder : String -> Json.Decoder Game
gameDecoder str =
    case fromString str of
        Just g ->
            Json.succeed g

        Nothing ->
            Json.fail ("Failed to parse " ++ str)


test =
    """3
2
1
1
"""


test2 =
    """3
3
1
1
"""


henningTest =
    """50
36
35
15
8
6
"""


bolusTest =
    """2
1
1
1
"""


canadian95 =
    """# System to Amend the Canadian Constitution
#    from "Mathematics and Politics", Taylor, 1995, Springer.
#
7 50
1 34 Ontario
1 29 Quebec
1 9 British Columbia
1 7 Alberta
1 5 Saskatchewan
1 5 Manitoba
1 4 Nova Scotia
1 3 New Brunswick
1 3 Newfoundland
1 1 Prince Edward Island
"""


magicSquares =
    """# 3x3 Magic Square, sum is 15 in each row/col/diag.
#
# From "Mathematics and Politics", p.189
#   by A. Taylor
#
# 4 3 8
# 9 5 1
# 2 7 6
#
# Players are the 9 fields. A coalition is winning, iff
#   1) it has 4 or more players, or
#   2) it's weight is strictly greater than 15, or
#   3) it's weight is exactly 15 and it's a row.
# Additionally, each coalition must have at least 3 players Otherwise, it is
# losing.
#
%join 1 OR (2 AND 3) OR (5 OR 6 OR 7)
4 3 16 15 3 3 3
1 1  4  4 1 0 0 (1,1)
1 1  3  3 1 0 0 (1,2)
1 1  8  8 1 0 0 (1,3)
1 1  9  9 0 1 0 (2,1)
1 1  5  5 0 1 0 (2,2)
1 1  1  1 0 1 0 (2,3)
1 1  2  2 0 0 1 (3,1)
1 1  7  7 0 0 1 (3,2)
1 1  6  6 0 0 1 (3,3)
"""


eu27 =
    """# Council of Ministers of the European Union
# (Treaty of Lisbon)
#
# See: http://en.wikipedia.org/wiki/Treaty_of_Lisbon
# (Number of Votes AND Population) OR (Blocking Miniority)
%join ((1 AND 2) OR 3) AND 4
%type binary
# 55% and 65% or at least at most four not supporting it
15 32400 24 376
1 8200 1 0 Germany
1 6400 1 0 France
1 6200 1 0 United
1 6000 1 0 Italy
1 4500 1 0 Spain
1 3800 1 0 Poland
1 2100 1 0 Romania
1 1700 1 0 Netherlands
1 1100 1 0 Greece
1 1100 1 0 Portugal
1 1100 1 0 Belgium
1 1000 1 0 Czech
1 1000 1 0 Hungary
1 920 1 0 Sweden
1 830 1 0 Austria
1 760 1 0 Bulgaria
1 550 1 0 Denmark
1 540 1 0 Slovakia
1 530 1 0 Finland
1 450 1 0 Ireland
1 330 1 0 Lithuania
1 220 1 0 Latvia
1 200 1 0 Slovenia
1 130 1 0 Estonia
1 87 1 0 Cyprus
1 49 1 0 Luxembourg
1 41 1 0 Malta
0 0 0 217 EPP
0 0 0 189 S and D
0 0 0 74 ECR
0 0 0 68 ALDE
0 0 0 52 GUE NGL
0 0 0 51 Greens EFA
0 0 0 42 EFDD
0 0 0 40 ENF
0 0 0 18 Non Inscrits
"""


eu28 =
    """## Council
# see http://www.consilium.europa.eu/en/council-eu/voting-system/qualified-majority/
# and voting calculator for pop shares
# missing: The blocking minority must include at least four Council members representing more than 35% of the EU population.
# https://www.lexology.com/library/detail.aspx?g=232a482a-c56b-48da-936d-413c583391fe
# http://www.cms-lawnow.com/~/media/Files/RegZone/TrainingSeminarsPDFs/QMV%20report%20German%20EU%20Foundation%20Series.pdf#page=2
## Parliament
# for parliament seat shares see: https://en.wikipedia.org/wiki/Political_groups_of_the_European_Parliament#Current_composition_of_the_8th_European_Parliament
# vacant seats not included
%join ((1 AND 2) AND 3)
%type binary
16 6500 374
1 1606 0 Germany
1 1305 0 France
1 1279 0 United Kingdom
1 1200 0 Italy
1 909 0 Spain
1 743 0 Poland
1 387 0 Romania
1 337 0 Netherlands
1 221 0 Belgium
1 211 0 Greece
1 204 0 Czech Republic
1 202 0 Portugal
1 196 0 Sweden
1 192 0 Hungary
1 171 0 Austria
1 140 0 Bulgaria
1 112 0 Denmark
1 107 0 Finland
1 106 0 Slovakia
1 91 0 Ireland
1 82 0 Croatia
1 57 0 Lithuania
1 40 0 Slovenia
1 39 0 Latvia
1 26 0 Estonia
1 17 0 Cyprus
1 11 0 Luxembourg
1 9 0 Malta
0 0 214 European People's Party (EPP)
0 0 189 Progressive Alliance of Socialists and Democrats (S&D)
0 0 73 European Conservatives and Reformists (ECR)
0 0 68 Alliance of Liberals and Democrats for Europe (ALDE)
0 0 52 European United Left–Nordic Green Left (GUE-NGL)
0 0 51 The Greens–European Free Alliance (Greens–EFA)
0 0 41 Europe of Freedom and Direct Democracy (EFDD)
0 0 40 Europe of Nations and Freedom (ENL)
0 0 18 Non-Inscrits (NI)"""
