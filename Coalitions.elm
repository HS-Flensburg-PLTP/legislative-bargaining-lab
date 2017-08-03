module Coalitions exposing (..)

import ListUtil exposing (..)
import QOBDD exposing (..)


-- paths : Tree -> List (List Int)
-- paths t =
--     case t of
--         Zero ->
--             []
--
--         One ->
--             [ [] ]
--
--         Ref i ->
--             []
--
--         Node r ->
--             List.map ((::) r.label) (paths r.t) ++ paths r.e
-- paths : BDD -> List (List Int)
-- paths t =
--     let
--         node v pt pe =
--             List.map ((::) v) pt ++ pe
--     in
--     foldBDDShare [] [ [] ] node t


paths : BDD -> List ( List Int, List Int )
paths t =
    let
        node v pt pe =
            List.map (\( set, comp ) -> ( v :: set, comp )) pt
                ++ List.map (\( set, comp ) -> ( set, v :: comp )) pe
    in
    foldBDDShare [] [ ( [], [] ) ] node t


sumProd :
    (Int -> a)
    -> (Int -> a)
    -> (a -> a -> a)
    -> (a -> a -> a)
    -> a
    -> a
    -> BDD
    -> a
sumProd f g plus times zero one t =
    let
        sum =
            List.foldr plus zero

        prod =
            List.foldr times one

        prods ( set, comp ) =
            times
                (prod <| List.map f set)
                (prod <| List.map g comp)
    in
    sum (List.map prods (paths t))


sumProd2 :
    (Int -> a)
    -> (Int -> a)
    -> (a -> a -> a)
    -> (a -> a -> a)
    -> a
    -> a
    -> BDD
    -> a
sumProd2 f g plus times zero one t =
    let
        node v pt pe =
            plus (times (f v) pt) (times (g v) pe)
    in
    foldBDDShare zero one node t
