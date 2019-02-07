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
            Debug.toString int

        Var string ->
            string

        BinOp op exp1 exp2 ->
            "(" ++ prettyExp exp1 ++ " " ++ prettyOp op ++ " " ++ prettyExp exp2 ++ ")"


type Def
    = Def String Eqn


prettyDefs : List Def -> String
prettyDefs defs =
    String.concat (List.map prettyDef defs)


prettyDef : Def -> String
prettyDef def2 =
    case def2 of
        Def var eqn ->
            var ++ "..\n " ++ prettyEqn eqn


type Eqn
    = Eqn String Exp


equals : String -> Exp -> Eqn
equals var exp =
    Eqn var exp


prettyEqn : Eqn -> String
prettyEqn eqn =
    case eqn of
        Eqn var exp ->
            var ++ " =E= " ++ prettyExp exp ++ ";\n"


buildVars : Int -> Dict Int String
buildVars n =
    Dict.fromList (List.map (\i -> ( i, "PI(g, \"" ++ Debug.toString i ++ "\")" )) (List.range 0 (n - 1)))

type alias Elements =
  { defs2 : List Def
  , variables2 : String
  , nodes : String
  , equations2 : String
  , model : String
  }

def : QOBDD -> Elements
def qobdd =
    let
        ( defs, v, vs ) =
            defTree (buildVars qobdd.vars) qobdd.bdd
    in
    Elements ( defs ++ [ Def mainEquation (equals "P(g)" v) ])
     variables
     (setVars vs)
     (equations vs)
     (buildModel vs)



variables : String
variables =
    "variables\n t(g, nodes)\n;"


{-| Generates a string in the form of
def_t5
def_t7
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
def_t5(g)
def_t7(g)
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
    context (String.concat <| List.intersperse ", " <| List.map Debug.toString vars)


{-| Generates a string in the form of
model nash_nlp /
def_t5
def_t7
def_t9
/;
-}
buildModel : List Int -> String
buildModel vars =
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
    "def_t" ++ Debug.toString i


defTree : Dict Int String -> BDD -> ( List Def, Exp, List Int )
defTree vars =
    let
        termvar i =
            "t(g, \"" ++ Debug.toString i ++ "\")"

        ident i =
            case Dict.get i vars of
                Nothing ->
                    Debug.todo ("Error: " ++ Debug.toString i ++ " not found in " ++ Debug.toString vars)

                Just v ->
                    v

        ref i =
            ( [], Var (termvar i), [] )

        node i ( s1, v1, vars1 ) label ( s2, v2, vars2 ) =
            let
                eqn =
                    equals (termvar i) (add (mult (Var (ident label)) v1) (mult (minus (Num 1) (Var (ident label))) v2))

                def2 =
                    Def (equation i) eqn
            in
            ( s1 ++ s2 ++ [ def2 ], Var (termvar i), i :: vars1 ++ vars2 )
    in
    QOBDD.foldBDD ( [], Num 0, [] ) ( [], Num 1, [] ) ref node


type alias File =
    { name : String, content : String }



{-| Generates the file contents
-}
files : QOBDD -> List File
files bdd =
    let
        es =
          def bdd

        definitionsFile =
            { name = "definitions.gms"
            , content =
                es.nodes
                    ++ "\n\n"
                    ++ es.variables2
                    ++ "\n\n"
                    ++ es.equations2
                    ++ "\n\n"
                    ++ prettyDefs es.defs2
            }

        modelFile =
            { name = "model.gms"
            , content = es.model
            }
    in
    [ definitionsFile, modelFile ]
