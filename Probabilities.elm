module Probabilities exposing (..)


import QOBDD exposing (QOBDD, Tree, foldTreeShare)
import Dict exposing (Dict, get)
import Random exposing (Generator)


--
probs : List (Dict Int Float) -> QOBDD -> List Float
probs probs qobdd = normalise (List.map (\probs -> prob probs qobdd) probs)

normalise : List Float -> List Float
normalise probs =
  let total = List.sum probs
  in
  List.map (\p -> p / total) probs

prob : Dict Int Float -> QOBDD -> Float
prob probs qobdd = probTree probs qobdd.root

probTree : Dict Int Float -> Tree -> Float
probTree probs =
  let f label p1 p2 =
    case get label probs of
      Nothing -> Debug.crash ("Label " ++ toString label ++ " not found in "  ++ toString probs)
      Just p -> p * p1 + (1-p) * p2
  in
  foldTreeShare 0 1 f


-- the diagonal is one
halves : Int -> List (List Float)
halves n = List.indexedMap halvesRow (List.repeat n n)

halvesRow : Int -> Int -> List Float
halvesRow i n = List.repeat i 0.5 ++ 1 :: List.repeat (n-i-1) 0.5

probsGenerator : Int -> Generator (List (List Float))
probsGenerator n =
  Random.list n (Random.list n (Random.map (\i -> toFloat i / 10) (Random.int 0 10)))
