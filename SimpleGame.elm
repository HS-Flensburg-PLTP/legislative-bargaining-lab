port module SimpleGame exposing (..)

import Json.Decode as Json
import Json.Encode
import List exposing (..)
import Result exposing (..)


type JoinTree
    = BoolVar String
    | BoolAnd JoinTree JoinTree
    | BoolOr String JoinTree JoinTree


type alias Player =
    { m : Int, name : String, id : Int }


type alias RuleMVG =
    { quota : Int, weights : List Int }


type alias SimpleGame =
    { n : Int, rules : List RuleMVG, ruleCount : Int, players : List Player, joinTree : Maybe JoinTree }


joinTreeDecoder : Json.Decoder JoinTree
joinTreeDecoder =
    Json.oneOf
        [ Json.map3 BoolOr
            (Json.field "kind" Json.string)
            (Json.field "left" (Json.lazy (\_ -> joinTreeDecoder)))
            (Json.field "right" (Json.lazy (\_ -> joinTreeDecoder)))
        , Json.map BoolVar (Json.field "name" Json.string)
        , Json.map2 BoolAnd
            (Json.field "left" (Json.lazy (\_ -> joinTreeDecoder)))
            (Json.field "right" (Json.lazy (\_ -> joinTreeDecoder)))
        ]


{-| decoder for js player
-}
playerDecoder : Json.Decoder Player
playerDecoder =
    Json.map3 Player
        (Json.field "m" Json.int)
        (Json.field "name" (Json.oneOf [ Json.string, Json.succeed "" ]))
        (Json.field "id" Json.int)


{-| decoder for js rule objects
-}
ruleDecoder : Json.Decoder RuleMVG
ruleDecoder =
    Json.map2 RuleMVG
        (Json.field "quota" Json.int)
        (Json.field "weights" (Json.list (Json.oneOf [ Json.int, Json.succeed 0 ])))


{-| like take just reversed
-}
takeReverse : Int -> List a -> List a
takeReverse n l =
    reverse (take n (reverse l))


{-| removes artifacts coursed by undefined objects in js lists
-}
cleanRules : Int -> RuleMVG -> RuleMVG
cleanRules n rule =
    { rule | weights = takeReverse n rule.weights }


{-| removes artifacts coursed by undefined objects in js lists
-}
cleanSimpleGame : SimpleGame -> SimpleGame
cleanSimpleGame game =
    { game | rules = List.map (\rule -> cleanRules game.n rule) (takeReverse game.ruleCount game.rules) }


{-| decodes Json to Elm Simple Game
-}
simpleGameDecoder : Json.Decoder SimpleGame
simpleGameDecoder =
    Json.map5 SimpleGame
        (Json.field "n" Json.int)
        (Json.field "rules" (Json.list (Json.oneOf [ ruleDecoder, Json.succeed (RuleMVG 0 []) ])))
        (Json.field "ruleCount" Json.int)
        (Json.field "classes" (Json.list playerDecoder))
        (Json.field "joinTree" (Json.nullable joinTreeDecoder))


port parseSimpleGame : String -> Cmd msg


port parsedSimpleGameJson : (Json.Encode.Value -> msg) -> Sub msg


{-| decodes js simple games object as elm object and produces massage with the elm object
-}
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
