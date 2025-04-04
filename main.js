// Global elements ... (no changes needed here)
// cacheElements() ... (no changes needed here)

let clockTimeoutId = null;

function setupClock() {
    runClockCycle();
}

function runClockCycle() {
    // Get the timestamp for this specific cycle *once*
    const now = new Date();

    // 1. Update the display using this timestamp
    updateTimeAndScheduleDisplay(now); // Pass the timestamp

    // 2. Calculate the delay until the next whole second based on when we started
    // Ensure a minimum delay
    const delayUntilNextSecond = Math.max(50, 1000 - now.getMilliseconds());

    // 3. Schedule the next cycle
    clockTimeoutId = setTimeout(runClockCycle, delayUntilNextSecond);
}

// Function now accepts the timestamp for the current cycle
function updateTimeAndScheduleDisplay(now) {
    // Use the passed 'now' object for all time components in this cycle
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    // Update clock display
    elements.timeEl.textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;

    // Update schedule display using the same timestamp
    updateScheduleDisplay(now); // Pass the timestamp down

    // Check for scheduled refresh only at the start of the minute (seconds === 0)
    if (seconds === 0) {
        const refreshTimes = [6, 7]; // 6 AM, 7 AM
        if (refreshTimes.includes(hours) && minutes === 0) {
            console.log(`Refreshing page at ${hoursStr}:${minutesStr}...`);
            location.reload();
        }
    }
}

// --- updateScheduleDisplay now accepts the timestamp ---
function updateScheduleDisplay(now) { // Added 'now' parameter
    // Pass the timestamp down to get schedule info based on this exact moment
    const scheduleInfo = getCurrentScheduleInfo(now);

    // ... (rest of the display logic remains the same) ...

    let displayInfoA = { name: "Loading...", timeRemaining: "", progress: 0, active: false };
    let displayInfoB = { name: "", timeRemaining: "", progress: 0, active: false };
    let showBar1 = false;
    let showBar2 = false;

    if (scheduleInfo.inSession) {
        if (scheduleInfo.scheduleA.inSession) {
            displayInfoA = { ...scheduleInfo.scheduleA, active: true };
            showBar1 = true;
        }
        if (scheduleInfo.needsTwoProgressBars && scheduleInfo.scheduleB.inSession) {
             displayInfoB = { ...scheduleInfo.scheduleB, active: true };
             showBar2 = true;
             if (!scheduleInfo.scheduleA.inSession) {
                displayInfoA = displayInfoB;
                showBar1 = true;
                showBar2 = false;
             }
        } else if (!scheduleInfo.scheduleA.inSession && scheduleInfo.scheduleB.inSession) {
            displayInfoA = { ...scheduleInfo.scheduleB, active: true };
            showBar1 = true;
        }
    } else if (scheduleInfo.nextPeriod.available) {
        displayInfoA = { name: `Next: ${scheduleInfo.nextPeriod.name}`, timeRemaining: `in ${scheduleInfo.nextPeriod.timeUntilStart}`, progress: 0, active: false };
        showBar1 = true;
    } else {
         displayInfoA = { name: scheduleInfo.message || "End of School Day", timeRemaining: "", progress: 0, active: false };
         showBar1 = true;
    }

    // Update Bar 1 DOM
    if (showBar1) {
        elements.bar1Name.textContent = displayInfoA.name;
        elements.bar1Remaining.textContent = displayInfoA.timeRemaining;
        elements.bar1Progress.style.width = displayInfoA.active ? `${displayInfoA.progress}%` : '0%';
        elements.bar1.classList.toggle('active', displayInfoA.active);
        elements.bar1.style.display = 'flex';
    } else {
        elements.bar1.style.display = 'none';
    }

    // Update Bar 2 DOM
    if (showBar2) {
        elements.bar2Name.textContent = displayInfoB.name;
        elements.bar2Remaining.textContent = displayInfoB.timeRemaining;
        elements.bar2Progress.style.width = `${displayInfoB.progress}%`;
        elements.bar2.classList.add('active');
        elements.bar2.style.display = 'flex';
    } else {
        elements.bar2.style.display = 'none';
    }
}


