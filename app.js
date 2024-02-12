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
        if(user.userCredentials.workspaceAction === "1"){
            const isGroupExist = await checkAvailability("workgroup", "groupCode", user.userCredentials.groupinfo)
            if(isGroupExist === false){
                createUser(user.userCredentials, "join")
            } else{
                console.log("There is no group with this code!")
                response.send({ErrorMessage: "There is no group with this code!" })
            }
        } else if(user.userCredentials.workspaceAction === "2"){

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

async function createUser(user, type){
    if(type === "join"){
        let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
        let groupId = sqlGetId.all(user.groupinfo)
        console.log(groupId[0].ID)
        const hashedPassword = await bcrypt.hash(user.password, 10)
        const UUID = uuid.v4();
        let sqlCreateUser = db.prepare("INSERT INTO users (uuid, name, email, password, usertype, workgroup, userStatus ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,)")
        let createdUser = sqlCreateUser.all(UUID, user.name, user.email, hashedPassword, user.role, groupId[0].ID, false)
    }
}


async function createGroup(){

}

app.listen(3012, () => {
    console.log("Server is running on http://localhost:3012/login-page.html");
});