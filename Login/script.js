// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, createUserWithEmailAndPassword } from "https://www.getstatic.com/firebasejs/11.1.0/firebase-auth.js";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQlrm5dRkOEoX_qF1GcMCEi8yXMAyudrE",
  authDomain: "ceo-login-71ba2.firebaseapp.com",
  projectId: "ceo-login-71ba2",
  storageBucket: "ceo-login-71ba2.firebasestorage.app",
  messagingSenderId: "920533810055",
  appId: "1:920533810055:web:c8546a0ee35dd0b56fb122"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//Submit button
const submit = document.getElementById('submit');
submit.addEventListener("click",function(event){
    event.preventDefault()
// Inputs
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) =>{
            const user = userCredential.user;
            alert("Logging in...")
        })
        .catch((error) =>{
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage)
        });
})