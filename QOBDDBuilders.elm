module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-
   The function creates a BDD without sharing
-}


buildBDDWithIds : Id -> Quota -> List PlayerWeight -> ( BDD, Id )
buildBDDWithIds id quota weights =
    case weights of
        [] ->
            if quota > 0 then
                ( Zero, id )
            else
                ( One, id )

        w :: ws ->
            let
                ( lTree, lTreeId ) =
                    buildBDDWithIds id (quota - w) ws

                ( rTree, rTreeId ) =
                    buildBDDWithIds lTreeId quota ws
            in
            ( Node { id = rTreeId, thenB = lTree, var = 0, elseB = rTree }, rTreeId + 1 )



{-
   The function creates a simple QOBDD without sharing for the first rule in rules only.
-}


fromSGToSimpleQOBDD : SimpleGame -> QOBDD
fromSGToSimpleQOBDD game =
    QOBDD game.playerCount
        (case List.head game.rules of
            Nothing ->
                Zero

            Just rule ->
                first (buildBDDWithIds 0 rule.quota rule.weights)
        )
