const toggleButton = document.getElementsByClassName('toggle-button')[0];
const navbarLinks = document.getElementsByClassName('navbar-links')[0];
let isAnimating = false;
let confirmDelete = false; 

toggleButton.addEventListener('click', () => {
    if (isAnimating) {
        return;
    }
    isAnimating = true;
    if (navbarLinks.classList.contains('active')) {
        navbarLinks.style.animationName = 'pageOut';
    } else {
        navbarLinks.classList.add('active');
        navbarLinks.style.animationName = 'pageIn';
    }
});
navbarLinks.addEventListener('animationend', (event) => {
    if (event.animationName === 'pageOut') {
        navbarLinks.classList.remove('active');
    }
    isAnimating = false;
});

function changePage(page) {
    let pagesDiv = document.querySelector('.pages');
    Array.from(pagesDiv.children).forEach(div => {
        div.id === page ? div.style.display = 'flex' : div.style.display = 'none';
    });
    document.getElementById('page-title').innerText = page[0].toUpperCase() + page.slice(1) ;
}

function changeUserPage(page) {
    let pagesDiv = document.querySelector('.userDiv');
    Array.from(pagesDiv.children).forEach(div => {
        div.id === page ? div.style.display = 'block' : div.style.display = 'none';
    });
}
function changeGroupPage(page) {
    let pagesDiv = document.querySelector('.groupTasks');
    Array.from(pagesDiv.children).forEach(div => {
        div.id === page ? div.style.display = 'block' : div.style.display = 'none';
    });
}


document.getElementsByClassName('optionButton')[0].addEventListener('click', async function() {
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
    document.getElementsByClassName('settingChange')[0].style.display = 'flex'
})

if(document.getElementById('addTaskButton')){
    document.getElementById('addTaskButton').addEventListener('click', async function() {
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
        document.getElementsByClassName('settingTaskCreate')[0].style.display = 'flex'
    })
}


document.getElementById('settingCancel').addEventListener('click', function() {
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
    document.getElementsByClassName('settingChange')[0].style.display = 'none';
    document.getElementById("settingResponseMessage").innerText = "";
    document.getElementById("settingChangeForm").reset();
});

if(document.getElementById('editCancel')){
    document.getElementById('editCancel').addEventListener('click', function() {
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
        document.getElementsByClassName('settingEdit')[0].style.display = 'none';
        document.getElementById("settingEditResponse").innerText = "";
        document.getElementById("settingEditForm").reset();
    })
}

if (document.getElementById('groupCancel')) {
    document.getElementById('groupCancel').addEventListener('click', function() {
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
        document.getElementsByClassName('settingGroup')[0].style.display = 'none';
        document.getElementById("settingGroupResponse").innerText = "";
        document.getElementById("settingGroupForm").reset();
    });
}

if(document.getElementById('taskCreateCancel')){
    document.getElementById('taskCreateCancel').addEventListener('click', function() {
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
        document.getElementsByClassName('settingTaskCreate')[0].style.display = 'none';
        document.getElementById("settingTaskCreateResponse").innerText = "";
        document.getElementById("settingTaskCreateForm").reset();
    });
}

if(document.getElementById('taskEditCancel')){
    document.getElementById('taskEditCancel').addEventListener('click', function() {
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
        document.getElementsByClassName('settingTaskEdit')[0].style.display = 'none';
        document.getElementById("settingTaskEdit").innerText = "";
        document.getElementById("settingTaskEditForm").reset();
    });
}

async function getUserInfo() {
    const requestOptions = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    };
    let response = await fetch('/getUserInfo', requestOptions);
    let data = await response.json();
    document.getElementById('settingChangeUuid').innerText = data[0].uuid;
    document.getElementById('settingName').placeholder = data[0].name;
    document.getElementById('settingEmail').placeholder = data[0].email;
    document.getElementById('settingGroup').placeholder = data[0].workgroup;
}

