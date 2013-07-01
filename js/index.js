var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
        StartDatabase();
    }
};

// =====================
// Funkcje bazy danych
// =====================

// uruchamianie bazy danych po starcie programu
function StartDatabase() {
    sessionStorage.wybranawycieczka=0;
    var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
    
    var storagefirstrun = window.localStorage.getItem("wycieczki-pierwszyraz");
    if (storagefirstrun != 'true') {
       navigator.notification.alert(
          'Program jest uruchamiany pierwszy raz. Zostanie utworzona baza danych.', function (){}, 'Pierwsze uruchomienie', 'OK');

       db.transaction(populateDB, errorCB);
       window.localStorage.setItem("wycieczki-pierwszyraz", "true");
    }
    db.transaction(queryDB, errorCB);
}

// Tworzenie bazy danych
function populateDB(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS wycieczki (id INTEGER PRIMARY KEY, nazwa, opis, latitude, longitude, photo)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS obiekty (id INTEGER PRIMARY KEY, wycieczkaid INTEGER, position INTEGER, nazwa, notatki, grupa, rodzaj)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS grupa (id INTEGER PRIMARY KEY, nazwa)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS rodzaj (grupaid INTEGER, nazwa)');

    tx.executeSql('SELECT * FROM grupa',[], function (tx,result) {
        if (result.rows.length == 0) {
            tx.executeSql('INSERT INTO grupa (id, nazwa) VALUES (1, "Podstawowe")');
            tx.executeSql('INSERT INTO grupa (id, nazwa) VALUES (2, "Lokalne")');
            tx.executeSql('INSERT INTO grupa (id, nazwa) VALUES (3, "Kulinarne")');
        }
    }, errorCB);

    tx.executeSql('SELECT * FROM rodzaj',[], function (tx,result) {
        if (result.rows.length == 0) {
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Muzeum")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Katedra")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Kościół")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Rynek")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Zabytkowy budynek")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (1, "Zabytkowa ulica")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (2, "Targ")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (2, "Festyn")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (2, "Jarmark")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (2, "Wyroby rzemieślnicze")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (3, "Restauracja")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (3, "Lokalne danie")');
            tx.executeSql('INSERT INTO rodzaj (grupaid, nazwa) VALUES (3, "Degustacja")');
        }
    }, errorCB);
}

// Błąd SQL
function errorCB(tx, err) {
    alert("Błą bazy danych: "+err);
}

//pobierz z bazy wszystkie wycieczki
function queryDB(tx){
    tx.executeSql('SELECT * FROM wycieczki',[],pokazWycieczki,errorCB);
}
 
// pokaż listę wycieczek
function pokazWycieczki(tx,result){
    $('#listofexcursions').empty();
    var len = result.rows.length;
    for (var i=0; i<len; i++) {
        $('#listofexcursions').append('<li><a id="'+result.rows.item(i).id+'" href="#"><h2>'+result.rows.item(i).nazwa+'</h2><p>'+result.rows.item(i).opis+'</p></a></li>');
    }
    $('#listofexcursions').listview('refresh');
}

// otwórz wycieczkę
function otworzwycieczkeDB(tx){
    tx.executeSql('SELECT * FROM wycieczki WHERE id='+sessionStorage.wybranawycieczka,[], function (tx,result) {
        $('#inputname').val(result.rows.item(0).nazwa);
        $('#inputdescription').val(result.rows.item(0).opis);
        var photopath = '';
        if (result.rows.item(0).photo != '') {
            photopath = 'Zdjęcie: '+ result.rows.item(0).photo + '<br />';
        }
        $('#labelgeo').html(photopath + 'Szerokość geograficzna: '+ result.rows.item(0).latitude+' Długość: '+ result.rows.item(0).longitude);
    }, errorCB);

    sessionStorage.liczbaobiektow = 0;

    tx.executeSql('SELECT * FROM obiekty WHERE wycieczkaid="'+sessionStorage.wybranawycieczka+'" ORDER BY position ASC',[], function (tx,result) {
        $('#listofexcs').empty();
        var len = result.rows.length;
        sessionStorage.liczbaobiektow = len;
        for (var i=0; i<len; i++) {
            $('#listofexcs').append('<li><a id="'+result.rows.item(i).id+'" href="#"> '+result.rows.item(i).nazwa+'</a></li>');
        }
        $('#listofexcs').listview('refresh');
    }, errorCB);
}
    
// załaduj menu na stronie obiektu
function ladujmenuDB(tx){
    $('#objname').val('');
    $('#notes').val('');
    $('#objgroup').empty();
    $('#objtype').empty();
    tx.executeSql('SELECT * FROM grupa',[], function (tx,result) {
        var len = result.rows.length;
        for (var i=0; i<len; i++) {
            $('#objgroup').append('<option value="'+result.rows.item(i).id+'">'+result.rows.item(i).nazwa+'</option>').selectmenu('refresh');
        }
    }, errorCB);
    if (sessionStorage.wybranyobiekt != 0) {
        tx.executeSql('SELECT * FROM obiekty WHERE id="'+sessionStorage.wybranyobiekt+'"',[], function (tx,result) {
            $('#objgroup option[value="'+result.rows.item(0).grupa+'"]').prop('selected',true);
            $('#objgroup').selectmenu("refresh",true);
            $('#objname').val(result.rows.item(0).nazwa);
            $('#notes').val(result.rows.item(0).notatki);
        }, errorCB);
    }
}

