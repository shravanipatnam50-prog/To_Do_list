const SUPABASE_URL =
    "https://vlcgleglsspurpscjwym.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_g8tlp3tqOXAztRkRhGMF1w_hE2pNnWu";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

let tasks = [];


// ======================================================
// GET HTML ELEMENTS
// ======================================================

const taskInput =
    document.getElementById("taskInput");

const taskList =
    document.getElementById("taskList");

const pendingList =
    document.getElementById("pendingList");

const completedList =
    document.getElementById("completedList");

const noTasks =
    document.getElementById("noTasks");

const noPending =
    document.getElementById("noPending");

const noCompleted =
    document.getElementById("noCompleted");

const count =
    document.getElementById("count");

const date =
    document.getElementById("date");

const previousSection =
    document.getElementById("previousSection");

const previousButton =
    document.getElementById("previousButton");

const previousDate =
    document.getElementById("previousDate");

const previousResult =
    document.getElementById("previousResult");


// Authentication elements

const authSection =
    document.getElementById("authSection");

const emailInput =
    document.getElementById("emailInput");

const passwordInput =
    document.getElementById("passwordInput");

const authMessage =
    document.getElementById("authMessage");


// ======================================================
// GET DATE IN YYYY-MM-DD FORMAT
// ======================================================

function getDateKey(dateObject) {

    let year =
        dateObject.getFullYear();

    let month =
        String(
            dateObject.getMonth() + 1
        ).padStart(2, "0");

    let day =
        String(
            dateObject.getDate()
        ).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


// ======================================================
// TODAY'S DATE
// ======================================================

let today =
    new Date();

let todayKey =
    getDateKey(today);


// Display today's date

date.innerText =
    today.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );


// Maximum date for previous date picker

previousDate.max =
    todayKey;


// ======================================================
// GET CURRENT LOGGED-IN USER
// ======================================================

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        console.log(
            "User error:",
            error.message
        );

        return null;
    }


    return data.user;
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// LOAD TODAY'S TASKS FROM SUPABASE
// ======================================================

async function loadTasks() {

    const user =
        await getCurrentUser();


    if (!user) {

        tasks = [];

        displayTasks();

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("tasks")
            .select(
                "id, text, completed, created_at"
            )
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "task_date",
                todayKey
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.log(
            "Load tasks error:",
            error.message
        );

        alert(
            "Could not load your tasks.\n\n" +
            error.message
        );

        return;
    }


    tasks =
        data || [];


    displayTasks();
}


// ======================================================
// DISPLAY TODAY'S TASKS
// ======================================================

function displayTasks() {

    taskList.innerHTML = "";

    pendingList.innerHTML = "";

    completedList.innerHTML = "";


    let completedCount = 0;


    for (
        let i = 0;
        i < tasks.length;
        i++
    ) {

        let task =
            tasks[i];


        let div =
            document.createElement("div");

        div.className =
            "task";


        if (task.completed) {

            div.classList.add(
                "completed"
            );

            completedCount++;

        }


        div.innerHTML = `
            <input
                type="checkbox"
                ${task.completed ? "checked" : ""}
                onchange="completeTask(${i})"
            >

            <span class="task-name">
                ${escapeHTML(task.text)}
            </span>

            <button
                class="delete"
                onclick="deleteTask(${i})"
            >
                ×
            </button>
        `;


        // Show task under Today

        taskList.appendChild(div);


        // Make copy for Pending / Completed

        let copy =
            div.cloneNode(true);


        if (task.completed) {

            completedList.appendChild(
                copy
            );

        } else {

            pendingList.appendChild(
                copy
            );

        }
    }


    // ==================================================
    // NO TASKS
    // ==================================================

    if (tasks.length === 0) {

        noTasks.style.display =
            "block";

    } else {

        noTasks.style.display =
            "none";
    }


    // ==================================================
    // NO PENDING TASKS
    // ==================================================

    if (
        tasks.length === completedCount
    ) {

        noPending.style.display =
            "block";

    } else {

        noPending.style.display =
            "none";
    }


    // ==================================================
    // NO COMPLETED TASKS
    // ==================================================

    if (completedCount === 0) {

        noCompleted.style.display =
            "block";

    } else {

        noCompleted.style.display =
            "none";
    }


    // ==================================================
    // COUNTER
    // ==================================================

    count.innerText =
        completedCount +
        " / " +
        tasks.length +
        " completed";
}


// ======================================================
// ADD TASK
// ======================================================

async function addTask() {

    let text =
        taskInput.value.trim();


    if (text === "") {

        alert(
            "Please enter a task!"
        );

        return;
    }


    const user =
        await getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;
    }


    // Disable input while saving

    taskInput.disabled =
        true;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("tasks")
            .insert([
                {
                    user_id: user.id,

                    task_date: todayKey,

                    text: text,

                    completed: false
                }
            ])
            .select()
            .single();


    taskInput.disabled =
        false;


    if (error) {

        console.log(
            "Add task error:",
            error.message
        );

        alert(
            "Could not save task.\n\n" +
            error.message
        );

        return;
    }


    // Add returned task to our array

    tasks.push(data);


    // Clear input

    taskInput.value = "";


    // Display updated list

    displayTasks();
}


// ======================================================
// COMPLETE / UNCOMPLETE TASK
// ======================================================

