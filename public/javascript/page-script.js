const toggleButton = document.getElementsByClassName('toggle-button')[0];
const navbarLinks = document.getElementsByClassName('navbar-links')[0];
let isAnimating = false;

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
        div.id === page ? div.style.display = 'block' : div.style.display = 'none';
    });
    document.getElementById('page-title').innerText = page[0].toUpperCase() + page.slice(1) ;
}

function changeUserPage(page) {
    let pagesDiv = document.querySelector('.userDiv');
    Array.from(pagesDiv.children).forEach(div => {
        div.id === page ? div.style.display = 'block' : div.style.display = 'none';
    });
}

document.getElementsByClassName('optionButton')[0].addEventListener('click', async function() {
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
<<<<<<< HEAD
    document.getElementsByClassName('settingChange')[0].style.display = 'flex'
=======
    let settingDiv = document.querySelector('.settingBackgroud');
    Array.from(settingDiv.children).forEach(div => {
        div.className === "settingChange" ? div.style.display = 'flex' : div.style.display = 'none';
    });
>>>>>>> da585a4a89a1e75ba56d853dfc2b7f42ae8f04c9
})

document.getElementById('settingCancel').addEventListener('click', function() {
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
    document.getElementsByClassName('settingChange')[0].style.display = 'none';
<<<<<<< HEAD
    document.getElementById("settingResponseMessage").innerText = "";
=======
>>>>>>> da585a4a89a1e75ba56d853dfc2b7f42ae8f04c9
    document.getElementById("settingChangeForm").reset();
});

document.getElementById('editCancel').addEventListener('click', function() {
    document.getElementsByClassName('settingBackgroud')[0].style.display = 'none';
    document.getElementsByClassName('settingEdit')[0].style.display = 'none';
<<<<<<< HEAD
    document.getElementById("settingResponseMessage").innerText = "";
=======
>>>>>>> da585a4a89a1e75ba56d853dfc2b7f42ae8f04c9
    document.getElementById("settingEditForm").reset();
})

async function getUserInfo() {
    const requestOptions = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify()
    };
    let response = await fetch('getUserInfo', requestOptions);
    let data = await response.json();
    document.getElementById('settingUserUuid').innerText = data[0].uuid;
    document.getElementById('settingName').placeholder = data[0].name;
    document.getElementById('settingEmail').placeholder = data[0].email;
    document.getElementById('settingGroup').placeholder = data[0].workgroup;
}

document.getElementById('filterName').addEventListener('input',  getGroupUsers)
document.getElementById('filterRole').addEventListener('change', getGroupUsers)
document.getElementById('filterMost').addEventListener('change', getGroupUsers)

async function getGroupUsers() {
    let countActiveUsers = 0;
    let countAwatingUsers = 0; 
    let response = await fetch('/getGroupUsers');
    let data = await response.json()
    let groupData = data.groupInfo[0]
    let groupInfoDiv = `
    <div class="groupInfo">
       <h2>Familiy Information</h2>
       <h3>Invite code: ${groupData.groupCode}</h3>
       <p>Name: <span>${groupData.name}</span></p>
       <p>Owner:<span> ${groupData.createdBy}</span></p>
       <p>Total tasks completed: <span>${groupData.totalTaskCompleted}</span></p>
       <p>Total points collected: <span>${groupData.totalPoints}</span></p>
<<<<<<< HEAD
       <div>
          <button onclick="editGroup('${groupData.uuid}')">Edit Group</button>
          <button id="deleteButton" onclick="purgeGroup('${groupData.uuid}')">Purge</button>
       </div>
    </div>`
    let filterSearch = document.getElementById("filterName").value.toLowerCase()
    let filterRole = document.getElementById("filterRole").value 
    let filterMost = document.getElementById("filterMost").value
    filterMost === "points" ? data.userInfo.sort((a, b) => b.points - a.points) : data.userInfo.sort((a, b) => b.taskCompleted - a.taskCompleted);
=======
       <button onclick="editGroup('${groupData.uuid}')">Edit Group</button>
    </div>`
>>>>>>> da585a4a89a1e75ba56d853dfc2b7f42ae8f04c9
    document.querySelector("#familiy .group").innerHTML = groupInfoDiv
    document.querySelector("#activeDiv .users").innerHTML = '';
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
                        <p>Tasks completed: ${user.taskCompleted}</p>
                        <p>Points: ${user.points}</p>
                    </div>`
                    document.querySelector("#activeDiv .users").innerHTML += userDiv;
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
        document.getElementById('editUserUuid').innerText =data[0].uuid;
        document.getElementById('editName').placeholder = data[0].name;
        document.getElementById('editEmail').placeholder = data[0].email;
        document.getElementById('editPoints').placeholder = data[0].points;
        document.getElementById('editTaskCompleted').placeholder = data[0].taskCompleted;
        document.getElementsByClassName('settingBackgroud')[0].style.display = 'flex'
<<<<<<< HEAD
        document.getElementsByClassName('settingEdit')[0].style.display = 'flex';
=======
        let settingDiv = document.querySelector('.settingBackgroud');
        Array.from(settingDiv.children).forEach(div => {
            div.className === "settingEdit" ? div.style.display = 'flex' : div.style.display = 'none';
        });
>>>>>>> da585a4a89a1e75ba56d853dfc2b7f42ae8f04c9
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
            getUserInfo()
            responseMessageDisplay.style.color = "green"
            document.getElementById("settingChangeForm").reset()
        } else {
            responseMessageDisplay.style.color = "red"
        }
    }
});

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
        uuid: document.getElementById('editUserUuid').innerText,
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

async function getUserRoles() {
    let response = await fetch('getUserRoles');
    let data = await response.json();
    let select = document.getElementById('filterRole');
    data.forEach(role => {
        let option = document.createElement('option');
        option.value = role.id;
        option.innerHTML = role.name;
        select.appendChild(option);
    });
}

document.getElementsByClassName('optionButton')[1].addEventListener('click', async function() {
    let response = await fetch('logout');
    let data = await response.json();
    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        getGroupUsers();
    }
});


getUserInfo();
getGroupUsers();
getUserRoles()