async function getUserInfoTasks(){
    const requestOptions = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({type: "task"})
    };
    let response = await fetch('/getUserInfo', requestOptions);
    let data = await response.json();
    let groupInfoDiv = `
    <div class="userInfo">
       <h2>Welcome ${data[0].name}</h2>
       <p>Group: <span>${data[0].workgroup}</span></p>
       <p>Tasked assigned to you: <span>${data[0].taskAssigned}</span></p>
       <p>Total tasks completed: <span>${data[0].taskCompleted}</span></p>
       <p>Total points collected: <span>${data[0].points}</span></p>
    </div>`
    document.querySelector("#tasks .userInformation").innerHTML = groupInfoDiv
}


document.getElementById("filterNameTasks").addEventListener('input', getGroupTasks)
document.getElementById("filterAssigned").addEventListener('change', getGroupTasks)
document.getElementById("filterMostTasks").addEventListener('change', getGroupTasks)

async function getGroupTasks() {
    let countActiveTasks = 0;
    let countAwatingTasks = 0;
    let countCompletedTasks = 0;
    let response = await fetch('/getGroupTasks');
    let data = await response.json();
    let filterSearch = document.getElementById("filterNameTasks").value.toLowerCase()
    let filterAssigned = document.getElementById("filterAssigned").value
    document.querySelector("#activeDiv .tasks").innerHTML = '';
    document.querySelector("#awatingDiv .tasks").innerHTML = '';
    document.querySelector("#completedDiv .tasks").innerHTML = '';
    let filterMost = document.getElementById("filterMostTasks").value
    filterMost === "points" ? data.groupTasks.sort((a, b) => b.points - a.points) : data.groupTasks;
    if(data.requestType === "eier" || data.requestType === "voksen"){
        data.groupTasks.forEach(task => {
            if((filterSearch === "" || task.name.toLowerCase().includes(filterSearch)) && (filterAssigned === "any" ||  task.assignedToUUID === data.requestUUID)){
                let assignedTo = task.assignedTo ? task.assignedTo : 'None';
                if(task.status === "active"){
                    countActiveTasks++;
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <button onclick="taskAction('Edit','${task.uuid}')">Edit Task</button>
                        <button id="deleteButton" onclick="taskAction('Delete','${task.uuid}')">Delete Task</button>
                    </div>`
                    document.querySelector("#activeDiv .tasks").innerHTML += taskDiv;
    
                }else if (task.status === "awating"){
                    countAwatingTasks++;
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Completed by: ${task.completedBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <p>Completed at: ${task.dateCompleted}</p>
                        <button onclick="taskAction('Confirmed','${task.uuid}')">Confirm Task</button>
                        <button id="deleteButton" onclick="taskAction('Uncomplete','${task.uuid}')">Reverse Task</button>
                    </div>`
                    document.querySelector("#awatingDiv .tasks").innerHTML += taskDiv;
    
                }else if (task.status === "completed"){
                    countCompletedTasks++
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Completed by: ${task.completedBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <p>Completed at: ${task.dateCompleted}</p>
                        <button id="deleteButton" onclick="taskAction('Delete','${task.uuid}')">Delete Task</button>
                    </div>`
                    document.querySelector("#completedDiv .tasks").innerHTML += taskDiv;
    
                }
            }

        });
    } else if (data.requestType === "barn"){
        data.groupTasks.forEach(task => {
            if((filterSearch === "" || task.name.toLowerCase().includes(filterSearch)) && (filterAssigned === "any" ||  task.assignedToUUID === data.requestUUID)){
                let assignedTo = task.assignedTo ? task.assignedTo : 'None';
                if(task.status === "active" && (task.assignedToUUID === data.requestUUID || task.assignedTo === null)){
                    countActiveTasks++;
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <button onclick="taskAction('Complete','${task.uuid}')">Complete Tasks</button>
                    </div>`
                    document.querySelector("#activeDiv .tasks").innerHTML += taskDiv;
        
                } else if (task.status === "awating" && task.completedByUUID === data.requestUUID){
                    countAwatingTasks++;
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <p>Finished at: ${task.dateCompleted}</p>
                        <button id="deleteButton" onclick="taskAction('Uncomplete','${task.uuid}')">Reverse Task</button>
                    </div>`
                    document.querySelector("#awatingDiv .tasks").innerHTML += taskDiv;
        
                } else if (task.status === "completed" && task.completedByUUID === data.requestUUID){
                    countCompletedTasks++
                    let taskDiv = `
                    <div>
                        <p id="taskUuid">${task.uuid}</p>
                        <h3>Name: ${task.name}</h3>
                        <p>Description: ${task.description}</p>
                        <p>Points: ${task.points}</p>
                        <p>Assigned to: ${assignedTo}</p>
                        <p>Created by: ${task.createdBy}</p>
                        <p>Created at: ${task.dateCreated}</p>
                        <p>Finished at: ${task.dateCompleted}</p>
                        <button id="deleteButton" onclick="taskAction('delete','${task.uuid}')">Remove Task</button>
                    </div>`
                    document.querySelector("#completedDiv .tasks").innerHTML += taskDiv;
        
        
                }
            }

        })
    }
    document.getElementById('activeTasksCount').innerText = countActiveTasks;
    document.getElementById('awatingTasksCount').innerText = countAwatingTasks;
    document.getElementById('completedTasksCount').innerText = countCompletedTasks;
    
}

document.getElementById('filterName').addEventListener('input',  getGroupUsers)
document.getElementById('filterRole').addEventListener('change', getGroupUsers)
document.getElementById('filterMost').addEventListener('change', getGroupUsers)

async function getGroupUsers() {
    let groupInfoDiv
    let countActiveUsers = 0;
    let countAwatingUsers = 0; 
    let response = await fetch('/getGroupUsers');
    let data = await response.json()
    let groupData = data.groupInfo[0]
    if(data.requestType === "eier"){
        groupInfoDiv = `
        <div class="groupInfo">
           <h2>Familiy Information</h2>
           <h3>Invite code: ${groupData.groupCode}</h3>
           <p>Name: <span>${groupData.name}</span></p>
           <p>Owner:<span> ${groupData.createdBy}</span></p>
           <p>Total tasks completed: <span>${groupData.totalTaskCompleted}</span></p>
           <p>Total points collected: <span>${groupData.totalPoints}</span></p>
           <div class="buttons">
              <button onclick="editGroup()">Edit Group</button>
              <button id="deleteButtonGroup" onclick="deleteGroup()">Purge</button>
           </div>
        </div>`
    } else if(data.requestType === "voksen" || data.requestType === "barn"){
        groupInfoDiv = `
        <div class="groupInfo">
           <h2>Familiy Information</h2>
           <h3>Invite code: ${groupData.groupCode}</h3>
           <p>Name: <span>${groupData.name}</span></p>
           <p>Owner:<span> ${groupData.createdBy}</span></p>
           <p>Total tasks completed: <span>${groupData.totalTaskCompleted}</span></p>
           <p>Total points collected: <span>${groupData.totalPoints}</span></p>
        </div>`
    }
    let filterSearch = document.getElementById("filterName").value.toLowerCase()
    let filterRoleElement = document.getElementById("filterRole");
    let filterRole = filterRoleElement ? filterRoleElement.value : "all"; 
    let filterMost = document.getElementById("filterMost").value
    filterMost === "points" ? data.userInfo.sort((a, b) => b.points - a.points) : data.userInfo.sort((a, b) => b.taskCompleted - a.taskCompleted);
    document.querySelector("#familiy .group").innerHTML = groupInfoDiv
    document.querySelector(".userDiv #activeDiv .users").innerHTML = '';
    if(data.requestType === "eier" || data.requestType === "voksen"){
        document.querySelector("#awatingDiv .users").innerHTML = '';
        data.userInfo.forEach(user => {  
            if((filterRole === "all" || user.roleId === Number(filterRole)) && (filterSearch === "" || user.name.toLowerCase().includes(filterSearch))){
                if (user.userStatus === "true"){
                    countActiveUsers++;
                    let userDiv = `
                    <div>
                        <p id="userUuid">${user.uuid}</p>
                        <h3>Navn: ${user.name}</h3>
                        <p>Email: ${user.email}</p>
                        <p>Role: ${user.userRole}</p>
                        <p>Tasks completed: ${user.taskCompleted}</p>
                        <p>Points: ${user.points}</p>
                        <button onclick="userAction('Edit','${user.uuid}')">Edit User</button>
                        <button id="deleteButton" onclick="userAction('Delete','${user.uuid}')">Remove User</button>
                    </div>`
                    document.querySelector("#activeDiv .users").innerHTML += userDiv;
                } else if (user.userStatus === "false"){
                    countAwatingUsers++;
                    let userDiv = `
                    <div>
                        <p id="userUuid">${user.uuid}</p>
                        <h3>Navn: ${user.name}</h3>
                        <p>Email: ${user.email}</p>
                        <p>Role: ${user.userRole}</p>
                        <p>Tasks completed: ${user.taskCompleted}</p>
                        <p>Points: ${user.points}</p>
                        <button onclick="userAction('Confirm','${user.uuid}')">Confirm User</button>
                        <button id="deleteButton" onclick="userAction('Delete','${user.uuid}')">Remove User</button>
                    </div>`
                    document.querySelector("#awatingDiv .users").innerHTML += userDiv;
                }
            }

        })
    } else if (data.requestType === "barn"){
        data.userInfo.forEach(user => {
            if((filterRole === "all" || user.roleId === Number(filterRole)) && (filterSearch === "" || user.name.toLowerCase().includes(filterSearch))){
                if (user.userStatus === "true"){
                    countActiveUsers++;
                    let userDiv = `
                    <div>
                        <p id="userUuid">${user.uuid}</p>
                        <h3>Navn: ${user.name}</h3>
                        <p>Email: ${user.email}</p>
                        <p>Role: ${user.userRole}</p>
                        <p>Tasks completed: ${user.taskCompleted}</p>
                        <p>Points: ${user.points}</p>
                    </div>`
                    document.querySelector(".userDiv #activeDiv .users").innerHTML += userDiv;
                }
            }
        })
    }
    document.getElementById('activeUsersCount').innerText = countActiveUsers;
    document.getElementById('awatingUsersCount').innerText = countAwatingUsers;
}

async function userAction(type, uuid){
    if(type === "Edit"){
        const requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({uuid: uuid})
        };
        let response = await fetch(`/getUserInfo`, requestOptions);
        let data = await response.json();
        document.getElementById('settingEditUuid').innerText = data[0].uuid;
        document.getElementById('editName').placeholder = data[0].name;
        document.getElementById('editEmail').placeholder = data[0].email;
        document.getElementById('editPoints').placeholder = data[0].points;
        document.getElementById('editTaskCompleted').placeholder = data[0].taskCompleted;
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
        document.getElementsByClassName('settingEdit')[0].style.display = 'flex';
    } else if (type === "Delete" || type === "Confirm"){
        let methodType = type === "Delete" ? "POST" : "PUT";
        const requestOptions = {
            method: methodType,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({uuid: uuid})
        };
        let response = await fetch(`/user${type}`, requestOptions);
        let data = await response.json();
        if(data.responseMessage){
            getGroupUsers();
        }
    }
}

async function editGroup(){
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
    document.getElementsByClassName('settingGroup')[0].style.display = 'flex'
    let response = await fetch(`/getGroupUsers`);
    let data = await response.json()
    document.getElementById('settingGroupUuid').innerText = data.groupInfo[0].uuid;
    document.getElementById('editGroupName').placeholder = data.groupInfo[0].name;
    document.getElementById('editOwner').placeholder = data.groupInfo[0].createdByUuid;
}


async function deleteGroup(){
    document.getElementById('deleteButtonGroup').innerText = "You sure?"
    if(confirmDelete === false){
        confirmDelete = true;
        setTimeout(() => {
            confirmDelete = false;
            document.getElementById('deleteButtonGroup').innerText = "Purge"
        }, 5000);
    } else if(confirmDelete === true){
        let response = await fetch('/deleteGroup');
        let data = await response.json();
        if(data.responseMessage){
            window.location.href = data.redirectUrl;
        }
    }
}

async function taskAction(type, taskUUID){
    if(type === "Delete"){
        const requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({uuid: taskUUID})
        };
        let response = await fetch(`/${type.toLowerCase()}GroupTasks`, requestOptions);
        let data = await response.json();
        if(data.responseMessage){
            getGroupTasks();
        }
    } else if (type === "Edit"){
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
        document.getElementsByClassName('settingTaskEdit')[0].style.display = 'flex'
        const requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({uuid: taskUUID})
        };
        let response = await fetch(`/${type.toLowerCase()}GroupTasks`, requestOptions);
        let data = await response.json();
        document.getElementById('settingTaskEditUuid').innerText = data[0].uuid;
        document.getElementById('taskEditName').placeholder = data[0].name;
        document.getElementById('taskEditDescription').placeholder = data[0].description;
        document.getElementById('taskEditPoints').placeholder = data[0].points;
        document.getElementById('taskEditAssigned').placeholder = data[0].assignedTo;

    } else if (type === "Complete" || type === "Uncomplete" ){
        const requestOptions = {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({uuid: taskUUID})
        };
        let response = await fetch(`/${type.toLowerCase()}GroupTasks`, requestOptions);
        let data = await response.json();
        if(data.responseMessage){
            getGroupTasks();
        }
    } else if (type === "Confirmed"){
        const requestOptions = {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({taskUUID: taskUUID})
        };
        let response = await fetch(`/${type.toLowerCase()}GroupTasks`, requestOptions);
        let data = await response.json();
        if(data.responseMessage){
            getGroupTasks();
            getGroupUsers(); 
        }
    }
}

document.getElementById('settingConfirm').addEventListener('click', async function () {
    let settingName = document.getElementById("settingName");
    let settingEmail = document.getElementById("settingEmail");
    let settingGroup = document.getElementById("settingGroup");
    let responseMessageDisplay = document.getElementById("settingResponseMessage");

    let newName = settingName.value !== "" ? settingName.value : settingName.placeholder;
    let newEmail = settingEmail.value !== "" ? settingEmail.value : settingEmail.placeholder;
    let newGroupCode = settingGroup.value !== "" ? settingGroup.value : settingGroup.placeholder;

    const updateUser = {
        type: "setting",
        name: newName,
        email: newEmail,
        groupCode: newGroupCode,
    };
    const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateUser)
    };

    let response = await fetch('/updateUserInfo', requestOptions)
    let data = await response.json();
  
    if (data.responseMessage) {
        responseMessageDisplay.style.display = "block"
        responseMessageDisplay.innerText = data.responseMessage;
        if (data.responseMessage === "The user info is updated!") {
            responseMessageDisplay.style.color = "green"
            await getUserInfo()
            await getUserInfoTasks()
            document.getElementById("settingChangeForm").reset()
        } else {
            responseMessageDisplay.style.color = "red"
        }
    }
});

if(document.getElementById('editConfirm')){
    document.getElementById('editConfirm').addEventListener('click', async function() {
        let editName = document.getElementById("editName");
        let editEmail = document.getElementById("editEmail");
        let editTaskCompleted = document.getElementById("editTaskCompleted");
        let editPoints = document.getElementById("editPoints");
        let responseMessageDisplay = document.getElementById("settingEditResponse");
    
        let newName = editName.value !== "" ? editName.value : editName.placeholder;
        let newEmail = editEmail.value !== "" ? editEmail.value : editEmail.placeholder;
        let newTaskCompleted = editTaskCompleted.value !== "" ? editTaskCompleted.value : editTaskCompleted.placeholder;
        let newPoints = editPoints.value !== "" ? editPoints.value : editPoints.placeholder;
    
    
        const updateUser = {
            type: "edit",
            uuid: document.getElementById('settingEditUuid').innerText,
            name: newName,
            email: newEmail,
            taskCompleted: newTaskCompleted,
            points: newPoints,
        };
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateUser)
        };
        let response = await fetch('/updateUserInfo', requestOptions)
        let data = await response.json();
    
        if (data.responseMessage) {
            responseMessageDisplay.style.display = "block"
            responseMessageDisplay.innerText = data.responseMessage;
            await getGroupUsers();
            if (data.responseMessage === "The user info is updated!") {
                responseMessageDisplay.style.color = "green"
                editName.placeholder = newName;  
                editEmail.placeholder = newEmail;  
                editTaskCompleted.placeholder = newTaskCompleted;  
                editPoints.placeholder = newPoints;  
                document.getElementById("settingEditForm").reset()
            } else {
                responseMessageDisplay.style.color = "red"
            }
        }
    })
}

if(document.getElementById('groupConfirm')){
    document.getElementById('groupConfirm').addEventListener('click', async function() {
        let editGroupName = document.getElementById("editGroupName");
        let editOwner = document.getElementById("editOwner");
        let responseMessageDisplay = document.getElementById("settingGroupResponse");
    
        let newName = editGroupName.value !== "" ? editGroupName.value : editGroupName.placeholder;
        let newOwner = editOwner.value !== "" ? editOwner.value : "NaN";
    
        const updateGroup = {
            name: newName,
            owner: newOwner,
        };
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateGroup)
        };
        let response = await fetch('/updateGroupInfo', requestOptions)
        let data = await response.json();
    
        if (data.responseMessage) {
            responseMessageDisplay.style.display = "block"
            responseMessageDisplay.innerText = data.responseMessage;
            await getGroupUsers();
            if (data.responseMessage === "The group info is updated!") {
                responseMessageDisplay.style.color = "green"
                editGroupName.placeholder = newName;  
                document.getElementById("settingGroupForm").reset()
            } else {
                responseMessageDisplay.style.color = "red"
            }
        } else if(data.responseURL){
            window.location.href = data.responseURL;
        }
    })
}

if(document.getElementById('taskCreateConfirm')){
    document.getElementById('taskCreateConfirm').addEventListener('click', async function() {
        let taskName = document.getElementById("taskCreateName");
        let taskDescription = document.getElementById("taskCreateName");
        let taskPoints = document.getElementById("taskCreatePoints");
        let taskAssigned = document.getElementById("taskCreateAssigned");
        let responseMessage =  document.getElementById("settingTaskCreateResponse")
        if (taskName.value === "" || taskDescription.value === "" || taskPoints.value === ""){
            responseMessage.innerText = "All fields must be filled out, except assigned!";
            responseMessage.style.color = "red"
        } else {
            let assignedTo = taskAssigned.value === "" ? "none" : taskAssigned.value ;
            const createTask = {
                name: taskName.value,
                description: taskDescription.value,
                points: taskPoints.value,
                assignedTo: assignedTo
            };
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createTask)
            };
            let response = await fetch('/createGroupTasks', requestOptions)
            let data = await response.json();
            if (data.responseMessage) {
                responseMessage.innerText = data.responseMessage;
                if (data.responseMessage === "The task is created!") {
                    responseMessage.style.color = "green"
                    document.getElementById("settingTaskCreateForm").reset()
                    getGroupTasks() 
                } else {
                    responseMessage.style.color = "red"
                }
            }
        }
    })
}

if(document.getElementById('taskEditConfirm')){
    document.getElementById('taskEditConfirm').addEventListener('click', async function() {
        let editName = document.getElementById("taskEditName");
        let editDesc = document.getElementById("taskEditDescription");
        let editPoints = document.getElementById("taskEditPoints");
        let editUUID = document.getElementById("taskEditAssigned");
        let taskUUID = document.getElementById("settingTaskEditUuid");
        let responseMessage = document.getElementById("settingTaskEdit");
        
        let newName = editName.value === "" ? editName.placeholder : editName.value;
        let newDesc = editDesc.value === "" ?  editDesc.placeholder : editDesc.value;
        let newPoints = editPoints.value === "" ? editPoints.placeholder : editPoints.value;
        let newAssigned = editUUID.value === "" ? editUUID.placeholder : editUUID.value;

        const updateGroup = {
            uuid: taskUUID.innerText,
            name: newName,
            description: newDesc,
            points: newPoints,
            assignedTo: newAssigned
        };
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateGroup)
        };
        let response = await fetch('/confirmGroupTasks', requestOptions)
        data = await response.json();
        if(data.responseMessage){
           responseMessage.innerText = data.responseMessage;
           if(data.responseMessage === "The task is updated!"){
               responseMessage.style.color = "green"
               editName.placeholder = newName;
               editDesc.placeholder = newDesc;
               editPoints.placeholder = newPoints;
               editUUID.placeholder = newAssigned;
               document.getElementById("settingTaskEditForm").reset()
               getGroupTasks();
           } else {
               responseMessage.style.color = "red"
           }
        }
    })
}

async function getUserRoles() {
    let response = await fetch('/getUserRoles');
    let data = await response.json();
    let select = document.getElementById('filterRole');
    data.forEach(role => {
        let option = document.createElement('option');
        option.value = role.id;
        option.innerHTML = role.name;
        select.appendChild(option);
    });
}

async function getLeaderboard(){
    let responseUsers = await fetch('/getGroupUsers');
    let responseFamiliy = await fetch('/getLeaderboard');
    let dataUsers = await responseUsers.json();
    let dataFamiliy = await responseFamiliy.json();
    let userPoints = dataUsers.userInfo.sort((a, b) => b.points - a.points);
    let userTasks = dataUsers.userInfo.sort((a, b) => b.taskCompleted - a.taskCompleted); 
    let groupPoints = dataFamiliy.sort((a, b) => b.totalPoints - a.totalPoints);
    let groupTasks = dataFamiliy.sort((a, b) => b.totalTaskCompleted - a.totalTaskCompleted);
    let fPointsLeaderboardTable = document.querySelector('.leaderboard .pointsFamiliyTable tbody');
    let fTasksLeaderboardTable = document.querySelector('.leaderboard .tasksFamiliyTable tbody');
    let gPointsLeaderboardTable = document.querySelector('.leaderboard .pointsGroupTable tbody');
    let gTasksLeaderboardTable = document.querySelector('.leaderboard .tasksGroupTable tbody');

    userPoints.forEach((user, index) => {
        if(index < 5){
            let row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${user.name}</td><td>${user.points}</td>`;
            fPointsLeaderboardTable.appendChild(row);
        }
    });

    userTasks.forEach((user, index) => {
        if (index < 5){
            let row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${user.name}</td><td>${user.taskCompleted}</td>`;
            fTasksLeaderboardTable.appendChild(row);
        }
    });
    
    groupPoints.forEach((group, index) => {
        if(index < 5){
            let row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${group.groupName}</td><td>${group.totalPoints}</td>`;
            gPointsLeaderboardTable.appendChild(row);
        }
    });
    groupTasks.forEach((group, index) => {
        if(index < 5){
            let row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${group.groupName}</td><td>${group.totalTaskCompleted}</td>`;
            gTasksLeaderboardTable.appendChild(row);
        }
    });
}

document.getElementsByClassName('optionButton')[1].addEventListener('click', async function() {
    let response = await fetch('logout');
    let data = await response.json();
    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
    }
});

getUserInfo()
getGroupTasks()
getGroupUsers()
getUserRoles()
getLeaderboard()
getUserInfoTasks()