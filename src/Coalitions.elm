module Coalitions exposing
    ( all
    , winning
    )

import List exposing (map)
import QOBDD exposing (..)
import Tuple exposing (mapFirst, mapSecond)


winning : BDD -> List (List Int)
winning bdd =
    let
        node pt v pe =
            map ((::) v) pt ++ pe
    in
    foldBDDShare [] [ [] ] node bdd


all : BDD -> List ( List Int, List Int )
all bdd =
    let
        node pt v pe =
            map (mapFirst ((::) v)) pt ++ map (mapSecond ((::) v)) pe
    in
    foldBDDShare [] [ ( [], [] ) ] node bdd
