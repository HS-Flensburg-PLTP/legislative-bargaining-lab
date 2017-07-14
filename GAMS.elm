module GAMS exposing (..)

import Dict exposing (Dict)
import QOBDD exposing (..)


type Op
    = Mult
    | Add
    | Minus


prettyOp : Op -> String
prettyOp op =
    case op of
        Mult ->
            "*"

        Add ->
            "+"

        Minus ->
            "-"


type Exp
    = Num Int
    | Var String
    | BinOp Op Exp Exp


add : Exp -> Exp -> Exp
add =
    BinOp Add


minus : Exp -> Exp -> Exp
minus =
    BinOp Minus


mult : Exp -> Exp -> Exp
mult =
    BinOp Mult


prettyExp : Exp -> String
prettyExp exp =
    case exp of
        Num int ->
            toString int

        Var string ->
            string

        BinOp op exp exp2 ->
            "(" ++ prettyExp exp ++ " " ++ prettyOp op ++ " " ++ prettyExp exp2 ++ ")"


type Stmt
    = Assign String Exp


(:=) : String -> Exp -> Stmt
(:=) var exp =
    Assign var exp


prettyStmts : List Stmt -> String
prettyStmts stmts =
    String.concat (List.map prettyStmt stmts)


prettyStmt : Stmt -> String
prettyStmt stmt =
    case stmt of
        Assign var exp ->
            var ++ " = " ++ prettyExp exp ++ ";\n"


vars : Int -> Dict Int String
vars n =
    Dict.fromList (List.map (\i -> ( i, "p(1," ++ toString i ++ ")" )) (List.range 0 (n - 1)))


stmt : Dict Int String -> QOBDD -> List Stmt
stmt vars qobdd =
    let
        ( stmts, v ) =
            stmtTree vars qobdd.root
    in
    "zero" := Num 0 :: "one" := Num 1 :: stmts ++ [ "r" := Var v ]


stmtTree : Dict Int String -> Tree -> ( List Stmt, String )
stmtTree vars =
    let
        term i =
            "t_" ++ toString i

        ident i =
            --     "p_" ++ toString i
            case Dict.get i vars of
                Nothing ->
                    Debug.crash ("Error: " ++ toString i ++ " not found in " ++ toString vars)

                Just v ->
                    v

        ref i =
            ( [], term i )

        node label i ( s1, v1 ) ( s2, v2 ) =
            let
                assignment =
                    term i := add (mult (Var (ident label)) (Var v1)) (mult (minus (Num 1) (Var (ident label))) (Var v2))
            in
            ( s1 ++ s2 ++ [ assignment ], term i )
    in
    QOBDD.foldTree ( [], "zero" ) ( [], "one" ) ref node
