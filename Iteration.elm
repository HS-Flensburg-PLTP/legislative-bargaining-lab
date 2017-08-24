module Iteration exposing (..)

import Coalitions
import QOBDD exposing (..)


type alias Semiring a =
    { plus : a -> a -> a
    , zero : a
    , mult : a -> a -> a
    , one : a
    }


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
    sum (List.map prods (Coalitions.all t))


sumProdFast : (Int -> a) -> (Int -> a) -> Semiring a -> BDD -> a
sumProdFast f g sr t =
    let
        node pt v pe =
            sr.plus (sr.mult (f v) pt) (sr.mult (g v) pe)
    in
    foldBDDShare sr.zero sr.one node t


card : BDD -> Int
card =
    sumProdFast (always 1) (always 1) { plus = (+), zero = 0, mult = (*), one = 1 }
