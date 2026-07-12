import{

auth,

signInWithEmailAndPassword

}from"./firebase.js";


const loginForm=

document.getElementById(

"loginForm"

);


const errorBox=

document.getElementById(

"loginError"

);



loginForm.onsubmit=async event=>{


event.preventDefault();



const email=

document.getElementById(

"loginEmail"

).value.trim();



const password=

document.getElementById(

"loginPassword"

).value;



errorBox.textContent="";



try{


const result=

await signInWithEmailAndPassword(

auth,

email,

password

);



if(result.user){


location.href="index.html";


}



}catch(error){



switch(error.code){



case "auth/invalid-email":

errorBox.textContent=

"Invalid email address";

break;



case "auth/user-not-found":

errorBox.textContent=

"Account not found";

break;



case "auth/wrong-password":

errorBox.textContent=

"Wrong password";

break;



case "auth/too-many-requests":

errorBox.textContent=

"Too many attempts. Try later";

break;



default:

errorBox.textContent=

"Login failed";


}



}


};