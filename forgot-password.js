import{

auth,

sendPasswordResetEmail

}from"./firebase.js";

const form=

document.getElementById(

"forgotForm"

);

const email=

document.getElementById(

"forgotEmail"

);

const message=

document.getElementById(

"forgotMessage"

);

const error=

document.getElementById(

"forgotError"

);

form.onsubmit=async e=>{

e.preventDefault();

message.textContent="";

error.textContent="";

try{

await sendPasswordResetEmail(

auth,

email.value.trim()

);

message.textContent=

"Password reset email sent successfully.";

form.reset();

}catch(err){

switch(err.code){

case"auth/user-not-found":

error.textContent=

"Account not found.";

break;

case"auth/invalid-email":

error.textContent=

"Invalid email address.";

break;

case"auth/too-many-requests":

error.textContent=

"Too many requests. Try again later.";

break;

default:

error.textContent=

"Unable to send reset email.";

}

}

};