// --- getCurrentScheduleInfo now accepts the timestamp ---
function getCurrentScheduleInfo(now) { // Added 'now' parameter
    // Use the passed 'now' object instead of creating a new Date()
    const dayOfWeek = now.getDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Handle weekend case first
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { inSession: false, message: "Weekend - No School", needsTwoProgressBars: false, scheduleA: { inSession: false }, scheduleB: { inSession: false }, nextPeriod: { available: false } };
    }

    // Check if schedules were loaded for the weekday
    if (!currentSchedules[0]) {
        return { inSession: false, message: "No schedule available", needsTwoProgressBars: false, scheduleA: { inSession: false }, scheduleB: { inSession: false }, nextPeriod: { available: false } };
    }

    // Pass the 'now' object down to the period info functions
    const scheduleAInfo = getCurrentPeriodInfo(currentSchedules[0], now); // Pass 'now'
    const scheduleBInfo = currentSchedules[1]
        ? getCurrentPeriodInfo(currentSchedules[1], now) // Pass 'now'
        : { inSession: false };

    const needsTwoProgressBars = scheduleBInfo.inSession;

    // Pass the 'now' object down to get next period info
    const nextPeriodInfo = getNextPeriodInfo(now); // Pass 'now'

    return {
        inSession: scheduleAInfo.inSession || scheduleBInfo.inSession,
        needsTwoProgressBars,
        scheduleA: scheduleAInfo,
        scheduleB: scheduleBInfo,
        nextPeriod: nextPeriodInfo
    };
}


// --- getCurrentPeriodInfo now accepts the timestamp ---
function getCurrentPeriodInfo(scheduleObj, now) { // Added 'now' parameter
    if (!scheduleObj || !scheduleObj.periods) return { inSession: false };

    // Use the passed 'now' object to get minutes and seconds for this cycle
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Check each period in the schedule
    for (const period of scheduleObj.periods) {
        if (period.startTimeMinutes == null || period.endTimeMinutes == null) continue;

        if (currentTimeInMinutes >= period.startTimeMinutes && currentTimeInMinutes < period.endTimeMinutes) {
            const totalDuration = period.endTimeMinutes - period.startTimeMinutes;
             if (totalDuration <= 0) continue;

            // Use currentTimeInMinutes and currentSeconds derived from the passed 'now'
            const elapsed = currentTimeInMinutes - period.startTimeMinutes;
            const remainingWithSeconds = (period.endTimeMinutes - currentTimeInMinutes) - (currentSeconds / 60);
            const progress = ((elapsed + (currentSeconds / 60)) / totalDuration) * 100;

            return {
                inSession: true,
                name: period.name,
                timeRemaining: timeUtils.formatRemaining(remainingWithSeconds),
                progress: Math.min(100, progress).toFixed(1)
            };
        }
    }

    return { inSession: false }; // No active period found in this schedule
}

// --- getNextPeriodInfo now accepts the timestamp ---
function getNextPeriodInfo(now) { // Added 'now' parameter
    if (allSortedPeriods.length === 0) return { available: false };

    // Use the passed 'now' object to get minutes and seconds for this cycle
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Find the first period in the sorted list that starts after the current time
    for (const period of allSortedPeriods) {
        if (period.startTimeMinutes > currentTimeInMinutes) {
             // Use currentTimeInMinutes and currentSeconds derived from the passed 'now'
             const timeUntilStartMinutes = period.startTimeMinutes - currentTimeInMinutes;
             const timeUntilStartWithSeconds = timeUntilStartMinutes - (currentSeconds / 60);

            return {
                available: true,
                name: period.name,
                timeUntilStart: timeUtils.formatRemaining(timeUntilStartWithSeconds)
            };
        }
    }

    return { available: false }; // No future periods found for today
}


