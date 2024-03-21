const express = require("express")
const session = require("express-session")
const path = require("path")
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
const uuid = require('uuid');

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

app.post("/getUserInfo", getUserInfo)

app.get("/getGroupUsers", getGroupUsers)

app.get("/getGroupTasks", getGroupTasks)

app.get("/getLeaderboard", getLeaderboard)

app.post("/createGroupTasks", createGroupTasks)

app.post("/userEdit", userEdit)

app.post("/editGroupTasks", editGroupTasks)

app.put("/confirmGroupTasks", confirmGroupTasks)

app.put("/confirmedGroupTasks", confirmedGroupTasks)

app.put("/completeGroupTasks", completeGroupTasks)

app.put("/uncompleteGroupTasks", uncompleteGroupTasks)

app.post("/userDelete", userDelete)

app.post("/deleteGroupTasks", deleteGroupTasks)

app.get("/groupDelete", groupDelete)

app.put("/userConfirm", userConfirm)

app.post("/checkCredentials", checkCredentials)

app.post("/checkLogin", checkLogin)

app.put("/updateUserInfo", updateUserInfo)

app.put("/updateGroupInfo", updateGroupInfo)

async function getUserRoles(request, response) {
    const sql = db.prepare('SELECT * FROM usertype WHERE ID <= 2')
    let rows = sql.all()
    let roles = rows.map(role => ({
        id: role.ID,
        name: role.role
    }));
    response.send(roles)
}

async function getUserInfo(request, response){
    let rows
    let getUserInfo
    let sql = db.prepare(
    `SELECT users.uuid, users.name, users.email, workgroup.groupCode, workgroup.name AS groupName , users.points, users.taskCompleted
    FROM users 
    INNER JOIN workgroup ON users.workgroup = workgroup.ID
    WHERE users.uuid = ?
    `)
    if(request.body.uuid){
        rows = sql.all(request.body.uuid)
        getUserInfo = rows.map(user => ({
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            points: user.points,
            taskCompleted: user.taskCompleted,
        }));
        
    } 
    else if(request.body.type){
        let sqlAssigned= db.prepare(`SELECT COUNT(*) as taskCount FROM tasks WHERE tasks.workgroup = ? and tasks.assignedTo = ? and tasks.status = ? `).get(request.session.userWorkgroup, request.session.userID, "active");
        rows = sql.all(request.session.userUUID)
        getUserInfo = rows.map(user => ({
            uuid: user.uuid,
            name: user.name,
            workgroup: user.groupName,
            points: user.points,
            taskCompleted: user.taskCompleted,
            taskAssigned: sqlAssigned.taskCount
        }));
    }
    else if(!request.body.uuid) {

        rows = sql.all(request.session.userUUID)
        getUserInfo = rows.map(user => ({
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            workgroup: user.groupCode,
        }));
    }
    response.send(getUserInfo)
}


async function getGroupUsers(request, response){
    let getGroupUsers
    let totalPoints = 0
    let totalTaskCompleted = 0
    let sqlUsers = db.prepare(
    `SELECT users.uuid, users.name, users.email, users.userStatus, usertype.role, users.usertype, users.points, users.taskCompleted
    FROM users
    INNER JOIN usertype ON users.usertype = usertype.ID
    WHERE workgroup = ? and uuid != ? and users.usertype != '3'
    `)
    let sqlGroup = db.prepare(`
    SELECT workgroup.id, workgroup.uuid, workgroup.name AS groupName, users.name, workgroup.groupCode, workgroup.createdBy 
    FROM workgroup 
    INNER JOIN users ON workgroup.createdBy = users.uuid
    WHERE workgroup.ID = ?
    `)
    let rowsUsers = sqlUsers.all(request.session.userWorkgroup, request.session.userUUID)
    let rowsGroup = sqlGroup.all(request.session.userWorkgroup)
    getGroupUsers = rowsUsers.map(user => ({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        userStatus: user.userStatus,
        userRole: user.role,
        roleId: user.usertype,
        points: user.points,
        taskCompleted: user.taskCompleted,
    }));
    getGroupUsers.forEach(user => {
        if (user.roleId === 1){
            totalPoints += user.points
            totalTaskCompleted += user.taskCompleted
        }
    })
    getGroupInfo = rowsGroup.map(group => ({
        uuid: group.uuid,
        name: group.groupName,
        groupCode: group.groupCode,
        createdBy: group.name,
        createdByUuid: group.createdBy,
        totalPoints: totalPoints,
        totalTaskCompleted: totalTaskCompleted
    }));
    response.send({
        requestType: request.session.isLoggedIn,
        userInfo: getGroupUsers,
        groupInfo: getGroupInfo,
    })
};

