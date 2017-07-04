port module QOBDD exposing(parseMWVG, parsedMWVG, QOBDD, size)

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

-- this.size_ = function () {
-- 	var op_id = ++QOBDD.unique_op_id;
-- 	var sum = 0;
--
-- 	var aux = function (v) {
-- 		if ( v.isConst() || v.visited == op_id) return;
-- 		else {
-- 			sum ++;
-- 			v.visited = op_id;
-- 			aux(v.getThen());
-- 			aux(v.getElse());
-- 		}
-- 	};
--
-- 	aux(this.getRoot());
-- 	return sum;
-- };


type Tree = Empty
          | Node {label : Int, id : Int, t : Tree, e : Tree}
          | Ref Int

-- foldTree : b -> (Int -> b) -> (Int -> Int -> b -> b) -> Tree -> b
-- foldTree
--
-- foldTreeWithRef :

-- foldTree : b -> (Int -> Int -> a -> b -> b -> b) -> Tree a -> b
-- foldTree e f tree =
--   case tree of
--     Empty  -> e
--     Node r -> f r.label r.id r.value (foldTree e f r.t) (foldTree e f r.e)

sizeTree : Tree -> Int
sizeTree = Tuple.second << sizeTreeDict Dict.empty

sizeTreeDict : Dict.Dict Int Int -> Tree -> (Dict.Dict Int Int, Int)
sizeTreeDict dict1 tree =
  case tree of
    Empty  -> (dict1, 0)
    Node r ->
      let (dict2, size1) = sizeTreeDict dict1 r.t
          (dict3, size2) = sizeTreeDict dict2 r.e
      in
      (Dict.insert r.id (size1+size2+1) dict3, size1+size2+1)
    Ref id ->
       case Dict.get id dict1 of
         Nothing -> Debug.crash ("Ref " ++ toString id ++ " missing\n" ++ toString dict1)
         Just v -> (dict1, v)

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
