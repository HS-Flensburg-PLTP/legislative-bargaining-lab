module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import Dict exposing (Dict)
import QOBDD exposing (..)
import SimpleGame exposing (..)
import Tuple exposing (first)


{-| The node types is used to identify the type of BDD constructor
0 is used to represent the Zero constructor
1 is used to represent the One constructor
2 is used to indicates that Node and Ref constructor
-}
type alias NodeType =
    Int


{-| The type either contains a NodeId then the indicator is 2 or the indicator
indicates if the node is a Zero or a One leave.
-}
type alias EitherNodeId =
    ( NodeId, NodeType )


{-| Extracts information from a BDD node
-}
subTreeInfo : BDD -> EitherNodeId
subTreeInfo tree =
    case tree of
        Zero ->
            ( 0, 0 )

        One ->
            ( 0, 1 )

        Node nodeData ->
            ( nodeData.id, 2 )

        Ref id ->
            ( id, 2 )


{-| The type is used to hold specific information about a BDD node
and be used as comparable in a Dict type
-}
type alias NodeInfo =
    ( EitherNodeId, PlayerId, EitherNodeId )


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
                first (buildBDD 0 rule.quota rule.weights game.players Dict.empty)
        )
