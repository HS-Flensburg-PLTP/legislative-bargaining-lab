module Power exposing (..)

import Iteration exposing (sumProd)
import List exposing (indexedMap, length, map, sum)
import QOBDD exposing (..)
import Utils exposing (fac)
import Vector exposing (Vector, extend, minus, mult, one, plus, zero)


-- henningIndex : (Int -> Float) -> BDD -> Float
-- henningIndex p bdd =
--     let
--         node pt v pe =
--             p v * pt + (1 - p v) * pe
--     in
--     foldBDDShare 0 1 node bdd


henningIndex : (Int -> Float) -> BDD -> Float
henningIndex p =
    sumProd p (\v -> 1 - p v) { plus = (+), zero = 0, mult = (*), one = 1 }


with : Int -> BDD -> Int
with i =
    sumProd (always 1) (isPlayer i 0 1) { plus = (+), zero = 0, mult = (*), one = 1 }


without : Int -> BDD -> Int
without i =
    sumProd (isPlayer i 0 1) (always 1) { plus = (+), zero = 0, mult = (*), one = 1 }


isPlayer : Int -> a -> a -> Int -> a
isPlayer i thenV elseV j =
    if j == i then
        thenV
    else
        elseV


swings : Int -> BDD -> Int
swings i bdd =
    with i bdd - without i bdd


allSwings : List Int -> BDD -> List Int
allSwings players bdd =
    map (\i -> swings i bdd) players


{-| The absolute Banzhaf index for a specific player
-}
banzhaf : Int -> Int -> BDD -> Float
banzhaf player n bdd =
    toFloat (swings player bdd) / 2 ^ toFloat n - 1


{-| The relative Banzhaf index for a list of players
-}
banzhafs : List Int -> BDD -> List Float
banzhafs players bdd =
    let
        sws =
            map (\i -> toFloat (swings i bdd)) players

        total =
            sum sws
    in
    map (\s -> s / total) sws


withV : Int -> BDD -> Vector Int
withV i =
    sumProd
        (always (extend one))
        (isPlayer i zero one)
        { plus = plus, zero = zero, mult = mult, one = one }


withoutV : Int -> BDD -> Vector Int
withoutV i =
    sumProd
        (isPlayer i zero (extend one))
        (always one)
        { plus = plus, zero = zero, mult = mult, one = one }


swingsV : Int -> BDD -> Vector Int
swingsV i bdd =
    minus (withV i bdd) (extend (withoutV i bdd))


allSwingsV : List Int -> BDD -> List (List Int)
allSwingsV players bdd =
    map (\i -> swingsV i bdd) players


{-| The absolute Shapley-Shubik index for a specific player
-}
shapley : Int -> Int -> BDD -> Float
shapley player n bdd =
    let
        v =
            swingsV player bdd

        s1 =
            sum (indexedMap (\k s2 -> fac (k - 1) * fac (n - k) * s2) v)
    in
    toFloat s1 / toFloat (fac n)


{-| The relative Shapley-Shubik index for a list of players
-}
shapleys : List Int -> BDD -> List Float
shapleys players bdd =
    let
        n =
            length players

        values =
            map (\i -> shapley i n bdd) players

        total =
            sum values
    in
    map (\v -> v / total) values
