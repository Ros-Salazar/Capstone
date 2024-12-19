import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, getDocs, collection, addDoc, onSnapshot, query, doc, updateDoc} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOo_r7lBGB_FiuwFIcsc-ecRsd43pDXF0",
    authDomain: "ceo-projectmanagementweb.firebaseapp.com",
    projectId: "ceo-projectmanagementweb",
    storageBucket: "ceo-projectmanagementweb.appspot.com",
    messagingSenderId: "60010633148",
    appId: "1:60010633148:web:abaa3776928df2a351fdb9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

 
// DOM Elements declarations
let newProjectBtn;
let popupWindow;
let closeBtns;
let projectForm;
let projectContainer;
let noProjectsText;
let editPopupWindow;
let editProjectForm;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements after the document has loaded
    newProjectBtn = document.getElementById('newProjectBtn');
    popupWindow = document.getElementById('popupWindow');
    closeBtns = document.querySelectorAll('.close-btn');
    projectForm = document.getElementById('projectForm');
    projectContainer = document.getElementById('projectContainer');
    noProjectsText = document.getElementById('noProjectsText');
    editPopupWindow = document.getElementById('editPopupWindow');
    editProjectForm = document.getElementById('editProjectForm');

    // Show popup when 'Add Project' is clicked
    newProjectBtn.addEventListener('click', () => {
        popupWindow.style.display = 'flex';
    });

    // Close popup
    closeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            popupWindow.style.display = 'none';
            editPopupWindow.style.display = 'none';
        });
    });

    // Add Project to Firestore
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const projectName = document.getElementById("project-name").value;
        const location = document.getElementById("location").value;
        const group = document.getElementById("group").value;

        try {
            const docRef = await addDoc(collection(db, "projects"), {
                name: projectName,
                location: location,
                group: group,
                completion: "0%",
            });

            console.log("Project added with ID:", docRef.id);

            projectForm.reset();
            popupWindow.style.display = 'none';
        } catch (error) {
            console.error("Error adding project:", error);
        }
    });

    let currentProjectBox = null;

    // Redirect to Project Template
    const openProject = (projectId) => {
        window.location.href = `projectTemplate.html?projectId=${projectId}`;
    };

    // Populate Navigation Pane
    const fetchProjectsForNav = async () => {
        const projects = [];
        const querySnapshot = await getDocs(collection(db, "projects"));
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        return projects;
    };

    const populateNavigationPane = async () => {
        projectList.innerHTML = ''; // Clear existing items
        const projects = await fetchProjectsForNav();
        projects.forEach((project) => {
            const li = document.createElement('li');
            li.textContent = project.name;
            li.className = project.group;
            li.addEventListener('click', () => openProject(project.id));
            projectList.appendChild(li);
        });
    };

    // Load Projects in Real-Time
    const loadProjects = () => {
        const q = query(collection(db, "projects"));

        onSnapshot(q, (snapshot) => {
            projectContainer.innerHTML = ''; // Clear existing projects

            snapshot.forEach((doc) => {
                const project = doc.data();

                const projectBox = document.createElement("div");
                projectBox.classList.add("project-box", project.group);
                projectBox.setAttribute("data-id", doc.id);
                projectBox.innerHTML = `
                    <h3>${project.name}</h3>
                    <p>${project.location}</p>
                    <p class="completion-text">${project.completion} COMPLETED</p>
                    <i class="fas fa-pencil-alt edit-icon"></i>
                `;

                // Add click event for redirecting to project template
                projectBox.addEventListener('click', () => openProject(doc.id));

                projectContainer.appendChild(projectBox);
            });

            noProjectsText.style.display = projectContainer.children.length ? "none" : "block";
        });
    };

    loadProjects();

    // Edit Project in Firestore
    editProjectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const updatedProjectName = document.getElementById("edit-project-name").value;
        const updatedLocation = document.getElementById("edit-location").value;

        try {
            const projectId = currentProjectBox.getAttribute("data-id");
            const projectDoc = doc(db, "projects", projectId);

            await updateDoc(projectDoc, {
                name: updatedProjectName,
                location: updatedLocation,
            });

            editPopupWindow.style.display = "none";
            editProjectForm.reset();
        } catch (error) {
            console.error("Error updating project:", error);
        }
    });

    // Handle navigation pane toggle
    document.querySelector('.header-right a[href="#projects"]').addEventListener('click', async (e) => {
        e.preventDefault();
        if (navigationPane.style.display === 'none' || !navigationPane.style.display) {
            await populateNavigationPane();
            navigationPane.style.display = 'block';
        } else {
            navigationPane.style.display = 'none';
        }
    });
});

export {db};    