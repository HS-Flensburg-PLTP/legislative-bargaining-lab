module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing(first)


{-
   The function creates a BDD without sharing and without giving the tree nodes ids
-}


buildBDD : Quota -> List PlayerWeight -> List Player -> BDD
buildBDD quota weights players =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            Node { id = 0, thenB = buildBDD (quota - w) ws ps, var = 0, elseB = buildBDD quota ws ps }

        ( _, _ ) ->
            if quota > 0 then
                One
            else
                Zero
{-
   The function creates a BDD without sharing
-}


buildBDDWithIds : Id -> Quota -> List PlayerWeight -> List Player -> ( BDD, Id )
buildBDDWithIds id quota weights players =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            let
                ( lTree, lTreeId ) =
                    buildBDDWithIds (id) (quota - w) ws ps

                ( rTree, rTreeId ) =
                    buildBDDWithIds (lTreeId) quota ws ps
            in
            ( Node { id = (rTreeId), thenB = lTree, var = 0, elseB = rTree }, ( rTreeId + 1 ))

        ( _, _ ) ->
            if quota > 0 then
                ( One, id )
            else
                ( Zero, id )



{-
   The function creates a simple QOBDD without sharing and without ids for the first rule only.
-}


fromSGToSimpleQOBDD : SimpleGame -> QOBDD
fromSGToSimpleQOBDD game =
    QOBDD game.playerCount
        (case List.head game.rules of
            Nothing ->
                Zero

            Just rule ->
                first (buildBDDWithIds 0 rule.quota rule.weights game.players)
        )
