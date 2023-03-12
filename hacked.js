"use strict";

window.addEventListener("DOMContentLoaded", start);

// Global array
const allStudents = [];

let allExpelledStudents = [];
let allPrefectStudents = [];
let allInquisitorStudents = [];

// variabler

const settings = {
  filter: "all",
  sortBy: "house",
  sortDir: "asc",
  sortExpel: false,
  sortPref: false,
  sortInq: false,
};

let studentInfo = document.querySelector("#student");
let filterBy = "all";
let sortDropDown = "";
let isHacked = false;

// Laver prototypen til Student objects
const Student = {
  firstName: "",
  lastName: "",
  middleName: "",
  nickName: "",
  image: "",
  house: "",
  prefect: "",
  bloodtype: "",
  inquisitor: false,
  expelled: false,
};

function start() {
  console.log("ready");
  loadJSON();
  addButtons();
}

// BUTTON FILTER + SORT EVENTLISTNERS CLICK
function addButtons() {
  // sætter click event på filter knapper, så den kan filtrer mellem husene
  document.querySelectorAll("[data-action='filter']").forEach((button) => button.addEventListener("click", selectHouse));
  console.log("klik virker");
  //  sætter click event på filter knapper, så den kan SORTERER
  document.querySelectorAll("[data-action='sort']").forEach((button) => button.addEventListener("click", selectSort));
  // DROPDOWN
  document.querySelector("#nameDropDown").addEventListener("click", toggleDropDown);
  /* Bliver nødt til at lave forEach for at den tager fat i begge p tags og dermed lukker uansetm om klik på fornavn eller efternavn */
  document.querySelectorAll("#dropDown p").forEach(function (element) {
    element.addEventListener("click", toggleDropDown);
  });

  /* Click hack */
  document.querySelector("#hacking_btn").addEventListener("click", hackTheSystem);
}

// Load json
async function loadJSON() {
  console.log("fetcher jsondata");
  const studentJSON = await fetch("https://petlatkea.dk/2021/hogwarts/students.json");
  const studentData = await studentJSON.json();
  const bloodJSON = await fetch("https://petlatkea.dk/2021/hogwarts/families.json");
  const bloodData = await bloodJSON.json();
  // when loaded, prepare objects
  prepareObjects(studentData, bloodData);
}
//console.log("prepare", prepareObjects());

