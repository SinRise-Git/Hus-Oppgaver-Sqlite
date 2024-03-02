const express = require("express")
const session = require("express-session")
const path = require("path")
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
const uuid = require('uuid');
const { get } = require("http")

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

function checkAuthorization(allowedRole) {
    return function(request, response, next) {
        if (!request.session.isLoggedIn) {
            return response.redirect('/login-page.html');
        }
        if (allowedRole !== request.session.isLoggedIn) {
            return response.redirect('/login-page.html');
        }
        next();
    };
}
app.get('/eier-page.html', checkAuthorization('eier'), (request, response) => {
  response.sendFile(path.join(staticPath, '/eier-page.html'));
});
     
app.get('/voksen-page.html', checkAuthorization('voksen'), (request, response) => {
  response.sendFile(path.join(staticPath, '/voksen-page.html'));
});
     
app.get('/barn-page.html', checkAuthorization('barn'), (request, response) => {
   response.sendFile(path.join(staticPath, '/barn-page.html'));
});

app.use(express.static(staticPath));

app.get("/getUserRoles", getUserRoles)

app.get("/logout",  logout)

app.get("/getUserInfo", getUserInfo)

app.get("/getGroupInfo", getGroupInfo)

app.post("/checkCredentials", checkCredentials)

app.post("/checkLogin", checkLogin)

app.put("/updateUserInfo", updateUserInfo)

async function getUserRoles(request, response) {
    const sql = db.prepare('SELECT * FROM usertype WHERE ID <= 2')
    let rows = sql.all()
    let roles = rows.map(role => ({
        id: role.ID,
        name: role.role
    }));
    response.send(roles)
}

async function logout(request, response){
    request.session.destroy()
    response.send({redirectUrl: 'login-page.html'})

}

async function getUserInfo(request, response){
    let sql = db.prepare(
    `SELECT uuid, users.name, email, workgroup.groupCode
    FROM users 
    INNER JOIN workgroup ON users.workgroup = workgroup.ID
    WHERE uuid = ?
    `)
    let rows = sql.all(request.session.userUuid)
    let getUserInfo = rows.map(user => ({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        workgroup: user.groupCode,
    }));
    response.send(getUserInfo)
}

async function getGroupInfo(request, response){
    let sql = db.prepare(
    `SELECT uuid, users.name, email, userStatus, usertype.role, usertype, points, taskCompleted 
    from users 
    INNER JOIN usertype ON users.usertype = usertype.ID
    WHERE workgroup = ?
    
    `)
    let rows = sql.all(request.session.userWorkgroup)
    let getGroupInfo = rows.map(user => ({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        userStatus: user.userStatus,
        userRole: user.role,
        roleId: user.usertype,
        points: user.points,
        taskCompleted: user.taskCompleted,

    }));
    response.send(getGroupInfo)
}


async function checkLogin(request, response){
    const user = request.body.userCredentials
    const sql = db.prepare(
    `SELECT password, userStatus, usertype.role, uuid, workgroup
    FROM users
    INNER JOIN usertype ON users.usertype = usertype.ID
    WHERE email = ?
    `)
    let rows = sql.all(user.email)
    if(rows.length === 0){
        response.send({errorMessage: "There is no user with that email!" })
    } else {
        const users = rows[0]
        const isPasswordCorrect = await bcrypt.compare(user.password, users.password)
        if(isPasswordCorrect){
            if(users.userStatus === "true"){
                request.session.isLoggedIn = users.role.toLowerCase()
                request.session.userUuid = users.uuid
                request.session.userWorkgroup = users.workgroup
                response.send({redirectUrl: `${users.role.toLowerCase()}-page.html`})
            } else {
                response.send({errorMessage: "User is not activated, ask a someone to active it!" })
            }
        } else {
            response.send({errorMessage: "The password is incorrect!" })
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
                response.send({responseMessage: "The user is created!"})
            } else{
                response.send({responseMessage: "There is no group with this code!" })
            }
        } else if(user.workgroupAction === "2"){
            await fixGroup(user, "create")
            response.send({responseMessage: "The user is created!"})
        } 
    } else {
        response.send({errorMessage: "A user is already created with that email!" })
    }
    };

async function checkAvailability(table, type, info){
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

async function fixGroup(user, workgroupAction){
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const UUID = await generatedUuid()
    if (user.usertype === '1' || user.usertype === '2') {
        if (workgroupAction === "join") {
            let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
            let getWorkgroupId = sqlGetId.all(user.workgroupInfo)
            createUser(UUID, user.name, user.email, hashedPassword, user.usertype, getWorkgroupId[0].ID, "false")
        } else if (workgroupAction === "create") {
            await createWorkgroup(user.workgroupInfo, UUID)
            let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE createdBy = ?")
            let getWorkgroupId = sqlGetId.all(UUID)
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
    const sqlCreateUser = db.prepare("INSERT INTO users  (uuid, name, email, password, usertype, workgroup, userStatus, points, taskCompleted) values (?, ?, ?, ?, ?, ?, ?)")
    const createUser = sqlCreateUser.run(uuid, name, email, password, usertype, workgroup, userStatus, 0, 0)
}

async function generatedUuid(){
    let uuidGenrated = uuid.v4()
    let sqlCheckUuid = db.prepare("SELECT * FROM users WHERE uuid = ?")
    let checkUuid = sqlCheckUuid.all(uuidGenrated)
    if (checkUuid.length === 0) {
        return uuidGenrated;
    } else {
        generatedUuid()
    }
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


async function updateUserInfo(request, response){
    const user = request.body
    const sqlCheckEmail = db.prepare("SELECT name, email FROM users WHERE email = ? and uuid != ?")
    const sqlCurrentWorkgroup = db.prepare("SELECT workgroup FROM users WHERE uuid = ?")
    let currentWorkgroup = sqlCurrentWorkgroup.all(request.session.userUuid)
    let checkEmail = sqlCheckEmail.all(user.email, request.session.userUuid)
    if(checkEmail.length !== 0){
        response.send({responseMessage: "Email already in use!"})
    } else {
       const isWorkgroupExist = await checkAvailability("workgroup", "groupCode", user.groupCode)
       if(isWorkgroupExist === true){
          response.send({responseMessage: "Group code don't exist!" })
       } else {
         let sqlUpdate = db.prepare("UPDATE users SET name = ?, email = ?, workgroup = ? WHERE uuid = ?")
         let sqlGroup = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
         let getWorkgroupId = sqlGroup.all(user.groupCode)
         const workgroupId = getWorkgroupId[0].ID
         let updateUserInfo = sqlUpdate.run(user.name, user.email, workgroupId, request.session.userUuid) 
         if(currentWorkgroup[0].workgroup !== workgroupId){
            response.send({redirectUrl: '/login-page.html'})
            request.session.destroy()
         } else{
            response.send({responseMessage: "The user info is updated!"})
         }
       }
    }    

}

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000/login-page.html");
});