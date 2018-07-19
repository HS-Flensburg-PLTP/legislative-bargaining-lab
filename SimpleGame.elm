port module SimpleGame exposing (..)

import Json.Decode as Json
import Json.Encode
import List exposing (..)
import Result exposing (..)


type JoinTree
    = BoolVar String
    | BoolAnd JoinTree JoinTree
    | BoolOr JoinTree JoinTree


type alias PlayerId =
    Int


type alias Quota =
    Int


type alias PlayerWeight =
    Int


type alias Player =
    { name : String, id : PlayerId }


type alias RuleMVG =
    { quota : Quota, weights : List PlayerWeight }


type alias SimpleGame =
    { playerCount : Int, rules : List RuleMVG, ruleCount : Int, players : List Player, joinTree : Maybe JoinTree }


joinTreeDecoder : Json.Decoder JoinTree
joinTreeDecoder =
    Json.oneOf
        [ Json.map3 (\_ l r -> BoolOr l r)
            (Json.field "kind" Json.string)
            (Json.field "left" (Json.lazy (\_ -> joinTreeDecoder)))
            (Json.field "right" (Json.lazy (\_ -> joinTreeDecoder)))

        --Json.field "kind" Json.string |> Json.andThen boolOrNodeDecoder
        , Json.map BoolVar (Json.field "name" Json.string)
        , Json.map2 BoolAnd
            (Json.field "left" (Json.lazy (\_ -> joinTreeDecoder)))
            (Json.field "right" (Json.lazy (\_ -> joinTreeDecoder)))
        ]


{-| decoder for js player
-}
playerDecoder : Json.Decoder Player
playerDecoder =
    Json.map2 Player
        (Json.field "name" (Json.oneOf [ Json.string, Json.succeed "" ]))
        (Json.field "id" Json.int)


{-| decoder for js rule objects
-}
ruleDecoder : Json.Decoder RuleMVG
ruleDecoder =
    Json.map2 RuleMVG
        (Json.field "quota" Json.int)
        (Json.field "weights" (Json.list (Json.oneOf [ Json.int, Json.succeed 0 ])))


{-| removes artifacts caused by js dictionaries
-}
cleanRule : Int -> RuleMVG -> RuleMVG
cleanRule n rule =
    { rule | weights = List.drop (length rule.weights - n) rule.weights }


{-| removes artifacts caused by js dictionaries
-}
cleanSimpleGame : SimpleGame -> SimpleGame
cleanSimpleGame game =
    { game | rules = List.map (\rule -> cleanRule game.playerCount rule) (List.drop (length game.rules - game.ruleCount) game.rules) }


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
