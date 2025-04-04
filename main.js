// Global elements to avoid frequent DOM queries
const elements = {
    timeEl: null,
    tempElement: null,
    dateElement: null,
    bar1: null,
    bar1Name: null,
    bar1Remaining: null,
    bar1Progress: null,
    bar2: null,
    bar2Name: null,
    bar2Remaining: null,
    bar2Progress: null
};

// Cache DOM elements on load
function cacheElements() {
    elements.timeEl = document.querySelector("div.bar div.clock p.time");
    elements.tempElement = document.querySelector('div.bar div.weather p.temperature');
    elements.dateElement = document.querySelector('div.bar div.date p.date');
    elements.bar1 = document.getElementById('bar1');
    elements.bar1Name = elements.bar1.querySelector('.name');
    elements.bar1Remaining = elements.bar1.querySelector('.remaining');
    elements.bar1Progress = elements.bar1.querySelector('.progress');
    elements.bar2 = document.getElementById('bar2');
    elements.bar2Name = elements.bar2.querySelector('.name');
    elements.bar2Remaining = elements.bar2.querySelector('.remaining');
    elements.bar2Progress = elements.bar2.querySelector('.progress');
}

// Store the timeout ID
let clockTimeoutId = null;

// Clock functionality - using self-adjusting setTimeout for accuracy
function setupClock() {
    // Start the clock loop
    runClockCycle();
}

function runClockCycle() {
    // 1. Update the display with the current time AND schedule info
    updateTimeAndScheduleDisplay(); // Combined update function

    // 2. Calculate the delay until the next whole second
    const now = new Date();
    // Ensure a minimum delay to prevent potential tight loops if calculation is off
    const delayUntilNextSecond = Math.max(50, 1000 - now.getMilliseconds());

    // 3. Schedule the next cycle
    clockTimeoutId = setTimeout(runClockCycle, delayUntilNextSecond);
}

// Combined function to update time display and schedule display every second
function updateTimeAndScheduleDisplay() {
    const now = new Date();
    const hours = now.getHours(); // Get hours for refresh check too
    const minutes = now.getMinutes(); // Get minutes for refresh check
    const seconds = now.getSeconds();

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    // Update clock display
    elements.timeEl.textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;

    // --- UPDATE: Run schedule display update EVERY second ---
    // This ensures the "time remaining" counts down visually each second.
    updateScheduleDisplay();

    // --- Moved Refresh Logic Here ---
    // Check for scheduled refresh only at the start of the minute (seconds === 0)
    if (seconds === 0) {
        // Set the refresh times (6 AM and 7 AM)
        const refreshTimes = [6, 7]; // 6 AM, 7 AM

        // Check if the current time matches one of the refresh times on the hour
        if (refreshTimes.includes(hours) && minutes === 0) {
            console.log(`Refreshing page at ${hoursStr}:${minutesStr}...`);
            location.reload();
        }
    }
}

// --- REMOVED the duplicate/old updateTime function ---

// Weather functionality (already reasonably optimized with caching)
function setupWeather() {
    const apiKey = '7a08aa9c10a1a7edae637fa85fc3ecae';
    // Using HTTPS for OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Highlands%20Ranch,us&appid=${apiKey}&units=imperial`;
    const CACHE_DURATION = 900000; // 15 minutes in milliseconds
    const REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds

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
        // Don't fetch if cache is still valid (checkWeatherCache already updated display if valid)
        if (checkWeatherCache()) return;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data && data.main && typeof data.main.temp !== 'undefined') {
                    const temp = Math.round(data.main.temp);
                    elements.tempElement.textContent = `${temp}°`;
                    localStorage.setItem("wxTemp", temp.toString()); // Store as string
                    localStorage.setItem("wxTime", Date.now().toString()); // Store as string
                } else {
                    // Handle cases where data might be missing expected fields
                    console.warn("Weather data received but format is unexpected:", data);
                    elements.tempElement.textContent = "--°"; // Indicate missing data
                }
            })
            .catch(error => {
                console.error("Weather fetch error:", error);
                elements.tempElement.textContent = "ERR";
                // Clear potentially stale cache on error to force retry next time
                localStorage.removeItem("wxTemp");
                localStorage.removeItem("wxTime");
            });
    }

    // Initial weather check/fetch
    fetchWeather();

    // Periodic weather updates
    setInterval(fetchWeather, REFRESH_INTERVAL);
}


