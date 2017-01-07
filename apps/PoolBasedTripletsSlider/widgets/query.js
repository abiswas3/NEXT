fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.hasControls = false;


var submit_left = function() {
    next_widget.processAnswer({"target_winner": {{ query.target_indices[1].target_id }}});
    $('#left').css({'outline': '2px solid #FF0000'});
}

document.onkeydown = checkKey;

canvas = new fabric.Canvas('c1', { backgroundColor: "#fff" });
canvas.selection = false; // disable group selection

resizeCanvas();
window.addEventListener('resize', resizeCanvas, false);

// screen rotation business
// window.addEventListener('orientationchange', doOnOrientationChange);
// Initial execution if needed
//doOnOrientationChange();

canvas.add(new fabric.Line([0, 0, canvas.width - 65, 0], {
    left: 6,
    top: canvas.height/2,
    stroke: 'blue',
    selectable: false
    
}));

canvas.add(new fabric.Line([0, 75, 0, canvas.height -75], {
    left: canvas.width/2,
    top: 75,
    stroke: 'blue',
    selectable: false
}));

// rebuild canvas
for (i = 0; i < 3; i++) {
    //------------------------- IMAGES--------------------------
    //URL = "http://fabricjs.com/lib/pug.jpg"

    if(i==0) URL = "{{ query.target_indices[1].primary_description }}";
    
    //right
    if(i==1) URL = "{{ query.target_indices[2].primary_description }}";

    // centre
    if(i==2) URL = "{{ query.target_indices[0].primary_description }}";
    
    fabric.Image.fromURL(URL, function (dot) {
        canvas.add(dot);
        if(canvas.getObjects().length == 5) init();
        },
                         {"left": -200,
                          "top": canvas.height/2,
                          "lockMovementY" : true,
                          "scaleX": 0.4,
                          "scaleY": 0.4,
                          "image": true
                         });    
}
canvas.renderAll();



canvas.on('object:moving', function(e) {
    //animate(e, 1);
    var obj = e.target;
    var left = get_point("left");
    var right= get_point("right");
    var centre = get_point("centre");

    
    // if object is too big ignore
    if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
        return;
    }
    obj.setCoords();

    // left
    if(obj.left < left.left + obj.currentWidth ){
        obj.left = left.left + obj.currentWidth
    }
    
    if(obj.left  > right.left - right.currentWidth){
        obj.left = right.left - right.currentWidth;
    }
});     

function get_point(pos){

    var centre = null;
    map_filter_points(
        function(i,p){
            centre = p;
        },
        function(i,p){
            if(p.type == pos) return true;
            
        }        
    );
    return centre;    
}


function checkKey(e) {
    e = e || window.event;
    if (e.keyCode == '13') {

        var decision = get_distance();
        console.log(decision);
        
        if(decision <=0.5){
            next_widget.processAnswer({"target_winner": {{ query.target_indices[1].target_id }}, "magnitude": decision});                 
        }
        else{
            next_widget.processAnswer({"target_winner": {{ query.target_indices[2].target_id }}, "magnitude": decision});
        }
    }
}


function get_distance(){

    var left=0, right=0, centre = 0;
    map_filter_points(
        function(i,p){
            if(p.type == "left"){
                left = p.left                
            }
            else if(p.type == "right"){
                right = p.left
                p.top = canvas.height/2 - p.currentHeight/2;
                p.selectable = false
            }
            else if(p.type == "centre"){
                centre = p.left
            }        

        },
        function(i,p){
            if(i > 0) return true;
        });

    obj = canvas.getObjects()[1]

    var left = get_point("left");
    var right= get_point("right");

    //centre += left.currentWidth/2;
    
    max_width =  right.left - left.currentWidth;
    min_width = left.left + left.currentWidth 
    
    console.log(min_width, max_width, centre, (centre - min_width)/(max_width -  min_width))

    return (centre - min_width)/(max_width -  min_width)
}

function change_scale(scale_val){
    map_filter_points(
        function(i,p){
            if(p.image == true){                
                p.scaleX = scale_val;
                p.scaleY = scale_val;
            }
            p.setCoords();
        },
        function(i,p){

            if(i > 0) return true;
        });        
}

function map_filter_points(map,filter) {
    var arr = canvas.getObjects();
    var ans = [];
    for(var i = 1; i < arr.length; i++){
        if(filter(i,arr[i])){
            ans.push(map(i,arr[i]));
        }
    }
    return ans;
}

init = function() {
    map_filter_points(
        function(i,p){

            if(canvas.width < 800) {
                p.scaleX = 0.2
                p.scaleY = 0.2
            }                
            if(i == 2){
                p.left = 10;
                p.top = canvas.height/2 - p.currentHeight/2;
                p.selectable = false;
                p.type = "left";
                
            }
            else if(i == 3){
                p.left = canvas.width -p.currentWidth - 10;
                p.top = canvas.height/2 - p.currentHeight/2;
                p.selectable = false
                p.type = "right";
            }
            else if(i == 4){

                p.left = (canvas.width - p.currentWidth)/2;;
                p.top = canvas.height/2 - p.currentHeight/2;
                p.type = "centre";
            }        
            p.setCoords();
        },
        function(i,p){

            if(i > 0) return true;
        });
    canvas.renderAll();
}


function resizeCanvas() {
    canvas.setZoom(Math.min(1, window.innerWidth/800 )) ;
    canvas.renderAll();
}

function doOnOrientationChange()
{
    switch(window.orientation)
    {
        case -90:
        case 90:
        canvas.setZoom(Math.min(1, window.innerWidth/800 )) ;
        canvas.renderAll();

        //alert('landscape');
        break;
        default:
        canvas.setZoom(Math.min(1, window.innerWidth/800 )) ;
        canvas.renderAll();        
        break;
    }
}


