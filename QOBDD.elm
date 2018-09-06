port module QOBDD exposing
    (  BDD(..)
       -- should not be exposed

    , NodeId
    , PlayerId
    , QOBDD
    , coalitions
    , foldBDD
    , foldBDDShare
    , fullSize
    , nodeId
    , parseMWVG
    , parsedMWVG
    , pretty
    , prettyQOBDD
    , size
    )

import Dict exposing (Dict)
import Json.Decode as Json
import Json.Encode


type alias PlayerId =
    Int


type alias NodeId =
    Int


{-| Because Elm is strict we protect the shared bdd from beeing evaluated by a function type
-}
type BDD
    = Zero
    | One
    | Node { id : NodeId, thenB : BDD, var : PlayerId, elseB : BDD }
    | Ref { id : NodeId, bdd : BDD }


nodeId : BDD -> NodeId
nodeId bdd =
    case bdd of
        Zero ->
            0

        One ->
            1

        Ref node ->
            node.id

        Node node ->
            node.id


prettyQOBDD : QOBDD -> String
prettyQOBDD qobdd =
    "{ " ++ toString qobdd.vars ++ ", " ++ pretty qobdd.bdd ++ " }"


pretty : BDD -> String
pretty bdd =
    case bdd of
        Zero ->
            "Zero"

        One ->
            "One"

        Ref { id, bdd } ->
            "(Ref " ++ toString id ++ ")"

        Node { id, thenB, var, elseB } ->
            "(Node " ++ pretty thenB ++ " " ++ toString var ++ " " ++ pretty elseB ++ " ID:" ++ toString id ++ ")"


foldBDD : b -> b -> (NodeId -> (() -> b) -> b) -> (NodeId -> b -> PlayerId -> b -> b) -> BDD -> b
foldBDD zero one ref node bdd =
    case bdd of
        Zero ->
            zero

        One ->
            one

        Ref { id, bdd } ->
            ref id (\() -> foldBDD zero one ref node bdd)

        Node { id, thenB, var, elseB } ->
            node id (foldBDD zero one ref node thenB) var (foldBDD zero one ref node elseB)


foldBDDShareDict :
    b
    -> b
    -> (b -> PlayerId -> b -> b)
    -> BDD
    -> Dict NodeId b
    -> ( Dict NodeId b, b )
foldBDDShareDict zero one node =
    let
        zeroS dict =
            ( dict, zero )

        oneS dict =
            ( dict, one )

        refS id _ dict =
            ( dict, unsafeGet id dict )

        nodeS id thenF var elseF dict =
            let
                ( dict1, res1 ) =
                    thenF dict

                ( dict2, res2 ) =
                    elseF dict1

                res =
                    node res1 var res2
            in
            ( Dict.insert id res dict2, res )
    in
    foldBDD zeroS oneS refS nodeS


unsafeGet : NodeId -> Dict NodeId a -> a
unsafeGet i dict =
    case Dict.get i dict of
        Nothing ->
            Debug.crash (error i dict)

        Just v ->
            v


foldBDDShare : b -> b -> (b -> PlayerId -> b -> b) -> BDD -> b
foldBDDShare zero one node tree =
    Tuple.second (foldBDDShareDict zero one node tree Dict.empty)


error : Int -> Dict NodeId b -> String
error i dict =
    "Ref " ++ toString i ++ " missing\n" ++ toString dict


foldQOBDD : b -> b -> (Int -> (() -> b) -> b) -> (Int -> b -> PlayerId -> b -> b) -> QOBDD -> b
foldQOBDD zero one ref node qobdd =
    foldBDD zero one ref node qobdd.bdd


foldQOBDDShare : b -> b -> (b -> PlayerId -> b -> b) -> QOBDD -> b
foldQOBDDShare zero one node qobdd =
    foldBDDShare zero one node qobdd.bdd


type alias QOBDD =
    { vars : Int, bdd : BDD }


qobddDecoder : Json.Decoder QOBDD
qobddDecoder =
    Json.map2 QOBDD
        (Json.field "n" Json.int)
        (Json.field "root" treeDecoder)


size : QOBDD -> Int
size =
    foldQOBDD 0 0 (\_ _ -> 0) (\_ s1 _ s2 -> s1 + s2 + 1)


fullSize : QOBDD -> Int
fullSize =
    foldQOBDDShare 0 0 (\s1 _ s2 -> s1 + s2 + 1)


coalitions : QOBDD -> Float
coalitions qobdd =
    foldQOBDDShare 0 (2 ^ toFloat qobdd.vars) (\ft _ fe -> (ft + fe) / 2) qobdd


leaf : Dict Int BDD -> Float -> Int -> Json.Decoder ( Dict Int BDD, BDD )
leaf dict f v =
    if isInfinite f then
        Json.succeed
            ( dict
            , if v == 0 then
                Zero

              else
                One
            )

    else
        Json.fail "no leaf"


node : Float -> Int -> BDD -> BDD -> Dict Int BDD -> ( Dict Int BDD, BDD )
node var id t e dict =
    case Dict.get id dict of
        Just node ->
            ( dict, node )

        Nothing ->
            let
                node =
                    Node { id = id, var = truncate var, thenB = t, elseB = e }
            in
            ( Dict.insert id (Ref { id = id, bdd = node }) dict, node )


treeDecoder : Json.Decoder BDD
treeDecoder =
    Json.map Tuple.second (treeDecoderList Dict.empty)


treeDecoderList : Dict Int BDD -> Json.Decoder ( Dict Int BDD, BDD )
treeDecoderList l =
    Json.oneOf
        [ Json.andThen
            (\v ->
                Json.andThen (\f -> leaf l f v) (Json.field "label" Json.float)
            )
            (Json.field "value" Json.int)
        , Json.andThen
            (\label ->
                Json.andThen
                    (\id ->
                        Json.andThen
                            (\( l1, t ) ->
                                Json.map (\( dict, e ) -> node label id t e dict)
                                    (Json.field "e" (Json.lazy (\_ -> treeDecoderList l1)))
                            )
                            (Json.field "t" (Json.lazy (\_ -> treeDecoderList l)))
                    )
                    (Json.field "id" Json.int)
            )
            (Json.field "label" Json.float)
        ]


port parseMWVG : String -> Cmd msg


port parsedMWVGJson : (Json.Encode.Value -> msg) -> Sub msg


parsedMWVG : (QOBDD -> msg) -> Sub msg
parsedMWVG f =
    parsedMWVGJson
        (\v ->
            case Json.decodeValue qobddDecoder v of
                Ok r ->
                    f r

                Err _ ->
                    Debug.crash "Parse error"
        )
