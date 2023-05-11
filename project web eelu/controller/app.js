var dbUsername = "admin"
var dbPassword = "admin"
var dbName = "users_db"

var db = new PouchDB('http://' + dbUsername + ":" + dbPassword + '@localhost:5984/' + dbName);
db.info();



var signedInUser = JSON.parse(sessionStorage.getItem("signedInUserLocal"));


if (signedInUser != null) {
    db.get(signedInUser['_id']).then(function (doc) {
        signedInUser = doc;
    }).catch(function (err) {
        signedInUser = null;
    });
    sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
}


if (signedInUser != null) {



    console.log(signedInUser);
    $('#fullnameInfo').text(signedInUser['fullname']);
    $('#usernameInfo').text(signedInUser['_id']);
    $('#addressInfo').text(signedInUser['address']);
    $('#mountainTripsInfo').text(signedInUser['trips']['mountain']);
    $('#surfingTripsInfo').text(signedInUser['trips']['surfing']);
    $('#oceanTripsInfo').text(signedInUser['trips']['ocean']);

    $('#greeting').text('Hello, ' + signedInUser['fullname'] + '!');
}



//the booking buttons
$('*[id*=Booking]').each(function () {
    var bookingType = $(this).attr('id').slice(0, -7);
    $(this).click(function () {
        if (signedInUser != null) {

            signedInUser['trips'][bookingType] += 1;
            sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
            db.get(signedInUser['_id']).then(function (doc) {
                return db.put({
                    _id: signedInUser['_id'],
                    _rev: doc._rev,
                    trips: signedInUser['trips']
                });
            })
            alert('One additinoal ' + bookingType + " trip has been added to your acount\nYou can see it in the details page.")

        }
        else {
            alert("You must login first!");
        }
    })
});


function registrationFieldsAreEmpty() {
    let empty = false;
    $('#in1,#in2,#in3,#in4').each(function () {
        if ($(this).val().length == 0) {
            empty = true;
        }
    });
    if (empty) {
        alert("Fill all fields first!");
    }
    return empty;
}

function loginFieldsAreEmpty() {
    let empty = false;
    $('#loginUsername,#loginPassword').each(function () {
        if ($(this).val().length == 0) {
            empty = true;
        }
    });
    if (empty) {
        alert("Enter both username and password!");
    }
    return empty;
}



function storeNewUser(db, table) {
    db.put(table).then(function (doc) {
        alert("Account has been made successfully!\nNow go and sign in.");
        console.log(doc);
    }).catch(function (err) {
        if (err.error == "conflict") {
            alert("Username '" + table["_id"] + "' already registered!");
        } else {
            console.log("couldn't create new user!");
            console.log(err);
        }
    });
}


$(function () {
    $('button:contains("Submit")').click(function () {

        if (!registrationFieldsAreEmpty()) {
            var userRecord = {
                "_id": $('#in2').val(),
                "fullname": $('#in1').val(),
                "password": $('#in3').val(),
                "address": $('#in4').val(),
                "trips": {
                    "mountain": 0,
                    "surfing": 0,
                    "ocean": 0
                }
            }

            storeNewUser(db, userRecord);
        }
    });
});

$(function () {
    $('button:contains("Login")').click(function () {

        if (!loginFieldsAreEmpty()) {
            var enteredUsername = $('#loginUsername').val();
            var enteredPassword = $('#loginPassword').val();
            db.get(enteredUsername).then(function (doc) {
                if (doc["password"] != enteredPassword) {
                    alert("Password is incorrect!");
                } else {
                    alert("Successfully logged in!");
                    signedInUser = doc;
                    sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
                }
            }).catch(function (err) {
                alert("Username was not found!");
            });
        }
    });
});
