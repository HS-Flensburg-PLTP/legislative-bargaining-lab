module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-| Takes a Node id a quota and a list of player weights
and cursively calls itself to generate a BDD.
-}
buildBDDWithIds : Id -> Quota -> List PlayerWeight -> List Player -> ( BDD, Id )
buildBDDWithIds id quota weights players =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            let
                ( lTree, lTreeId ) =
                    buildBDDWithIds id (quota - w) ws ps

                ( rTree, rTreeId ) =
                    buildBDDWithIds lTreeId quota ws ps
            in
            ( Node { id = rTreeId, thenB = lTree, var = p.id, elseB = rTree }, rTreeId + 1 )

        ( _, _ ) ->
            if quota > 0 then
                ( Zero, id )
            else
                ( One, id )


{-| Takes a SimpleGame and generates a QOBDD
(at the moment without sharing) and
(at the moment just for the first game rule only)
-}
fromSGToSimpleQOBDD : SimpleGame -> QOBDD
fromSGToSimpleQOBDD game =
    QOBDD game.playerCount
        (case game.rules of
            [] ->
                Zero

            rule :: rules ->
                first (buildBDDWithIds 0 rule.quota rule.weights game.players)
        )
