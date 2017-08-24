module Coalitions
    exposing
        ( all
        , winning
        )

import QOBDD exposing (..)


winning : BDD -> List (List Int)
winning t =
    let
        node pt v pe =
            List.map ((::) v) pt
    in
    foldBDDShare [] [ [] ] node t


all : BDD -> List ( List Int, List Int )
all t =
    let
        node pt v pe =
            List.map (\( set, comp ) -> ( v :: set, comp )) pt
                ++ List.map (\( set, comp ) -> ( set, v :: comp )) pe
    in
    foldBDDShare [] [ ( [], [] ) ] node t
