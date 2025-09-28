// Modal Logic

const modal = document.getElementById("login");
const othermodal = document.getElementById("otherloginmodal");

document.getElementById("otherlogin").addEventListener("click", () => {
    console.log("test")
    othermodal.classList.toggle("hidden")
})

document.querySelector(".logLink").addEventListener("click", () => {
    modal.classList.toggle("hidden")
})

const notice = document.querySelector(".notice")

document.querySelector('.close').addEventListener("click", () => {
    notice.remove()
})