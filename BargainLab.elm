module BargainLab exposing (..)

import Base64
import Browser
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
import QOBDD exposing (BDD, QOBDD, parseMWVG, parsedMWVG, size)
import Random exposing (Generator)
import Vector exposing (toList)


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
                    Debug.todo ""

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
    option [ value (Debug.toString game) ] [ text (Games.showGame game) ]


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
        , text (Maybe.withDefault "no size available" (Maybe.map (Debug.toString << QOBDD.size) model.qobdd))
        ]


viewCoalisions : Model -> Html Msg
viewCoalisions model =
    div []
        [ text "Coalisions: "
        , text (Maybe.withDefault "number of coalisions not available" (Maybe.map (Debug.toString << QOBDD.coalitions) model.qobdd))
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
                    [ download file.name
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
        (text ("Player " ++ Debug.toString i ++ ": ")
            :: [ text (String.concat (List.intersperse ", " (List.map viewProb probs))) ]
        )


viewProb : Float -> String
viewProb f =
    Debug.toString f


viewPowerList : Model -> Html Msg
viewPowerList model =
    Maybe.withDefault (text "no powers available")
        (Maybe.map (\q -> viewPowerListQOBDD q model.probs) model.qobdd)


viewPowerListQOBDD : QOBDD -> List (List Float) -> Html Msg
viewPowerListQOBDD qobdd probs =
    let
        probDicts =
            List.map (\ps2 -> Dict.fromList (List.indexedMap (\i p -> ( i, p )) ps2)) probs

        ps =
            Probabilities.probs probDicts qobdd
    in
    div [ class "power-list" ] (List.indexedMap viewPower ps)


viewPower : Int -> Float -> Html Msg
viewPower player prob =
    div [] [ text ("Power of player " ++ Debug.toString player ++ ": " ++ Debug.toString prob) ]


viewResult : Maybe QOBDD -> (BDD -> a) -> Html Msg
viewResult mqobdd f =
    div [] [ text (Maybe.withDefault "no result" (Maybe.map (Debug.toString << f << .bdd) mqobdd)) ]


subscriptions : Model -> Sub Msg
subscriptions model =
    parsedMWVG Parsed


main : Program () Model Msg
main =
    Browser.element
        { init = \_ -> init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
