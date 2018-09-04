module QOBDDBuilders exposing (..)

--(fromSGToSimpleQOBDD, buildQOBDD)

import Dict exposing (Dict)
import QOBDD exposing (..)
import SimpleGame exposing (..)


{-| Binary operations : 0 is and 1 is or
-}
type alias BOP =
    Int


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


{-| x is the smallest weight in the winning coalition of a node. if all coalitions are winning is
x = - inf. are all coalitions loosing is x = 0.
y is the largest weight in the loosing coalition of a node. if all coalitions are losing is y = inf
are all coalitions winning is x = 0.
-}
type alias NInfo =
    { v : BDD, x : Float, y : Float }


{-| Contains the lookup table for each player
-}
type alias LookUpTables =
    Dict PlayerId (List NInfo)


{-| the function tries to find a sub-tree for player i that has already
been created and can be used for the given quota again. (for the buildRec algorithm)
-}
lookup : LookUpTables -> PlayerId -> Quota -> Maybe NInfo
lookup tables i q =
    case Dict.get i tables of
        Nothing ->
            Nothing

        Just table ->
            case List.filter (\info -> (info.x < toFloat q) && (info.y >= toFloat q)) table of
                [] ->
                    Nothing

                [ info ] ->
                    Just info

                infos ->
                    Nothing


{-| insert a sub-tree with node information in the table for a specific player. (for the buildRec algorithm)
-}
insert : LookUpTables -> PlayerId -> NInfo -> LookUpTables
insert tables i v =
    case Dict.get i tables of
        Nothing ->
            Dict.insert i [ v ] tables

        Just table ->
            Dict.insert i (v :: table) tables


{-| The function is used to build a BDD.
-}
buildRec :
    NodeId
    -> Quota
    -> List PlayerWeight
    -> List Player
    -> LookUpTables
    -> ( NodeId, NInfo, LookUpTables )
buildRec nodeId1 quota weights players tables1 =
    case ( weights, players ) of
        ( w :: ws, p :: ps ) ->
            case lookup tables1 p.id quota of
                Just nodeInfo ->
                    ( nodeId1, nodeInfo, tables1 )

                Nothing ->
                    let
                        ( nodeId2, infoT, tables2 ) =
                            buildRec nodeId1 (quota - w) ws ps tables1

                        ( nodeId3, infoE, tables3 ) =
                            buildRec nodeId2 quota ws ps tables2

                        ( x1, y1 ) =
                            ( max (infoT.x + toFloat w) infoE.x, min (infoT.y + toFloat w) infoE.y )

                        newNode =
                            Node { id = nodeId3, thenB = infoT.v, var = p.id, elseB = infoE.v }

                        newInfo =
                            { v = newNode, x = x1, y = y1 }
                    in
                    ( nodeId3 + 1, newInfo, insert tables3 p.id newInfo )

        ( _, _ ) ->
            if quota > 0 then
                ( nodeId1, { v = Zero, x = 0, y = 1 / 0 }, tables1 )
            else
                ( nodeId1, { v = One, x = -1 / 0, y = 0 }, tables1 )



--{-| Recursively calls itself to generate a BDD.
---}
--buildBDD :
--    NodeId
--    -> Quota
--    -> List PlayerWeight
--    -> List Player
--    -> Dict NodeInfo BDD
--    -> ( BDD, ( NodeId, Dict NodeInfo BDD ) )
--buildBDD id quota weights players dict1 =
--    case ( weights, players ) of
--        ( w :: ws, p :: ps ) ->
--            let
--                ( lTree, ( lTreeId, dict2 ) ) =
--                    buildBDD id (quota - w) ws ps dict1
--
--                ( rTree, ( rTreeId, dict3 ) ) =
--                    buildBDD lTreeId quota ws ps dict2
--
--                nodeInfo =
--                    ( subTreeInfo lTree
--                    , p.id
--                    , subTreeInfo rTree
--                    )
--            in
--            case Dict.get nodeInfo dict3 of
--                Just refNode ->
--                    ( refNode, ( rTreeId, dict3 ) )
--
--                Nothing ->
--                    let
--                        refNode =
--                            Node { id = rTreeId, thenB = lTree, var = p.id, elseB = rTree }
--                    in
--                    ( refNode
--                    , ( rTreeId + 1
--                      , Dict.insert nodeInfo refNode dict3
--                      )
--                    )
--
--        ( _, _ ) ->
--            if quota > 0 then
--                ( Zero, ( id, dict1 ) )
--            else
--                ( One, ( id, dict1 ) )


