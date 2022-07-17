function change_color() {
    const nav = document.querySelector("nav");
    if (this.scrollY >= 10) {
        nav.classList.add("nav-scrolled-color");

    } else {
        nav.classList.remove("nav-scrolled-color");
    }
}
window.addEventListener("scroll", change_color);
