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
    $('[name="androidAddress"]').on('input',function(){
        send_android_path(this.value)
    });

    $('.copy-code').on('click',function(){
        $('<textarea>').val($(this).data("code")).appendTo('body').select();
        document.execCommand('copy');
        $('textarea').remove();
        $(this).attr('data-original-title', "Copied: "+ $(this).data("code")).tooltip('show');
    });

    $('.copy-code').on('mouseleave',function(){
        $(this).attr('data-original-title', "Copy to clipboard");
    });

});