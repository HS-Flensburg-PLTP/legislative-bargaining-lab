module Probabilities exposing (..)


import QOBDD exposing (QOBDD, Tree, foldTreeShare)
import Dict exposing (Dict, get)
import Random exposing (Generator)


--
probs : List (Dict Int Float) -> QOBDD -> List Float
probs probs qobdd =
  List.indexedMap (\player probs -> prob player probs qobdd) probs

-- The power of a specific player given specific probabilities
prob : Int -> Dict Int Float -> QOBDD -> Float
prob player probs qobdd = probTree player probs qobdd.root

-- The player accepts her own proposal with probability 1
probTree : Int -> Dict Int Float -> Tree -> Float
probTree player probs =
  let f label p1 p2 =
    if label == player
    then p1
    else
      case get label probs of
        Nothing -> Debug.crash ("Label " ++ toString label ++ " not found in "  ++ toString probs)
        Just p -> p * p1 + (1-p) * p2
  in
  foldTreeShare 0 1 f


halves : Int -> List (List Float)
halves n = List.repeat n (List.repeat n 0.5)

probsGenerator : Int -> Generator (List (List Float))
probsGenerator n =
  Random.list n (Random.list n (Random.map (\i -> toFloat i / 10) (Random.int 0 10)))
