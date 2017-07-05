module Probabilities exposing (..)


import QOBDD exposing (QOBDD, Tree, foldTreeShare)
import Dict exposing (Dict, get)


prob : Dict Int Float -> QOBDD -> Float
prob probs qobdd = probTree probs qobdd.root

probTree : Dict Int Float -> Tree -> Float
probTree probs =
  let f label p1 p2 =
    case get label probs of
      Nothing -> Debug.crash ("Label " ++ toString label ++ " not found in "  ++ toString probs)
      Just p -> p * p1 + (1-p) * p2
        -- 0.5 * p1 + 0.5 * p2
  in
  foldTreeShare 0 1 f


-- -- These functions calculate the probability for accepting a proposal of a specific player
-- acceptProb : Int -> Dict Int Float -> QOBDD -> Float
-- acceptProb player probs qobdd = squareProbsTree probs qobdd.root
--
-- squareProbsTree : List (Dict Int Float) -> Tree -> Float
-- squareProbsTree probs t =
--   List.sum (List.indexedMap (\i d -> probTree d t) probs)
