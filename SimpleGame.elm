port module SimpleGame exposing (..)

import Json.Decode as Json
import Json.Encode
import List exposing (..)
import Result exposing (..)
import String


type alias RuleMVG =
    { quota : Int, weight : Int} --, weights : List Int }


type alias SimpleGame =
    { n : Int, rules : RuleMVG } -- should be a list

-- how to handel empty 
ruleDecoder : Json.Decoder RuleMVG
ruleDecoder =
    Json.map2 RuleMVG
        (Json.field "quota" Json.int)
            (Json.field "weights" (Json.index 1 Json.int))
        --(Json.field "weights" (Json.list ( Json.oneOf [Json.int, Json.null 0])))
--        (Json.field "weights"
--            (Json.list
--                (Json.oneOf
--                    [ Json.int
--                    , Json.null 0
--                    ]
--                )
--            )
--        )


-- first element is empty
-- how to handel the case that there are no simple games
-- how to handel self ref.
simpleGameDecoder : Json.Decoder SimpleGame
simpleGameDecoder =
    Json.map2 SimpleGame
        (Json.field "n" Json.int)
        (Json.field "rules" (Json.index 1 ruleDecoder))
--            (Json.oneOf
--                [ ruleDecoder
--                , Json.null (RuleMVG 0 [])
--                ]
--            )
--        )


port parseSimpleGame : String -> Cmd msg


port parsedSimpleGameJson : (Json.Encode.Value -> msg) -> Sub msg


parsedSimpleGame : (SimpleGame -> msg) -> Sub msg
parsedSimpleGame f =
    parsedSimpleGameJson
        (\v ->
            case Json.decodeValue simpleGameDecoder v of
                Ok r ->
                    f r

                Err _ ->
                    Debug.crash "Parse error"
        )
