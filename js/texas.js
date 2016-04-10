$(document).ready(function(){
    var socket = io.connect("http://localhost:3333/"); 
    $(".result").hide();
    var i = 0;
    socket.on("symptoms", function(data){
        $("#selSymtoms").append(data);
    });
    
    $("#btnGetDiagnosis").click(function(){
        var $btn = $(this).button('loading');
        var age = $("#age").val();
        var sex = $("#sex").val();
        var race = $("#race").val();
        $(".result").hide();
        $(".diagnosis-table").html("");
        var symptom = '';
        console.log($("#symptom").val());
        console.log($("#selSymtoms").val());
        if($("#symptom").val() != '' || $("#selSymtoms").val() != ''){
            if($("#symptom").val() == ''){
                symptom = $("#selSymtoms").val();
            }
            else{
                symptom = $("#symptom").val();
            }
            socket.emit("getDiagnosis", {"age":age,"sex":sex,"race":race,"adc":symptom});
            $(".result").show(1000);
        }
        else{
            $(this).button("reset");
            $("#symptom").notify("Please enter or select Symptom", "error");
        }
        
    });
    
    $("#btnLock").click(function(){
        socket.emit("setSCL",{"support":$("#support").val() ,"confidence":$("#confidence").val() , "lift":$("#lift").val()});
    });
    
    $(".modal").on('hidden.bs.modal', function(){
        $("#avgLOS").html("<p>Nothing to show</p>");
        $("#ds").html("<p>Nothing to show</p>");
    });
    
    socket.on("sclSet", function(){
        $("#btnLock").notify("Support, confidence and lift have been set", "success");
    });
    
    socket.on("diagnosisCode", function(data){
        $("#btnGetDiagnosis").button('reset');
        $(".diagnosis-table").append("<div id='"+data+"' class='col-md-5 transparent-bg transition' value='"+data+"'>"+data+"</div>");
        $(".diagnosis-table #"+data+"").click(function(){
            var diag_code = $(this).html();
            socket.emit("getDiagnosisInfo", diag_code);
            $(".modal-title").html(diag_code);
            var age = $("#age").val();
            var race = $("#race").val();
            var sex = $("#sex").val();
            $("#modalAge").val(age);
            $("#modalRace").val(race);
            $("#modalSex").val(sex);
            $("#btnSetDemo").val(diag_code);
            $(".modal").modal();
        });
    });
    
    socket.on("avgLOS", function(data){
        if(data!=null)
            $("#avgLOS").html("<p>Average Length of Stay</p><p>"+data.toFixed(2)+"</p>");
    });
    
    socket.on("DS", function(data){
        var dead = 0;
        var alive = 0;
        
        if(data[1]!=undefined){
            dead = data[1].DS;
        }
        if(data[0]!=undefined){
            alive = data[0].DS;
        }
        
        var total = dead + alive;
        if(total!=0)
        $("#ds").html("<p>Discharge Status</p><p>You have "+((dead/total)*100).toFixed(2)+"% chance of dying and "+((alive/total)*100).toFixed(2)+"% chance of living!</p>"); 
    });
    
    socket.on("diagnosisCodeClear", function(){
        if($(".diagnosis-table").children().length == 0){
            $(".diagnosis-table").html("<p>Nothing to show</p>");
            $("#btnGetDiagnosis").button("reset");
        }
    });
    
    socket.on("ready", function(){
        $("#btnGetDiagnosis").prop("disabled",false);
    });
    
    $("#btnSetDemo").click(function(){
        var age = $("#modalAge").val();
        var sex = $("#modalSex").val();
        var race = $("#modalRace").val();
        socket.emit("setDemoFilter",{"age":age,"sex":sex,"race":race});
    });
    
    socket.on("demoFilterSet", function(){
        $("#avgLOS").html("<p>Nothing to show</p>");
        $("#ds").html("<p>Nothing to show</p>");
        console.log("Demo filter set : "+$("#btnSetDemo").val());
        socket.emit("getDiagnosisInfo",$("#btnSetDemo").val());
    });
});