{-| Creates a BDD by applying a binary operation to two BDD's
-}
apply : BDD -> BDD -> BOP -> Dict ( NodeId, NodeId, BOP ) BDD -> Maybe ( BDD, Dict ( NodeId, NodeId, BOP ) BDD )
apply tree1 tree2 op dict1 =
    case ( tree1, tree2 ) of
        ( Node a, Node b ) ->
            case Dict.get ( a.id, b.id, op ) dict1 of
                Just refNode ->
                    Just ( refNode, dict1 )

                Nothing ->
                    case apply a.thenB b.thenB op dict1 of
                        Nothing ->
                            Nothing

                        Just ( lBdd, dict2 ) ->
                            case apply a.elseB b.elseB op dict2 of
                                Nothing ->
                                    Nothing

                                Just ( rBdd, dict3 ) ->
                                    let
                                        refNode =
                                            Node { id = a.id, thenB = lBdd, var = a.var, elseB = rBdd }
                                    in
                                    Just ( refNode, dict3 )

        ( Ref _, _ ) ->
            Nothing

        ( _, Ref _ ) ->
            Nothing

        ( sinka, sinkb ) ->
            case ( sinka, sinkb, op ) of
                ( One, One, 0 ) ->
                    Just ( One, dict1 )

                ( _, _, 0 ) ->
                    Just ( Zero, dict1 )

                ( Zero, Zero, 1 ) ->
                    Just ( Zero, dict1 )

                ( _, _, 1 ) ->
                    Just ( One, dict1 )

                ( _, _, _ ) ->
                    Just ( Ref 0, dict1 )


{-| Takes a SimpleGame and generates a QOBDD
(at the moment just for the first game rule only)
-}



--fromSGToSimpleQOBDD : SimpleGame -> QOBDD
--fromSGToSimpleQOBDD game =
--    QOBDD game.playerCount
--        (case game.rules of
--            [] ->
--                Zero
--
--            rule :: rules ->
--                first (buildBDD 2 rule.quota rule.weights game.players Dict.empty)
--        )


joinTree : JoinTree -> List Player -> List RuleMVG -> Maybe BDD
joinTree jTree players rules =
    case jTree of
        BoolVar str ->
            case String.toInt str of
                Ok ruleid ->
                    case List.drop (ruleid - 1) rules of
                        r :: rs ->
                            Just (build r players)

                        _ ->
                            Nothing

                Err _ ->
                    Nothing

        BoolAnd tree1 tree2 ->
            case ( joinTree tree1 players rules, joinTree tree2 players rules ) of
                ( Just left, Just right ) ->
                    case apply left right 0 Dict.empty of
                        Nothing ->
                            Nothing

                        Just ( bdd, dict ) ->
                            Just bdd

                _ ->
                    Nothing

        BoolOr tree1 tree2 ->
            case ( joinTree tree1 players rules, joinTree tree2 players rules ) of
                ( Just left, Just right ) ->
                    case apply left right 1 Dict.empty of
                        Nothing ->
                            Nothing

                        Just ( bdd, dict ) ->
                            Just bdd

                _ ->
                    Nothing


build : RuleMVG -> List Player -> BDD
build rule players =
    let
        ( id, info, tables ) =
            buildRec 0 rule.quota rule.weights players Dict.empty
    in
    info.v


buildQOBDD : SimpleGame -> Maybe QOBDD
buildQOBDD game =
    case game.joinTree of
        Nothing ->
            case game.rules of
                [ rule ] ->
                    Just (QOBDD game.playerCount (build rule game.players))

                _ ->
                    Nothing

        Just tree ->
            case joinTree tree game.players game.rules of
                Nothing ->
                    Nothing

                Just bdd ->
                    Just (QOBDD game.playerCount bdd)