// Creating new array with cleaned Student data
function prepareObjects(studentData, bloodData) {
  studentData.forEach((jsonObject) => {
    const student = Object.create(Student);
    const text = jsonObject.fullname.trim().split(" ");
    const fullName = jsonObject.fullname.trim();
    // console.log("variabler oprettet");

    // FIRSTNAME
    // sætter forbogstav til STORT og resten til småt
    student.firstName = text[0].charAt(0).toUpperCase() + text[0].slice(1).toLowerCase();

    //    MIDDLENAME
    // If there are more than 2 text in the full name, the middle name(s) are present
    if (text.length > 2) {
      // Capitalize and clean the first middle name
      student.middleName = text[1].charAt(0).toUpperCase() + text[1].slice(1).toLowerCase();
    } else if (text.length === 2) {
      // If there are only 2 text elements, the second element is the last name
      student.lastName = text[1].charAt(0).toUpperCase() + text[1].slice(1).toLowerCase();
    }

    // LASTNAME

    // Capitalize and clean the last name
    student.lastName = text[text.length - 1].charAt(0).toUpperCase() + text[text.length - 1].slice(1).toLowerCase();

    // IMAGE
    let imgSrc = new Image(100, 100);
    student.image = imgSrc;

    let lastNameImage = student.lastName.toLowerCase();
    let firstNameImage = student.firstName.charAt(0).toLowerCase();
    // finder mappen til billederne
    imgSrc.src = "./images/" + lastNameImage + "_" + firstNameImage + ".png";

    // NICKNAME
    let nickNameClear = jsonObject.fullname.substring(jsonObject.fullname.indexOf(`"`), jsonObject.fullname.lastIndexOf(`"`) + 1);

    student.nickName = nickNameClear.replaceAll(`"`, ``);

    // FIXING LEANNE, ERNIE AND FINCH
    if (fullName.includes(" ") === false) {
      student.firstName = capitalize(fullName.substring(0));
      student.lastName = "";
    }
    if (student.middleName.includes(`"`)) {
      student.nickName = capitalize(student.middleName.substring(1, student.middleName.length - 1));
      student.middleName = "";
    }
    if (student.lastName.includes("-")) {
      student.lastName = student.lastName.split("-")[0] + "-" + capitalize(student.lastName.split("-")[1]);
    }
    // FIXING IMAGES FOR LEANNE, PATIL AND FINCH
    if (lastNameImage.includes("-")) {
      imgSrc.src = "./images/" + lastNameImage.substring(lastNameImage.indexOf("-") + 1) + "_" + firstNameImage + ".png";
    } else if (lastNameImage === "Leanne") {
      imgSrc.src = "";
    } else if (lastNameImage.includes("patil")) {
      imgSrc.src = "./images/" + lastNameImage + "_" + student.firstName.toLowerCase() + ".png";
    }

    // HOUSE
    let housename = jsonObject.house;
    housename = housename.trimStart();
    housename = housename.trimEnd();
    student.house = housename.charAt(0).toUpperCase() + housename.slice(1).toLowerCase();

    // FIND BLOOD STATUS

    let blood;

    const isHalfBlood = bloodData.half.includes(student.lastName);
    const isPureBlood = bloodData.pure.includes(student.lastName);
    // console.log("half pur", isHalfBlood, isPureBlood);

    if (isHalfBlood && isPureBlood) {
      student.blood = "H";
    } else if (isHalfBlood) {
      student.blood = "H";
    } else if (isPureBlood) {
      student.blood = "P";
    } else {
      student.blood = "M";
    }

    // Tilføjer det nye object til vores array allStudents
    allStudents.push(student);
  });
  // displayList();
  buildList();

  /* CLICK STUDENT - POPUP */
}

// DISPLAY
function displayList(students) {
  // clear the list
  document.querySelector("#list tbody").innerHTML = "";
  // build a new list
  students.forEach(displayStudent);
}

