module SimpleGamesLab exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import QOBDD exposing (parseMWVG, parsedMWVG, QOBDD, size)
import Games exposing (eu17)


type alias Model = { text : String, qobdd : Maybe QOBDD }

type Msg = Parse | Load Game | Input String | Parsed QOBDD

type Game = EU17 | Squares


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
    EU17    -> Games.eu17
    Squares -> Games.magicSquares

view : Model -> Html Msg
view model =
  div []
    [ div []
        [ text "Game:"
        , button [ onClick Parse ] [ text "Parse" ]
        , button [ onClick (Load EU17) ] [ text "Load EU17" ]
        , button [ onClick (Load Squares) ] [ text "Load Magic Squares" ]
        ]
    , textarea [ rows 35, placeholder "Please input game", onInput Input ] []
    -- , text (toString model.text)
    -- , text (toString model.qobdd)
    , text (toString (Maybe.withDefault 10 (Maybe.map QOBDD.size model.qobdd)))
    ]

subscriptions : Model -> Sub Msg
subscriptions model = parsedMWVG Parsed

main =
  program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