async function completeTask(index) {

    let task =
        tasks[index];


    if (!task) {

        return;
    }


    let newStatus =
        !task.completed;


    const {
        error
    } =
        await supabaseClient
            .from("tasks")
            .update({
                completed: newStatus
            })
            .eq(
                "id",
                task.id
            );


    if (error) {

        console.log(
            "Update task error:",
            error.message
        );

        alert(
            "Could not update task.\n\n" +
            error.message
        );

        return;
    }


    // Update local array

    tasks[index].completed =
        newStatus;


    // Refresh display

    displayTasks();
}


// ======================================================
// DELETE TASK
// ======================================================

async function deleteTask(index) {

    let task =
        tasks[index];


    if (!task) {

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("tasks")
            .delete()
            .eq(
                "id",
                task.id
            );


    if (error) {

        console.log(
            "Delete task error:",
            error.message
        );

        alert(
            "Could not delete task.\n\n" +
            error.message
        );

        return;
    }


    // Remove from local array

    tasks.splice(
        index,
        1
    );


    // Refresh display

    displayTasks();
}


// ======================================================
// PRESS ENTER TO ADD TASK
// ======================================================

taskInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            addTask();

        }

    }
);


// ======================================================
// SHOW PREVIOUS DAYS
// ======================================================

function showPreviousDays() {

    previousSection.style.display =
        "block";

    previousButton.style.display =
        "none";
}


// ======================================================
// VIEW SELECTED PREVIOUS DAY
// ======================================================

async function viewPreviousDay() {

    let selectedDate =
        previousDate.value;


    if (selectedDate === "") {

        alert(
            "Please select a date!"
        );

        return;
    }


    // Don't allow today

    if (selectedDate === todayKey) {

        alert(
            "Today is already shown above!"
        );

        return;
    }


    const user =
        await getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;
    }


    // Get tasks for selected date

    const {
        data,
        error
    } =
        await supabaseClient
            .from("tasks")
            .select(
                "id, text, completed, created_at"
            )
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "task_date",
                selectedDate
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.log(
            "Previous day error:",
            error.message
        );

        alert(
            "Could not load previous tasks.\n\n" +
            error.message
        );

        return;
    }


    previousResult.innerHTML = "";


    // Convert date for display

    let displayDate =
        new Date(
            selectedDate +
            "T00:00:00"
        );


    let formattedDate =
        displayDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    let title =
        document.createElement("h4");


    title.className =
        "previous-result-title";


    title.innerText =
        formattedDate;


    previousResult.appendChild(
        title
    );


    // No tasks

    if (!data || data.length === 0) {

        let message =
            document.createElement("p");


        message.className =
            "previous-empty";


        message.innerText =
            "No tasks were saved for this day.";


        previousResult.appendChild(
            message
        );

        return;
    }


    // Display old tasks

    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        let task =
            data[i];


        let div =
            document.createElement("div");


        div.className =
            "previous-task";


        if (task.completed) {

            div.classList.add(
                "completed"
            );

        } else {

            div.classList.add(
                "pending"
            );

        }


        let icon =
            task.completed
                ? "✅"
                : "⬜";


        div.innerHTML = `
            <span class="previous-task-icon">
                ${icon}
            </span>

            <span class="previous-task-name">
                ${escapeHTML(task.text)}
            </span>
        `;


        previousResult.appendChild(
            div
        );
    }
}


// ======================================================
// BACK TO TODAY
// ======================================================

function backToToday() {

    previousSection.style.display =
        "none";

    previousButton.style.display =
        "block";

    previousResult.innerHTML =
        "";

    previousDate.value =
        "";
}


// ======================================================
// SIGN UP
// ======================================================

async function signUp() {

    let email =
        emailInput.value.trim();

    let password =
        passwordInput.value.trim();


    if (
        email === "" ||
        password === ""
    ) {

        authMessage.innerText =
            "Please enter email and password.";

        return;
    }


    if (password.length < 6) {

        authMessage.innerText =
            "Password must be at least 6 characters.";

        return;
    }


    authMessage.innerText =
        "Creating your account...";


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                emailRedirectTo:
                    "http://127.0.0.1:5500/index.html"
            }
        });


    if (error) {

        authMessage.innerText =
            error.message;

        return;
    }


    authMessage.innerText =
        "Account created! Check your email to confirm your account.";
}


// ======================================================
// LOGIN
// ======================================================

async function signIn() {

    let email =
        emailInput.value.trim();

    let password =
        passwordInput.value.trim();


    if (
        email === "" ||
        password === ""
    ) {

        authMessage.innerText =
            "Please enter email and password.";

        return;
    }


    authMessage.innerText =
        "Logging in...";


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({

                email: email,

                password: password
            });


    if (error) {

        authMessage.innerText =
            error.message;

        return;
    }


    authSection.style.display =
        "none";


    authMessage.innerText =
        "";


    // Load cloud tasks

    await loadTasks();
}


// ======================================================
// LOGOUT
// ======================================================

async function signOut() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert(
            "Could not logout.\n\n" +
            error.message
        );

        return;
    }


    tasks = [];


    displayTasks();


    authSection.style.display =
        "flex";
}


// ======================================================
// CHECK LOGIN
// ======================================================

async function checkLogin() {

    const {
        data
    } =
        await supabaseClient.auth.getSession();


    if (data.session) {

        authSection.style.display =
            "none";


        await loadTasks();

    } else {

        authSection.style.display =
            "flex";


        tasks = [];


        displayTasks();
    }
}


// ======================================================
// AUTH STATE CHANGE
// ======================================================

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        if (event === "SIGNED_OUT") {

            tasks = [];

            displayTasks();

            authSection.style.display =
                "flex";
        }
    }
);


// ======================================================
// START APPLICATION
// ======================================================

checkLogin();