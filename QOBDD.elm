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
size =
    foldQOBDD 0 0 (\_ -> 0) (\_ s1 _ s2 -> s1 + s2 + 1)


fullSize : QOBDD -> Int
fullSize =
    foldQOBDDShare 0 0 (\s1 _ s2 -> s1 + s2 + 1)


coalitions : QOBDD -> Float
coalitions qobdd =
    foldQOBDDShare 0 (2 ^ toFloat qobdd.vars) (\ft _ fe -> (ft + fe) / 2) qobdd


foldQOBDD : b -> b -> (Int -> b) -> (Int -> b -> Variable -> b -> b) -> QOBDD -> b
foldQOBDD zero one ref node qobdd =
    foldBDD zero one ref node qobdd.bdd


foldQOBDDShare : b -> b -> (b -> Variable -> b -> b) -> QOBDD -> b
foldQOBDDShare zero one node qobdd =
    foldBDDShare zero one node qobdd.bdd


type alias Variable =
    Int


type alias Id =
    Int


type BDD
    = Zero
    | One
    | Node { id : Id, thenB : BDD, var : Variable, elseB : BDD }
    | Ref Id


foldBDD : b -> b -> (Id -> b) -> (Id -> b -> Variable -> b -> b) -> BDD -> b
foldBDD zero one ref node bdd =
    case bdd of
        Zero ->
            zero

        One ->
            one

        Ref i ->
            ref i

        Node { id, thenB, var, elseB } ->
            node id (foldBDD zero one ref node thenB) var (foldBDD zero one ref node elseB)


foldBDDShare : b -> b -> (b -> Variable -> b -> b) -> BDD -> b
foldBDDShare zero one node tree =
    Tuple.second (foldBDDShareDict zero one node tree Dict.empty)


error : Int -> Dict Id b -> String
error i dict =
    "Ref " ++ Debug.toString i ++ " missing\n" ++ Debug.toString dict



-- foldBDDShareDict :
--     b
--     -> b
--     -> (b -> Int -> b -> b)
--     -> BDD
--     -> Dict.Dict Int b
--     -> ( Dict.Dict Int b, b )
-- foldBDDShareDict zero one node tree dict =
--     case tree of
--         Zero ->
--             ( dict, zero )
--
--         One ->
--             ( dict, one )
--
--         Node { id, thenB, var, elseB } ->
--             let
--                 ( dict1, res1 ) =
--                     foldBDDShareDict zero one node thenB dict
--
--                 ( dict2, res2 ) =
--                     foldBDDShareDict zero one node elseB dict1
--
--                 res =
--                     node res1 var res2
--             in
--             ( Dict.insert id res dict2, res )
--
--         Ref i ->
--             case Dict.get i dict of
--                 Nothing ->
--                     Debug.crash (error i dict)
--
--                 Just v ->
--                     ( dict, v )


foldBDDShareDict :
    b
    -> b
    -> (b -> Variable -> b -> b)
    -> BDD
    -> Dict Id b
    -> ( Dict Id b, b )
foldBDDShareDict zero one node =
    let
        zeroS dict =
            ( dict, zero )

        oneS dict =
            ( dict, one )

        refS i dict =
            ( dict, unsafeGet i dict )

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


unsafeGet : Id -> Dict Id a -> a
unsafeGet i dict =
    case Dict.get i dict of
        Nothing ->
            Debug.todo (error i dict)

        Just v ->
            v



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
--
-- lookup : Int -> Dict Int b -> ( Dict Int b, b )
-- lookup i dict =
--     case Dict.get i dict of
--         Nothing ->
--             Debug.crash ("Ref " ++ toString i ++ " missing\n" ++ toString dict)
--
--         Just v ->
--             ( dict, v )
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


buildLeaf : List Int -> Float -> Int -> Json.Decoder ( List Int, BDD )
buildLeaf l f v =
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


buildNode : Float -> Int -> BDD -> ( List Int, BDD ) -> ( List Int, BDD )
buildNode var id t ( l, e ) =
    ( id :: l, Node { id = id, var = truncate var, thenB = t, elseB = e } )


buildRef : List Int -> Int -> Json.Decoder ( List Int, BDD )
buildRef l i =
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
                Json.andThen (\f -> buildLeaf l f v) (Json.field "label" Json.float)
            )
            (Json.field "value" Json.int)
        , Json.andThen (buildRef l) (Json.field "id" Json.int)
        , Json.andThen
            (\label ->
                Json.andThen
                    (\id ->
                        Json.andThen
                            (\( l1, t ) ->
                                Json.map (buildNode label id t)
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
                    Debug.todo "Parse error"
        )
