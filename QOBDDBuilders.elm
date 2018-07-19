module QOBDDBuilders exposing (fromSGToSimpleQOBDD)

import QOBDD exposing (..)
import SimpleGame exposing (..)


buildBDD : Quota -> List PlayerId -> List Player -> BDD
buildBDD quota weights players  =
    case (weights, players) of
        (w :: ws, p :: ps) ->
            Node { id = 0, thenB = buildBDD (quota - w) ws ps, var = p.id, elseB = buildBDD quota ws ps }

        (_, _) ->
            if quota > 0 then
                One
            else
                Zero


fromSGToSimpleQOBDD : SimpleGame -> QOBDD
fromSGToSimpleQOBDD game =
    QOBDD game.playerCount
        (case List.head game.rules of
            Nothing ->
                Zero

            Just rule ->
                buildBDD rule.quota rule.weights game.players
        )
