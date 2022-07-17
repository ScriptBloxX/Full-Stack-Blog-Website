// alert popup
async function Alert(data) {
    const typeColor = {
        error: '#e64d6c',
        warn: '#ff8c00',
        information: '#1EF4EC',
        success: '#2eac62'
    }
    bgblur(true);
    await stlyeFix('.notification-comment','filter','brightness(.5) blur(2px)');
    await stlyeFix('.notification-container', 'transition', 'all linear .2s');
    await stlyeFix('.notification-container', 'visibility', 'visible');
    await stlyeFix('.notification-container', 'opacity', '1');
    await stlyeFix(`.notification-container`, 'transform', 'scale(1)');
    await stlyeFix('#alert-icon', 'color', typeColor[data.type]);
    document.querySelector('.alert-title').innerHTML = data.title;
    document.querySelector('.alert-content').innerHTML = data.content;

    window.scrollTo(0, 0);
    await stlyeFix('body','overflow','hidden');
};

// close btn
document.querySelector('.close-btn-alert').addEventListener('click', async () => {
    closeAlert_func();
});

async function closeAlert_func(){
    bgblur(false);
    await stlyeFix('.notification-comment', 'filter', 'none');
    await stlyeFix(`.notification-container`, 'transform', 'scale(.8)');
    await stlyeFix('.notification-container', 'opacity', '0');
    await stlyeFix('.notification-container', 'visibility', 'hidden');
    await stlyeFix('.notification-container', 'transition', 'none');

    await stlyeFix('body','overflow','unset');
}

// other function
async function bgblur(val) {
    if (val) {
        await stlyeFix('.blur2', 'filter', 'brightness(.5) blur(2px)');
    } else {
        await stlyeFix('.blur2', 'filter', 'none');
    }
};
async function stlyeFix(target, type, val) {
    if(document.querySelector(target)){
        return document.querySelector(target).style[type] = val;
    }
};


