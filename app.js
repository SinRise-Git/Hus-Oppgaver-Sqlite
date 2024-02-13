const express = require("express")
const path = require("path")
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
const session = require("express-session")
const uuid = require('uuid')    
const { request } = require("http")

dotenv.config();

const app = express();
const staticPath = path.join(__dirname, 'public')
const db = sqlite3('./database.db', { verbose: console.log })
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(express.static(staticPath));

app.get("/getUserRoles", getUserRoles)

app.post("/checkCredentials", checkCredentials)

app.post("/checkLogin", checkLogin)

async function getUserRoles(request, response) {
    const sql = db.prepare('SELECT * FROM usertype WHERE ID <= 2')
    let rows = sql.all()
    let roles = rows.map(role => ({
        id: role.ID,
        name: role.role
    }));
    response.send(roles)
}

async function checkLogin(request, response){
    const user = request.body.userCredentials
    const sql = db.prepare('SELECT * FROM users WHERE email = ?')
    let rows = sql.all(user.email)
    if(rows.length === 0){
        response.send({ErrorMessage: "There is no user with that email!" })
    } else {
        let users = rows[0]
        const isPasswordCorrect = await bcrypt.compare(user.password, users.password)
        if(isPasswordCorrect){
            if(users.userStatus === "true"){
                response.send({ErrorMessage: "Correct username and password!"})
            } else {
                response.send({ErrorMessage: "The user is not actived, ask a voksen to active it!" })
            }
        } else {
            response.send({ErrorMessage: "The password is incorrect!" })
        }
    }
}

async function checkCredentials(request, response){
    const user = request.body.userCredentials
    const isAvailableEmail = await checkAvailability("users", "email", user.email);
    if(isAvailableEmail === true){
        if(user.workgroupAction === "1"){
            const isWorkgroupExist = await checkAvailability("workgroup", "groupCode", user.workgroupInfo)
            if(isWorkgroupExist === false){
                await fixGroup(user, "join")
            } else{
                response.send({ErrorMessage: "There is no group with this code!" })
            }
        } else if(user.workgroupAction === "2"){
            await fixGroup(user, "create")
        } 
    } else {
        response.send({ErrorMessage: "A user is already created with that email!" })
    }
    };

async function checkAvailability(table, type, info){
    const validTables = ['users', 'workgroup'];
    const validColumns = ['name', 'email', 'groupCode'];
    if (validTables.includes(table) && validColumns.includes(type)) {
        let isAvailable
        const sql = db.prepare(`SELECT * FROM ${table} WHERE ${type} = ?`)
        let check = sql.all(info)
        if(check.length === 0){
            isAvailable = true
        } else {
            isAvailable = false
        }
        return isAvailable
    }
}

async function fixGroup(user, workgroupAction){
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const UUID = uuid.v4();
    if (user.usertype === '1' || user.usertype === '2') {
        if (workgroupAction === "join") {
            let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
            let getWorkgroupId = sqlGetId.all(user.workgroupInfo)
            createUser(UUID, user.name, user.email, hashedPassword, user.usertype, getWorkgroupId[0].ID, "false")
        } else if (workgroupAction === "create") {
            await createWorkgroup(user.workgroupInfo, UUID)
            sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE createdBy = ?")
            getWorkgroupId = sqlGetId.all(UUID)
            createUser(UUID, user.name, user.email, hashedPassword, 3, getWorkgroupId[0].ID, "true")
        }
    } 
}
async function createWorkgroup(name, createdBy){
    let groupCode = await genrateString();
    const sqlCreateWorkgroup = db.prepare("INSERT INTO workgroup (name, createdBy, groupCode) values (?, ?, ?)")
    const createWorkgroup = sqlCreateWorkgroup.run(name, createdBy, groupCode)
}

async function createUser(uuid, name, email, password, usertype, workgroup, userStatus) {
    const sqlCreateUser = db.prepare("INSERT INTO users  (uuid, name, email, password, usertype, workgroup, userStatus) values (?, ?, ?, ?, ?, ?, ?)")
    const createUser = sqlCreateUser.run(uuid, name, email, password, usertype, workgroup, userStatus)
}

async function genrateString(){
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    async function getRandomString(){
        let generatedString = ''
        for (var i = 0; i < 4; i++) {
            generatedString += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return generatedString
    }
    let randomString =`${await getRandomString()}-${await getRandomString()}`;
    let sqlCheckString = db.prepare("SELECT * FROM workgroup WHERE groupCode = ?")
    let checkString = sqlCheckString.all(randomString)
    if (checkString.length === 0) {
        return randomString;
    } else {
        genrateString()
    }
}

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000/login-page.html");
});