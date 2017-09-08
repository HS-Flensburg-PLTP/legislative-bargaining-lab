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


toList : Vector a -> List a
toList =
    identity


fromList : List a -> Vector a
fromList =
    identity


type alias Vector a =
    List a


map2 : (a -> a -> a) -> Vector a -> Vector a -> Vector a
map2 f v1 v2 =
    case ( v1, v2 ) of
        ( [], _ ) ->
            v2

        ( _, [] ) ->
            v1

        ( a1 :: v12, a2 :: v22 ) ->
            f a1 a2 :: map2 f v12 v22


zero : Vector Int
zero =
    []


plus : Vector Int -> Vector Int -> Vector Int
plus =
    map2 (+)


one : Vector Int
one =
    [ 1 ]


mult : Vector Int -> Vector Int -> Vector Int
mult v1 v2 =
    case ( v1, v2 ) of
        ( [], _ ) ->
            []

        ( _, [] ) ->
            []

        ( n :: v12, _ ) ->
            plus (List.map ((*) n) v2) (0 :: mult v12 v2)


extend : Vector Int -> Vector Int
extend v =
    0 :: v


minus : Vector Int -> Vector Int -> Vector Int
minus =
    map2 (-)
