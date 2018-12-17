module BargainLab exposing
    ( Model
    , Msg(..)
    , gameOption
    , gameOptions
    , hasQOBDD
    , hasText
    , headerRow
    , hrefDownload
    , init
    , main
    , subscriptions
    , update
    , view
    , viewCoalisions
    , viewCode
    , viewFiles
    , viewPower
    , viewPowerList
    , viewPowerListQOBDD
    , viewProb
    , viewProbs
    , viewProbsRow
    , viewResult
    , viewSize
    )

import Base64
import Coalitions exposing (..)
import Dict
import GAMS
import Games exposing (Game(..), gameDecoder, gameDefinition, games)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (on, onClick, onInput, targetValue)
import Json.Decode
import Power
import Probabilities
import QOBDD exposing (BDD, QOBDD, normalizeIDs, normalizeVars, parseMWVG, parsedMWVG, size)
import QOBDDBuilders exposing (..)
import Random exposing (Generator)
import SimpleGame exposing (..)
import Vector exposing (toList)


main : Program Never Model Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



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



-- split Update


type Msg
    = Parse
    | Display Game
    | Input String
    | Random
    | Probs (List (List Float))
    | Parsed QOBDD
    | ParseTestGame
    | ParsedTestGame SimpleGame


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
            ( { model | qobdd = Just (normalizeIDs qobdd), probs = Probabilities.halvesDiag qobdd.vars }
            , parseSimpleGame model.text
            )

        Random ->
            case model.qobdd of
                Just q ->
                    ( model, Random.generate Probs (Probabilities.probsDiagGen q.vars) )

                Nothing ->
                    Debug.crash ""

        Probs fs ->
            ( { model | probs = fs }, Cmd.none )

        ParseTestGame ->
            ( model, parseSimpleGame model.text )

        ParsedTestGame testGame ->
            case model.qobdd of
                Nothing ->
                    ( { model | text = "Old parsing failed" }, Cmd.none )

                Just qobdd ->
                    case Maybe.map normalizeVars (buildQOBDD testGame) of
                        Nothing ->
                            ( { model | text = "New parsing failed" }, Cmd.none )

                        Just newQOBDD ->
                            if qobdd == newQOBDD then
                                ( { model | text = "QOBDDs are equal" }, Cmd.none )

                            else
                                ( { model | text = "QOBDDs differ\n\n" ++ QOBDD.prettyQOBDD qobdd ++ "\n\n" ++ QOBDD.prettyQOBDD newQOBDD }, Cmd.none )



-- SUBSCRIPTION


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ parsedMWVG Parsed
        , parsedSimpleGame ParsedTestGame
        ]



-- VIEW


headerRow : Model -> Html Msg
headerRow model =
    div []
        [ text "Game:"
        , select [ on "change" (Json.Decode.map Display (Json.Decode.andThen gameDecoder targetValue)) ]
            gameOptions
        , button [ onClick Parse, disabled (hasText model) ]
            [ text "Load current game" ]
        , button
            [ onClick ParseTestGame, disabled (hasText model) ]
            [ text "Test parse game" ]
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
        , h2 [] [ text "GAMS Code" ]
        , p []
            [ text "The following code can be used in "
            , a [ href "https://www.gams.com" ] [ text "GAMS" ]
            , text " to calculate the probability of a proposal to be accepted."
            ]
        , viewCode model
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



-- viewBanzhaf : Model -> Html Msg
-- viewBanzhaf


hrefDownload : String -> Attribute msg
hrefDownload text =
    href
        ("data:application/octet-stream;charset=utf16le;base64,"
            ++ Base64.encode text
        )


viewFiles : List GAMS.File -> Html Msg
viewFiles files =
    let
        viewFile file =
            div []
                [ a
                    [ downloadAs file.name
                    , hrefDownload file.content
                    ]
                    [ text file.name ]
                ]
    in
    div [] (List.map viewFile files)


viewCode : Model -> Html Msg
viewCode model =
    let
        default =
            text "code not available"
    in
    Maybe.withDefault
        default
        (Maybe.map (viewFiles << GAMS.files) model.qobdd)


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


viewResult : Maybe QOBDD -> (BDD -> a) -> Html Msg
viewResult mqobdd f =
    div [] [ text (Maybe.withDefault "no result" (Maybe.map (toString << f << .bdd) mqobdd)) ]
