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
    document.getElementById("home").style.display = "none";
    document.getElementById("tasks").style.display = "none";
    document.getElementById("users").style.display = "none";
    document.getElementById("shop").style.display = "none";
    document.getElementById("leaderboard").style.display = "none";
    document.getElementById(page).style.display = "block";
}

function changeUserPage(page) {
    document.getElementById("activeDiv").style.display = "none";
    document.getElementById("awatingDiv").style.display = "none";
    document.getElementById(page).style.display = "block";
}

document.getElementsByClassName('optionButton')[0].addEventListener('click', async function() {
    document.getElementsByClassName('settingDiv')[0].style.display = 'flex'
});

document.getElementById('settingCancel').addEventListener('click', function() {
    document.getElementsByClassName('settingDiv')[0].style.display = 'none';
    document.getElementById("settingName").value = "";
    document.getElementById("settingEmail").value = "";
    document.getElementById("settingGroup").value = "";
    document.getElementById("settingResponseMessage").innerText = "";
});

document.getElementById('editCancel').addEventListener('click', function() {
    document.getElementsByClassName('editDiv')[0].style.display = 'none';
    document.getElementById("editName").value = "";
    document.getElementById("editEmail").value = "";
    document.getElementById("editPoints").value = "";
    document.getElementById("editTaskCompleted").value = "";
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

async function getGroupUsers() {
    let countActiveUsers = 0;
    let countAwatingUsers = 0; 
    let response = await fetch('/getGroupUsers');
    let data = await response.json();
    document.querySelector("#activeDiv .users").innerHTML = '';
    console.log(data);
    if(data.requestType === "eier" || data.requestType === "voksen"){
        document.querySelector("#awatingDiv .users").innerHTML = '';
        data.userInfo.forEach(user => {  
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
                    <button onclick="userAction('Delete','${user.uuid}')">Remove User</button>
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
                    <button onclick="userAction('Delete','${user.uuid}')">Remove User</button>
                </div>`
                document.querySelector("#awatingDiv .users").innerHTML += userDiv;
            }
        })
    } else if (data.requestType === "barn"){
        data.userInfo.forEach(user => {
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
        document.getElementById('editUserUuid').innerText = data[0].uuid;
        document.getElementById('editName').placeholder = data[0].name;
        document.getElementById('editEmail').placeholder = data[0].email;
        document.getElementById('editPoints').placeholder = data[0].points;
        document.getElementById('editTaskCompleted').placeholder = data[0].taskCompleted;
        document.getElementsByClassName('editDiv')[0].style.display = "flex";
    } else {
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
        getUserInfo();
        if (data.responseMessage === "The user info is updated!") {
            responseMessageDisplay.style.color = "green"
            settingName.value = "";
            settingEmail.value = "";
            settingGroup.value = "";
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
    let responseMessageDisplay = document.getElementById("editResponseMessage");

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
        await getGroupInfo();
        if (data.responseMessage === "The user info is updated!") {
            responseMessageDisplay.style.color = "green"
            editName.placeholder = newName;  
            editName.value = "";
            editEmail.placeholder = newEmail;  
            editEmail.value = "";
            editTaskCompleted.placeholder = newTaskCompleted;  
            editTaskCompleted.value = "";
            editPoints.placeholder = newPoints;  
            editPoints.value = "";
        } else {
            responseMessageDisplay.style.color = "red"
        }
    }
})

document.getElementsByClassName('optionButton')[1].addEventListener('click', async function() {
    let response = await fetch('logout');
    let data = await response.json();
    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        getGroupInfo();
    }
});

getUserInfo();
getGroupUsers();