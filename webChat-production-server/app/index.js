const express = require("express");
const path = require("path");
const app = express();
const staticPath = path.resolve(__dirname, "./public");
const viewPath = path.resolve(__dirname, "./view");

app.use(express.static(staticPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", viewPath);

app.get("/", (request, response) => {
    response.render("index")
})

app.get("/home", (request, response) => {
    response.render("home")
})

app.get("/chat", (request, response) => {
    response.render("chat")
})

app.get("/signup", (request, response) => {
    response.render("signup")
})

app.listen(process.env.PORT, ()=>{
    console.log("Production Server is up at 8000");
})