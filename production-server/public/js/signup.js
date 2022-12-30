const url = "http://localhost:3000/signup";

const userSignup = async (user) => {
    const signupResult = await signup(url, user)
    if (signupResult.code == 200) {
        const userNickname = signupResult.data.nickname;
        const userToken = signupResult.data.token;
        localStorage.setItem(userNickname, userToken);
        location.href = `/home?nickname=${userNickname}`;
    } else {
        let feedback = "";
        if (signupResult.data.email) {
            const msg = signupResult.data.email.properties.message;
            feedback += `Email: ${msg}\n\n`
        }

        if (signupResult.data.password) {
            const msg = signupResult.data.password.properties.message;
            feedback += `Password: ${msg}\n\n`
        }

        if (signupResult.data.nickname) {
            const msg = signupResult.data.nickname.properties.message;
            feedback += `Nickname: ${msg}\n\n`
        }
        alert(`Signup failed:\n\n${feedback}`);
    }
};

let loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", (event) => {
    location.href = "/";
})

let submitBtn = document.getElementById("submit-btn");
submitBtn.addEventListener("click", async (event) => {
    const inputEmail = email.value.trim();
    const inputPassword1 = password1.value.trim();
    const inputPassword2 = password2.value.trim();
    const nicknameInput = nickname.value.trim();
    if (inputEmail && inputPassword1 && inputPassword2 && nicknameInput) {
        if (inputPassword1 != inputPassword2) {
            alert("Passwords do not match.");
        }else{
            const user = {
                email: inputEmail,
                password: inputPassword1,
                nickname: nicknameInput
            }
            await userSignup(user);
        }
    } else {
        alert("Missing the input");
    }
});