function displayStudent(student) {
  // console.log(student);
  // create clone
  const clone = document.querySelector("template#student").content.cloneNode(true);
  // set clone data
  clone.querySelector("[data-field=fullname]").textContent = student.firstName + " " + student.lastName;
  clone.querySelector("[data-field=firstname]").textContent = student.firstName;
  clone.querySelector("[data-field=prefect]").textContent = student.prefect;
  clone.querySelector("[data-field=expelled]").textContent = student.expelled;
  clone.querySelector("[data-field=inquisitor]").textContent = student.inquisitor;
  clone.querySelector("[data-field=image] img").src = student.image.src;
  clone.querySelector("[data-field=house]").textContent = student.house;
  // ADD EVENTLISTNER
  clone.querySelector("[data-field=prefect]").addEventListener("click", makePrefect);
  clone.querySelector("[data-field=inquisitor]").addEventListener("click", makeInquisitor);

  // TILFØJER BLOOD TYPE SVG'er
  if (student.blood === "P") {
    clone.querySelector("[data-field=blood] img").src = "SVG/pureblood.svg";
  } else if (student.blood === "H") {
    clone.querySelector("[data-field=blood] img").src = "SVG/halfblood.svg";
  } else {
    clone.querySelector("[data-field=blood] img").src = "SVG/muggle.svg";
  }

  /* CLICK EXPELLED SORT*/
  clone.querySelector("[data-field=expelled]").addEventListener("click", expelStudent);
  clone.querySelector("[data-field=prefect]").addEventListener("click", prefectStudent);
  clone.querySelector("[data-field=inquisitor]").addEventListener("click", makeInquisitor);

  /* CLICK STUDENT POPUP */
  clone.querySelector("#student_info").addEventListener("click", showPopup);

  // INQUISITOR
  function makeInquisitor() {
    let isPure;
    let isSlytHouse;

    isPure = student.blood === "P";
    isSlytHouse = student.house === "Slytherin";
    if (isPure) {
      student.inquisitor = true;
      moveInquisitor();
      console.log("inq is true");
    } else if (isSlytHouse) {
      student.inquisitor = true;
      moveInquisitor();
    } else {
      // console.log("nu skal vi lave inquisitor");
      tryMakeInquisitor();
    }
    buildList();
  }

  function moveInquisitor() {
    const inquisitorID = allStudents.indexOf(student);

    const newInquisitorStudent = allStudents.splice(inquisitorID, 1);

    /* shift gør at den klikkede student bliver taget ud af det gamle array allStudents */
    const moveInquisitorStudent = newInquisitorStudent.shift();

    /* push gør at den klikkede student bliver fjernet fra listen ud i den nye liste allInquisitorStudents*/
    allInquisitorStudents.push(moveInquisitorStudent);
    console.log(allInquisitorStudents);

    buildList();
  }

  // INQUSITOR
  if (student.inquisitor) {
    clone.querySelector("[data-field=inquisitor]").textContent = "Inquisitor";
    document.querySelector("#inquisitorText").textContent = "Inquisitor: Yes";
  } else {
    clone.querySelector("[data-field=inquisitor]").textContent = "Make inquisitor";
    document.querySelector("#inquisitorText").textContent = "Inquisitor: No";
  }

  function tryMakeInquisitor() {
    // console.log("nu kommer der warning);
    document.querySelector("#inqWarning").classList.remove("hide");
    document.querySelector("#inqWarning .closebtn_dialog").addEventListener("click", closeDialog);
  }

  // PREFECT
  if (student.prefect) {
    document.querySelector("#prefectText").textContent = "Prefect: Yes";
    clone.querySelector("[data-field=prefect]").textContent = "Prefect";
  } else {
    document.querySelector("#prefectText").textContent = "Prefect: No";
    clone.querySelector("[data-field=prefect]").textContent = "Make prefect";
  }

  function makePrefect() {
    if (student.prefect) {
      student.prefect = false;
    } else {
      // console.log("nu skal vi lave prefect");
      tryMakePrefect(student);
    }

    buildList();
  }
  // TRY MAKE PREFECT
  function tryMakePrefect(selectedPrefect) {
    // filterer på alle studerende der prefects
    const prefects = allStudents.filter((student) => student.prefect);
    console.log(prefects);
    const others = prefects.filter((student) => student.house === selectedPrefect.house);
    console.log(others);

    if (others.length > 1) {
      removeOthers(others);
    } else {
      isPrefect(selectedPrefect);
    }
    isPrefect(selectedPrefect);

    function isPrefect(student) {
      student.prefect = true;
    }

    function removeOthers(others) {
      // sprøg om user vil ignore eller fjerne studerende
      document.querySelector("#remove_AorB").classList.remove("hide");
      document.querySelector("#remove_AorB .closebtn_dialog").addEventListener("click", closeDialog);
      document.querySelector("#remove_AorB #remove_a").addEventListener("click", () => clickRemoveA(others[0], selectedPrefect));
      document.querySelector("#remove_AorB #remove_b").addEventListener("click", () => clickRemoveB(others[1], selectedPrefect));

      //vis navne på knapper
      document.querySelector("#remove_a [data-field=prefectA]").textContent = others[0].firstName;
      document.querySelector("#remove_b [data-field=prefectB]").textContent = others[1].firstName;
    }
  }

  function closeDialog() {
    document.querySelector("#remove_AorB").classList.add("hide");
    document.querySelector("#inqWarning").classList.add("hide");
    document.querySelector("#inqWarning .closebtn_dialog").removeEventListener("click", closeDialog);
    document.querySelector("#remove_AorB .closebtn_dialog").removeEventListener("click", closeDialog);
    document.querySelector("#remove_AorB #remove_a").removeEventListener("click", clickRemoveA);
    document.querySelector("#remove_AorB #remove_b").removeEventListener("click", clickRemoveB);
  }

  function clickRemoveA(studentA, selectedPrefect) {
    removePrefect(studentA);
    makeNewPrefect(selectedPrefect);
    buildList();
    closeDialog();
  }

  function clickRemoveB(studentB, selectedPrefect) {
    removePrefect(studentB);
    makeNewPrefect(selectedPrefect);
    buildList();
    closeDialog();
  }

  function removePrefect(others) {
    others.prefect = false;
  }

  function makeNewPrefect(student) {
    student.prefect = true;
  }

  /* EXPELLED */
  //Must be able to expel individual students, and see a list of expelled students.

  if (student.expelled) {
    clone.querySelector("[data-field=expelled]").textContent = "Expelled";
    document.querySelector("#expelledText").textContent = "Expelled: Yes";
  } else {
    clone.querySelector("[data-field=expelled]").textContent = "Expell";
    document.querySelector("#expelledText").textContent = "Expelled: No";
  }

  function expelStudent() {
    if (student.lastName === "Sofia") {
      alertFromHacker();
      document.querySelector("#hacking_msg h1").textContent = "Hacker cannot be removed!";
    } else {
      student.expelled = true;
      const studentID = allStudents.indexOf(student);

      const newExpelledStudent = allStudents.splice(studentID, 1);

      /* shift gør at den klikkede student bliver taget ud af det gamle array allStudents */
      const moveExpelledStudent = newExpelledStudent.shift();

      alertFromHacker();
      document.querySelector("#hacking_msg").textContent = student.firstName + " was EXPELLED";
      document.querySelector("#hacking_msg").style.color = "red";
      document.querySelector("#hacking_msg").style.fontSize = "5rem";
      document.querySelector("#hacking_msg").style.fontFamily = "Harry Potter";

      /* push gør at den klikkede student bliver fjernet fra listen ud i den nye liste allExpelledStudents*/
      allExpelledStudents.push(moveExpelledStudent);
      console.log(allExpelledStudents);
    }

    buildList();
  }

  function prefectStudent() {
    student.prefect = true;

    const studentID2 = allStudents.indexOf(student);
    const newPrefectStudent = allStudents.splice(studentID2, 1);

    const movePrefectStudent = newPrefectStudent.shift();

    allPrefectStudents.push(movePrefectStudent);
    console.log(allPrefectStudents);
    buildList();
  }

  /* CLICK STUDENT POPUP */
  clone.querySelector("#student_info").addEventListener("click", showPopup);

  /* POPUP STUDENT */
  function showPopup() {
    console.log("SHOW POPUP");
    let popup = document.querySelector("#popupContainer");
    popup.style.display = "block";

    // Make element visible
    let jasonDataStudent = document.querySelector("#student");
    jasonDataStudent.classList.add("show");
    jasonDataStudent.style.display = "block";

    // Get firstname from the student object OBS den kan ikke finde dette ???
    let firstNamePop = student.firstName;
    let middleNamePop = student.middleName;
    let lastNamePop = student.lastName;
    let nickNamePop = student.nickName;

    // Update the HTML with the first name

    let namePop = document.querySelectorAll(".studentName p");
    let statusPop = document.querySelectorAll(".moreInfo p");
    namePop[0].textContent = "Firstname: " + firstNamePop;
    namePop[1].textContent = "Middlename: " + middleNamePop;
    namePop[2].textContent = "Lastname: " + lastNamePop;
    namePop[3].textContent = "Nickname: " + nickNamePop;

    document.querySelector("#image img").src = student.image.src;
    document.querySelector(".houseNamePop").textContent = student.house;

    // INQUISITOR TEXT PÅ POPUP
    if (student.inquisitor) {
      console.log("popup text");
      document.querySelector("#inquisitorText").textContent = "Inquisitor: Yes";
    } else {
      document.querySelector("#inquisitorText").textContent = "Inquisitor: No";
    }

    // PREFECT TEXT PÅ POPUP
    if (student.prefect) {
      document.querySelector("#prefectText").textContent = "Prefect: Yes";
    } else {
      document.querySelector("#prefectText").textContent = "Prefect: No";
    }

    // BLOODTYPE TEXT PÅ POPUP
    if (student.blood === "H") {
      document.querySelector("#bloodText").textContent = "Bloodtype: Half";
    } else if (student.blood === "P") {
      document.querySelector("#bloodText").textContent = "Bloodtype: Pure";
    } else {
      document.querySelector("#bloodText").textContent = "Bloodtype: Muggle";
    }

    // change background based on house
    if (student.house === "Gryffindor") {
      document.querySelector("#popupContainer").style.backgroundColor = "#7f0909";
    } else if (student.house === "Slytherin") {
      document.querySelector("#popupContainer").style.backgroundColor = "#1a472a";
    } else if (student.house === "Hufflepuff") {
      document.querySelector("#popupContainer").style.backgroundColor = "#ecb939";
    } else if (student.house === "Ravenclaw") {
      document.querySelector("#popupContainer").style.backgroundColor = "#0e1a40";
    } else {
      document.querySelector("#popupContainer").style.backgroundColor = "white";
    }
  }

  // Listen for click on close button
  document.querySelector(".closebtn").addEventListener("click", closePopup);

  // append clone to list
  document.querySelector("#list tbody").appendChild(clone);
}