// Date functionality (already very efficient)
function setupDate() {
    function updateDate() {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        elements.dateElement.textContent = `${month}/${day}`;
    }

    updateDate(); // Update date initially

    // Calculate time until midnight for next update
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime(); // Use getTime() for clarity

    // Set up update at midnight (store timeout ID)
    midnightUpdateTimeoutId = setTimeout(() => { // Assign to global timeout ID
        updateDate();
        // Then update every 24 hours
        setInterval(updateDate, 24 * 60 * 60 * 1000); // Use calculation for clarity
    }, msUntilMidnight);
}

// Time utility functions (minor optimization in timeToMinutes)
const timeUtils = {
    // Convert time string (HH:MM) to minutes since midnight
    timeToMinutes: timeString => {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);
        return hours * 60 + minutes;
    },

    // Format remaining time in a readable way
    formatRemaining: minutes => {
        if (minutes < 1) {
            // Ensure we don't show negative seconds if update timing is slightly off
            return `${Math.max(0, Math.floor(minutes * 60))} sec`;
        }

        const hrs = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);

        if (hrs === 0) return `${mins} min`;
        if (mins === 0) return `${hrs} hr`;
        return `${hrs} hr ${mins} min`;
    },

    // Format time as HH:MM (no changes needed)
    formatTime: (hours, minutes) => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
};


// Schedule class - OPTIMIZED to pre-calculate minutes
class Schedule {
    constructor(scheduleString) {
        this.periods = this.parseSchedule(scheduleString);
    }

    parseSchedule(scheduleString) {
        return scheduleString.split(',').map(part => {
            const [startTime, name, endTime] = part.split(';');
            const startTimeMinutes = timeUtils.timeToMinutes(startTime);
            const endTimeMinutes = endTime ? timeUtils.timeToMinutes(endTime) : null;

            return {
                startTime, name, endTime,
                startTimeMinutes, endTimeMinutes
            };
        });
    }
}

// Schedule data - daily schedules (no changes needed)
const scheduleData = {
    1: ["7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50", "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"],
    2: ["7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;S.A.S.;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50", "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"],
    3: ["7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50", "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"],
    4: ["7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;Eagle Time;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50", "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"],
    5: ["7:00;Happy Friday!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;8:36,8:36;Passing Period;8:41,8:41;Period 2;9:32,9:32;Passing Period;9:37,9:37;Period 3;10:28,10:28;Passing Period;10:33,10:33;Period 4;11:24,11:24;A Lunch;12:02,12:02;Passing Period;12:07,12:07;Period 5;12:58,12:58;Passing Period;13:03,13:03;Period 6;13:54,13:54;Passing Period;13:59,13:59;Period 7;14:50", "11:24;Passing Period;11:29,11:29;Period 5;12:20,12:20;B Lunch;12:58"]
};

// Cache for daily schedules
let currentSchedules = [null, null];
// OPTIMIZATION: Cache for all sorted periods of the day
let allSortedPeriods = [];

