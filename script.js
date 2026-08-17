// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBHtHwQjRmvViy-Stp7ueMx6KlUFzWLBzw",

    authDomain:
        "students-record-10c74.firebaseapp.com",

    databaseURL:
        "https://students-record-10c74-default-rtdb.europe-west1.firebasedatabase.app",

    projectId:
        "students-record-10c74",

    storageBucket:
        "students-record-10c74.firebasestorage.app",

    messagingSenderId:
        "863514705875",

    appId:
        "1:863514705875:web:a8adfde90d85d8dec23926",

    measurementId:
        "G-WGC2JT5V0L"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);

const db =
    getDatabase(app);


// =====================================================
// FIREBASE REFERENCES
// =====================================================

const commandRef =
    ref(db, "collectionCommand");

const dataRef =
    ref(db, "ESP32_Data");


// =====================================================
// HTML ELEMENTS
// =====================================================

const intervalInput =
    document.getElementById("interval");

const setBtn =
    document.getElementById("setBtn");

const statusDot =
    document.getElementById("statusDot");

const statusText =
    document.getElementById("statusText");

const intervalDisplay =
    document.getElementById("intervalDisplay");

const recordCount =
    document.getElementById("recordCount");

const sensorTable =
    document.getElementById("sensorTable");

const modeText =
    document.getElementById("modeText");


// =====================================================
// VARIABLES
// =====================================================

let running = false;

let selectedInterval = 0;


// =====================================================
// READY STATE
// =====================================================

function showReady() {

    running = false;

    statusText.textContent =
        "READY";

    statusDot.style.background =
        "#a7a0a1";

    modeText.textContent =
        "IDLE";

    setBtn.disabled =
        false;

    intervalInput.disabled =
        false;

}


// =====================================================
// RUNNING STATE
// =====================================================

function showRunning() {

    running = true;

    statusText.textContent =
        "COLLECTING";

    statusDot.style.background =
        "#7395bd";

    modeText.textContent =
        "ACTIVE";

    setBtn.disabled =
        false;

    intervalInput.disabled =
        false;

}


// =====================================================
// SET INTERVAL
// =====================================================

setBtn.addEventListener(
    "click",
    async () => {

        const seconds =
            Number(
                intervalInput.value
            );


        // =============================================
        // VALIDATION
        // =============================================

        if (
            !Number.isFinite(seconds) ||
            seconds < 1 ||
            !Number.isInteger(seconds)
        ) {

            alert(
                "Please enter a whole number of seconds."
            );

            return;

        }


        // =============================================
        // DISABLE TEMPORARILY
        // =============================================

        setBtn.disabled = true;


        try {

            // =========================================
            // CREATE COMMAND
            // =========================================

            const command = {

                action:
                    "start",

                interval:
                    seconds,

                timestamp:
                    Date.now()

            };


            console.log(
                "Sending command:",
                command
            );


            // =========================================
            // SEND TO ESP32
            // =========================================

            await set(
                commandRef,
                command
            );


            // =========================================
            // WEBSITE DISPLAY
            // =========================================

            selectedInterval =
                seconds;

            intervalDisplay.textContent =
                seconds;

            intervalInput.value =
                seconds;


            showRunning();


            console.log(
                "Collection started at",
                seconds,
                "seconds."
            );

        }

        catch (error) {

            console.error(
                "SET ERROR:",
                error
            );

            alert(
                "Firebase error:\n\n" +
                error.message
            );

            showReady();

        }

    }
);


// =====================================================
// AUTO STOP WHEN WEBSITE CLOSES
// =====================================================

async function setupDisconnect() {

    try {

        await onDisconnect(
            commandRef
        ).set({

            action:
                "stop",

            timestamp:
                Date.now()

        });


        console.log(
            "Automatic website-close STOP armed."
        );

    }

    catch (error) {

        console.error(
            "onDisconnect ERROR:",
            error
        );

    }

}


setupDisconnect();


// =====================================================
// REALTIME DATABASE RECORDS
// =====================================================

onValue(

    dataRef,

    (snapshot) => {

        sensorTable.innerHTML =
            "";


        // =============================================
        // NO RECORDS
        // =============================================

        if (!snapshot.exists()) {

            recordCount.textContent =
                "0";


            sensorTable.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty"
                    >

                        Waiting for ESP32 records...

                    </td>

                </tr>

            `;

            return;

        }


        const data =
            snapshot.val();


        const rows = [];


        // =============================================
        // READ DATES
        // =============================================

        Object.keys(data).forEach(
            (date) => {

                const dateData =
                    data[date];


                if (
                    !dateData ||
                    typeof dateData !==
                    "object"
                ) {

                    return;

                }


                // =====================================
                // READ TIMES
                // =====================================

                Object.keys(dateData).forEach(
                    (time) => {

                        const record =
                            dateData[time];


                        if (
                            !record ||
                            typeof record !==
                            "object"
                        ) {

                            return;

                        }


                        rows.push({

                            date:
                                date,

                            time:
                                time,

                            float:
                                record.float ??
                                "-",

                            int:
                                record.int ??
                                "-",

                            string:
                                record.string ??
                                "-"

                        });

                    }
                );

            }
        );


        // =============================================
        // NEWEST FIRST
        // =============================================

        rows.sort(
            (a, b) => {

                const aKey =
                    a.date +
                    " " +
                    a.time;

                const bKey =
                    b.date +
                    " " +
                    b.time;


                return bKey.localeCompare(
                    aKey
                );

            }
        );


        // =============================================
        // COUNT
        // =============================================

        recordCount.textContent =
            rows.length;


        // =============================================
        // DISPLAY ROWS
        // =============================================

        rows.forEach(
            (row) => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        ${
                            selectedInterval > 0
                                ? selectedInterval
                                : "—"
                        }
                    </td>

                    <td>
                        ${row.date}
                    </td>

                    <td>
                        ${row.time}
                    </td>

                    <td>
                        ${row.float}
                    </td>

                    <td>
                        ${row.int}
                    </td>

                    <td>
                        ${row.string}
                    </td>

                `;


                sensorTable.appendChild(
                    tr
                );

            }
        );

    },


    (error) => {

        console.error(
            "Firebase data error:",
            error
        );


        sensorTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty"
                >

                    Firebase connection error:
                    ${error.message}

                </td>

            </tr>

        `;

    }

);


// =====================================================
// LISTEN TO COMMAND
// =====================================================

onValue(

    commandRef,

    (snapshot) => {

        if (!snapshot.exists()) {

            return;

        }


        const command =
            snapshot.val();


        if (!command) {

            return;

        }


        console.log(
            "Firebase command:",
            command
        );


        // =============================================
        // START
        // =============================================

        if (
            command.action ===
            "start"
        ) {

            const seconds =
                Number(
                    command.interval
                );


            if (
                seconds >= 1
            ) {

                selectedInterval =
                    seconds;

                intervalInput.value =
                    seconds;

                intervalDisplay.textContent =
                    seconds;

                showRunning();

            }

        }


        // =============================================
        // STOP
        // =============================================

        if (
            command.action ===
            "stop"
        ) {

            showReady();

        }

    }

);


// =====================================================
// INITIAL STATE
// =====================================================

showReady();


console.log(
    "===================================="
);

console.log(
    "DATA BLOOM ESP32 MONITOR"
);

console.log(
    "Firebase: students-record-10c74"
);

console.log(
    "Command: /collectionCommand"
);

console.log(
    "Data: /ESP32_Data"
);

console.log(
    "===================================="
);