/* luk popup */
function closePopup() {
  let closePopup = document.querySelector("#popupContainer");
  closePopup.style.display = "none";
}

//Hacking
function hackTheSystem() {
  console.log("haking btn was cliked");
  if (isHacked === false) {
    isHacked = true;
    console.log(isHacked);

    /* dialog box for hacking */
    document.querySelector("#hacking_msg").classList.remove("hide");
    document.querySelector("#hacking_msg h1").textContent = "Oh Nooo... The system was hacked";
    /* sætter et dealy mens hacking sker */
    setTimeout(function () {
      document.querySelector("#hacking_msg").classList.add("hide");
    }, 3500);

    setTimeout(function () {
      alertFromHacker();
      document.querySelector("#hacking_msg h1").textContent = "Beware! A new student was added to the Howarts studentlist";
    }, 4000);

    setTimeout(function () {
      alertFromHacker();

      document.querySelector("#hacking_msg h1").textContent = "All the bloodtypes is messed up!";
    }, 7500);

    // HACKING FUNCTIONER
    addMyself();
    messBlood();
    removeAsInq();
  } else {
    alertFromHacker();

    document.querySelector("#hacking_msg h1").textContent = "The system has already been hacked";
  }

  buildList();
}

// ADD MYSELF

function addMyself() {
  const me = {
    firstName: "Hacker",
    middleName: "",
    lastName: "Sofia",
    nickName: "",
    house: "Slytherin",
    expelled: false,
    blood: "Half",
    squad: false,
    prefect: false,
    image: "",
  };
  // Tilføjer "me" til studentlist
  allStudents.unshift(me);
  console.log(allStudents);
}

