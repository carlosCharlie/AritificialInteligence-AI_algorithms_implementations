//Carlos Castellanos Mateo
let initData;
let attributesKey;
let tree;
let treant;
let path;

$(function(){

    $("#content*").css("display","none");

   
   
    $("#step0Button").on("click",function(){
        
        $("#uploadwindow").css("display","none");
        $("#content").css("display","block");

        getText((attributes,examples)=>{
            initData = parseText(attributes,examples);
            renderTable();
        });
    })





    $("#step1Button").on("click",function(){
        
        $("#step1*").css("display","none");
        $("#step2*").css("display","flex");

        tree = id3(attributesKey,initData);

        renderTree(tree);

        attributesKey.forEach((attribute,index)=>{

            if(index<attributesKey.length-1){
            let inserted = [];
            let select = $("<select></select>");
            initData.forEach((row)=>{

                if(inserted.indexOf(row[attribute])==-1){
                    inserted.push(row[attribute]);
                    select.append("<option value="+row[attribute]+">"+row[attribute]+"</option>");
                }
            })

            let div = $("<div id="+attribute+"><h4>"+attribute+"</h4><div>");
            div.append(select);
            $("#check").append(div);
        }
        })

        $("#check").append($('<input id="checkButton" type="button" value="Probar">'));

    })





    $("#check").on("click",$("#checkButton"),(data)=>{

        if(data.target.id == "checkButton"){
            let exampleFields = $("#check").children();
            path = [];
            id3Execution(tree,exampleFields,path);
            renderTree(tree,path);
        }
    })

    function id3Execution(node,exampleFields,path){

        path.push(node);

        if(node.children == null) return node.value;

        let i;
        for(i = 0 ;i<exampleFields.length && exampleFields[i].id != node.value;i++){};

        let j;
        for(j = 0 ;j<exampleFields.length && $("#"+exampleFields[i].id+" option:selected").val() != node.children[j].value;j++){};

        let next = node.children[j];
        path.push(next);

        return id3Execution(next.children[0],exampleFields,path);
        
        
    }
})

function id3(attributes,examples){
    
    if(examples.length<=0) return {value:"Vacio"};
    else if(examples.every(example=>example[attributes[attributes.length-1]])) return {value:true,children:null};
    else if(examples.every(example=>!example[attributes[attributes.length-1]])) return {value:false,children:null};
    
    let bestAt = best(attributes,examples);
    let node={value:bestAt,children:[]};

    examples.forEach(example=>{
        if(node.children.indexOf(example[node.value])==-1){ 
            node.children.push(example[node.value]);
        }
    });

    node.children.forEach((value,i)=>{
        
        node.children[i] = {value:value,children:[]};

        node.children[i].children.push(id3(attributes.filter(attribute=>attribute!=node.value),
                            examples.filter(example=>example[node.value]==value)
                            )
        );
    })

    return node;
}

function best(attributes,examples){
    
    let attributesTmp = [];

    attributes.forEach(attribute=>{

        let possibleValues = [];
        
        examples.forEach((example)=>{if(possibleValues.indexOf(example[attribute])==-1) possibleValues.push(example[attribute])});
        
        for(let i = 0; i<possibleValues.length; i++)
            possibleValues[i] = {val:possibleValues[i]};
        
        possibleValues.forEach((value)=>{
            
            value.p = 0;
            value.n = 0;

            examples.forEach(example=>{
                if(example[attribute] == value.val && example[attributes[attributes.length-1]]) value.p++;
                else if (example[attribute] == value.val && !example[attributes[attributes.length-1]]) value.n++;
            })
            
            value.a = value.p+value.n;
            value.r = value.a/examples.length;

            let total = value.p+value.n;

            value.p = value.p/total;
            value.n = value.n/total;

        });

        attributesTmp.push(possibleValues);

    })

    let total = [];

    attributesTmp.forEach(attribute=>{
        
        let sum = 0;

        for(let i = 0;i<attribute.length; i++)
            sum+=attribute[i].r*infor(attribute[i].p,attribute[i].n);

        total.push(sum);

    })

    let index = -1;

    for(let i = 0; i<total.length-1; i++)
        if(index==-1 || total[i] < total[index])
            index = i;

    return attributes[index];
}

function infor(p,n){
    return (-p*(p==0 ? 0 :Math.log2(p)))-(n*(n==0 ? 0:Math.log2(n)));
}


function getText(callback){
    let reader = new FileReader();
    let examples;
    reader.onload=function(data){
        examples = data.target.result;
        reader.onload = (data)=>{callback(data.target.result,examples)}
        reader.readAsText($("#attributes").prop("files")[0],"UTF-8");
    };
    reader.readAsText($("#examples").prop("files")[0],"UTF-8");
}



function parseText(attributes,examples){
    
    let parsed = [];
    attributesKey = attributes.split(",").map(attribute=>{return attribute.replace("\n",'').replace("\r",'')})
    
    let rows = examples.split("\n").filter(row=>{return row!="" && row!=" " && row!="\r" && row!="\n"});
    
    rows.forEach(row => {
        
        let words = row.split(",");
        
        words = words
        .map((word)=>{return word.replace("\n",'').replace("\r",'')})
        .map((word)=>{
            if(word=="si"||word=="SI")return true;
            else if (word=="no"||word=="NO") return false;
            else return word;
        });

        let newObject = {};

        for(let i = 0; i<words.length;i++)
            newObject[attributesKey[i]]=words[i];

        parsed.push(newObject);

    });

    return parsed;
}

function renderTable(){
    let titles = "<tr>";
    attributesKey.forEach(key=>titles+="<th>"+key+"</th>");
    titles+="</tr>";

    $("#tableExamples").append($(titles));

    initData.forEach(example=>{
        
        let row = "<tr>";
        
        for(let i = 0;i<attributesKey.length;i++)
            row+="<td>"+example[attributesKey[i]] +"</td>";
        
        row+="</tr>";

        $("#tableExamples").append($(row));
    })
}


function renderTree(tree,path){

    $("#tree").css("width","80%");
    $("#tree").height(window.innerHeight-10);
    if(treant != undefined && treant != null) treant.destroy();
    $("#tree").empty();

    simple_chart_config = {
        chart: {
            container: "#tree",
            stye:{
                stroke:"#FF3800"
            },
        padding:0
        },
        nodeStructure: createStructure(tree,path)
    };
    treant = new Treant(simple_chart_config,null,$);
}


function createStructure(tree,path){
    let node = {};
    node.text ={};
    node.text.title = String(tree.value);
    if(path != undefined && path.indexOf(tree)!=-1){

        if(tree.children == null)
            node.HTMLclass="answer";
        else
            node.HTMLclass = "path";
    }else
        node.HTMLclass ="rest";
    
    if(tree.children == null) return node;

    node.children = [];
    tree.children.forEach(child=>{
        node.children.push(createStructure(child,path));
    })

    return node;
}
