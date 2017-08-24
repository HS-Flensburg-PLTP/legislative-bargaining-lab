module Vector
    exposing
        ( Vector(..)
        , extend
        , fromList
        , map
        , minus
        , mult
        , one
        , plus
        , toList
        , zero
        )


fromList : List a -> Vector a
fromList xs =
    case xs of
        [] ->
            Debug.crash "empty list"

        [ x ] ->
            Single x

        y :: ys ->
            More y (fromList ys)


toList : Vector a -> List a
toList v =
    case v of
        Single x ->
            [ x ]

        More x v_ ->
            x :: toList v_


type Vector a
    = Single a
    | More a (Vector a)


map : (a -> b) -> Vector a -> Vector b
map f xs =
    case xs of
        Single a ->
            Single (f a)

        More a aVector ->
            More (f a) (map f aVector)


map2 : (a -> a -> a) -> Vector a -> Vector a -> Vector a
map2 f xs ys =
    case ( xs, ys ) of
        ( Single v1, Single v2 ) ->
            Single (f v1 v2)

        ( Single v1, More v2 vt2_ ) ->
            More (f v1 v2) vt2_

        ( More v1 vt1_, Single v2 ) ->
            More (f v1 v2) vt1_

        ( More v1 vt1_, More v2 vt2_ ) ->
            More (f v1 v2) (map2 f vt1_ vt2_)


zero : Vector Int
zero =
    Single 0


plus : Vector Int -> Vector Int -> Vector Int
plus =
    map2 (+)


one : Vector Int
one =
    Single 1


mult_ : Vector Int -> Vector Int -> Vector Int
mult_ vt1 vt2 =
    case vt1 of
        Single v1 ->
            map ((*) v1) vt2

        More v1 vt1_ ->
            plus (map ((*) v1) vt2) (More 0 (mult_ vt1_ vt2))


mult : Vector Int -> Vector Int -> Vector Int
mult vt1 vt2 =
    case ( vt1, vt2 ) of
        ( Single 0, _ ) ->
            Single 0

        ( _, Single 0 ) ->
            Single 0

        ( _, _ ) ->
            mult_ vt1 vt2


extend : Vector Int -> Vector Int
extend v =
    More 0 v


minus : Vector Int -> Vector Int -> Vector Int
minus =
    map2 (-)
