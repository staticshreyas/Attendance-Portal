$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidenav-main').toggleClass('active');
        $('.overlay').toggleClass('active');
    });

    window.onscroll = function(){
        var value = window.scrollY;
        var bg = document.getElementById("sidebarCollapse");
        if(value > 35){        
            bg.style.opacity = 0.4;
        }
        else{
            bg.style.opacity = .9;
        }
    }


    // $('#sidenav-main').on('mouseleave', function () {
    //     if($( window ).width() < 1180){
    //         $('#sidenav-main').toggleClass('active');
    //     }
    // });

});