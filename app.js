/*
Akarsh Varadaraju - 1000988892
Akshay Radhakrishna - 1000981007
Gandharva Gowda - 1001115865
Ranjith Marasingana - 1000969864
*/
var http = require('http'); 
var fs = require('fs');  
var io = require('socket.io'); 
var path = require('path');
var mime = require('mime');
var mysql = require('mysql');

fs.readFile('./texas.html', function (err, data) {  
 if (err) {
    throw err;
 }
 index = data;
});

function sendFile(response, filepath, fileContents){
    response.writeHead(200, {"content-type": mime.lookup(path.basename(filepath))});
    response.end(fileContents);
}

function serverStatic(response, absPath){
    fs.readFile(absPath, function(err, data){
        if(err){
            console.log(err);
        }
        else{
            sendFile(response,absPath, data);
        }
    });
}

/* Create a server that listns on TCP port 3333 */
var server = http.createServer(function(request, response) {
    var filePath = false;
    if(request.url == '/'){
        filePath = './texas.html';
    }
    else{
        filePath = request.url;
    }
    var absPath = './' + filePath;
    serverStatic(response, absPath);
}).listen(3333);

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Fillers1',
  database : 'texas'
});

connection.connect();

var socket = io.listen(server);
var adcList = [];
var totalRows = 202714;
var support = 0;
var confidence = 0;
var lift = 1;
var diagnosisCodeCount = [];

