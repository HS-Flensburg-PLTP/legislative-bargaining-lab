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
    Dict.fromList (List.map (\i -> ( i, "p0(\"" ++ toString i ++ "\", g)" )) (List.range 0 (n - 1)))


stmt : QOBDD -> ( List Stmt, String )
stmt qobdd =
    let
        ( stmts, v, vs ) =
            stmtTree (vars qobdd.vars) qobdd.root
    in
    ( stmts ++ [ "%1" := v ], setVars vs )



-- Generates a string in the form of
-- set nodes /19588, 19586, 19590, 19582, 19584, 19592/;


setVars : List Int -> String
setVars vars =
    let
        context v =
            "set nodes /" ++ v ++ "/"
    in
    context (String.concat <| List.intersperse ", " <| List.map toString vars)


stmtTree : Dict Int String -> Tree -> ( List Stmt, Exp, List Int )
stmtTree vars =
    let
        term i =
            "t(g, \"" ++ toString i ++ "\")"

        ident i =
            case Dict.get i vars of
                Nothing ->
                    Debug.crash ("Error: " ++ toString i ++ " not found in " ++ toString vars)

                Just v ->
                    v

        ref i =
            ( [], Var (term i), [] )

        node label i ( s1, v1, vars1 ) ( s2, v2, vars2 ) =
            let
                assignment =
                    term i := add (mult (Var (ident label)) v1) (mult (minus (Num 1) (Var (ident label))) v2)
            in
            ( s1 ++ s2 ++ [ assignment ], Var (term i), i :: vars1 ++ vars2 )
    in
    QOBDD.foldTree ( [], Num 0, [] ) ( [], Num 1, [] ) ref node
