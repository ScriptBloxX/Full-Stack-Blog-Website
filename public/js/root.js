// login register
async function Popup(val) {
    await formClose();
    bgblur(true);
    await stlyeFix('.lr-container', 'visibility', 'visible');
    await stlyeFix('.lr-container', 'opacity', '1');
    await stlyeFix(`.${val.toLowerCase()}-form`, 'visibility', 'visible');
    await stlyeFix(`.${val.toLowerCase()}-form`, 'opacity', '1');
    await stlyeFix(`.${val.toLowerCase()}-form`, 'transform', 'translateX(-50%) scale(1)');
};

async function formClose() {
    document.querySelectorAll('.lr-form').forEach(e => {
        e.style.visibility = 'hidden';
        e.style.opacity = 0;
    });
    bgblur(false);
    await stlyeFix('.lr-container', 'visibility', 'hidden');
    await stlyeFix('.lr-container', 'opacity', '0');
    await stlyeFix(`.login-form`, 'transform', 'translateX(-50%) scale(.8)');
    await stlyeFix(`.register-form`, 'transform', 'translateX(-50%) scale(.8)');
};
// open popup
document.querySelectorAll('#btn').forEach(item => {
    item.addEventListener('click', element => {
        Popup(element.target.textContent);
    });
});
// close btn
document.querySelectorAll('.close-btn').forEach(item => {
    item.addEventListener('click', () => {
        formClose();
    });
});

// other function
async function bgblur(val) {
    if (val) {
        await stlyeFix('.container', 'filter', 'brightness(.5) blur(2px)');
    } else {
        await stlyeFix('.container', 'filter', 'none');
    }
};
async function stlyeFix(target, type, val) {
    if(document.querySelector(target)){
        return document.querySelector(target).style[type] = val;
    }
};

if (document.querySelector('.forgot-password')) {
    document.querySelector('.forgot-password').addEventListener('click', () => {
        window.location.href = '/forgot-password';
    });
}
