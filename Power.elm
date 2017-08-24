module Power exposing (..)

import Iteration exposing (sumProdFast)
import QOBDD exposing (..)
import Utils exposing (fac)
import Vector exposing (Vector)


-- henningIndexFast : (Int -> Float) -> BDD -> Float
-- henningIndexFast p bdd =
--     let
--         node pt v pe =
--             p v * pt + (1 - p v) * pe
--     in
--     foldBDDShare 0 1 node bdd


henningIndexFast : (Int -> Float) -> BDD -> Float
henningIndexFast p =
    sumProdFast p (\v -> 1 - p v) { plus = (+), zero = 0, mult = (*), one = 1 }


with : Int -> BDD -> Int
with i =
    sumProdFast (always 1) (isPlayer i 0 1) { plus = (+), zero = 0, mult = (*), one = 1 }


without : Int -> BDD -> Int
without i =
    sumProdFast (isPlayer i 0 1) (always 1) { plus = (+), zero = 0, mult = (*), one = 1 }


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
    List.map (\i -> swings i bdd) players


{-| The absolute Banzhaf index for a specific player
-}
banzhaf : Int -> Int -> BDD -> Float
banzhaf player n bdd =
    toFloat (swings player bdd)


{-| The relative Banzhaf index for a list of players
-}
banzhafs : List Int -> BDD -> List Float
banzhafs players bdd =
    let
        sws =
            List.map (\i -> toFloat (swings i bdd)) players

        total =
            List.sum sws
    in
    List.map (\s -> s / total) sws


withV : Int -> BDD -> Vector Int
withV i =
    sumProdFast
        (always (Vector.extend Vector.one))
        (isPlayer i Vector.zero Vector.one)
        { plus = Vector.plus, zero = Vector.zero, mult = Vector.mult, one = Vector.one }


withoutV : Int -> BDD -> Vector Int
withoutV i =
    sumProdFast
        (isPlayer i Vector.zero (Vector.extend Vector.one))
        (always Vector.one)
        { plus = Vector.plus, zero = Vector.zero, mult = Vector.mult, one = Vector.one }


swingsV : Int -> BDD -> Vector Int
swingsV i bdd =
    Vector.minus (withV i bdd) (Vector.extend (withoutV i bdd))


allSwingsV : List Int -> BDD -> List (List Int)
allSwingsV players bdd =
    List.map (\i -> Vector.toList (swingsV i bdd)) players


{-| The absolute Shapley-Shubik index for a specific player
-}
shapley : Int -> Int -> BDD -> Float
shapley player n bdd =
    let
        si =
            Vector.toList (swingsV player bdd)

        sum =
            List.sum (List.indexedMap (\k s -> fac (k - 1) * fac (n - k) * s) si)
    in
    toFloat sum / toFloat (fac n)


{-| The relative Shapley-Shubik index for a list of players
-}
shapleys : List Int -> BDD -> List Float
shapleys players bdd =
    let
        n =
            List.length players

        values =
            List.map (\i -> shapley i n bdd) players

        total =
            List.sum values
    in
    List.map (\v -> v / total) values