// Initialize schedules and pre-calculate/sort periods
function initializeSchedules() {
    const now = new Date();
    const dayOfWeek = now.getDay();

    currentSchedules = [null, null];
    allSortedPeriods = [];

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const daySchedules = scheduleData[dayOfWeek];
        if (daySchedules && daySchedules.length > 0) {
            currentSchedules[0] = new Schedule(daySchedules[0]);
            if (daySchedules.length > 1) {
                 currentSchedules[1] = new Schedule(daySchedules[1]);
            }

            const tempPeriodsMap = new Map();
            for (const schedule of currentSchedules) {
                if (!schedule) continue;
                for (const period of schedule.periods) {
                    if (period.startTimeMinutes != null && period.endTimeMinutes != null) {
                        const key = `${period.startTimeMinutes}-${period.name}`;
                        if (!tempPeriodsMap.has(key)) {
                             tempPeriodsMap.set(key, {
                                name: period.name,
                                startTime: period.startTime,
                                startTimeMinutes: period.startTimeMinutes
                             });
                        }
                    }
                }
            }
            allSortedPeriods = Array.from(tempPeriodsMap.values())
                                  .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
        }
    }
     updateScheduleDisplay(); // Update display immediately after loading schedules
}

// Get current period information - uses pre-calculated minutes
function getCurrentPeriodInfo(scheduleObj, currentTimeInMinutes) {
    if (!scheduleObj || !scheduleObj.periods) return { inSession: false };

    const now = new Date(); // Get current time again for seconds precision
    const currentSeconds = now.getSeconds();

    for (const period of scheduleObj.periods) {
        if (period.startTimeMinutes == null || period.endTimeMinutes == null) continue;

        if (currentTimeInMinutes >= period.startTimeMinutes && currentTimeInMinutes < period.endTimeMinutes) {
            const totalDuration = period.endTimeMinutes - period.startTimeMinutes;
             if (totalDuration <= 0) continue; // Avoid division by zero

            const elapsed = currentTimeInMinutes - period.startTimeMinutes;
            const remainingWithSeconds = (period.endTimeMinutes - currentTimeInMinutes) - (currentSeconds / 60);
            const progress = ((elapsed + (currentSeconds / 60)) / totalDuration) * 100;

            return {
                inSession: true,
                name: period.name,
                timeRemaining: timeUtils.formatRemaining(remainingWithSeconds),
                progress: Math.min(100, progress).toFixed(1) // Cap progress at 100
            };
        }
    }
    return { inSession: false };
}

// Find the next period - uses pre-calculated and sorted list
function getNextPeriodInfo(currentTimeInMinutes) {
    if (allSortedPeriods.length === 0) return { available: false };

    const now = new Date();
    const currentSeconds = now.getSeconds();

    for (const period of allSortedPeriods) {
        if (period.startTimeMinutes > currentTimeInMinutes) {
             const timeUntilStartMinutes = period.startTimeMinutes - currentTimeInMinutes;
             const timeUntilStartWithSeconds = timeUntilStartMinutes - (currentSeconds / 60);

            return {
                available: true,
                name: period.name,
                timeUntilStart: timeUtils.formatRemaining(timeUntilStartWithSeconds)
            };
        }
    }
    return { available: false };
}


// Get current schedule information - calls optimized functions
function getCurrentScheduleInfo() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { inSession: false, message: "Weekend - No School", needsTwoProgressBars: false, scheduleA: { inSession: false }, scheduleB: { inSession: false }, nextPeriod: { available: false } };
    }
    if (!currentSchedules[0]) {
        return { inSession: false, message: "No schedule available", needsTwoProgressBars: false, scheduleA: { inSession: false }, scheduleB: { inSession: false }, nextPeriod: { available: false } };
    }

    const scheduleAInfo = getCurrentPeriodInfo(currentSchedules[0], currentTimeInMinutes);
    const scheduleBInfo = currentSchedules[1] ? getCurrentPeriodInfo(currentSchedules[1], currentTimeInMinutes) : { inSession: false };
    const needsTwoProgressBars = scheduleBInfo.inSession;
    const nextPeriodInfo = getNextPeriodInfo(currentTimeInMinutes);

    return {
        inSession: scheduleAInfo.inSession || scheduleBInfo.inSession,
        needsTwoProgressBars,
        scheduleA: scheduleAInfo,
        scheduleB: scheduleBInfo,
        nextPeriod: nextPeriodInfo
    };
}

