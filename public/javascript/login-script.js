function showHide(show, hide) {
    document.getElementById(show).style.display = 'flex';
    document.getElementById(hide).style.display = 'none';
}
document.getElementById('usertypeSelect').addEventListener('change', function() {
    if (this.value == 2) {
        document.getElementById('workgroupActionDiv').style.display = 'block';
        document.getElementById('joinWorkgroupDiv').style.display = 'block';

    } else if (this.value == 1) {
        document.getElementById('workgroupActionDiv').style.display = 'none';
        document.getElementById('createWorkgroupDiv').style.display = 'none';
        document.getElementById('joinWorkgroupDiv').style.display = 'block'
        document.getElementById('workgroupAction').value = 1
    }
});
document.getElementById('workgroupAction').addEventListener('change', function() {
    if (this.value == 1) {
        document.getElementById('joinWorkgroupDiv').style.display = 'block';
        document.getElementById('createWorkgroupDiv').style.display = 'none';
    } else if (this.value == 2) {
        document.getElementById('joinWorkgroupDiv').style.display = 'none';
        document.getElementById('createWorkgroupDiv').style.display = 'block';
    }
});
async function getUserRoles() {
    let response = await fetch('getUserRoles');
    let data = await response.json();
    let select = document.getElementById('usertypeSelect');
    data.forEach(role => {
        let option = document.createElement('option');
        option.value = role.id;
        option.innerHTML = role.name;
        select.appendChild(option);
    });
}
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault()
    const loginForm = document.getElementById("loginForm")
    const userCredentials = {
        email: loginForm.loginEmail.value,
        password: loginForm.loginPassword.value
    }
    const requestBody = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userCredentials
        })
    }
    const response = await fetch('/checkLogin', requestBody);
    const data = await response.json();
    if (data.errorMessage) {
        document.getElementById('errorMessageLogin').innerHTML = data.errorMessage
        document.getElementById('errorMessageLogin').style.animationName = 'displayErrorMessage';
    } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl
    }
})

document.getElementById("signupForm").addEventListener('submit', async function(event) {
    event.preventDefault()
    const signupForm = document.getElementById("signupForm")
    let workgroupInfo
    if (signupForm.usertypeSelect.value === "1") {
        workgroupInfo = signupForm.joinWorkgroup.value
    } else if (signupForm.usertypeSelect.value == "2" && signupForm.workgroupAction.value === "2") {
        workgroupInfo = signupForm.createWorkgroup.value
    } else {
        workgroupInfo = signupForm.joinWorkgroup.value
    }
    const userCredentials = {
        name: signupForm.signupNavn.value,
        email: signupForm.signupEmail.value,
        password: signupForm.signupPassword.value,
        usertype: signupForm.usertypeSelect.value,
        workgroupAction: signupForm.workgroupAction.value,
        workgroupInfo: workgroupInfo
    }

    const requestBody = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userCredentials
        })
    }
    const response = await fetch('/checkCredentials', requestBody);
    const data = await response.json();
    if (data.errorMessage) {
        document.getElementById('errorMessageSignup').innerHTML = data.errorMessage
        document.getElementById('errorMessageSignup').style.animationName = 'displayErrorMessage';
    } else if (data.responseMessage) {
        document.getElementById("loginDiv").style.display = "flex"
        document.getElementById("signupDiv").style.display = "none"
    }
})
getUserRoles()