socket.on("connection", function(client){
    connection.query('SELECT DISTINCT ADMITTING_DIAGNOSIS_CODE FROM health', function(err, rows, fields) {
  	if (!err){
        var res = '';
        for(var i=0; i<rows.length; i++){
            var temp = rows[i].ADMITTING_DIAGNOSIS_CODE;
            adcList.push(temp);
            res += "<option value='"+temp+"'>"+temp+"</option>";
        }
        client.emit("symptoms", res);
        connection.query('SELECT DIAGNOSIS_CODE_1, COUNT(*) AS DIAGNOSIS_COUNT FROM health GROUP BY DIAGNOSIS_CODE_1', function(er1, row){
            if(!er1){
                for(var i=0; i<row.length; i++){
                    if(row[i].DIAGNOSIS_CODE_1!=''){
                        diagnosisCodeCount[row[i].DIAGNOSIS_CODE_1] = row[i].DIAGNOSIS_COUNT;
                    }
                }
                client.emit("ready");
            }
        });
    }
    		
  	else
        console.log(err);
    }); 
    var queryStr = '';
    var queryFilter = '';
    client.on("getDiagnosis", function(data){
        
        var diagnosisRes = [];
        queryStr = '';
        queryStr = formQueryString(data);
        queryFilter = queryStr;
        
        var getDiagCode = queryStr;
        var temp = queryStr;
        //console.log(queryStr);
        if(queryStr!=''){
            getDiagCode = " AND "+queryStr;
            temp = " WHERE "+queryStr;
        }
        
        connection.query('SELECT COUNT(*) AS TOTAL FROM health'+temp, function(er1, TOTAL){
            if(!er1){
                totalRows = TOTAL[0].TOTAL;
                connection.query('SELECT COUNT(*) AS A_COUNT FROM health WHERE ADMITTING_DIAGNOSIS_CODE = "'+data.adc+'"'+getDiagCode, function(er2, A_COUNT){
                    if(!er2 && A_COUNT[0].A_COUNT!=0){
                    //method1(queryStr, client, data, A_COUNT[0].A_COUNT);
                        method2(queryStr, data, A_COUNT[0].A_COUNT, client);
                    }
                    else{
                        client.emit("diagnosisCodeClear");
                    }
                });
            }
            else{
                console.log("error in total rows");
            }
        });
        
        // Choose between method 1 and 2 
        
        
        
         
    });
    
    client.on("getDiagnosisInfo", function(data){
        var getDiag = queryFilter;
        if(queryFilter!=''){
            getDiag = ' AND ' + queryFilter;
        }
        connection.query('SELECT AVG(LENGTH_OF_STAY) AS AVG_LOS FROM health WHERE DIAGNOSIS_CODE_1 = "'+data+'"'+getDiag, function(err, rows){
            if(!err){
                client.emit("avgLOS", rows[0].AVG_LOS);
            }
        });
        connection.query('SELECT DISCHARGE_STATUS, COUNT(*) AS DS FROM health WHERE DIAGNOSIS_CODE_1 = "'+data+'"'+getDiag+' GROUP BY DISCHARGE_STATUS', function(err, rows){
            if(!err){
                client.emit("DS", rows);
            }
        });
    });
    
    client.on("setSCL", function(data){
        support = data.support;
        confidence = data.confidence;
        lift = data.lift;
        client.emit("sclSet");
    });
    
    client.on("setDemoFilter", function(data){
        queryFilter = formQueryString(data);
        console.log(queryFilter);
        client.emit("demoFilterSet");
    });
});
function formQueryString(data){
    var query = '';
    if(data.age != ''){
        query+= "AGE = "+data.age;
    }
    if(data.race != ''){
        if(data.age!=''){
            query+= " AND RACE = "+data.race;
        }
        else{
            query+= "RACE = "+data.race;
        }
    }
    if(data.sex != ''){
        if(data.age!='' || data.race!=''){
            query+= " AND SEX = "+data.sex;
        }
        else{
            query+= "SEX = "+data.sex;
        } 
    }
    return query;
}
function method1(queryStr, client, data, a_count){
    var getDiagCode = queryStr;
    var dc1 = [];
    if(queryStr!=''){
        getDiagCode = " WHERE "+queryStr;
        queryStr = " AND "+queryStr;
    }
    
    connection.query('SELECT DISTINCT DIAGNOSIS_CODE_1 FROM result'+getDiagCode, function(err, rows){
        for(var i=0; i<rows.length; i++){
            var diagnosis_code_1 = rows[i].DIAGNOSIS_CODE_1;
                connection.query('SELECT DIAGNOSIS_CODE_1, COUNT(*) AS SUPP_COUNT FROM result WHERE ADMITTING_DIAGNOSIS_CODE = "'+data.adc+'" AND '+
                                     'DIAGNOSIS_CODE_1 = "'+diagnosis_code_1+'"'+queryStr, function(er1, SUPP_COUNT){
                    if(!er1){
                        var aub = SUPP_COUNT[0].SUPP_COUNT;
                        if(aub!=0){
                            var supp = aub/totalRows;
                            if(supp >= support){
                                var conf = supp/a_count;
                                if(conf>=confidence){
                                    connection.query('SELECT DIAGNOSIS_CODE_1, COUNT(*) AS B_COUNT FROM result WHERE DIAGNOSIS_CODE_1 = "'+SUPP_COUNT[0].DIAGNOSIS_CODE_1+'"'+queryStr, function(er3, B_COUNT){
                                        if(!er3){
                                            var b_cnt = B_COUNT[0].B_COUNT;
                                            if(b_cnt!=0){
                                                var expected_conf = b_cnt/totalRows;
                                                var lft = conf/expected_conf;
                                                if(lft>=lift){
                                                    client.emit("diagnosisCode",B_COUNT[0].DIAGNOSIS_CODE_1);
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }                 
                });
            }
        });
}
function method2(queryStr, data, adc_count, client){
    var getDiagCode = queryStr;
    if(queryStr!=''){
        getDiagCode = " WHERE "+queryStr;
        queryStr = " AND "+queryStr;
    }
    connection.query('SELECT DIAGNOSIS_CODE_1,LENGTH_OF_STAY, DISCHARGE_STATUS FROM health WHERE ADMITTING_DIAGNOSIS_CODE = "'+data.adc+'"'+queryStr, function(err, rows){
        if(!err){
            console.log(rows.length);
            var diag = [];
            var rowLength = rows.length;
            for(var i=0; i<rowLength; i++){
                var diag_code = rows[i].DIAGNOSIS_CODE_1;
                var supp_count = 0;
                //console.log("For dia "+diag_code);
                if(!(diag_code in diag)){
                    diag[diag_code] = diag_code;
                    for(var j=i; j<rowLength; j++){
                        if(rows[j].DIAGNOSIS_CODE_1 == diag_code){
                            //console.log(" dc "+diag_code+ " support count :"+supp_count);
                            supp_count++;
                        }
                    }
                    var supp = supp_count/totalRows;
                    //console.log("support = "+supp);
                    if(supp>=support){
                        var conf = supp_count/adc_count;
                        //console.log("conf = "+conf+" adc_count "+adc_count);
                        if(conf>=confidence){
                            var lft_count = diagnosisCodeCount[diag_code];
                            var expected_conf = lft_count/totalRows;
                            var lft = conf/expected_conf;
                            //console.log(lft_count+" for dia "+ diag_code+ " lift "+lft);
                            if(lft>=lift){
                                client.emit("diagnosisCode", diag_code);
                            }
                        }
                    }
                }
            }
            client.emit("diagnosisCodeClear");
        }
        else{
            console.log("error");
            client.emit("diagnosisCodeClear");
        }
    });
}