port module SimpleGame exposing (..)

import Json.Decode as Json
import Json.Encode
import List exposing (..)
import Result exposing (..)


type alias RuleMVG =
    { quota : Int, weights : List Int }


type alias SimpleGame =
    { n : Int, rules : List RuleMVG, ruleCount : Int }


ruleDecoder : Json.Decoder RuleMVG
ruleDecoder =
    Json.map2 RuleMVG
        (Json.field "quota" Json.int)
        (Json.field "weights" (Json.list (Json.oneOf [ Json.int, Json.succeed 0 ])))


takeReverse : Int -> List a -> List a
takeReverse n l =
    reverse (take n (reverse l))


cleanRules : Int -> RuleMVG -> RuleMVG
cleanRules n rule =
    { rule | weights = takeReverse n rule.weights }


cleanSimpleGame : SimpleGame -> SimpleGame
cleanSimpleGame game =
    { game | rules = List.map (\rule -> cleanRules game.n rule) (takeReverse game.ruleCount game.rules) }


simpleGameDecoder : Json.Decoder SimpleGame
simpleGameDecoder =
    Json.map3 SimpleGame
        (Json.field "n" Json.int)
        (Json.field "rules" (Json.list (Json.oneOf [ ruleDecoder, Json.succeed (RuleMVG 0 []) ])))
        (Json.field "ruleCount" Json.int)


port parseSimpleGame : String -> Cmd msg


port parsedSimpleGameJson : (Json.Encode.Value -> msg) -> Sub msg


parsedSimpleGame : (SimpleGame -> msg) -> Sub msg
parsedSimpleGame f =
    parsedSimpleGameJson
        (\v ->
            case Json.decodeValue simpleGameDecoder v of
                Ok r ->
                    f (cleanSimpleGame r)

                Err _ ->
                    Debug.crash "Parse error"
        )
