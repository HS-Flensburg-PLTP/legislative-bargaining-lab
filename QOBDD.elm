port module QOBDD exposing(parseMWVG, parsedMWVG, QOBDD, size, fullSize)

import Json.Decode as Json
import Json.Encode
import Dict


type alias QOBDD = { n : Int, root : Tree }

qobddDecoder : Json.Decoder QOBDD
qobddDecoder =
  Json.map2 QOBDD
    (Json.field "n" Json.int)
    (Json.field "root" treeDecoder)

size : QOBDD -> Int
size qobdd = sizeTree qobdd.root

fullSize : QOBDD -> Int
fullSize qobdd = fullSizeTree qobdd.root

-- coalitions : QOBDD -> Int
-- coalitions 


type Tree = Empty
          | Node {label : Int, id : Int, t : Tree, e : Tree}
          | Ref Int

foldTree : b -> (Int -> b) -> (Int -> Int -> b -> b -> b) -> Tree -> b
foldTree empty ref node tree =
  case tree of
    Empty  -> empty
    Ref i  -> ref i
    Node r ->
      node r.label r.id (foldTree empty ref node r.t) (foldTree empty ref node r.e)

foldTreeShare : b -> (Int -> Int -> b -> b -> b) -> Tree -> b
foldTreeShare empty node tree =
  Tuple.second (foldTreeShareDict Dict.empty empty node tree)

foldTreeShareDict : Dict.Dict Int b -> b -> (Int -> Int -> b -> b -> b) -> Tree
                  -> (Dict.Dict Int b, b)
foldTreeShareDict dict1 empty node tree =
  case tree of
    Empty -> (dict1, empty)
    Node r ->
      let (dict2, res1) = foldTreeShareDict dict1 empty node r.t
          (dict3, res2) = foldTreeShareDict dict2 empty node r.e
          res = node r.label r.id res1 res2
      in
      (Dict.insert r.id res dict3, res)
    Ref i ->
      case Dict.get i dict1 of
        Nothing -> Debug.crash ("Ref " ++ toString i ++ " missing\n" ++ toString dict1)
        Just v -> (dict1, v)


sizeTree : Tree -> Int
sizeTree = foldTree 0 (\_ -> 0) (\_ _ s1 s2 -> s1+s2+1)

fullSizeTree : Tree -> Int
fullSizeTree = foldTreeShare 0 (\_ _ s1 s2 -> s1+s2+1)


-- sizeTree : Tree -> Int
-- sizeTree = Tuple.second << sizeTreeDict Dict.empty
--
-- sizeTreeDict : Dict.Dict Int Int -> Tree -> (Dict.Dict Int Int, Int)
-- sizeTreeDict dict1 tree =
--   case tree of
--     Empty  -> (dict1, 0)
--     Node r ->
--       let (dict2, size1) = sizeTreeDict dict1 r.t
--           (dict3, size2) = sizeTreeDict dict2 r.e
--       in
--       (Dict.insert r.id (size1+size2+1) dict3, size1+size2+1)
--     Ref id ->
--        case Dict.get id dict1 of
--          Nothing -> Debug.crash ("Ref " ++ toString id ++ " missing\n" ++ toString dict1)
--          Just v -> (dict1, v)

empty : List Int -> Float -> Json.Decoder (List Int, Tree)
empty l f =
  if isInfinite f then Json.succeed (l, Empty) else Json.fail "no empty"

node : Float -> Int -> Tree -> (List Int, Tree) -> (List Int, Tree)
node label id t (l,e) =
  (id::l, Node {label = truncate label, id = id, t = t, e = e})

ref : List Int -> Int -> Json.Decoder (List Int, Tree)
ref l i =
  if List.member i l then Json.succeed (l, Ref i) else Json.fail "no ref"

treeDecoder : Json.Decoder Tree
treeDecoder = Json.map Tuple.second (treeDecoderList [])

treeDecoderList : List Int -> Json.Decoder (List Int, Tree)
treeDecoderList l =
  Json.oneOf [
    Json.null (l, Empty),
    Json.andThen (empty l) (Json.field "label" Json.float),
    Json.andThen (ref l) (Json.field "id" Json.int),
    Json.andThen (\label ->
      Json.andThen (\id ->
        Json.andThen (\(l1,t) ->
          Json.map (node label id t)
            (Json.field "t" (Json.lazy (\_ -> treeDecoderList l1))))
          (Json.field "e" (Json.lazy (\_ -> treeDecoderList l))))
        (Json.field "id" Json.int))
      (Json.field "label" Json.float)
  ]


port parseMWVG : String -> Cmd msg

port parsedMWVGJson : (Json.Encode.Value -> msg) -> Sub msg

parsedMWVG : (QOBDD -> msg) -> Sub msg
parsedMWVG f =
  parsedMWVGJson (\v -> case Json.decodeValue qobddDecoder v of
                          Ok r -> f r
                          Err _ -> Debug.crash "Parse error")
