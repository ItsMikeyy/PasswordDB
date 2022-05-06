const express = require("express");
require("dotenv").config()
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const res = require("express/lib/response");
const app = express();

let loginID;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))

const options ={

};
app.use(express.static("public", options));


mongoose.connect(process.env.DATABASE)

const userSchema = {
    username: String,
    password: String,
    accounts: [{
        accountName: String,
        accountUsername: String,
        accountPassword: String
    }]
};

const User = mongoose.model("User", userSchema);


app.get("/", (req,res) => {
    res.sendFile(__dirname + "/index.html")
});

app.post("/", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    if(username === USERNAME && password===PASSWORD){
        res.redirect("/home")
    }
    else{
        res.redirect("/");
    }
    //check if in database
});

app.get("/login", (req,res)=>{
    res.render("login");
})

app.post("/login",(req,res) => {
    User.findOne({username:req.body.username}, function(err, foundUser){
        
        //console.log(foundUser)
        if(err){
            console.log(err)
            return;
        } 
        if(foundUser != null){
            loginID = foundUser._id;
            bcrypt.compare(req.body.password, foundUser.password, function(err, result){
                if(result === true){
                    res.redirect("/home")
                } else {
                    res.redirect("/login")
                }
            });
        } else{
           // console.log("does not exist")
            res.redirect("/login")
        }
    });
});

app.get("/signup", (req,res)=>{
    res.render("signup");
})

app.post("/signup",(req,res) => {
    let saltRounds = 10;
    bcrypt.genSalt(saltRounds, function(err, salt){
        bcrypt.hash(req.body.password, salt, function(err, hash){
            User.create({username: req.body.username, password: hash}, function(err){
                if(err){
                    console.log(err);
                    res.redirect("/signup");
                } else {
                    console.log("Created");
                    res.redirect("/");
                }
            });
        });  
    });
});


app.get("/home", (req,res) => {
    User.findById({_id: loginID}, function(err, foundUser){
        if(err){
            console.log(err);
            return;
        }
        else{
            if (foundUser != null ){
                res.render("home", {
                    information: foundUser.accounts
                });
            }
            else{
                res.redirect("/login");
            }
        }
        })
       
   
});

app.post("/home", (req,res) => {
    res.redirect("/create");
})

app.get("/create",(req,res) =>{
    res.render("create");
})

app.post("/create", (req,res) =>{
    const accountName = req.body.accountName;
    const username = req.body.username;
    let password = req.body.password;
    const length = req.body.length;
    const symbols = req.body.symbols;
    const numbers = req.body.numbers;
    const lowecase = req.body.lowercase;
    const uppercase = req.body.uppercase;

    if (password === ""){
        password = generatePassword(length, symbols, numbers, lowecase, uppercase);
    }
    
    User.findByIdAndUpdate({_id: loginID}, {$push: { accounts: {accountName: accountName, accountUsername: username, accountPassword: password } } }, function(err){
        if(err){
            console.log(err);
        } else {
            console.log("success")
            res.redirect("/home");
        }
    })
    

})


function generatePassword(length, symbols, numbers, lowercase, uppercase){
    let symbolList = ["!","@","#","$","%","^","&","*"]
    let numberList = ["0","1","2","3","4","5","6","7","8","9"]
    let lowercaseList = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    let uppercaseList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    let selectionList = [];
    let finalPassword = [];

    if(symbols==="yes"){
        selectionList = selectionList.concat(symbolList)
    }
    if(numbers === "yes"){
        selectionList = selectionList.concat(numberList);
    }
    if(lowercase==="yes"){
        selectionList = selectionList.concat(lowercaseList);
    }
    if(uppercase === "yes"){
        selectionList = selectionList.concat(uppercaseList);
    }
    for (let i = 0; i < length; i++){
        finalPassword.push(selectionList[Math.floor(Math.random() * selectionList.length)])
    }
    return finalPassword.join("")
}

// app.get("/edit"){

// }

app.post("/edit", (req,res) =>{
    console.log(mongoose.Types.ObjectId(req.body.id))
    // User.aggregate([{$unwind: "$accounts"}, {$match:{"accounts._id" : mongoose.Types.ObjectId(req.body.id)}}], function(err, user){
    value = User.findOne({id: loginID})
    value.select({ accounts: {$elemMatch: {_id: mongoose.Types.ObjectId(req.body.id)}}})
    value.exec(function(err,user){
        console.log(user)
        res.render("edit", {account: user.accounts[0]});
    })
});

app.post("/delete", (req,res) =>{
    User.updateOne({_id: loginID}, {$pull: {"accounts": {_id: mongoose.Types.ObjectId(req.body.id)}}}, function(err,user){
        if(err){
            console.log(err);
        } else{
            console.log(user)
            res.redirect("/home");
        }
        console.log(loginID)
    })
    
});



app.post("/edit/update", (req,res) =>{
    User.updateOne({'accounts._id': mongoose.Types.ObjectId(req.body.id)}, {$set: {"accounts.$.accountName": req.body.accountName, "accounts.$.accountUsername": req.body.username, "accounts.$.accountPassword": req.body.password }}, function(err,user){
        console.log(user)
        res.redirect("/home");
    })
    
})
// app.post("/edit/save", function(req, res){

// })

app.listen(3000, () => {
    console.log("Server started on port 3000!");
});