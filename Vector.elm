module Vector
    exposing
        ( Vector
        , extend
        , fromList
        , minus
        , mult
        , one
        , plus
        , toList
        , zero
        )

import List exposing (map)


toList : Vector a -> List a
toList =
    identity


fromList : List a -> Vector a
fromList =
    identity


type alias Vector a =
    List a


alignWith : (a -> a -> a) -> Vector a -> Vector a -> Vector a
alignWith f v1 v2 =
    case ( v1, v2 ) of
        ( [], _ ) ->
            v2

        ( _, [] ) ->
            v1

        ( a1 :: v12, a2 :: v22 ) ->
            f a1 a2 :: alignWith f v12 v22


type alias Nat =
    Int


zero : Vector Nat
zero =
    []


plus : Vector Nat -> Vector Nat -> Vector Nat
plus =
    alignWith (+)


one : Vector Nat
one =
    [ 1 ]


mult : Vector Nat -> Vector Nat -> Vector Nat
mult v1 v2 =
    case ( v1, v2 ) of
        ( [], _ ) ->
            []

        ( _, [] ) ->
            []

        ( n :: v12, _ ) ->
            plus (map ((*) n) v2) (0 :: mult v12 v2)


extend : Vector Nat -> Vector Nat
extend v =
    0 :: v


minus : Vector Nat -> Vector Nat -> Vector Nat
minus =
    alignWith (-)
