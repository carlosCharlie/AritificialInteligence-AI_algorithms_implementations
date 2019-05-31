//Carlos Castellanos Mateo

let matriz = [];
let ancho;
let largo;
let click;
let inicio;
let final;
let camino = [];
let paso;
let intervalo = null;
let waypoints = [];
let waypointActual;
let trazos = [];
let waypointCalculado;

const TIPOS = {riesgo:"rgb(62, 99, 164)",vacio:"#04756F",comienzo:"#FF2D00",camino:"#FF8C00",final:"#D90000",obstaculo:"#191C1D",waypoint:"rgb(0, 217, 63)"};
$(()=>{

    $("#crear").on("click",function(){
        inicializar();
        $(this).css("display","none");
        $("#calcular").css("display","inline");

    })

    $("#calcular").on("click",function(){
        
        waypointCalculado = 0;
        waypointActual = 0;
        camino = [];
        waypoints.splice(0,0,inicio);
        waypoints.push(final);

        for(let i = 0; i<waypoints.length-1;i++)
            trazos.push(aEstrella(waypoints[i],waypoints[i+1]));

        for(let i = 0; i<trazos.length;i++)
            camino = camino.concat(trazos[i]);

        paso = 0;
        ejecutar();
    })


})

function ejecutar(){
    intervalo = setInterval(function(){
       
        if(camino[paso].waypoint!=undefined)
            waypointActual = camino[paso].waypoint;

        camino[paso].v = TIPOS.camino;
        renderizar();
        if(paso >= camino.length-1){
            clearInterval(intervalo);
            intervalo = null;
        }
        else paso++;
    },100);
}

function parar(){
    clearInterval(intervalo);
    intervalo = null;
    camino[paso].v = TIPOS.camino;
    renderizar();
}

function inicializar(){
    waypoints = [];
    $("#seleccion").css("visibility","visible");
    
    $("#comienzo .cuadrado").css("background-color",TIPOS.comienzo);
    $("#final .cuadrado").css("background-color",TIPOS.final);
    $("#obstaculo .cuadrado").css("background-color",TIPOS.obstaculo);
    $("#waypoint .cuadrado").css("background-color",TIPOS.waypoint);
    $("#riesgo .cuadrado").css("background-color",TIPOS.riesgo);

    $("#seleccion>div").on("click",function(){
        
        $(".cuadrado").css("border-color","transparent");
        $("#"+$(this).prop("id")+" .cuadrado").css("border-color","black");

        click = $(this).prop("id");
    })

    ancho = Number($("#ancho").val());
    largo = Number($("#largo").val());

    let gridFil="";
    let gridCol="";

    for(let i = 0; i<largo;i++)
        gridFil+="1fr ";

    for(let j = 0;j<ancho;j++)
        gridCol+="1fr ";

    $("#tablero").height(window.innerHeight-100);
    $("#tablero").width($("#tablero").height()*(ancho/largo));
    $("#tablero").css("grid-template-columns",gridCol);
    $("#tablero").css("grid-template-rows",gridFil);

    for(let i = 0;i<largo;i++)
        for(let j = 0; j<ancho;j++){
        
        let celda = $("<div></div>");
        celda.prop("id",""+i+"_"+j);
        celda.css("background-color",TIPOS.vacio);
        celda.on("click",function(){

            matriz[i][j].v = TIPOS[click];

            if(click == "comienzo")
                inicio = matriz[i][j];

            else if(click == "final")
                final = matriz[i][j];

            else if(click == "obstaculo"){
                matriz[i][j].v = TIPOS.obstaculo;
                if(intervalo!=null){
                    
                    parar();
                    paso++;
                    camino = [];
                    
                    trazos[waypointActual]=aEstrella(waypoints[waypointActual],waypoints[waypointActual+1]);
                    
                    for(let i = waypointActual;i<trazos.length;i++){
                        trazos[i]=aEstrella(waypoints[i],waypoints[i+1]);
                        camino = camino.concat(trazos[i]);
                    }

                    ejecutar();
                }
            }else if(click =="waypoint"){
                waypoints.push(matriz[i][j]);
                celda.text(waypoints.length);
                celda.css("font-size",celda.width()-10+"px");
            }else if(click == "riesgo"){
                matriz[i][j].r = Number($("#factor").val());
                celda.text(matriz[i][j].r);
                celda.css("font-size",celda.width()-10+"px");
            }


            renderizar();
        })
        $("#tablero").append(celda);
    }

    for(let i=0; i<largo;i++)
        matriz.push([]);

    for(let i=0; i<largo;i++)
        for(let j=0; j<ancho;j++){
            matriz[i].push(
                {v:TIPOS.vacio,
                 f:-1,
                 i:i,
                 j:j,
                 r:0
                })
        }
    
        if($("#0_0").height()>$("#0_0").width()){
            $("#tablero").css("height","auto");
            $("#tablero div").height($("#0_0").width());
        }
}

