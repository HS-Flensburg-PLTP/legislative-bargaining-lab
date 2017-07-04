module Games exposing(..)

magicSquares ="""
# 3x3 Magic Square, sum is 15 in each row/col/diag.
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

eu17 ="""
# Council of Ministers of the European Union
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
