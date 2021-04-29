function send_android_path(path){
    // console.log("front-end : ", path);
    fetch('/classroom/class-details',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            android_path: path
        })
    }).then(function(){
        // window.location.href = "/checkout";
    })

}

$(document).ready(function () {
    $('[name="androidAddress"]').on('change',function(){
        send_android_path(this.value)
    });

});