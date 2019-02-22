module ListUtil exposing (diff, remove)


remove : comparable -> List comparable -> List comparable
remove x xs =
    case xs of
        [] ->
            []

        y :: ys ->
            if x == y then
                ys

            else
                y :: remove x ys


diff : List comparable -> List comparable -> List comparable
diff xs ys =
    case ys of
        [] ->
            xs

        z :: zs ->
            diff (remove z xs) zs
