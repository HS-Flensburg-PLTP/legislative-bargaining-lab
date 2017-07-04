module SimpleGamesLab exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import QOBDD exposing (parseMWVG, parsedMWVG, QOBDD, size)
import Games exposing (eu17)


type alias Model = { text : String, qobdd : Maybe QOBDD }

type Msg = Parse | Load Game | Input String | Parsed QOBDD

type Game = EU17 | Squares | Canadian95


init : (Model, Cmd Msg)
init = ({text = "", qobdd = Nothing} , Cmd.none)

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Parse        -> ({model | text = ""}, parseMWVG model.text)
    Load g       -> ({model | text = game g}, Cmd.none)
    Input str    -> ({model | text = str}, Cmd.none)
    Parsed qobdd -> ({model | qobdd = Just qobdd}, Cmd.none)

game : Game -> String
game g =
  case g of
    EU17       -> Games.eu17
    Squares    -> Games.magicSquares
    Canadian95 -> Games.canadian95

headerRow : Model -> Html Msg
headerRow model =
  div []
    [ text "Game:"
    , button [ onClick Parse ] [ text "Parse" ]
    , button [ onClick (Load EU17) ] [ text "Load EU17" ]
    , button [ onClick (Load Squares) ] [ text "Load Magic Squares" ]
    , button [ onClick (Load Canadian95) ] [ text "Load Canadian 95" ]
    ]

view : Model -> Html Msg
view model =
  div []
    [ headerRow model
    , textarea [ rows 35, placeholder "Please input game", onInput Input ] []
    , viewSize model
    , viewFullSize model
    -- , text (toString model.qobdd)
    ]

viewSize : Model -> Html Msg
viewSize model =
  div [] [text (Maybe.withDefault "no size available" (Maybe.map (toString << QOBDD.size) model.qobdd))]

viewFullSize : Model -> Html Msg
viewFullSize model =
  div [] [text (Maybe.withDefault "no fullsize available" (Maybe.map (toString << QOBDD.coalitions) model.qobdd))]


subscriptions : Model -> Sub Msg
subscriptions model = parsedMWVG Parsed

main =
  program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