// MESS BLOOD UP

function messBlood() {
  allStudents.forEach((student) => {
    if (student.blood === "P") {
      const randomNumber = Math.floor(Math.random() * 3) + 1;
      if (randomNumber === 1) {
        student.blood = "P";
      } else if (randomNumber === 2) {
        student.blood = "H";
      } else {
        student.blood = "M";
      }
    } else {
      student.blood = "P";
    }
  });
  console.log(allStudents);
}

// Remove all students from Squad

function removeAsInq() {
  allInquisitorStudents.forEach((obj) => {
    obj.inquisitor = false;

    setTimeout(function () {
      alertFromHacker();

      document.querySelector("#hacking_msg h1").textContent = "All students were removed as Inquisitors";
    }, 11000);
  });

  allInquisitorStudents = [];

  buildList();
}

function alertFromHacker() {
  document.querySelector("#hacking_msg").classList.remove("hide");

  setTimeout(function () {
    document.querySelector("#hacking_msg").classList.add("hide");
  }, 3000);
}

// DROPDOWN
function toggleDropDown(evt) {
  console.log("klik drop");
  document.querySelector("#dropDown").classList.toggle("hide");
}

// FILTER HOUSE FUNCTIONS
function selectHouse(event) {
  settings.sortExpel = false;
  settings.sortPref = false;
  settings.sortInq = false;
  const filter = event.target.dataset.filter;
  console.log(`User selected ${filter}`);
  //   Kalder setFilter(med det selectede filter)
  setFilter(filter);
}

