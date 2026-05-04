let assignments = {};

function startAnalysis() {
    let userInput = document.getElementById("powerschool-paste").value;
    let tablediv = document.getElementById("tables");

    tablediv.innerHTML = "";

    assignments = parseAssignments(userInput);
    
    for (const key in assignments) {
        let heading = document.createElement("h3");
        heading.innerHTML = key + ` - Precent Weight: <input type="number" class="precent-weight" oninput="if(this.value > 100){this.value=100;alert('Max Value 100%');}" placeholder="0"}>%`;
        tablediv.appendChild(heading);

        let table = createTableBase();

        assignments[key].forEach(element =>{
            table.appendChild(createRow(element.date, element.name, element.score, element.maxscore, element.exempt));
        })

        tablediv.appendChild(table);

    }

    document.documentElement.style.setProperty('--positionOffset', '200%');
}

function parseAssignments(plaintext) {
    // Remove Flags
    let cleanedtext = plaintext.replaceAll("	collected	late	missing	exempt from final grade	absent	incomplete	excluded from final grade", "")
    
    cleanedtext = cleanedtext.replaceAll("	 ", "	View ");

    // Create Array
    let stringArray = cleanedtext.split("	View ");
    
    // Remove "View" from the last element - wouldn't get removed by the split
    stringArray[stringArray.length - 1] = stringArray[stringArray.length - 1].replace("	View", "");

    // Creates JSON version of Assignments
    let newAssignments = {};
    stringArray.forEach(element => {

        element = element.split("	");
        let category = element[1];

        let exempt = false        

        if(element[3].includes("This assignment is weighted")) {
            element[3] = element[3].split("(")[1].split(")")[0];
        }

        if(element[3].split("/")[0] == "--") {
            exempt = true;
            element[3] = element[3].replace("--","0");
        }
        
        let newJSON = {
            "exempt": exempt,
            "date": element[0],
            "name": element[2],
            "score": element[3].split("/")[0],
            "maxscore": element[3].split("/")[1]
        };

        if(!newAssignments[category]) {
            newAssignments[category] = [];
        }

        newAssignments[category].push(newJSON);

    });

    return newAssignments;
}

function createTableBase() {
    let table = document.createElement("table");
    table.innerHTML = "<tr class='table-header'> <th>Date</th> <th>Name</th> <th>Score</th> <th>%</th> <th>Exempt</th> </tr>";
    return table;
}

function createRow(date, name, score, maxscore, exempt) {

    let checkedText = "";
    if (exempt) { checkedText = "checked"; }

    let precentText = calculatePrecent(score, maxscore) + "%";
    if(exempt) { precentText = "N/A"; }

    let newRow = document.createElement("tr");
    newRow.innerHTML = `<td>${date}</td> <td>${name}</td> <td><input type="number" value="${score}" class="score-input" oninput="updatePrecent(this);"> / <input type="number" value="${maxscore}" class="maxscore-input" oninput="updatePrecent(this);"></td> <td>${precentText}</td> <td><input type="checkbox" oninput="updatePrecent(this);" class="exempt-checkbox" ${checkedText}></td>`;
    return newRow;
}

function updatePrecent(inputElement) {
    let row = inputElement.parentElement.parentElement;
    let category = row.parentElement.previousSibling.innerHTML.split(" - ")[0];
    let score = row.getElementsByClassName("score-input")[0].value;
    let maxscore = row.getElementsByClassName("maxscore-input")[0].value;
    let precent = row.getElementsByTagName("td")[3];
    let exempt = row.getElementsByClassName("exempt-checkbox")[0].checked;

    let childNum = Array.prototype.indexOf.call(row.parentElement.children, row) - 1;
    assignments[category][childNum].score = score;
    assignments[category][childNum].maxscore = maxscore;
    assignments[category][childNum].exempt = exempt;

    if(exempt) {
        precent.innerHTML = "N/A";
    } else {
        precent.innerHTML = `${calculatePrecent(score, maxscore)}%`;
    }
}

function calculatePrecent(score, maxscore) {

    if(maxscore == 0) {
        return 0;
    } else {
        let precent = Math.round(score/maxscore * 10000)/100;
        return precent;
    }

}

function startCSAInput() {

    let weights = document.getElementsByClassName("precent-weight");
    for(let weight of weights) { if(weight.value == "") {weight.value = 0;} }

    let tables = document.getElementById("tables").getElementsByTagName("table");

    for (let table of tables) {
        
        let category = table.previousSibling.innerHTML.split(" - ")[0];
        let rows = table.getElementsByTagName("tr");
        for (let row of rows) {
            let index = Array.prototype.indexOf.call(row.parentElement.children, row)
            if (index == 0) { continue; }
            let maxscore = row.getElementsByClassName("maxscore-input")[0];
            if(maxscore.value <= 0 || maxscore.value == "") {
                maxscore.value = 0;
                assignments[category][index - 1].exempt = true;
            }
        }

    }

    let assignmentTypeContainer = document.getElementById("assignment-type-container");
    assignmentTypeContainer.innerHTML = "";
    Object.keys(assignments).forEach(category => {
        let categoryInput = document.createElement("input");
        categoryInput.type = "radio";
        categoryInput.className = "csa-category-option";
        categoryInput.name = "csa-category"
        let categoryLabel = document.createElement("label");
        categoryLabel.innerHTML = category;
        assignmentTypeContainer.appendChild(categoryInput);
        assignmentTypeContainer.appendChild(categoryLabel);
        assignmentTypeContainer.appendChild(document.createElement("br"));
    });

    document.documentElement.style.setProperty('--positionOffset', '300%');
}

