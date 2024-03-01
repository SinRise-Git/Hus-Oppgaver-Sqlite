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


let buttons = document.getElementsByClassName('optionPage');
for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function(event) {
        let activePage = event.target.innerText;
        document.getElementsByClassName('brand-title')[0].innerText = activePage;
        let pages = document.querySelectorAll('.pages > div');
        pages.forEach(function(page) {
            page.style.display = 'none';
        })
        let className = activePage.toLowerCase();
        document.getElementsByClassName(className)[0].style.display = 'block';
    })
}