function setFilter(filter) {
  // sets the global variable
  settings.filterBy = filter;
  buildList();
}

function filterList(filteredList) {
  if (settings.filterBy === "gryffindor") {
    console.log("This is gryffindor");
    // Create a filtered list of only cats
    filteredList = allStudents.filter(isGryf);
    document.querySelector("#expelledButton").classList.add("hide");
    document.querySelector("#inquisitorButton").classList.add("hide");
    document.querySelector("#prefectButton").classList.add("hide");
  } else if (settings.filterBy === "slytherin") {
    console.log("This is slytherin");
    document.querySelector("#expelledButton").classList.add("hide");
    document.querySelector("#prefectButton").classList.add("hide");
    document.querySelector("#inquisitorButton").classList.add("hide");
    // Create a filtered list of only dogs
    filteredList = allStudents.filter(isSlyt);
  } else if (settings.filterBy === "hufflepuff") {
    document.querySelector("#expelledButton").classList.add("hide");
    document.querySelector("#prefectButton").classList.add("hide");
    document.querySelector("#inquisitorButton").classList.add("hide");
    console.log("This is hufflepuff");
    // Create a filtered list of only dogs
    filteredList = allStudents.filter(isHuff);
  } else if (settings.filterBy === "ravenclaw") {
    console.log("This is ravenclaw");
    document.querySelector("#expelledButton").classList.add("hide");
    document.querySelector("#prefectButton").classList.add("hide");
    document.querySelector("#inquisitorButton").classList.add("hide");
    // Create a filtered list of only dogs
    filteredList = allStudents.filter(isRave);
  } else if (settings.filterBy === "all") {
    document.querySelector("#expelledButton").classList.remove("hide");
    document.querySelector("#prefectButton").classList.remove("hide");
    document.querySelector("#inquisitorButton").classList.remove("hide");
  }

  return filteredList;
}

function isGryf(student) {
  return student.house === "Gryffindor";
}
console.log(`valgt hus ${student}`);

function isSlyt(student) {
  return student.house === "Slytherin";
}
function isHuff(student) {
  return student.house === "Hufflepuff";
}
function isRave(student) {
  return student.house === "Ravenclaw";
}

