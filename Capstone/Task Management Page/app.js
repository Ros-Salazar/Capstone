const projectForm = document.getElementById("project-form");
const projectList = document.getElementById("project-list")

// counter variable to track project index
let projectIndex = 1;
// console.log(projectForm, projectList);

projectForm.addEventListener("submit",function(event){
    event.preventDefault();

    const projectInput = document.getElementById("project-input");
    const projectText = projectInput.value.trim();

//  console.log(projectText);

if(projectText !==""){

        // create a new project item
    const projectItem = document.createElement("li");
    projectItem.classList.add("project-item");
    projectItem.textContent = `${projectIndex} - ${projectText}`;

    projectItem.addEventListener("click", function(){
        // console.log("completed");
        this.classList.toggle("completed");
    });

        // append the project item to the project list
    projectList.appendChild(projectItem);

        // increment the project index
    projectIndex++;

    projectInput.value = "";
}
});