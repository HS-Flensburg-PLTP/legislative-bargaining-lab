module ProbGamesLab exposing (..)

import Dict
import GAMS
import Games exposing (Game(..), gameDecoder, gameDefinition, games)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (on, onClick, onInput, targetValue)
import Json.Decode
import Probabilities
import QOBDD exposing (QOBDD, parseMWVG, parsedMWVG, size)
import Random exposing (Generator)


-- split Model


type alias Model =
    { text : String, qobdd : Maybe QOBDD, probs : List (List Float) }


hasQOBDD : Model -> Bool
hasQOBDD model =
    case model.qobdd of
        Nothing ->
            True

        Just _ ->
            False


hasText : Model -> Bool
hasText model =
    String.isEmpty model.text



-- split Msg


type Msg
    = Parse
    | Display Game
    | Input String
    | Random
    | Probs (List (List Float))
    | Parsed QOBDD


init : ( Model, Cmd Msg )
init =
    ( { text = "", qobdd = Nothing, probs = [] }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Parse ->
            ( model, parseMWVG model.text )

        Display g ->
            ( { model | text = gameDefinition g }, Cmd.none )

        Input str ->
            ( { model | text = str }, Cmd.none )

        Parsed qobdd ->
            ( { model | qobdd = Just qobdd, probs = Probabilities.halvesDiag qobdd.vars }, Cmd.none )

        Random ->
            case model.qobdd of
                Just q ->
                    ( model, Random.generate Probs (Probabilities.probsDiagGen q.vars) )

                Nothing ->
                    Debug.crash ""

        Probs fs ->
            ( { model | probs = fs }, Cmd.none )


headerRow : Model -> Html Msg
headerRow model =
    div []
        [ text "Game:"
        , select [ on "change" (Json.Decode.map Display (Json.Decode.andThen gameDecoder targetValue)) ]
            gameOptions
        , button [ onClick Parse, disabled (hasText model) ] [ text "Load current game" ]
        ]


gameOptions : List (Html Msg)
gameOptions =
    option [ value "", disabled True, selected True ] [ text "Please Choose" ]
        :: List.map gameOption games


gameOption : Game -> Html Msg
gameOption game =
    option [ value (toString game) ] [ text (Games.showGame game) ]


view : Model -> Html Msg
view model =
    div []
        [ headerRow model
        , textarea [ class "game-input", rows 35, placeholder "Please input game", onInput Input ]
            [ text model.text ]
        , viewSize model
        , viewCoalisions model
        , h2 [] [ text "Formula" ]
        , viewFormula model

        -- , h2 [] [ text "Probabilities" ]
        -- , button [ onClick Random, disabled (hasQOBDD model) ] [ text "Random Probabilities" ]
        -- , viewProbs model.probs
        -- , h2 [] [ text "Powers" ]
        -- , viewPowerList model
        ]


viewSize : Model -> Html Msg
viewSize model =
    div []
        [ text "QOBDD nodes: "
        , text (Maybe.withDefault "no size available" (Maybe.map (toString << QOBDD.size) model.qobdd))
        ]


viewCoalisions : Model -> Html Msg
viewCoalisions model =
    div []
        [ text "Coalisions: "
        , text (Maybe.withDefault "number of coalisions not available" (Maybe.map (toString << QOBDD.coalitions) model.qobdd))
        ]


viewFormula : Model -> Html Msg
viewFormula model =
    let
        resultToString ( stmts, vs ) =
            vs ++ "\n\n" ++ GAMS.prettyStmts stmts
    in
    div []
        [ pre [] [ text (Maybe.withDefault "formula not available" (Maybe.map (\o -> resultToString <| GAMS.stmt <| o) model.qobdd)) ] ]


viewProbs : List (List Float) -> Html Msg
viewProbs probs =
    div [] (List.indexedMap viewProbsRow probs)


viewProbsRow : Int -> List Float -> Html a
viewProbsRow i probs =
    div []
        (text ("Player " ++ toString i ++ ": ")
            :: [ text (String.concat (List.intersperse ", " (List.map viewProb probs))) ]
        )


viewProb : Float -> String
viewProb f =
    toString f


viewPowerList : Model -> Html Msg
viewPowerList model =
    Maybe.withDefault (text "no powers available")
        (Maybe.map (\q -> viewPowerListQOBDD q model.probs) model.qobdd)


viewPowerListQOBDD : QOBDD -> List (List Float) -> Html Msg
viewPowerListQOBDD qobdd probs =
    let
        probDicts =
            List.map (\ps -> Dict.fromList (List.indexedMap (\i p -> ( i, p )) ps)) probs

        ps =
            Probabilities.probs probDicts qobdd
    in
    div [ class "power-list" ] (List.indexedMap viewPower ps)


viewPower : Int -> Float -> Html Msg
viewPower player prob =
    div [] [ text ("Power of player " ++ toString player ++ ": " ++ toString prob) ]


subscriptions : Model -> Sub Msg
subscriptions model =
    parsedMWVG Parsed


main : Program Never Model Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
