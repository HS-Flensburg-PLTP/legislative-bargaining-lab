module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import Dict exposing (Dict)
import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-| Takes a Node id a quota and a list of player weights
and cursively calls itself to generate a BDD.
-}
buildBDDWithIds : NodeId -> Quota -> List PlayerWeight -> List Player -> Dict ( ( NodeId, Int ), PlayerId, ( NodeId, Int ) ) NodeId -> ( BDD, ( NodeId, Dict ( ( NodeId, Int ), PlayerId, ( NodeId, Int ) ) NodeId ) )
buildBDDWithIds id quota weights players dict1 =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            let
                ( lTree, ( lTreeId, dict2 ) ) =
                    buildBDDWithIds id (quota - w) ws ps dict1

                ( rTree, ( rTreeId, dict3 ) ) =
                    buildBDDWithIds lTreeId quota ws ps dict2

                nodeInfo =
                    ( case lTree of
                        Zero ->
                            ( 0, 0 )

                        One ->
                            ( 0, 1 )

                        _ ->
                            ( lTreeId, 2 )
                    , p.id
                    , case lTree of
                        Zero ->
                            ( 0, 0 )

                        One ->
                            ( 0, 1 )

                        _ ->
                            ( rTreeId, 2 )
                    )
            in
            ( case Dict.get nodeInfo dict3 of
                Just nodeId ->
                    Ref nodeId

                Nothing ->
                    Node { id = rTreeId, thenB = lTree, var = p.id, elseB = rTree }
            , ( rTreeId + 1
              , Dict.insert nodeInfo rTreeId dict3
              )
            )

        ( _, _ ) ->
            if quota > 0 then
                ( Zero, ( id, dict1 ) )
            else
                ( One, ( id, dict1 ) )


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
                first (buildBDDWithIds 0 rule.quota rule.weights game.players Dict.empty)
        )
