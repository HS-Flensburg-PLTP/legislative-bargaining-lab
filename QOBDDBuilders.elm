module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import Dict exposing (Dict)
import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-| Extracts information from a BDD node
-}
subTreeInfo : BDD -> NodeId
subTreeInfo tree =
    case tree of
        Zero ->
            0

        One ->
            1

        Node nodeData ->
            nodeData.id

        Ref id ->
            id


{-| The type is used to hold specific information about a BDD node
and be used as comparable in a Dict type
-}
type alias NodeInfo =
    ( NodeId, PlayerId, NodeId )


{-| Recursively calls itself to generate a BDD.
-}
buildBDD :
    NodeId
    -> Quota
    -> List PlayerWeight
    -> List Player
    -> Dict NodeInfo NodeId
    -> ( BDD, ( NodeId, Dict NodeInfo NodeId ) )
buildBDD id quota weights players dict1 =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            let
                ( lTree, ( lTreeId, dict2 ) ) =
                    buildBDD id (quota - w) ws ps dict1

                ( rTree, ( rTreeId, dict3 ) ) =
                    buildBDD lTreeId quota ws ps dict2

                nodeInfo =
                    ( subTreeInfo lTree
                    , p.id
                    , subTreeInfo rTree
                    )
            in
            case Dict.get nodeInfo dict3 of
                Just nodeId ->
                    ( Ref nodeId, ( rTreeId, dict3 ) )

                Nothing ->
                    ( Node { id = rTreeId, thenB = lTree, var = p.id, elseB = rTree }
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
(at the moment just for the first game rule only)
-}
fromSGToSimpleQOBDD : SimpleGame -> QOBDD
fromSGToSimpleQOBDD game =
    QOBDD game.playerCount
        (case game.rules of
            [] ->
                Zero

            rule :: rules ->
                first (buildBDD 2 rule.quota rule.weights game.players Dict.empty)
        )
