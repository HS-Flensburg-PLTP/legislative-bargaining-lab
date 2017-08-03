port module QOBDD
    exposing
        ( BDD(..)
          -- should not be exposed
        , QOBDD
        , coalitions
        , foldBDD
        , foldBDDShare
        , fullSize
        , parseMWVG
        , parsedMWVG
        , size
        )

import Dict exposing (Dict)
import Json.Decode as Json
import Json.Encode


type alias QOBDD =
    { vars : Int, bdd : BDD }


qobddDecoder : Json.Decoder QOBDD
qobddDecoder =
    Json.map2 QOBDD
        (Json.field "n" Json.int)
        (Json.field "root" treeDecoder)


size : QOBDD -> Int
size qobdd =
    sizeBDD qobdd.bdd


fullSize : QOBDD -> Int
fullSize qobdd =
    fullSizeBDD qobdd.bdd


coalitions : QOBDD -> Float
coalitions qobdd =
    coalitionsBDD (toFloat qobdd.vars) qobdd.bdd



-- coalitions qobdd = coalitionsTree qobdd.root


type BDD
    = Zero
    | One
    | Node { id : Int, var : Int, thenB : BDD, elseB : BDD }
    | Ref Int


foldBDD : b -> b -> (Int -> b) -> (Int -> Int -> b -> b -> b) -> BDD -> b
foldBDD zero one ref node bdd =
    case bdd of
        Zero ->
            zero

        One ->
            one

        Ref i ->
            ref i

        Node r ->
            node r.id r.var (foldBDD zero one ref node r.thenB) (foldBDD zero one ref node r.elseB)


foldBDDShare : b -> b -> (Int -> b -> b -> b) -> BDD -> b
foldBDDShare zero one node tree =
    Tuple.second (foldBDDShareDict zero one node tree Dict.empty)


foldBDDShareDict :
    b
    -> b
    -> (Int -> b -> b -> b)
    -> BDD
    -> Dict.Dict Int b
    -> ( Dict.Dict Int b, b )
foldBDDShareDict zero one node tree dict1 =
    case tree of
        Zero ->
            ( dict1, zero )

        One ->
            ( dict1, one )

        Node r ->
            let
                ( dict2, res1 ) =
                    foldBDDShareDict zero one node r.thenB dict1

                ( dict3, res2 ) =
                    foldBDDShareDict zero one node r.elseB dict2

                res =
                    node r.var res1 res2
            in
            ( Dict.insert r.id res dict3, res )

        Ref i ->
            case Dict.get i dict1 of
                Nothing ->
                    Debug.crash ("Ref " ++ toString i ++ " missing\n" ++ toString dict1)

                Just v ->
                    ( dict1, v )



-- foldBDDShareDict :
--     b
--     -> b
--     -> (Int -> b -> b -> b)
--     -> BDD
--     -> Dict Int b
--     -> ( Dict Int b, b )
-- foldBDDShareDict zero one node tree =
--     let
--         zeroS s =
--             ( s, zero )
--
--         oneS s =
--             ( s, one )
--     in
--     foldBDD zeroS oneS lookup (share node) tree
--
-- type alias State a s =
--     s -> ( s, a )
--
--
-- return_S : a -> State a s
-- return_S =
--     flip (,)
--
--
-- map2_S : (a -> b -> c) -> State a s -> State b s -> State c s
-- map2_S f sx sy s =
--     let
--         ( s1, x ) =
--             sx s
--
--         ( s2, y ) =
--             sy s1
--     in
--     ( s2, f x y )
--
--
-- modify_S : (s -> s) -> State a s -> State a s
-- modify_S f sx s =
--     let
--         ( s2, x ) =
--             sx s
--     in
--     ( f s2, x )
--
--
-- lookup : Int -> State b (Dict Int b)
-- lookup i dict =
--     case Dict.get i dict of
--         Nothing ->
--             Debug.crash ("Ref " ++ toString i ++ " missing\n" ++ toString dict)
--
--         Just v ->
--             ( dict, v )
--
--
-- share :
--     (Int -> a -> a -> a)
--     -> Int
--     -> Int
--     -> State a (Dict Int a)
--     -> State a (Dict Int a)
--     -> State a (Dict Int a)
-- share node id v ft fe s =
--     let
--         ( s1, res ) =
--             map2_S (node v) ft fe s
--     in
--     ( Dict.insert id res s1, res )


sizeBDD : BDD -> Int
sizeBDD =
    foldBDD 0 0 (\_ -> 0) (\_ _ s1 s2 -> s1 + s2 + 1)


fullSizeBDD : BDD -> Int
fullSizeBDD =
    foldBDDShare 0 0 (\_ s1 s2 -> s1 + s2 + 1)


coalitionsBDD : Float -> BDD -> Float
coalitionsBDD n bdd =
    foldBDDShare 0 (2 ^ n) (\_ ft fe -> (ft + fe) / 2) bdd



-- sizeTree : Tree -> Int
-- sizeTree = Tuple.second << sizeTreeDict Dict.empty
--
-- sizeTreeDict : Dict.Dict Int Int -> Tree -> (Dict.Dict Int Int, Int)
-- sizeTreeDict dict1 tree =
--   case tree of
--     Empty  -> (dict1, 0)
--     Node r ->
--       let (dict2, size1) = sizeTreeDict dict1 r.t
--           (dict3, size2) = sizeTreeDict dict2 r.e
--       in
--       (Dict.insert r.id (size1+size2+1) dict3, size1+size2+1)
--     Ref id ->
--        case Dict.get id dict1 of
--          Nothing -> Debug.crash ("Ref " ++ toString id ++ " missing\n" ++ toString dict1)
--          Just v -> (dict1, v)


leaf : List Int -> Float -> Int -> Json.Decoder ( List Int, BDD )
leaf l f v =
    if isInfinite f then
        Json.succeed
            ( l
            , if v == 0 then
                Zero
              else
                One
            )
    else
        Json.fail "no leaf"


node : Float -> Int -> BDD -> ( List Int, BDD ) -> ( List Int, BDD )
node var id t ( l, e ) =
    ( id :: l, Node { id = id, var = truncate var, thenB = t, elseB = e } )


ref : List Int -> Int -> Json.Decoder ( List Int, BDD )
ref l i =
    if List.member i l then
        Json.succeed ( l, Ref i )
    else
        Json.fail "no ref"


treeDecoder : Json.Decoder BDD
treeDecoder =
    Json.map Tuple.second (treeDecoderList [])


treeDecoderList : List Int -> Json.Decoder ( List Int, BDD )
treeDecoderList l =
    Json.oneOf
        [ Json.andThen
            (\v ->
                Json.andThen (\f -> leaf l f v) (Json.field "label" Json.float)
            )
            (Json.field "value" Json.int)
        , Json.andThen (ref l) (Json.field "id" Json.int)
        , Json.andThen
            (\label ->
                Json.andThen
                    (\id ->
                        Json.andThen
                            (\( l1, t ) ->
                                Json.map (node label id t)
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
