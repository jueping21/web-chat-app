const url = "http://localhost:28000/login";

let signupBtn = document.getElementById("signup-btn");
signupBtn.addEventListener("click", async() => {
    location.href = "/signup";
});

let loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", async() => {
    const inputEmail = email.value.trim();
    const inputPassw = password.value.trim();
    if(inputEmail && inputPassw){
        const user = await login(url, email.value.trim(), password.value.trim());
        console.log(user);
        if (user.code == 200) { 
            const userNickname = user.data.nickname;
            const userToken = user.data.token;
            localStorage.setItem(userNickname, userToken);
            location.href = `/home?nickname=${userNickname}`;
        }else{
            alert("Incorrect email or password");
            location.href = "/";
        }
    }else{
        alert("Missing the input");
    }
});