// --- Remaining functions (setupWeather, setupDate, timeUtils, Schedule, scheduleData, initializeSchedules, checkCommands, init) have no changes ---

// Weather functionality ... (no changes needed)
function setupWeather() {
    const apiKey = '7a08aa9c10a1a7edae637fa85fc3ecae';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Highlands%20Ranch,us&appid=${apiKey}&units=imperial`;
    const CACHE_DURATION = 900000; // 15 minutes
    const REFRESH_INTERVAL = 300000; // 5 minutes

    function checkWeatherCache() {
        const cachedTemp = localStorage.getItem("wxTemp");
        const cachedTime = localStorage.getItem("wxTime");
        const now = Date.now();
        if (cachedTemp && cachedTime && (now - parseInt(cachedTime, 10)) < CACHE_DURATION) {
            elements.tempElement.textContent = `${cachedTemp}°`;
            return true;
        }
        return false;
    }

    function fetchWeather() {
        if (checkWeatherCache()) return;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data?.main?.temp !== undefined) {
                    const temp = Math.round(data.main.temp);
                    elements.tempElement.textContent = `${temp}°`;
                    localStorage.setItem("wxTemp", temp.toString());
                    localStorage.setItem("wxTime", Date.now().toString());
                } else {
                    console.warn("Weather data format unexpected:", data);
                    elements.tempElement.textContent = "--°";
                }
            })
            .catch(error => {
                console.error("Weather fetch error:", error);
                elements.tempElement.textContent = "ERR";
                localStorage.removeItem("wxTemp");
                localStorage.removeItem("wxTime");
            });
    }
    fetchWeather();
    setInterval(fetchWeather, REFRESH_INTERVAL);
}

// Date functionality ... (no changes needed)
function setupDate() {
    let midnightUpdateTimeoutId = null; // Keep this local if only used here
    function updateDate() {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        elements.dateElement.textContent = `${month}/${day}`;
    }
    updateDate();
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    midnightUpdateTimeoutId = setTimeout(() => {
        updateDate();
        setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

// Time utility functions ... (no changes needed)
const timeUtils = {
    timeToMinutes: timeString => { /* ... */ },
    formatRemaining: minutes => { /* ... */ },
    formatTime: (hours, minutes) => { /* ... */ }
};
// Explicitly defining the functions again for clarity, assuming they exist above
timeUtils.timeToMinutes = timeString => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
};
timeUtils.formatRemaining = minutes => {
    if (minutes < 1) { return `${Math.max(0, Math.floor(minutes * 60))} sec`; }
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
};
timeUtils.formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};


// Schedule class ... (no changes needed)
class Schedule {
    constructor(scheduleString) { this.periods = this.parseSchedule(scheduleString); }
    parseSchedule(scheduleString) {
        return scheduleString.split(',').map(part => {
            const [startTime, name, endTime] = part.split(';');
            const startTimeMinutes = timeUtils.timeToMinutes(startTime);
            const endTimeMinutes = endTime ? timeUtils.timeToMinutes(endTime) : null;
            return { startTime, name, endTime, startTimeMinutes, endTimeMinutes };
        });
     }
}

// Explicitly defining the data again for clarity, assuming it exists above
const scheduleData = {
    1: ["7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50", "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"],
    2: ["7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;S.A.S.;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50", "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"],
    3: ["7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50", "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"],
    4: ["7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;Eagle Time;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50", "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"],
    5: ["7:00;Happy Friday!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;8:36,8:36;Passing Period;8:41,8:41;Period 2;9:32,9:32;Passing Period;9:37,9:37;Period 3;10:28,10:28;Passing Period;10:33,10:33;Period 4;11:24,11:24;A Lunch;12:02,12:02;Passing Period;12:07,12:07;Period 5;12:58,12:58;Passing Period;13:03,13:03;Period 6;13:54,13:54;Passing Period;13:59,13:59;Period 7;14:50", "11:24;Passing Period;11:29,11:29;Period 5;12:20,12:20;B Lunch;12:58"]
};

let currentSchedules = [null, null];
let allSortedPeriods = [];

// initializeSchedules() ... (no changes needed)
function initializeSchedules() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    currentSchedules = [null, null];
    allSortedPeriods = [];
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const daySchedules = scheduleData[dayOfWeek];
        if (daySchedules?.length > 0) {
            currentSchedules[0] = new Schedule(daySchedules[0]);
            if (daySchedules.length > 1) { currentSchedules[1] = new Schedule(daySchedules[1]); }
            const tempPeriodsMap = new Map();
            for (const schedule of currentSchedules) {
                if (!schedule) continue;
                for (const period of schedule.periods) {
                    if (period.startTimeMinutes != null && period.endTimeMinutes != null) {
                        const key = `${period.startTimeMinutes}-${period.name}`;
                        if (!tempPeriodsMap.has(key)) {
                            tempPeriodsMap.set(key, { name: period.name, startTime: period.startTime, startTimeMinutes: period.startTimeMinutes });
                        }
                    }
                }
            }
            allSortedPeriods = Array.from(tempPeriodsMap.values()).sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
        }
    }
    // Initial update needed *after* initializing, handled by first clock cycle now.
    // updateScheduleDisplay(new Date()); // Pass current time for initial consistency
}


// checkCommands() ... (no changes needed)
async function checkCommands() { /* ... */ }
// Explicitly defining the function again for clarity, assuming it exists above
async function checkCommands() {
    try {
        const devLink = "https://script.google.com/macros/s/AKfycbxZe6A-GKnGcv9efNxrMeSNvxcYC2MhOvqQkQLNpIiQOqcJCSuCTauq0k7Pwuz4OIcf/exec";
        const response = await fetch(devLink, { cache: "no-store" });
        if (!response.ok) { throw new Error(`Command fetch HTTP error! status: ${response.status}`); }
        const command = await response.text();
        if (command === "refresh") { location.reload(); }
        else if (command === "wipe-storage") { localStorage.clear(); location.reload(); }
        setTimeout(checkCommands, 300000);
    } catch (error) {
        console.error("Command check error:", error);
        setTimeout(checkCommands, 300000);
    }
}


// Initialization ... (no changes needed, but ensure correct timeout IDs are used)
let midnightScheduleResetTimeoutId = null; // Ensure this ID is global/accessible if cleared in init
let dailyScheduleResetIntervalId = null;  // Ensure this ID is global/accessible if cleared in init

function init() {
    console.log("Initializing Dashboard...");
    cacheElements();

    if (clockTimeoutId) clearTimeout(clockTimeoutId);
    // Make sure midnightUpdateTimeoutId is defined if clearing it (or keep it local to setupDate)
    // if (midnightUpdateTimeoutId) clearTimeout(midnightUpdateTimeoutId);
    if (midnightScheduleResetTimeoutId) clearTimeout(midnightScheduleResetTimeoutId);
    if (dailyScheduleResetIntervalId) clearInterval(dailyScheduleResetIntervalId);

    initializeSchedules();
    setupClock();
    setupWeather();
    setupDate();
    checkCommands();

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    console.log(`Scheduling next schedule reset in ${timeUntilMidnight / 1000 / 60} minutes`);
    midnightScheduleResetTimeoutId = setTimeout(() => {
        console.log("Midnight: Re-initializing schedules.");
        initializeSchedules();
        dailyScheduleResetIntervalId = setInterval(() => {
            console.log("Daily Interval: Re-initializing schedules.");
            initializeSchedules();
        }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    console.log("Initialization Complete.");
}

// Start Everything
document.addEventListener('DOMContentLoaded', init);