function buildList() {
  console.log("BUILD LIST");
  console.log("settings.sortExpel", settings.sortExpel);
  let studentToWorkWith;
  if (settings.sortExpel) {
    studentToWorkWith = allExpelledStudents;
  } else if (settings.sortPref) {
    studentToWorkWith = allPrefectStudents;
  } else if (settings.sortInq) {
    studentToWorkWith = allInquisitorStudents;
  } else {
    studentToWorkWith = allStudents;
  }

  // først filterer vi
  const currentList = filterList(studentToWorkWith);
  const sortedList = sortList(currentList);
  // kalder displayList med vores sortedList

  displayList(sortedList);
  document.querySelector("h3").textContent = `The list has ${sortedList.length} students`;

  /* Click search */
  document.querySelector("#search").addEventListener("input", search);

  /* search */
  function search(evt) {
    const input = evt.target.value;

    const searchStudents = sortedList.filter((student) => {
      const fullStudentName = `${student.firstName} ${student.middleName} ${student.nickName} ${student.lastName}`;

      if (fullStudentName.toLowerCase().includes(input.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    });

    displayList(searchStudents);

    document.querySelector("h3").textContent = `The list has ${searchStudents.length} students`;

    if (searchStudents.length === 1) {
      document.querySelector("h3").textContent = `The list has 1 student`;
    }

    if (searchStudents.length === 0) {
      document.querySelector("h3").textContent = `No match`;
    }
  }
}

//Click expelled sorting
document.querySelector("#expelledButton").addEventListener("click", expelledList);
//Click prefect sorting
document.querySelector("#prefectButton").addEventListener("click", prefectList);
//Click inquisitor sorting
document.querySelector("#inquisitorButton").addEventListener("click", inquisitorList);

/*BYG LISTE AF INQUISITOR STUDENTS -SORTING*/
function inquisitorList() {
  settings.sortInq = true;
  settings.sortExpel = false;
  settings.sortPref = false;
  console.log("inq button cliked");
  /* laver en ny liste med de inquisitor students*/
  const inqList = filterList(allInquisitorStudents);
  console.log(inqList);
  const sortInquisitor = sortList(inqList);
  displayList(sortInquisitor);
  console.log("inquisitor list");
  document.querySelector("h3").textContent = `The list has ${inqList.length} students`;
}

/*BYG LISTE AF EXPELLED STUDENTS -SORTING*/
function expelledList() {
  settings.sortExpel = true;
  settings.sortPref = false;
  settings.sortInq = false;
  console.log("explled button cliked");
  /* laver en ny liste med de expelled students*/
  const expelList = filterList(allExpelledStudents);
  console.log(expelList);
  const sortExpelled = sortList(expelList);
  displayList(sortExpelled);
  console.log("expelled list");
  document.querySelector("h3").textContent = `The list has ${expelList.length} students`;
}

function prefectList() {
  settings.sortPref = true;
  settings.sortExpel = false;
  settings.sortInq = false;
  console.log("prefect button cliked");
  /* laver en ny liste med de expelled students*/
  const prefList = filterList(allPrefectStudents);
  console.log(prefList);
  const sortPrefect = sortList(prefList);
  displayList(sortPrefect);
  console.log("prefect list");
  document.querySelector("h3").textContent = `The list has ${prefList.length} students`;
}

// Capitalize function
function capitalize(str) {
  const capStr = str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  return capStr;
}
// Capitalize function
function capitalizeFull(str) {
  const capStrFull = str.toUpperCase();
  return capStrFull;
}

// SORTING
function selectSort(event) {
  settings.sortExpel = false;
  settings.prefect = true;
  console.log("selectSort", event);
  const sortBy = event.target.dataset.sort;
  const sortDir = event.target.dataset.sortDirection;

  // Toggle FIRSTNAME og LASTNAME direction !
  if (sortDir === "asc") {
    event.target.dataset.sortDirection = "desc";
    document.querySelector("#nameDropDown span").textContent = `${capitalizeFull(sortBy)} ( A - Z )`;
  } else {
    event.target.dataset.sortDirection = "asc";
    document.querySelector("#nameDropDown span").textContent = `${capitalizeFull(sortBy)} ( Z - A )`;
  }
  console.log(`User selected ${sortBy} - ${sortDir}`);
  //   Kalder sortList(med det valgte sorting
  setSort(sortBy, sortDir);
}

function setSort(sortBy, sortDir) {
  settings.sortBy = sortBy;
  settings.sortDir = sortDir;
  buildList();
  /* expelledList(); */
}

function sortList(sortedList) {
  let direction = 1;
  if (settings.sortDir === "desc") {
    direction = -1;
  } else {
    settings.direction = 1;
  }
  // Hvis sortedList = er "sorted" by name / .sort (en array methods)
  sortedList = sortedList.sort(sortByProperty);

  // SORTING BY  NAME med CLOSURE !! nødvendigt for at vi kan bruge sortBy parametret
  function sortByProperty(A, Z) {
    // console.log(`SortBy is ${sortBy}`);
    if (A[settings.sortBy] < Z[settings.sortBy]) {
      return -1 * direction;
    } else {
      return 1 * direction;
    }
  }

  // husk at return listen
  return sortedList;
}
