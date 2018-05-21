module SimpleGame exposing (..)

import Json.Decode exposing (..)
import List exposing (..)
import Result exposing (..)
import String exposing (..)


-- some test games in string form


test =
    """3
2
1
1
"""



-- better design of combine function.
-- is part of module Result.Extra (problem installing it!)


combine : List (Result x a) -> Result x (List a)
combine =
    List.foldr (Result.map2 (::)) (Ok [])


parseSimpleGameStr : String -> Result String (List Int)
parseSimpleGameStr jstr =
    combine__ (List.map (\x -> decodeString int x) (lines (trimRight jstr)))



-- first idea


combine_ : List (Result x a) -> Result x (List a)
combine_ rlist =
    case rlist of
        [] ->
            Ok []

        res :: ress ->
            case res of
                Ok val ->
                    Result.andThen (\vals -> Ok (val :: vals)) (combine_ ress)

                Err err ->
                    Err err



-- improved desgin


combine__ : List (Result x a) -> Result x (List a)
combine__ rlist =
    List.foldr
        (\res rvals ->
            case res of
                Err err ->
                    Err err

                Ok val ->
                    Result.andThen (\y -> Ok (val :: y)) rvals
        )
        (Ok [])
        rlist


type alias SimpleGame =
    { quota : Int, waights : List Int }


test_parse_mwvg : String -> SimpleGame
test_parse_mwvg strGame =
    case parseSimpleGameStr strGame of
        Err _ ->
            { quota = 0, waights = [] }

        Ok vals ->
            case List.head vals of
                Just val ->
                    { quota = val, waights = drop 1 vals }

                Nothing ->
                    { quota = 0, waights = [] }


test_show_game : SimpleGame -> String
test_show_game game =
    toString game



-- Type close to js class.
-- id could be represented as the index number in the list.


type alias Player =
    { name : String, id : Int, m : Int }



-- waight is maped with player by the index in the list


type alias Rule =
    { waights : List Int, quota : Int }


type alias SimpleGame_2 =
    { player : List Player, rules : List Rule }
