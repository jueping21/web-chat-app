const config = require("../config");
const fetch = require('node-fetch');
/**
 * auth() is a helper function
 * 
 * If token is valid, returns {code: 200, data: {isAuth: true}}, Otherwise,
 * returns {code: 200, data: {isAuth: false}}. If an error occurred, 
 * then returns {code: 799, data: error.message}
 * 
 * @param {String} token 
 * @returns a response message
 */
const auth = async (token) => {
    try {
        const fetchResult = await fetch(`${config.loginURL}/auth`, {
            headers: {
                authorization: `Bearer ${token}`,
            },
        })
        const authResult = await fetchResult.json();
        return authResult;
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

/**
 * getProfile() is a helper function
 * 
 * If token is valid, returns {code: 200, data: {isAuth: true, user: userObject}}, 
 * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
 * then returns {code: 799, data: error.message}
 * 
 * @param {String} token 
 * @returns a response message
 */
const getProfile = async (token) => {
    try {
        const fetchProfile = await fetch(`${config.loginURL}/me`, {
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        const profile = await fetchProfile.json();
        return profile;
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

/**
 * logout() is a helper function
 * 
 * If token is valid, returns {code: 200, data: {isAuth: true, user: userObject}}, 
 * Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
 * then returns {code: 799, data: error.message}
 * 
 * @param {*} token 
 * @returns a response message
 */
const logout = async (token) => {
    try {
        const logoutFetch = await fetch(`${config.loginURL}/logout`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`
            },
        });
        return await logoutFetch.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

const login = async (user) => {
    try {
        let fetchLogin = await fetch(`${config.loginURL}/login`, {
            method: "post",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(user),
        })
        return await fetchLogin.json();
    } catch (error) {
        console.log(error);
        return {
            code: 799,
            data: error.message
        };
    }
};

const signup = async (user) => {
    try {
        let fetchRegister = await fetch(`${config.loginURL}/signup`, {
            method: "post",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(user),
        })
        return await fetchRegister.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

/**
* getRooms() is a helper function
* 
* If token is valid, returns {code: 200, data: {isAuth: true, room: [...]}}, 
* Otherwise, returns {code: 200, data: {isAuth: false}}. If an error occurred, 
* then returns {code: 799, data: error.message}
* 
* @param {*} token 
* @returns a response message
*/
const getRooms = async () => {
    try {
        const fetchRoom = await fetch(`${config.managementAPI}/getRoom`);
        return await fetchRoom.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};


const joinChat = async (user) => {
    try {
        let joinChat = await fetch(`${config.managementAPI}/join`, {
            method: "post",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(user),
        })
        return await joinChat.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

const getSession = async (session) => {
    try {
        let chatSession = await fetch(`${config.managementAPI}/getSession/${session}`)
        return await chatSession.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

const disconnect = async (session) => {
    try {
        let disconnectChat = await fetch(`${config.managementAPI}/disconnect`, {
            method: "delete",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ session }),
        })
        return await disconnectChat.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

const logoutChat = async (username) => {
    try {
        let disconnectChat = await fetch(`${config.managementAPI}/logout`, {
            method: "delete",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ username }),
        })
        return await disconnectChat.json();
    } catch (error) {
        return {
            code: 799,
            data: error.message
        };
    }
};

module.exports = {
    auth,
    getProfile,
    login,
    signup,
    logout,
    getRooms,
    joinChat,
    getSession,
    disconnect,
    logoutChat
}