//przeładuj menu dolne na stronie obiektu
function reloadmenusDB(tx){
    tx.executeSql('SELECT * FROM rodzaj WHERE grupaid='+$('#objgroup').val(),[], function (tx,result) {
        var len = result.rows.length;
        $('#objtype').empty();
        $('#objtype').html('').selectmenu('refresh');
        for (var i=0; i<len; i++) {
            $('#objtype').append('<option value="'+result.rows.item(i).nazwa+'">'+result.rows.item(i).nazwa+'</option>').selectmenu('refresh');
        }
    }, errorCB);
    if (sessionStorage.wybranyobiekt != 0) {
        tx.executeSql('SELECT * FROM obiekty WHERE id="'+sessionStorage.wybranyobiekt+'"',[], function (tx,result) {
            $('#objtype option[value="'+result.rows.item(0).rodzaj+'"]').prop('selected',true);
            $('#objtype').selectmenu("refresh",true);
        }, errorCB);
    }
}

// zapisz wycieczkę
function dodajwycieczkeDB(tx){
    geolocation();
    var photopath = '';
    if (sessionStorage.photopath) {
        photopath = sessionStorage.photopath;
    }

    if (sessionStorage.wybranawycieczka == 0) {
        tx.executeSql('INSERT INTO wycieczki (nazwa, opis, latitude, longitude, photo) VALUES ("'+$('#inputname').val()+'", "'+$('#inputdescription').val()+'", "'+window.localStorage.getItem("latitude")+'", "'+window.localStorage.getItem("longitude")+'", "'+photopath+'")',[], function (tx,result) {}, errorCB);
    }
    else {
        tx.executeSql('UPDATE wycieczki SET nazwa="'+$('#inputname').val()+'", opis="'+$('#inputdescription').val()+'", latitude="'+window.localStorage.getItem("latitude")+'", longitude="'+window.localStorage.getItem("longitude")+'", photo="'+photopath+'" WHERE id='+sessionStorage.wybranawycieczka,[], function (tx,result) {}, errorCB);
    }

    tx.executeSql('SELECT * FROM wycieczki',[],pokazWycieczki,errorCB);
    $.mobile.changePage($("#pagehome"));
    sessionStorage.wybranawycieczka=0;
}

// usuń wycieczkę
function deleteprofileDB(tx) {
    tx.executeSql('DELETE FROM obiekty WHERE wycieczkaid='+sessionStorage.wybranawycieczka,[], function (tx,result) {}, errorCB);
    tx.executeSql('DELETE FROM wycieczki WHERE id='+sessionStorage.wybranawycieczka,[], function (tx,result) {}, errorCB);
    tx.executeSql('SELECT * FROM wycieczki',[],pokazWycieczki,errorCB);
    $.mobile.changePage($("#pagehome"));
    sessionStorage.wybranawycieczka=0;
}

// =====================
// Obsługa sprzętu
// =====================

// pobierz dane geolokalizacyjne
function geolocation (){
    navigator.geolocation.getCurrentPosition(function (position) {
        window.localStorage.setItem("latitude", position.coords.latitude);
        window.localStorage.setItem("longitude", position.coords.longitude);
    }, function(){});
}

// problem ze zrobieniem zdjęcia
function captureError(error) {
    var msg = 'Zdjęcie nie zostało wykonane!';
    navigator.notification.alert(msg, null, 'Brak zdjęcia');
}

// zdjęcie zostało wykonane
function captureSuccess(mediaFiles) {
    sessionStorage.photopath=mediaFiles[0].fullPath;
    sessionStorage.photoname=mediaFiles[0].name;
    $('#popupphoto').popup("open")
    setTimeout(function() {
        $('#popupphoto').popup("close");
    }, 2500);
}

// zrób zdjęcie
function takephoto() {
    navigator.device.capture.captureImage(captureSuccess, captureError);
}

//zapisz nowy obiekt
function saveobjectDB(tx){
    if (sessionStorage.wybranyobiekt == 0) {
        tx.executeSql('INSERT INTO obiekty (wycieczkaid, position, nazwa, notatki, grupa, rodzaj) VALUES ("'+ sessionStorage.wybranawycieczka +'", '+(parseInt(sessionStorage.liczbaobiektow)+1)+', "'+$("#objname").val()+'", "'+$("#notes").val()+'", "'+$("#objgroup").val()+'", "'+$('#objtype').val()+'")',[], function (tx,result) {}, errorCB);
    }
    else {
        tx.executeSql('UPDATE obiekty SET nazwa="'+$("#objname").val()+'", notatki="'+$("#notes").val()+'", grupa="'+$("#objgroup").val()+'", rodzaj="'+$("#objtype").val()+'" WHERE id='+sessionStorage.wybranyobiekt,[], function (tx,result) {}, errorCB);
    }

    $.mobile.changePage($("#addexcursion"));
    sessionStorage.liczbaobiektow = parseInt(sessionStorage.liczbaobiektow)+1;
}
    
