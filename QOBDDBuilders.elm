module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-| Takes a Node id a quota and a list of player weights
and cursively calls itself to generate a BDD.

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



{-| Takes a SimpleGame and generates a QOBDD
(at the moment without sharing) and
(at the moment just for the first game rule)
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
