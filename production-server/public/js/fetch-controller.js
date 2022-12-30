const login = async (url, email, password) => {
    try {
        const fetchResult = await fetch(url, {
            method: "post",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                email,
                password,
            }),
        });
        return await fetchResult.json();
    } catch (error) {
        return error;
    }
};

const signup = async (url, user) => {
    console.log(user);
    try {
        const fetchResult = await fetch(url, {
            method: "post",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(user)
        });
        return await fetchResult.json();
    } catch (error) {
        return error;
    }
};

const getRequest = async (url, token) => {
    try {
        const fetchResult = await fetch(url, {
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        return await fetchResult.json();
    } catch (error) {
        return error;
    }
};