function openInputSection() {
    document.documentElement.style.setProperty('--positionOffset', '100%');
}

function calculateFinalGrade() {
    let tableSection = document.getElementById("tables-section");
    let categoryWeightElements = tableSection.getElementsByClassName("precent-weight");
    let categoryWeights = [];
    for (let weight of categoryWeightElements) { categoryWeights.push(weight.value/100); }
    let categoryScores = [];
    let csaCategoryOptions = document.getElementsByClassName("csa-category-option");
    let csaCategory = null;
    let newCategoryWeight = document.getElementById("new-category-weight").value/100;
    let csaMaxPoints = document.getElementById("csa-maxpoints").value;
    let desiredScore = document.getElementById("desired-grade").value;

    let letterGrade = ["D", "C", "B", "A"][(desiredScore*10)-6];


    // Determine CSA Category (as an index)
    for (let optionIndex in csaCategoryOptions) {
        let option = csaCategoryOptions[optionIndex];
        if (option.checked) {
            csaCategory = parseFloat(optionIndex);
            break;
        }
    }

    if (csaCategory == null) {
        return alert("Please select the category for the CSA");
    }

    if (csaCategory + 1 == csaCategoryOptions.length && parseFloat(newCategoryWeight) <= 0) {
        return alert("If your CSA is in a unique category, please provide its weight.");
    }

    if (csaMaxPoints == "" || csaMaxPoints <= 0) {
        return alert("Please provide a valid amount of points for the CSA.");
    }

    // Calculate Category Scores
    Object.keys(assignments).forEach(category => {

        let categoryPointsEarned = 0;
        let categoryPointsPossible = 0;

        assignments[category].forEach(assignment => {
            if(assignment.exempt) return;
            categoryPointsEarned = categoryPointsEarned + parseFloat(assignment.score);
            categoryPointsPossible = categoryPointsPossible + parseFloat(assignment.maxscore);
        });

        categoryScores.push({ "score": categoryPointsEarned, "maxscore": categoryPointsPossible, "grade": categoryPointsEarned/categoryPointsPossible });
    });

    let neededGrade = null;
    let totalWeight = categoryWeights.reduce((sum, weight) => sum + weight, 0) + newCategoryWeight;
    categoryWeights = categoryWeights.map(weight => (weight / totalWeight));
    newCategoryWeight = (newCategoryWeight / totalWeight);

    if(csaCategory + 1 > categoryScores.length) {
        // CSA is in an Unique Category

        let tempGrade = 0;

        categoryScores.forEach((category, index) => {
            tempGrade = tempGrade + (parseFloat(category.grade) * parseFloat(categoryWeights[index]));
        });

        for (let i = 0; i <= csaMaxPoints; i++) {
            let finalGrade = tempGrade + (i/csaMaxPoints * newCategoryWeight);
            if(finalGrade >= desiredScore) {
                neededGrade = i;
                break;
            }
        }

    } else {
        // CSA is in Existing Category

        let tempGrade = 0;

        categoryScores.forEach((category, index) => {
            if (index == csaCategory) return;
            tempGrade = tempGrade + (parseFloat(category.grade) * parseFloat(categoryWeights[index]));
        });

        for (let i = 0; i <= csaMaxPoints; i++) {
            let finalGrade = tempGrade + ( (i + parseFloat(categoryScores[csaCategory].score)) / (parseFloat(csaMaxPoints) + parseFloat(categoryScores[csaCategory].maxscore)) * parseFloat(categoryWeights[csaCategory]) );
            if(finalGrade >= desiredScore) {
                neededGrade = i;
                break;
            }
        }
    }

    if(neededGrade == null) {
        document.getElementById("end-message-impossible").style.display = "";
        document.getElementById("end-message-score").style.display = "none";
        document.getElementById("end-message-precent").style.display = "none";
        document.getElementById("failed-grade").innerHTML = letterGrade;
        document.getElementById("failed-maxscore").innerHTML = csaMaxPoints;
        document.getElementById("goodfaith-note").style.display = "none";
    } else {
        document.getElementById("result-score").innerHTML = neededGrade;
        document.getElementById("result-maxscore").innerHTML = csaMaxPoints;
        document.getElementById("result-precentage").innerHTML = Math.round((neededGrade/csaMaxPoints) * 100) + "%";
        document.getElementById("result-grade").innerHTML = letterGrade;

        if(Math.round((neededGrade/csaMaxPoints) * 100) <= 60) {
            document.getElementById("goodfaith-note").style.display = "";
        } else {
            document.getElementById("goodfaith-note").style.display = "none";
        }

        document.getElementById("end-message-impossible").style.display = "none";
        document.getElementById("end-message-score").style.display = "";
        document.getElementById("end-message-precent").style.display = "";
    }

    document.getElementById("result-container").style.display = "";
}

let bg = document.querySelector(".mouse-cursor-gradient-tracking");
// If the element exists, listen on the whole document so the CSS variables
// update even when the cursor isn't directly over the bg element or when
// the element is moved around in the page.
if (bg) {
    document.addEventListener("mousemove", (e) => {
        // Use the bg element's bounding rect so coordinates remain correct
        // even when the event target is a different element.
        const rect = bg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        bg.style.setProperty("--x", x + "px");
        bg.style.setProperty("--y", y + "px");
    });
    // Optional: update on touch move (first touch) for mobile support
    document.addEventListener("touchmove", (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        const rect = bg.getBoundingClientRect();
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        bg.style.setProperty("--x", x + "px");
        bg.style.setProperty("--y", y + "px");
    }, { passive: true });
}