// Update the schedule display - Called every second now
function updateScheduleDisplay() {
    const scheduleInfo = getCurrentScheduleInfo(); // Recalculate current state

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
             if (!scheduleInfo.scheduleA.inSession) { // B Lunch case where B is primary display
                displayInfoA = displayInfoB;
                showBar1 = true;
                showBar2 = false;
             }
        } else if (!scheduleInfo.scheduleA.inSession && scheduleInfo.scheduleB.inSession) { // Only B active
            displayInfoA = { ...scheduleInfo.scheduleB, active: true };
            showBar1 = true;
        }
    } else if (scheduleInfo.nextPeriod.available) { // Between periods
        displayInfoA = { name: `Next: ${scheduleInfo.nextPeriod.name}`, timeRemaining: `in ${scheduleInfo.nextPeriod.timeUntilStart}`, progress: 0, active: false };
        showBar1 = true;
    } else { // End of day or weekend/no schedule
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
        elements.bar2.classList.add('active'); // Must be active to be shown here
        elements.bar2.style.display = 'flex';
    } else {
        elements.bar2.style.display = 'none';
    }
}

// Check for admin commands
async function checkCommands() {
    try {
        const devLink = "https://script.google.com/macros/s/AKfycbxZe6A-GKnGcv9efNxrMeSNvxcYC2MhOvqQkQLNpIiQOqcJCSuCTauq0k7Pwuz4OIcf/exec";
        const response = await fetch(devLink, { cache: "no-store" });
        if (!response.ok) {
             throw new Error(`Command fetch HTTP error! status: ${response.status}`);
        }
        const command = await response.text();

        if (command === "refresh") {
            location.reload();
        } else if (command === "wipe-storage") {
            localStorage.clear();
            location.reload();
        }
        setTimeout(checkCommands, 300000); // Check again in 5 minutes
    } catch (error) {
        console.error("Command check error:", error);
        setTimeout(checkCommands, 300000); // Retry after 5 minutes
    }
}

// --- Initialization ---
let midnightUpdateTimeoutId = null; // For date update
let midnightScheduleResetTimeoutId = null; // For schedule reset
let dailyScheduleResetIntervalId = null; // Interval for resets after the first midnight

function init() {
    console.log("Initializing Dashboard...");
    cacheElements();

    // Clear any existing timers from previous runs or failed initializations
    if (clockTimeoutId) clearTimeout(clockTimeoutId);
    if (midnightUpdateTimeoutId) clearTimeout(midnightUpdateTimeoutId);
    if (midnightScheduleResetTimeoutId) clearTimeout(midnightScheduleResetTimeoutId);
    if (dailyScheduleResetIntervalId) clearInterval(dailyScheduleResetIntervalId); // Clear interval too

    initializeSchedules(); // Load today's schedule first
    setupClock(); // Starts the main clock/update cycle
    setupWeather();
    setupDate(); // Sets up date display and its midnight update timer
    // updateScheduleDisplay(); // No longer needed here, called within first clock cycle
    checkCommands(); // Start checking for commands

    // --- Midnight Schedule Reset ---
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    console.log(`Scheduling next schedule reset in ${timeUntilMidnight / 1000 / 60} minutes`);
    midnightScheduleResetTimeoutId = setTimeout(() => {
        console.log("Midnight: Re-initializing schedules for the new day.");
        initializeSchedules(); // Reload schedules for the new day

        // After the first midnight reset, set up a daily interval
        dailyScheduleResetIntervalId = setInterval(() => {
            console.log("Daily Interval: Re-initializing schedules.");
            initializeSchedules();
        }, 24 * 60 * 60 * 1000); // Repeat every 24 hours
    }, timeUntilMidnight);

    console.log("Initialization Complete.");
}

// --- REMOVED standalone refreshAtSpecificTimes function and its interval ---

// --- Start Everything ---
document.addEventListener('DOMContentLoaded', init);