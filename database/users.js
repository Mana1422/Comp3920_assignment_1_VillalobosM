const database = include('databaseConnection');

async function createUser(postData) {
	// Ensure that postData.user and postData.hashedPassword exist
    if (!postData.user || !postData.hashedPassword || 
		typeof postData.user !== "string" ||
	    typeof postData.hashedPassword !== "string") {
        console.log("Invalid input provided for creating user.");
        return false;
    }

	let createUserSQL = `
		INSERT INTO user
		(username, password)
		VALUES
		(${postData.user}, ${postData.hashedPassword});
	`;

	// let params = {
	// 	user: postData.user,
	// 	passwordHash: postData.hashedPassword
	// }
	
	try {
		const results = await database.query(createUserSQL);

        console.log("Successfully created user");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting user");
        console.log(err);
		return false;
	}
}

async function getUsers(postData) {
	let getUsersSQL = `
		SELECT username, password
		FROM user;
	`;
	
	try {
		const results = await database.query(getUsersSQL);

        console.log("Successfully retrieved users");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error getting users");
        console.log(err);
		return false;
	}
}


async function getUser(postData) {
	// Ensure that postData.user exists and is a string
    if (!postData.user || typeof postData.user !== "string") {
        console.log("Invalid input provided for username.");
        return false; // Return false to prevent further processing
    }

	console.log("The following is post data");
	console.log(postData);

	// Bad case 2 - not validating the user input
	let getUserSQL = "SELECT user_id, username, password \nFROM user \nWHERE username = \'"+ postData.user +"\';";
	// let params = {
	// 	user: postData.user
	// }

	console.log(getUserSQL);
	
	try {
		const results = await database.query(getUserSQL);

		// Ensure results exist before accessing properties
		if (!results[0] || results[0].length === 0) {
			console.log("No user found.");
			return false;
		}

        console.log("Successfully found user");
		console.log(results[0]);

		if (!results.password) {
			console.log("No password found for user.");
			return false;
		}
		
		return results[0];
	}
	catch(err) {
		console.log("Error trying to find user");
        console.log(err);
		return false;
	}
}

module.exports = {createUser, getUsers, getUser};
