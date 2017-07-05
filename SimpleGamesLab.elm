module SimpleGamesLab exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import QOBDD exposing (parseMWVG, parsedMWVG, QOBDD, size)
import Games
import Probabilities
import Dict


type alias Model = { text : String, qobdd : Maybe QOBDD }

type Msg = Parse | Load Game | Input String | Parsed QOBDD

type Game = EU17 | Squares | Canadian95 | Test


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
    Test       -> Games.test

headerRow : Model -> Html Msg
headerRow model =
  div []
    [ text "Game:"
    , button [ onClick Parse ] [ text "Parse" ]
    , button [ onClick (Load EU17) ] [ text "Load EU17" ]
    , button [ onClick (Load Squares) ] [ text "Load Magic Squares" ]
    , button [ onClick (Load Canadian95) ] [ text "Load Canadian 95" ]
    , button [ onClick (Load Test) ] [ text "Load Test" ]
    ]

view : Model -> Html Msg
view model =
  div []
    [ headerRow model
    , textarea [ rows 35, placeholder "Please input game", onInput Input ] []
    , viewSize model
    , viewCoalisions model
    , viewProb model
    -- , text (toString model.qobdd)
    -- , textarea [ rows 35, placeholder "Please input probabilities", onInput Input ] []
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

viewProb : Model -> Html Msg
viewProb model =
  div []
    [ text "Probability: "
    , text (Maybe.withDefault "no fullsize probability"
             (Maybe.map (\q -> toString (Probabilities.prob (probs q.vars) q)) model.qobdd))
    -- , text (Maybe.withDefault "no fullsize probability"
    --          (Maybe.map (\q -> toString (Probabilities.squareProbs (squareProbs q.vars) q)) model.qobdd))
    ]


squareProbs : Int -> List (Dict.Dict Int Float)
squareProbs n =
  let ps = probs n
  in
  List.repeat n ps

probs : Int -> Dict.Dict Int Float
probs n =
  let prob = 0.5
  in
  Dict.fromList (List.map (\i -> (i,prob)) (List.range 0 (n-1)))

subscriptions : Model -> Sub Msg
subscriptions model = parsedMWVG Parsed

main =
  program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
