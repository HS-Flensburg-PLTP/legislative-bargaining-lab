module GAMS exposing
    ( Def(..)
    , Eqn(..)
    , Exp(..)
    , File
    , Op(..)
    , add
    , def
    , defTree
    , defVar
    , definitions
    , equation
    , equations
    , files
    , mainEquation
    , minus
    , model
    , mult
    , prettyDef
    , prettyDefs
    , prettyEqn
    , prettyExp
    , prettyOp
    , setVars
    , variables
    , vars
    )

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
add exp1 exp2 =
    case ( exp1, exp2 ) of
        ( Num n1, Num n2 ) ->
            Num (n1 + n2)

        ( Num 0, _ ) ->
            exp2

        ( _, Num 0 ) ->
            exp1

        _ ->
            BinOp Add exp1 exp2


minus : Exp -> Exp -> Exp
minus exp1 exp2 =
    case ( exp1, exp2 ) of
        ( Num n1, Num n2 ) ->
            Num (n1 - n2)

        _ ->
            BinOp Minus exp1 exp2


mult : Exp -> Exp -> Exp
mult exp1 exp2 =
    case ( exp1, exp2 ) of
        ( Num n1, Num n2 ) ->
            Num (n1 * n2)

        ( Num 0, _ ) ->
            Num 0

        ( Num 1, _ ) ->
            exp2

        ( _, Num 0 ) ->
            Num 0

        ( _, Num 1 ) ->
            exp1

        _ ->
            BinOp Mult exp1 exp2


prettyExp : Exp -> String
prettyExp exp =
    case exp of
        Num int ->
            toString int

        Var string ->
            string

        BinOp op exp exp2 ->
            "(" ++ prettyExp exp ++ " " ++ prettyOp op ++ " " ++ prettyExp exp2 ++ ")"


type Def
    = Def String Eqn


prettyDefs : List Def -> String
prettyDefs defs =
    String.concat (List.map prettyDef defs)


prettyDef : Def -> String
prettyDef def =
    case def of
        Def var eqn ->
            var ++ "..\n " ++ prettyEqn eqn


type Eqn
    = Eqn String Exp


(==) : String -> Exp -> Eqn
(==) var exp =
    Eqn var exp


prettyEqn : Eqn -> String
prettyEqn eqn =
    case eqn of
        Eqn var exp ->
            var ++ " =E= " ++ prettyExp exp ++ ";\n"


vars : Int -> Dict Int String
vars n =
    Dict.fromList (List.map (\i -> ( i, "PI(g, \"" ++ toString i ++ "\")" )) (List.range 0 (n - 1)))


def : QOBDD -> ( List Def, String, String, String, String )
def qobdd =
    let
        ( defs, v, vs ) =
            defTree (vars qobdd.vars) qobdd.bdd
    in
    ( defs ++ [ Def mainEquation ("P(g)" == v) ]
    , variables
    , setVars vs
    , equations vs
    , model vs
    )


variables : String
variables =
    "variables\n t(g, nodes)\n;"


{-| Generates a string in the form of
def\_t5
def\_t7
-}
definitions : List Int -> String
definitions vars =
    let
        line i =
            " " ++ defVar i ++ "\n"
    in
    "equations\n" ++ String.concat (List.map line vars) ++ ";"


{-| Generates a string in the form of
equations
def\_t5(g)
def\_t7(g)
;
-}
equations : List Int -> String
equations vars =
    let
        line i =
            " " ++ equation i ++ "\n"
    in
    "equations\n" ++ String.concat (List.map line vars) ++ " " ++ mainEquation ++ "\n;"


{-| Generates a string in the form of
set nodes /19588, 19586, 19590, 19582, 19584, 19592/;
-}
setVars : List Int -> String
setVars vars =
    let
        context v =
            "set nodes /" ++ v ++ "/;"
    in
    context (String.concat <| List.intersperse ", " <| List.map toString vars)


{-| Generates a string in the form of
model nash\_nlp /
def\_t5
def\_t7
def\_t9
/;
-}
model : List Int -> String
model vars =
    let
        line v =
            " " ++ defVar v ++ "\n"
    in
    "model nash_nlp /\n" ++ String.concat (List.map line vars) ++ "/;"


mainEquation : String
mainEquation =
    "def_p_bdd(g)"


equation : Int -> String
equation i =
    defVar i ++ "(g)"


defVar : Int -> String
defVar i =
    "def_t" ++ toString i


defTree : Dict Int String -> BDD -> ( List Def, Exp, List Int )
defTree vars =
    let
        termvar i =
            "t(g, \"" ++ toString i ++ "\")"

        ident i =
            case Dict.get i vars of
                Nothing ->
                    Debug.crash ("Error: " ++ toString i ++ " not found in " ++ toString vars)

                Just v ->
                    v

        ref i _ =
            ( [], Var (termvar i), [] )

        node i ( s1, v1, vars1 ) label ( s2, v2, vars2 ) =
            let
                eqn =
                    termvar i == add (mult (Var (ident label)) v1) (mult (minus (Num 1) (Var (ident label))) v2)

                def =
                    Def (equation i) eqn
            in
            ( s1 ++ s2 ++ [ def ], Var (termvar i), i :: vars1 ++ vars2 )
    in
    QOBDD.foldBDD ( [], Num 0, [] ) ( [], Num 1, [] ) ref node


type alias File =
    { name : String, content : String }


{-| Generates the file contents
-}
files : QOBDD -> List File
files bdd =
    let
        ( defs, variables, nodes, equations, model ) =
            def bdd

        definitionsFile =
            { name = "definitions.gms"
            , content =
                nodes
                    ++ "\n\n"
                    ++ variables
                    ++ "\n\n"
                    ++ equations
                    ++ "\n\n"
                    ++ prettyDefs defs
            }

        modelFile =
            { name = "model.gms"
            , content = model
            }
    in
    [ definitionsFile, modelFile ]
