//Carlos Castellanos Mateo

const B = 2;
const E = 0.01;
const Ell = math.pow(10.0,-6);
const kMax = 1000;
const Y = 0.1;

let examples;
let test;

$(()=>{

    //$("body").height(window.innerHeight);
    
    $("#calcButton").on("click",function(){
        examples = [];
        test = {};
        let algorithm;
        switch($("#algorithm option:selected").val()){
            case "bayes":
            algorithm = bayes;
            break;
            case "kmedias":
            algorithm = kMeans;
            break;
            case "lloyd":
            algorithm = lloyd;
            break;
        }
        getText(function(l,t){
            parseText(l,t,algorithm);
        });
    })
})

function getText(callback){
    let reader = new FileReader();
    let test;
    reader.onload=function(data){
        test = data.target.result;
        reader.onload = (data)=>{callback(data.target.result,test)}
        reader.readAsText($("#learn").prop("files")[0],"UTF-8");
    };
    reader.readAsText($("#test").prop("files")[0],"UTF-8");
}

function parseText(learn,t,callback){

    //learn
    let rows = learn.split("\n").filter(row=>{return row!="" && row!=" " && row!="\r" && row!="\n"});

    rows.forEach(row=>{

        let att = row.split(",").map(att=>{return att.replace("\n",'').replace("\r",'')});

        let exampleTmp = {val:[]};
       
        let i;
        for(i=0; i<att.length-1; i++)
            exampleTmp.val.push(Number(att[i]))
        
        exampleTmp.class = att[i];

        examples.push(exampleTmp);

    })

    //test
    let att = t.split(",").map(att=>{return att.replace("\n",'').replace("\r",'')});

    test.val = [];
    let i;
    for(i=0; i<4; i++)
        test.val.push(Number(att[i]))
    
    test.class = att[i];

    callback();
}

function kMeans(){

    let n = examples.length-1;
    
    //get the number of classes and select random centers
    let cNames = [];
    let c = [];
    examples.forEach(example => {
        if(cNames.indexOf(example.class)==-1){
            cNames.push(example.class);
            c.push(example.val.map(v=>v+1)); 
        }
    });

    let end = false;

    while(!end){
        
        //get the p
        examples.forEach((example,i)=>{
            example.c = [];
            
            c.forEach(center=>{
                example.c.push(P(center,example.val,c));
            })
        })

        let init = [];
        examples[0].val.forEach(()=>init.push(0));

        //calculate new centers
        let newC = c.map((center,index)=>
                
            math.divide(
               examples.reduce((total,actual)=>math.add(total,math.multiply(Math.pow(actual.c[index],B),actual.val)),init),
               examples.reduce((total,actual)=>total+Math.pow(actual.c[index],B),0.0)
            )
        )
        
        //compares new and old centers
        end = newC.every((elem,i)=>d(elem,c[i])<E);
    
        if(!end) c = newC.filter(()=>true);
    }

    let max = -1;
    let i = -1;
    let pert = c.map((center,index)=>{
        let p = P(center,test.val,c);
        if(p > max){
            max = p;
            i = index;
        }

        return p;
    })

    let text = pert.reduce((text,center,i)=>text + cNames[i]+": "+center.toFixed(3)+"<br>","");
    $("#result").append("Grado de pertenencia<br>"+text+"<br>Pertenece al grupo "+cNames[i]);
    $("#step1").css("display","none");
    $("#step2").css("display","block");
}

function P(v,x,cs){
    if(d(v,x) == 0) return 1;
    let div = cs.reduce((total,actual)=>total+=Math.pow(1/d(actual,x),1/(B-1)),0.0);
    if(div == 0) return 1;
    return Math.pow(1/d(v,x),1/(B-1))/div;
}
function d(p1,p2){
    return Math.sqrt(math.subtract(p1,p2).map(elem=>Math.pow(elem,2)).reduce((total,next)=>total+next,0.0));  
}



function bayes(){
    
    let cNames = [];

    examples.forEach(example => {
        if(cNames.indexOf(example.class)==-1){
            cNames.push(example.class);
        }
    });


    //calculate m
    let m = cNames.map(()=>examples[0].val.map(()=>0));
    m = m.map((elem,i)=>
        examples.reduce((total,actual)=>{
            if(actual.class == cNames[i])
                return math.add(total,actual.val);
            else
                return total;
        },elem)
    )
    m = m.map((elem,i)=>math.divide(elem,examples.reduce((total,ex)=>ex.class==cNames[i] ? total+1 : total,0.0)));


    //C
    let Cs = cNames.map(()=>examples[0].val.map(()=>examples[0].val.map(()=>0)));
    examples.forEach((actual)=>{
        let tmp = math.subtract(actual.val,m[cNames.indexOf(actual.class)]);
        Cs[cNames.indexOf(actual.class)] = math.add(Cs[cNames.indexOf(actual.class)],math.multiply(math.transpose([tmp]),[tmp]));
    })
    Cs = Cs.map((c,i)=>math.divide(c,examples.reduce((total,actual)=>actual.class == cNames[i] ? total+1 : total,0.0)));


    //test
    let ds = Cs.map((c,i)=>math.multiply(math.subtract(test.val,m[i]),math.inv(c),math.transpose([math.subtract(test.val,m[i])])));
    
    let min = ds[0];
    let i = 0;
    ds.forEach((d,index)=>{
        if(d<min){
            min=d;
            i=index;
        }
    });

    let text = ds.reduce((text,center,i)=>text + cNames[i]+": "+center[0].toFixed(3)+"<br>","");
    $("#result").append("Distancias:<br>"+text+"<br>Pertenece al grupo "+cNames[i]);
    $("#step1").css("display","none");
    $("#step2").css("display","block");
        
}

function lloyd(){

    let cNames = [];
    let c = [];
    examples.forEach(example => {
        if(cNames.indexOf(example.class)==-1){
            cNames.push(example.class);
            c.push(example.val.map(v=>v+1));
        }
    });

    let cOld = [];

    for(let j = 0; j<kMax && (cOld.length==0 || !cOld.every((elem,i)=>d(elem,c[i])<Ell)); j++){

        cOld = c.map(x=>x);

        examples.forEach(ex => {
            ex.c = -1;
            let minD;
            let dTmp;
            for(let i=0; i<c.length; i++){
                dTmp = d(ex.val,c[i]);
                if(ex.c==-1 || dTmp<minD){
                    minD = dTmp;
                    ex.c = i;
                }
            }

            c[ex.c] = math.add(ex.val,math.multiply(Y,math.subtract(ex.val,c[ex.c])));
        })
    }

    let ds = c.map(elem=>d(elem,test.val));

    let i;
    let minDt = -1;

    for(let index=0; index<ds.length; index++)
        if(minDt == -1 || ds[index]<minDt){
            minDt = ds[index];
            i = index;
        } 

    let text = ds.reduce((text,center,i)=>text + cNames[i]+": "+center.toFixed(3)+"<br>","");
    $("#result").append("Distancias euclideas:<br>"+text+"<br>Pertenece al grupo "+cNames[i]);
    $("#step1").css("display","none");
    $("#step2").css("display","block");

}