// uaktualnij kolejność obiektów na liście
function sortbedsDB(tx) {
    var updatesql = '';
    if (parseInt(sessionStorage.endmove) < parseInt(sessionStorage.startmove)) {
        var updatesql = 'UPDATE obiekty SET position=( CASE WHEN position+1 > '+ parseInt(sessionStorage.startmove) + ' THEN ' + parseInt(sessionStorage.endmove) + ' ELSE position+1 END) WHERE wycieczkaid=' + sessionStorage.wybranawycieczka + ' AND position BETWEEN ' + parseInt(sessionStorage.endmove) + ' AND ' + parseInt(sessionStorage.startmove);
    }
    else {
        var updatesql = 'UPDATE obiekty SET position=( CASE WHEN position-1 < '+ parseInt(sessionStorage.startmove) + ' THEN ' + parseInt(sessionStorage.endmove) + ' ELSE position-1 END) WHERE wycieczkaid=' + sessionStorage.wybranawycieczka + ' AND position BETWEEN ' + parseInt(sessionStorage.startmove) + ' AND ' + parseInt(sessionStorage.endmove);
    }
    tx.executeSql(updatesql,[], function (tx,result) {}, errorCB);
}

// =====================
// Funkcje interfejsu
// =====================

// Strona główna / zdarzenie pageinit
$( document ).delegate("#pagehome", "pageinit", function() {

    $("#buttonnew").on('click', function() {
        sessionStorage.wybranawycieczka=0;
        $.mobile.changePage($("#addexcursion"));
        $('#inputname').val('');
        $('#inputdescription').val('');
        if (sessionStorage.photopath) {
            sessionStorage.removeItem(photopath);
        }
        if (sessionStorage.photoname) {
            sessionStorage.removeItem(photoname);
        }
        geolocation();
        $('#labelgeo').html('Latitude: '+ window.localStorage.getItem("latitude")+' Longitude: '+ window.localStorage.getItem("longitude")+' Altitude: '+ window.localStorage.getItem("altitude"));
    });

    $("#listofexcursions").on('click', 'li', function() {
        var selli = $(this).find('a');
        sessionStorage.wybranawycieczka=selli.attr('id');
        $.mobile.changePage($("#addexcursion"));
    });
});

// Widok wycieczki / zdarzenie pageinit
$( document ).delegate("#addexcursion", "pageinit", function() {

    $( "#listofexcs" ).sortable({
        start: function(event, ui) {
            start = ui.item.prevAll().length + 1;
        }
    });
    $( "#listofexcs" ).disableSelection();
    $( "#listofexcs" ).bind( "sortstop", function(event, ui) {
        $('#listofexcs').listview('refresh');
        sessionStorage.startmove = start;
        sessionStorage.endmove = ui.item.prevAll().length + 1;
        var previousposition = $(ui.item).text().split(" ");
        sessionStorage.elementmoved = previousposition[1];
        var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
        db.transaction(sortbedsDB, errorCB);
    });

    $("#buttonadd").on('click', function() {
        $.mobile.changePage($("#addobject"));
    });

    $("#listofexcs").on('click', 'li', function() {
        var selli = $(this).find('a');
        sessionStorage.wybranyobiekt=selli.attr('id');
        $.mobile.changePage($("#addobject"));
    });
});

// Widok obiektu / zdarzenie pageshow
$( document ).delegate("#addobject", "pageshow", function() {
    var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
    db.transaction(ladujmenuDB, errorCB);
    db.transaction(reloadmenusDB, errorCB);
        
    $('#objgroup').change(function() {
        db.transaction(reloadmenusDB, errorCB);
    });
});

// Widok wycieczki / zdarzenie pageshow
$( document ).delegate("#addexcursion", "pageshow", function() {
    if (sessionStorage.wybranawycieczka != 0) {
        var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
        db.transaction(otworzwycieczkeDB, errorCB);
    }
    sessionStorage.wybranyobiekt=0;
});

// Funkcje wywoływane po kliknięciu przycisków
// Zapisz wycieczkę
function butsaveexc () {
    if ($('#inputname').val() != '') {
        var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
        db.transaction(dodajwycieczkeDB, errorCB);
    }
}

// Usuń wycieczkę

function deleteprofile () {
    navigator.notification.confirm(
        'Czy na pewno usunąć tę wycieczkę?',  // komunikat
        function (buttonIndex) {
            if (buttonIndex == 1) {
                var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
                db.transaction(deleteprofileDB, errorCB);
            }
        },
        'Usuń wycieczkę',            // tytuł
        'Tak,Nie'          // etykiety przycisków
    );
}


// Zapisz obiekt
function saveobject () {
    var db = window.openDatabase("Wycieczki", "1.0", "Bazawycieczek", 10000000);
    db.transaction(saveobjectDB, errorCB);
}