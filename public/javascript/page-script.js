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
    document.getElementById("responseMessage").style.display = "none";
});

async function getUserInfo() {
    let response = await fetch('getUserInfo');
    let data = await response.json();
    document.getElementById('userUuid').innerText = data[0].uuid;
    document.getElementById('settingName').placeholder = data[0].name;
    document.getElementById('settingEmail').placeholder = data[0].email;
    document.getElementById('settingGroup').placeholder = data[0].workgroup;
}

async function getGroupInfo() {
    let countActiveUsers = 0;
    let countAwatingUsers = 0; 
    let response = await fetch('getGroupInfo');
    let data = await response.json();
    document.querySelector("#activeDiv .users").innerHTML = '';
    document.querySelector("#awatingDiv .users").innerHTML = '';
    data.forEach(user => {
        if (user.userStatus === "true"){
            countActiveUsers++;
            let userDiv = `
            <div>
                <h3>Navn: ${user.name}</h3>
                <p>Email: ${user.email}</p>
                <p>Tasks completed: ${user.taskCompleted}</p>
                <p>Points: ${user.points}</p>
                <button onclick="userEdit('${user.uuid}')">Edit</button>
                <button onclick="userDelete('${user.uuid}')">Remove User</button>
            </div>`
            console.log(userDiv)
            document.querySelector("#activeDiv .users").innerHTML += userDiv;
        } else if (user.userStatus === "false"){
            countAwatingUsers++;
            let userDiv = `
            <div>
                <h3>Navn: ${user.name}</h3>
                <p>Email: ${user.email}</p>
                <p>Tasks completed: ${user.taskCompleted}</p>
                <p>Points: ${user.points}</p>
                <button onclick="userEdit('${user.uuid}')">Confirm</button>
                <button onclick="userDelete('${user.uuid}')">Remove User</button>
            </div>`
            console.log(userDiv)
            document.querySelector("#awatingDiv .users").innerHTML += userDiv;
        }
    })
    document.getElementById('activeUsersCount').innerText = countActiveUsers;
    document.getElementById('awatingUsersCount').innerText = countAwatingUsers;
}

document.getElementById('settingConfirm').addEventListener('click', async function() {
    let settingName = document.getElementById("settingName");
    let settingEmail = document.getElementById("settingEmail");
    let settingGroup = document.getElementById("settingGroup");
    let responseMessageDisplay = document.getElementById("responseMessage");

    let newName = settingName.value !== "" ? settingName.value : settingName.placeholder;
    let newEmail = settingEmail.value !== "" ? settingEmail.value : settingEmail.placeholder;
    let newGroupCode = settingGroup.value !== "" || settingGroup.value === undefined ? settingGroup.value : settingGroup.placeholder;

    const updateUser = {
        name: newName,
        email: newEmail,
        groupCode: newGroupCode,
    };
    const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateUser)
    };

    let response = await fetch('updateUserInfo', requestOptions)
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
        } else if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
        } else {
            responseMessageDisplay.style.color = "red"
        }
    }
});

document.getElementsByClassName('optionButton')[1].addEventListener('click', async function() {
    let response = await fetch('logout');
    let data = await response.json();
    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
    }
});

getUserInfo();
getGroupInfo();