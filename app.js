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

async function getUserRoles(request, response) {
    const sql = db.prepare('SELECT * FROM usertype')
    let rows = sql.all()
    let roles = rows.map(role => ({
        id: role.ID,
        name: role.role
    }));
    response.send(roles)
}

async function checkCredentials(request, response){
    const user = request.body
    const isAvailableEmail = await checkAvailability("users", "email", user.userCredentials.email);
    if(isAvailableEmail === true){
        if(user.userCredentials.workgroupAction === "1"){
            const isWorkgroupExist = await checkAvailability("workgroup", "groupCode", user.userCredentials.workgroupInfo)
            if(isWorkgroupExist === false){
                fixGroup(user.userCredentials, "join")
            } else{
                console.log("There is no group with this code!")
                response.send({ErrorMessage: "There is no group with this code!" })
            }
        } else if(user.userCredentials.workgroupAction === "2"){
            fixGroup(user.userCredentials, "create")
        }
    } else {
        console.log("A user is already created with that email!")
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
    if(workgroupAction === "join"){
        console.log(user)
        let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
        let getWorkgroupId = sqlGetId.all(user.workgroupInfo)
        console.log(user.usertype)
        createUser(UUID, user.name, user.email, hashedPassword, user.usertype, getWorkgroupId[0].ID, "false")
    } else if(workgroupAction === "create"){
        let sqlGetId = db.prepare("SELECT MAX(ID) FROM workgroup")
        let groupId = sqlGetId.all()
        createUser(UUID, user.name, user.email, hashedPassword, user.usertype, groupId[0]['MAX(ID)'] + 1, "false")
        createWorkgroup(UUID, groupId[0]['MAX(ID)'] + 1, user.workgroupInfo)

    }
}


async function createWorkgroup(uuid, groupId, name){
    console.log(uuid, groupId, name)
}

async function createUser(uuid, name, email, password, usertype, workgroup, userStatus) {
    const sqlCreateUser = db.prepare("INSERT INTO users (uuid, name, email, password, usertype, workgroup, userStatus) values (?, ?, ?, ?, ?, ?, ?)")
    const createUser = sqlCreateUser.run(uuid, name, email, password, usertype, workgroup, userStatus)
}

app.listen(3012, () => {
    console.log("Server is running on http://localhost:3012/login-page.html");
});