async function getGroupTasks(request, response){
    let sql = db.prepare(`
    SELECT tasks.uuid, tasks.status, tasks.name, tasks.description, tasks.points, tasks.dateCreated, tasks.dateCompleted, 
    userCreatedBy.name AS createdByName, userAssignedBy.name AS userAssignedName, tasks.assignedTo AS assignedToUUID, 
    tasks.completedBy AS completedbyUUID, userCompletedBy.name AS completedByName
    FROM tasks
    INNER JOIN users AS userCreatedBy ON tasks.createdBy = userCreatedBy.id
    LEFT JOIN users AS userAssignedBy ON tasks.assignedTo = userAssignedBy.uuid
    LEFT JOIN users AS userCompletedBy ON tasks.completedBy = userCompletedBy.uuid
    WHERE tasks.workgroup = ? 
    `)
    let rows = sql.all(request.session.userWorkgroup)
    let getGroupTasks = rows.map(task => ({
        uuid: task.uuid,
        status: task.status,
        name: task.name,
        description: task.description,
        points: task.points,
        dateCreated: task.dateCreated,
        dateCompleted: task.dateCompleted,
        createdBy: task.createdByName,
        assignedTo: task.userAssignedName,
        assignedToUUID: task.assignedToUUID,
        completedBy: task.completedByName,
        completedByUUID: task.completedbyUUID
    }))
    response.send({
       requestType: request.session.isLoggedIn,
       requestUUID: request.session.userUUID,
       groupTasks: getGroupTasks,
    })
}
 


