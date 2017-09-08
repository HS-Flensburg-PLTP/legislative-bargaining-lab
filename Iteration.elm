module Iteration exposing (..)

import Coalitions
import List exposing (foldr, map)
import QOBDD exposing (..)


type alias Semiring a =
    { plus : a -> a -> a
    , zero : a
    , mult : a -> a -> a
    , one : a
    }


sumProdSpec : (Int -> a) -> (Int -> a) -> Semiring a -> BDD -> a
sumProdSpec f g sr t =
    let
        sum =
            foldr sr.plus sr.zero

        prod =
            foldr sr.mult sr.one

        prods ( win, comp ) =
            sr.mult
                (prod (map f win))
                (prod (map g comp))
    in
    sum (map prods (Coalitions.all t))


sumProd : (Int -> a) -> (Int -> a) -> Semiring a -> BDD -> a
sumProd f g sr t =
    let
        node pt v pe =
            sr.plus (sr.mult (f v) pt) (sr.mult (g v) pe)
    in
    foldBDDShare sr.zero sr.one node t


card : BDD -> Int
card =
    sumProd (always 1) (always 1) { plus = (+), zero = 0, mult = (*), one = 1 }
