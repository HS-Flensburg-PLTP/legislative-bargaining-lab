module QOBDDBuilders exposing
    ( LookUpTables
    , NInfo
    , apply
    , build
    , buildQOBDD
    , buildRec
    , insert
    , joinTree
    , lookup
    )

import Dict exposing (Dict)
import QOBDD exposing (..)
import SimpleGame exposing (..)


{-| x is the smallest weight in the winning coalition of a node. If all coalitions are winning is
x = - inf. Are all coalitions loosing is x = 0.
y is the largest weight in the loosing coalition of a node. If all coalitions are losing is y = inf
are all coalitions winning is x = 0.
-}
type alias NInfo =
    { v : BDD, x : Float, y : Float }


{-| Contains the lookup table for each player. (The single lookup tables should be AVL Trees)
-}
type alias LookUpTables =
    Dict PlayerId (List NInfo)


{-| The function tries to find a sub-tree for player i that has already
been created and can be used for the given quota again. (for the buildRec algorithm)
-}
lookup : LookUpTables -> PlayerId -> Quota -> Maybe NInfo
lookup tables playerId quota =
    case Dict.get playerId tables of
        Nothing ->
            Nothing

        Just table ->
            case List.filter (\info -> (info.x < toFloat quota) && (info.y >= toFloat quota)) table of
                [] ->
                    Nothing

                [ info ] ->
                    Just info

                infos ->
                    Nothing


{-| Insert a sub-tree in the LookUpTable for a specific player. (should be implemented as AVL Tree)
-}
insert2 : LookUpTables -> PlayerId -> NInfo -> LookUpTables
insert2 tables playerId nodeInfo =
    case Dict.get playerId tables of
        Nothing ->
            Dict.insert playerId [ nodeInfo ] tables

        Just table ->
            Dict.insert playerId (nodeInfo :: table) tables


{-| The function is used to build a single BDD.
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

                        node =
                            Node { id = nodeId3, thenB = infoT.v, var = p.id, elseB = infoE.v }

                        info =
                            { v = node, x = x1, y = y1 }

                        ref =
                            Ref { id = nodeId3, bdd = node }

                        refInfo =
                            { v = ref, x = x1, y = y1 }
                    in
                    ( nodeId3 + 1, info, insert2 tables3 p.id refInfo )

        ( _, _ ) ->
            if quota > 0 then
                ( nodeId1, { v = Zero, x = 0, y = 1 / 0 }, tables1 )

            else
                ( nodeId1, { v = One, x = -1 / 0, y = 0 }, tables1 )


op2Int : Op -> Int
op2Int op =
    case op of
        And ->
            0

        Or ->
            1


{-| Abstract used to circumvent restriction that keys of a dictionary have to be comparable
-}
get : ( NodeId, NodeId, Op ) -> Dict ( NodeId, NodeId, Int ) BDD -> Maybe BDD
get ( node1, node2, op ) =
    Dict.get ( node1, node2, op2Int op )


insert :
    ( NodeId, NodeId, Op )
    -> BDD
    -> Dict ( NodeId, NodeId, Int ) BDD
    -> Dict ( NodeId, NodeId, Int ) BDD
insert ( node1, node2, op ) bdd dict =
    Dict.insert ( node1, node2, op2Int op ) bdd dict


{-| Creates a BDD by applying a binary operation to two BDD's.
-}
apply : BDD -> BDD -> Op -> Dict ( NodeId, NodeId, Int ) BDD -> ( BDD, Dict ( NodeId, NodeId, Int ) BDD )
apply tree1 tree2 op dict1 =
    let
        applyNonRefs a b dict =
            let
                ( lBdd, dict2 ) =
                    apply a.thenB b.thenB op dict1

                ( rBdd, dict3 ) =
                    apply a.elseB b.elseB op dict2

                node =
                    Node { id = a.id, thenB = lBdd, var = a.var, elseB = rBdd }
            in
            ( node, insert ( a.id, b.id, op ) (Ref { id = a.id, bdd = node }) dict3 )
    in
    case ( tree1, tree2 ) of
        ( Zero, _ ) ->
            case op of
                And ->
                    ( Zero, dict1 )

                Or ->
                    ( tree2, dict1 )

        ( _, Zero ) ->
            case op of
                And ->
                    ( Zero, dict1 )

                Or ->
                    ( tree1, dict1 )

        ( One, _ ) ->
            case op of
                And ->
                    ( tree2, dict1 )

                Or ->
                    ( One, dict1 )

        ( _, One ) ->
            case op of
                And ->
                    ( tree1, dict1 )

                Or ->
                    ( One, dict1 )

        ( Ref a, Ref b ) ->
            case get ( a.id, b.id, op ) dict1 of
                Just refNode ->
                    ( refNode, dict1 )

                Nothing ->
                    apply a.bdd b.bdd op dict1

        ( Ref a, b ) ->
            apply a.bdd b op dict1

        ( a, Ref b ) ->
            apply a b.bdd op dict1

        ( Node a, Node b ) ->
            applyNonRefs a b dict1


{-| Uses apply to create a single BDD from a JoinTree.
-}
joinTree : JoinTree -> List Player -> List RuleMVG -> Maybe BDD
joinTree jTree players rules =
    case jTree of
        Var str ->
            case String.toInt str of
                Ok ruleid ->
                    case List.drop (ruleid - 1) rules of
                        r :: rs ->
                            Just (build r players)

                        _ ->
                            Nothing

                Err _ ->
                    Nothing

        BinOp op tree1 tree2 ->
            case ( joinTree tree1 players rules, joinTree tree2 players rules ) of
                ( Just left, Just right ) ->
                    Just (Tuple.first (apply left right op Dict.empty))

                _ ->
                    Nothing


{-| Uses the buildRec algorithm to create a BDD based on the rule defined in the RuleMVG type.
-}
build : RuleMVG -> List Player -> BDD
build rule players =
    let
        ( id, info, tables ) =
            buildRec 0 rule.quota rule.weights players Dict.empty
    in
    info.v


{-| Builds a QOBDD based on a single single rule or an entire JoinTree.
-}
buildQOBDD : SimpleGame -> Maybe QOBDD
buildQOBDD game =
    case joinTree game.joinTree game.players game.rules of
        Nothing ->
            Nothing

        Just bdd ->
            Just (QOBDD game.playerCount bdd)