async function createGroupTasks(request, response){
    group = request.body  
    let date = new Date().toISOString().slice(0, 10);
    if(group.assignedTo === "none"){
        let sqlCreateTask = db.prepare("INSERT INTO tasks (uuid, status, name, description, points, dateCreated, dateCompleted, createdBy, assignedTo, completedBy, workgroup) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        let UUID = await generatedUuid("tasks")
        let createTask = sqlCreateTask.run(UUID, "active", group.name, group.description, group.points, date, "None", request.session.userID, "None", "None", request.session.userWorkgroup)
        if(createTask){
            response.send({responseMessage: "The task is created!"})
        }
    } else{
        let checkUser = await checkAvailability("users", "uuid", group.assignedTo)
        if(checkUser === false){
            let sqlCreateTask = db.prepare("INSERT INTO tasks (uuid, status, name, description, points, dateCreated, dateCompleted, createdBy, assignedTo, completedBy, workgroup) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            let UUID = await generatedUuid("tasks")
            let createTask = sqlCreateTask.run(UUID, "active", group.name, group.description, group.points, date, "None", request.session.userID, group.assignedTo, "None", request.session.userWorkgroup)
            if(createTask){
               response.send({responseMessage: "The task is created!"})
            }
        } else {
            response.send({responseMessage: "There is no user with this uuid!"})
        }
    }
}

async function userEdit(request, response){
    let sql = db.prepare(
    `SELECT users.uuid, users.name, users.email, users.points, users.taskCompleted
    FROM users 
    WHERE uuid = ?
    `)
    let rows = sql.all(response.body.uuid)
    let getUserEditInfo = rows.map(user => ({
        uuid: user.uuid,
        name: user.name,
        points: user.points,
        taskCompleted: user.taskCompleted,
    }));
    response.send(getUserEditInfo)
}

async function userDelete(request, response){
    let sql = db.prepare("DELETE FROM users WHERE uuid = ?")
    let deleteUser = sql.run(request.body.uuid)
    response.send({responseMessage: "The user is deleted!"})
}
async function userConfirm(request, response){
    let sql = db.prepare("UPDATE users SET userStatus = 'true' WHERE uuid = ?")
    let editUser = sql.run(request.body.uuid)
    response.send({responseMessage: "The user is comfirmed!"})
}

async function confirmGroupTasks(request, response){
    let assignedToValue = request.body.assignedTo.toLowerCase() === "none" ? "None" : request.body.assignedTo
    let checkUser = await checkAvailability("users", "uuid", request.body.assignedTo)
    if(checkUser === false || assignedToValue === "None"){
        let sql = db.prepare("UPDATE tasks SET name = ?, description = ?, points = ?, assignedTo = ? WHERE uuid = ?")
        let editTask = sql.run(request.body.name, request.body.description, request.body.points, assignedToValue, request.body.uuid)
        response.send({responseMessage: "The task is updated!"})
    }
    else{
        response.send({responseMessage: "There is no user with this uuid!"})
    }

}

async function completeGroupTasks(request, response){
    let sql = db.prepare("UPDATE tasks SET status = ?, dateCompleted = ?, completedBy = ? WHERE uuid = ?")
    let date = new Date().toISOString().slice(0, 10);
    let editTask = sql.run("awating", date, request.session.userUUID, request.body.uuid)
    response.send({responseMessage: "The task is completed!"})
}

async function uncompleteGroupTasks(request, response){
    let sql = db.prepare("UPDATE tasks SET status = ?, dateCompleted = ?, completedBy = ? WHERE uuid = ?")
    let editTask = sql.run("active", "None", "None", request.body.uuid)
    response.send({responseMessage: "The task is uncompleted!"})
}

async function confirmedGroupTasks(request, response){
    let sqlTaskPoints = db.prepare("SELECT points, completedBy FROM tasks WHERE uuid = ?").all(request.body.taskUUID)
    let sqlUpdateTask = db.prepare("UPDATE tasks SET status = ? WHERE uuid = ?").run("completed", request.body.taskUUID)
    let sqlUpdateUser = db.prepare("UPDATE users SET points = points + ?, taskCompleted = taskCompleted + 1 WHERE uuid = ?").run(sqlTaskPoints[0].points, sqlTaskPoints[0].completedBy)
    response.send({responseMessage: "The task is completed!"})
}

async function editGroupTasks(request, response){
    let sql = db.prepare("SELECT tasks.uuid, tasks.name, tasks.description, tasks.points, tasks.assignedTo FROM tasks WHERE tasks.uuid = ?")
    let getTaskInfo = sql.all(request.body.uuid)
    response.send(getTaskInfo)
}

async function deleteGroupTasks(request, response){
    let sql = db.prepare("DELETE FROM tasks WHERE uuid = ?")
    let deleteUser = sql.run(request.body.uuid)
    response.send({responseMessage: "The task is deleted!"})
}


async function groupDelete(request, response){
    //db.transaction(() => {
        //db.prepare("DELETE FROM tasks WHERE workgroup = ?").run(request.session.userWorkgroup);
        //db.prepare("DELETE FROM shop WHERE workgroup = ?").run(request.session.userWorkgroup);
        //db.prepare("DELETE FROM users WHERE wokrgroup = ?").run(request.session.userWorkgroup); 
        //db.prepare("DELETE FROM group WHERE ID = ?").run(request.session.userWorkgroup);
    //})();
    //request.session.destroy()
    //response.send({responseURL: "login-page.html"})
}


async function getLeaderboard(request, response){
    let leaderboard = []
    let totalPoints
    let totalTaskCompleted
    let sqlGetGroup = db.prepare(`SELECT workgroup.id, workgroup.name FROM workgroup`).all()
    sqlGetGroup.forEach(group => {
        let sqlGetUsers = db.prepare(`SELECT users.name, users.points, users.taskCompleted FROM users WHERE workgroup = ?`).all(group.ID)
        totalPoints = 0
        totalTaskCompleted = 0 
        sqlGetUsers.forEach(user => {
            totalPoints += user.points
            totalTaskCompleted += user.taskCompleted
        })
        leaderboard.push({
            groupName: group.name,
            totalPoints: totalPoints,
            totalTaskCompleted: totalTaskCompleted
        });
    })
    response.send(leaderboard)
}

async function checkLogin(request, response){
    const user = request.body.userCredentials
    const sql = db.prepare(
    `SELECT users.id, users.password, users.userStatus, usertype.role, users.uuid, users.workgroup
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
                request.session.userUUID = users.uuid
                request.session.userID = users.ID
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
                response.send({errorMessage: "There is no group with this code!" })
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
    const UUID = await generatedUuid("users")
    if (user.usertype === '1' || user.usertype === '2') {
        if (workgroupAction === "join") {
            let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE groupCode = ?")
            let getWorkgroupId = sqlGetId.all(user.workgroupInfo)
            createUser(UUID, user.name, user.email, hashedPassword, user.usertype, getWorkgroupId[0].ID, "false", "0", "0")
        } else if (workgroupAction === "create") {
            await createWorkgroup(user.workgroupInfo, UUID)
            let sqlGetId = db.prepare("SELECT ID FROM workgroup WHERE createdBy = ?")
            let getWorkgroupId = sqlGetId.all(UUID)
            createUser(UUID, user.name, user.email, hashedPassword, 3, getWorkgroupId[0].ID, "true", "0", "0")
        }
    } 
}
async function createWorkgroup(name, createdBy){
    let groupCode = await genrateString();
    const UUID = await generatedUuid("workgroup")
    const sqlCreateWorkgroup = db.prepare("INSERT INTO workgroup (uuid, name, createdBy, groupCode) values (?, ?, ?, ?)")
    const createWorkgroup = sqlCreateWorkgroup.run(UUID, name, createdBy, groupCode)
}

async function createUser(uuid, name, email, password, usertype, workgroup, userStatus, points, taskCompleted) {
    const sqlCreateUser = db.prepare("INSERT INTO users  (uuid, name, email, password, usertype, workgroup, userStatus, points, taskCompleted) values (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const createUser = sqlCreateUser.run(uuid, name, email, password, usertype, workgroup, userStatus, points, taskCompleted)
}

async function generatedUuid(table){
    let uuidGenrated = uuid.v4()
    let sqlCheckUuid = db.prepare(`SELECT * FROM ${table} WHERE uuid = ?`)
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
    let UUID = user.type === "setting" ? request.session.userUUID : user.uuid
    getEmail = sqlCheckEmail.all(user.email, UUID)
    if (getEmail.length !== 0){
        response.send({responseMessage: "Email already in use!"})   
    } else {
        if(user.type === "setting"){
            let sqlUpdate = db.prepare("UPDATE users SET name = ?, email = ? WHERE uuid = ?")
            let updateUserInfo = sqlUpdate.run(user.name, user.email, request.session.userUUID) 
            response.send({responseMessage: "The user info is updated!"})
        }
        else if(user.type === "edit"){
            let sqlUpdate = db.prepare("UPDATE users SET name = ?, email = ?, points = ?, taskCompleted = ? WHERE uuid = ?")
            let updateUserInfo = sqlUpdate.run(user.name, user.email, user.points, user.taskCompleted, user.uuid) 
            response.send({responseMessage: "The user info is updated!"})
        }  
    }
}

async function updateGroupInfo(request, response){
    const user = request.body
    if (user.owner === "NaN"){
        sqlUpdateGroup = db.prepare("UPDATE workgroup SET name = ? WHERE ID = ?")
        let updateGroupName = sqlUpdateGroup.run(user.name, request.session.userWorkgroup)
        response.send({responseMessage: "The group info is updated!"})
    } else if(user.owner !== "NaN"){
        let checkOwner = await checkAvailability("users", "uuid", user.owner)
        if(checkOwner === true){
            response.send({responseMessage: "There is no user with that uuid!" })
        } else if(checkOwner === false){
            db.transaction(() => {
                db.prepare("UPDATE workgroup SET createdBy = ? WHERE ID = ?").run(user.owner, request.session.userWorkgroup);
                db.prepare("UPDATE users SET usertype = ? WHERE uuid = ?").run(3, user.owner); 
                db.prepare("UPDATE users SET usertype = ? WHERE uuid = ?").run(2, request.session.userUUID);
            })();
            request.session.destroy()
            response.send({responseURL: "login-page.html"})
        }
    } 
}

async function logout(request, response){
    request.session.destroy()
    response.send({redirectUrl: 'login-page.html'})
}

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000/login-page.html");
})