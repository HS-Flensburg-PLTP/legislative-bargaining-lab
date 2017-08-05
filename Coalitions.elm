module Coalitions exposing (..)

import ListUtil exposing (..)
import QOBDD exposing (..)
import Vector exposing (..)


coalitions : BDD -> List ( List Int, List Int )
coalitions t =
    let
        node pt v pe =
            List.map (\( set, comp ) -> ( v :: set, comp )) pt
                ++ List.map (\( set, comp ) -> ( set, v :: comp )) pe
    in
    foldBDDShare [] [ ( [], [] ) ] node t



-- henningValueFast : (Int -> Float) -> BDD -> Float
-- henningValueFast p bdd =
--     let
--         node pt v pe =
--             p v * pt + (1 - p v) * pe
--     in
--     foldBDDShare 0 1 node bdd


type alias Semiring a =
    { plus : a -> a -> a
    , zero : a
    , mult : a -> a -> a
    , one : a
    }


sumProdFast : (Int -> a) -> (Int -> a) -> Semiring a -> BDD -> a
sumProdFast f g sr t =
    let
        node pt v pe =
            sr.plus (sr.mult (f v) pt) (sr.mult (g v) pe)
    in
    foldBDDShare sr.zero sr.one node t


henningValueFast : (Int -> Float) -> BDD -> Float
henningValueFast p =
    sumProdFast p (\v -> 1 - p v) { plus = (+), zero = 0, mult = (*), one = 1 }



-- coalitions : Tree -> List (List Int)
-- coalitions t =
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


sumProd : (Int -> a) -> (Int -> a) -> Semiring a -> BDD -> a
sumProd f g sr t =
    let
        sum =
            List.foldr sr.plus sr.zero

        prod =
            List.foldr sr.mult sr.one

        prods ( set, comp ) =
            sr.mult
                (prod (List.map f set))
                (prod (List.map g comp))
    in
    sum (List.map prods (coalitions t))


vectors : BDD -> List Int
vectors =
    sumProdFast
        (\_ -> Vector.test)
        (\_ -> Vector.one)
        { plus = Vector.plus, zero = Vector.zero, mult = Vector.mult, one = Vector.one }