function renderizar(){
    for(let i = 0; i<largo;i++)
        for(let j = 0; j< ancho;j++)
            $("#"+i+"_"+j).css("background-color",matriz[i][j].v); 
}



function aEstrella(ini,fin){

    for(let i=0; i<largo;i++)
        for(let j=0; j<ancho;j++){
            matriz[i][j].f=-1;
            matriz[i][j].anterior = null;
            matriz[i][j].cerrado = false;
        }

    let actual = ini;
    let lista = [];

    actual.g = 0;
    actual.h = distancia(actual,fin);
    actual.f = actual.h + actual.g;


    insertarOrdenado(lista,actual);


    while(lista.length>0 && actual != fin){

        actual = lista.pop();

        //actual.v = TIPOS.camino;
        //renderizar();

        let adyacentes = [];

        //movimientos en cruz
        adyacentes.push(actual.i>0 ? matriz[actual.i-1][actual.j]:null);
        adyacentes.push(actual.i+1<matriz.length ? matriz[actual.i+1][actual.j]:null);
        adyacentes.push(actual.j>0 ? matriz[actual.i][actual.j-1]:null);
        adyacentes.push(actual.j+1<matriz[0].length ? matriz[actual.i][actual.j+1]:null);

        //movimientos en x
        adyacentes.push(actual.i>0 && actual.j>0 ? matriz[actual.i-1][actual.j-1]:null);
        adyacentes.push(actual.i+1<matriz.length && actual.j>0 <matriz.length ? matriz[actual.i+1][actual.j-1]:null);
        adyacentes.push(actual.i>0 && actual.j+1<matriz[0].length ? matriz[actual.i-1][actual.j+1]:null);
        adyacentes.push(actual.i+1<matriz.length && actual.j+1<matriz[0].length ? matriz[actual.i+1][actual.j+1]:null);
        

        adyacentes.forEach(element => {
            if(element != null && element.cerrado!=true && element.v != TIPOS.obstaculo){
                if(distancia(element,actual)+distancia(element,fin)+actual.g<element.f || element.f== -1){
                    
                    element.g = actual.g+distancia(element,actual)+element.r;
                    element.h = distancia(element,fin);
                    element.f = element.g + element.h;
                    insertarOrdenado(lista,element);
                }

                element.anterior = element.anterior == null || actual.g<element.anterior.g ? actual:element.anterior;
            }
        });

        actual.cerrado = true;
    }

    if(actual!=fin) alert("No se encuentra un camino optimo");

    let tmp = fin;
    let camInv = [];
    while(tmp.anterior != ini){
        camInv.push(tmp.anterior);
        tmp = tmp.anterior;
    }
    camInv[0].waypoint = waypointCalculado;
    waypointCalculado++;
    return camInv.reverse();
}


function insertarOrdenado(lista,elemento){
    let i = 0;
    while(i < lista.length && lista[i].f>=elemento.f) i++;
    lista.splice(i, 0, elemento);
}

function distancia(a,b){
    return Math.sqrt(Math.pow(b.i-a.i,2)+Math.pow(b.j-a.j,2));
}
