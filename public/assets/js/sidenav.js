$(document).ready(function () {

    // toggle the state on button click
    $('#sidebarCollapse').on('click', function () {
        $('#sidenav-main').toggleClass('active');
        $('.overlay').toggleClass('active');
    });

    // toggle the change on overlay click
    $('.overlay').on('click', function () {
        $('#sidenav-main').toggleClass('active');
        $('.overlay').toggleClass('active');
    });

    // change opacity of togggle button when scrolled
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


});