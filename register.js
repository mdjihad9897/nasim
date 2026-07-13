import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
  createUserDocument
} from "./firebase.js";

const registerForm = document.getElementById("registerForm");
const errorBox = document.getElementById("registerError");

registerForm.onsubmit = async (event) => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const phone = document.getElementById("registerPhone").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  errorBox.textContent = "";

  if (password !== confirmPassword) {
    errorBox.textContent = "Passwords do not match";
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, {
      displayName: name
    });

    await createUserDocument(result.user, {
      name,
      phone
    });

    location.href = "index.html";

  } catch (error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        errorBox.textContent = "Email already registered";
        break;
      case "auth/weak-password":
        errorBox.textContent = "Password must be stronger";
        break;
      case "auth/invalid-email":
        errorBox.textContent = "Invalid email";
        break;
      default:
        errorBox.textContent = "Registration failed";
    }
  }
};