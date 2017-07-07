module Probabilities exposing (..)


import QOBDD exposing (QOBDD, Tree, foldTreeShare)
import Dict exposing (Dict, get)
import Random exposing (Generator)


normalise : List Float -> List Float
normalise probs =
  let total = List.sum probs
  in
  List.map (\p -> p / total) probs

-- Calculates the probabilities for all players
probs : List (Dict Int Float) -> QOBDD -> List Float
probs probs qobdd = normalise (List.map (\probs -> prob probs qobdd) probs)

prob : Dict Int Float -> QOBDD -> Float
prob probs qobdd = probTree probs qobdd.root

probTree : Dict Int Float -> Tree -> Float
probTree probs =
  let f label p1 p2 =
    case get label probs of
      Nothing -> Debug.crash ("Label " ++ toString label ++ " not found in "  ++ toString probs)
      Just p  -> p * p1 + (1-p) * p2
  in
  foldTreeShare 0 1 f


diagonal : Int -> List (List Float) -> List (List Float)
diagonal n ffs = List.indexedMap row ffs

row : Int -> List Float -> List Float
row i fs = List.take i fs ++ 1 :: List.drop (i+1) fs


-- Matrix of 0.5 probabilities, the diagonal is one
halvesDiag : Int -> List (List Float)
halvesDiag n = diagonal n (halves n)

halves : Int -> List (List Float)
halves n = List.repeat n (List.repeat n 0.5)


probsDiagGen : Int -> Generator (List (List Float))
probsDiagGen n = Random.map (diagonal n) (probsGen n)

-- Random generator for generating a matrix of probabilities
probsGen : Int -> Generator (List (List Float))
probsGen n =
  Random.list n (Random.list n (Random.map (\i -> toFloat i / 10) (Random.int 0 10)))
