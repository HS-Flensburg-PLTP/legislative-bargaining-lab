module Probabilities exposing (..)

import Dict exposing (Dict, get)
import QOBDD exposing (BDD, QOBDD, foldBDDShare)
import Random exposing (Generator)


normalise : List Float -> List Float
normalise probs2 =
    let
        total =
            List.sum probs2
    in
    List.map (\p -> p / total) probs2



-- Calculates the probabilities for all players


probs : List (Dict Int Float) -> QOBDD -> List Float
probs probs1 qobdd =
    normalise (List.map (\probs2 -> prob probs2 qobdd) probs1)


prob : Dict Int Float -> QOBDD -> Float
prob probs2 qobdd =
    probTree probs2 qobdd.bdd


probTree : Dict Int Float -> BDD -> Float
probTree probs2 =
    let
        node p1 var p2 =
            case get var probs2 of
                Nothing ->
                    Debug.todo ("Label " ++ Debug.toString var ++ " not found in " ++ Debug.toString probs2)

                Just p ->
                    p * p1 + (1 - p) * p2
    in
    foldBDDShare 0 1 node


diagonal : Int -> List (List Float) -> List (List Float)
diagonal n ffs =
    List.indexedMap row ffs


row : Int -> List Float -> List Float
row i fs =
    List.take i fs ++ 1 :: List.drop (i + 1) fs



-- Matrix of 0.5 probabilities, the diagonal is one


halvesDiag : Int -> List (List Float)
halvesDiag n =
    diagonal n (halves n)


halves : Int -> List (List Float)
halves n =
    List.repeat n (List.repeat n 0.5)


probsDiagGen : Int -> Generator (List (List Float))
probsDiagGen n =
    Random.map (diagonal n) (probsGen n)



-- Random generator for generating a matrix of probabilities


probsGen : Int -> Generator (List (List Float))
probsGen n =
    Random.list n (Random.list n (Random.map (\i -> toFloat i / 10) (Random.int 0 10)))
