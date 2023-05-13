// Database server's username and password to used to make a connection.
var dbUsername = "admin"
var dbPassword = "admin"
// Name of database to be made holding users' data.
var dbName = "users_db"

// Make a connection to the database server.
// note: (if this is the first time connecting, this also initializes the database)
var db = new PouchDB('http://' + dbUsername + ":" + dbPassword + '@localhost:5984/' + dbName);

// Prints metadata about the database to make sure it has been successfully made
console.log(db.info());


// load signed-in user data currently in session storage into a global variable.
// note: (if session storage currently has no signed-in data, variable will be null)
var signedInUser = JSON.parse(sessionStorage.getItem("signedInUserLocal"));

// Make sure variable holding signed-in user data is syncronized with corresponding data of the same user inside the database.
// note: (if any change was made from the database-server side, this if-statement is responsible for making it reflect into the web page)
if (signedInUser != null) {
    db.get(signedInUser['_id']).then(function (doc) {
        signedInUser = doc;
    }).catch(function (err) {
        signedInUser = null;
    });
	// after syncronizing signed-in data, reflect the syncronization into the browser's session storage.
    sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
}

// if there exists a signed in user, make corresponding data appear to web pages (home and my profile)
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



// The code block below tells the booking buttons what to to when clicked.
// the part: '*[id*=Booking]' selects every web element with an ID containing the string 'Booking'
$('*[id*=Booking]').each(function () {
	// booking type extracted from Button ID by slicing it.
    var bookingType = $(this).attr('id').slice(0, -7);
    $(this).click(function () {
		// if there exists a currently-singed-in user
        if (signedInUser != null) {
			// incease the amount of the trip clicked by: 1
            signedInUser['trips'][bookingType] += 1;
			
			// reflect this increment to both the session storage and the database
            sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
            db.get(signedInUser['_id']).then(function (doc) {
				// 'put' puts data into the database.
                return db.put({
					// _id stores username. the field '_id' is a mandatory primary key field in CouchDB.
                    _id: signedInUser['_id'],
					// rev stands for 'revision', it belongs to pouchDB. it exists to the fact that couchDB also stored past values of data records.
                    _rev: doc._rev,
					// update trips data after increment.
                    trips: signedInUser['trips']
                });
            })
			// and after that, notity the user, that his booking was successfull.
            alert('One additinoal ' + bookingType + " trip has been added to your acount\nYou can see it in the profile page.");

        } // if there was no currently-singed-in user, let the user know that booking requires signing in.
        else {
            alert("You must login first!");
        }
    })
});

// makes sure all registration fields are filled, tells the user to fill them all if not already.
function registrationFieldsAreEmpty() {
    let empty = false;
	// iterating over all registration fields by their IDs
    $('#in1,#in2,#in3,#in4').each(function () {
		// if length of input field is 0, it is empty.
        if ($(this).val().length == 0) {
            empty = true;
        }
    });
	// tells the user to fill them all if not already.
    if (empty) {
        alert("Fill all fields first!");
    }
    return empty;
}

// exact same as above, but for login fields
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


// function that takes object of type: 'database', and takes user data (table) in form of JSON,
// and stores this user data into the database
function storeNewUser(db, table) {
	// 'put' here is used to store new data into the database.
	// note: (put can be used for both changing existing data and putting new data)
	// note2: ( the 'then and catch' statement is similar to 'try and catch' statement)
    db.put(table).then(function (doc) {
		// if storage of new user data succeeded, notify the user
        alert("Account has been made successfully!\nNow go and sign in.");
        console.log(doc);
    }).catch(function (err) {
		// if failed to store new user data and the error is a conflict,
		// then tell the user that the username is already registered.
		// if failed for any other reason, log it to the console/
        if (err.error == "conflict") {
            alert("Username '" + table["_id"] + "' already registered!");
        } else {
            console.log("couldn't create new user!");
            console.log(err);
        }
    });
}


// tell the 'submit' button what to do when clicked (register or store new user data in the database).
$(function () {
	// select button that has text 'Submit'
    $('button:contains("Submit")').click(function () {

		// make sure all fields are filled before proceeding
        if (!registrationFieldsAreEmpty()) {
			// create an object of type dictionary (key-valye pairs), holding entered registration data,
			// to be stored into the database
            var userRecord = {
                "_id": $('#in2').val().toLowerCase(),
                "fullname": $('#in1').val(),
                "password": $('#in3').val(),
                "address": $('#in4').val(),
                "trips": {
                    "mountain": 0,
                    "surfing": 0,
                    "ocean": 0
                }
            }
			// store data into database
            storeNewUser(db, userRecord);
        }
    });
});

// tell the 'Login' button what to do when clicked (fetch user data from database).
$(function () {
	// select button that has text 'Login'
    $('button:contains("Login")').click(function () {
		// make sure all fields are filled before proceeding
        if (!loginFieldsAreEmpty()) {
			// store entered login username and password,
            var enteredUsername = $('#loginUsername').val().toLowerCase();
            var enteredPassword = $('#loginPassword').val();
			// 'get' is used to fetch data from database using primary key (in this case it's the username)
            db.get(enteredUsername).then(function (doc) {
				// if username is found, but password does not match, notify the user.
                if (doc["password"] != enteredPassword) {
                    alert("Password is incorrect!");
                } else {
					// if username is found, and password matches, do all the following: 
					
					// tell the use a successfull sign-in was performed
                    alert("Successfully logged in!");
					// store fetched user data into user data variable
                    signedInUser = doc;
					// store user data variable in browser memory (session storage). -will prevent losing data while navigating through the site-
                    sessionStorage.setItem("signedInUserLocal", JSON.stringify(signedInUser));
					// redirect to home
                    window.location.replace("index.html");
                }
            }).catch(function (err) {
				// if username was not found in database, notify the user.
                alert("Username was not found!");
            });
        }
    });
});
