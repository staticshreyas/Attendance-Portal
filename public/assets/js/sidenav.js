$(document).ready(function () {

    $('#sidebarCollapse').on('mouseenter', function () {
        $('#sidenav-main').toggleClass('active');
    });


    $('#sidenav-main').on('mouseleave', function () {
        if($( window ).width() < 1180){
            $('#sidenav-main').toggleClass('active');
        }
    });

});