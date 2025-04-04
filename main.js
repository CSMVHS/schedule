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

// Store the timeout ID so we can potentially cancel it if needed (though not strictly necessary here)
let clockTimeoutId = null;

// Clock functionality - using self-adjusting setTimeout for accuracy
function setupClock() {
    // --- Remove the old setInterval logic ---
    // No initial sync setTimeout needed, the loop handles it.
    // No setInterval used anymore.

    // Start the clock loop
    runClockCycle();
}

function runClockCycle() {
    // 1. Update the display with the current time
    updateTimeDisplay(); // Renamed the core display logic

    // 2. Calculate the delay until the next whole second
    const now = new Date();
    const delayUntilNextSecond = 1000 - now.getMilliseconds();

    // 3. Schedule the next cycle
    // Use setTimeout to run this function again after the calculated delay
    clockTimeoutId = setTimeout(runClockCycle, delayUntilNextSecond);
}

// Renamed function to focus purely on updating the DOM element for time
function updateTimeDisplay() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Update clock display
    elements.timeEl.textContent = `${hours}:${minutes}:${seconds}`;

    // OPTIMIZATION: Update schedule display only once per minute (when seconds are 00)
    // This check remains the same, but it's now within the accurately timed cycle
    if (seconds === '00') {
        updateScheduleDisplay();
    }
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Update clock display every second
    elements.timeEl.textContent = `${hours}:${minutes}:${seconds}`;

    // OPTIMIZATION: Update schedule display only once per minute (when seconds are 00)
    if (seconds === '00') {
        updateScheduleDisplay();
    }
}

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

    // Set up update at midnight
    setTimeout(() => {
        updateDate();
        // Then update every 24 hours
        setInterval(updateDate, 24 * 60 * 60 * 1000); // Use calculation for clarity
    }, msUntilMidnight);
}

// Time utility functions (minor optimization in timeToMinutes)
const timeUtils = {
    // Convert time string (HH:MM) to minutes since midnight
    timeToMinutes: timeString => {
        // OPTIMIZATION: Slightly faster split and parse
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10); // Handle cases like "14" -> 14:00
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
            // OPTIMIZATION: Pre-calculate minutes from midnight
            const startTimeMinutes = timeUtils.timeToMinutes(startTime);
            // endTime might be null for the last period if string format allows
            const endTimeMinutes = endTime ? timeUtils.timeToMinutes(endTime) : null;

            return {
                startTime, // Keep original string if needed elsewhere
                name,
                endTime, // Keep original string if needed elsewhere
                startTimeMinutes,
                endTimeMinutes
            };
        });
    }
}

// Schedule data - daily schedules (no changes needed)
const scheduleData = {
    // Monday
    1: [
        "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50",
        "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
    ],
    // Tuesday
    2: [
        "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;S.A.S.;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50",
        "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
    ],
    // Wednesday
    3: [
        "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50",
        "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
    ],
    // Thursday
    4: [
        "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;Eagle Time;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50",
        "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
    ],
    // Friday
    5: [
        "7:00;Happy Friday!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;8:36,8:36;Passing Period;8:41,8:41;Period 2;9:32,9:32;Passing Period;9:37,9:37;Period 3;10:28,10:28;Passing Period;10:33,10:33;Period 4;11:24,11:24;A Lunch;12:02,12:02;Passing Period;12:07,12:07;Period 5;12:58,12:58;Passing Period;13:03,13:03;Period 6;13:54,13:54;Passing Period;13:59,13:59;Period 7;14:50",
        "11:24;Passing Period;11:29,11:29;Period 5;12:20,12:20;B Lunch;12:58"
    ]
};

// Cache for daily schedules
let currentSchedules = [null, null];
// OPTIMIZATION: Cache for all sorted periods of the day
let allSortedPeriods = [];

// Initialize schedules and pre-calculate/sort periods
function initializeSchedules() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Clear current schedules and sorted periods
    currentSchedules = [null, null];
    allSortedPeriods = []; // OPTIMIZATION: Clear the sorted list

    // Only initialize if it's a weekday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const daySchedules = scheduleData[dayOfWeek];
        if (daySchedules && daySchedules.length > 0) {
            // Initialize Schedule objects (which now pre-calculate minutes)
            currentSchedules[0] = new Schedule(daySchedules[0]);
            if (daySchedules.length > 1) {
                 currentSchedules[1] = new Schedule(daySchedules[1]);
            }

            // OPTIMIZATION: Collect, dedup, and sort all periods for the day *once*
            const tempPeriodsMap = new Map(); // Use Map for easy deduplication based on start time + name

            for (const schedule of currentSchedules) {
                if (!schedule) continue;
                for (const period of schedule.periods) {
                    // Ensure period has essential timing info
                    if (period.startTimeMinutes != null && period.endTimeMinutes != null) {
                        // Use a composite key for uniqueness if names can be the same at the same time (unlikely but safe)
                        const key = `${period.startTimeMinutes}-${period.name}`;
                        if (!tempPeriodsMap.has(key)) {
                             tempPeriodsMap.set(key, {
                                name: period.name,
                                startTime: period.startTime, // Keep original format if needed
                                startTimeMinutes: period.startTimeMinutes
                                // No need for endTime here, only used for finding *next* start
                             });
                        }
                    }
                }
            }
            // Convert map values to array and sort by start time
            allSortedPeriods = Array.from(tempPeriodsMap.values())
                                  .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
        }
    }
     // Ensure schedule display is updated after potentially clearing schedules (e.g., going from Friday to Saturday)
     updateScheduleDisplay();
}

// Get current period information - uses pre-calculated minutes
function getCurrentPeriodInfo(scheduleObj, currentTimeInMinutes) {
    if (!scheduleObj || !scheduleObj.periods) return { inSession: false };

    const now = new Date(); // Get current time again for seconds precision if needed
    const currentSeconds = now.getSeconds();

    // Check each period in the schedule
    for (const period of scheduleObj.periods) {
        // Use pre-calculated minutes; ensure endTime is valid
        if (period.startTimeMinutes == null || period.endTimeMinutes == null) continue;

        // Check if current time is within this period
        if (currentTimeInMinutes >= period.startTimeMinutes && currentTimeInMinutes < period.endTimeMinutes) {
            // Calculate progress using pre-calculated minutes
            const totalDuration = period.endTimeMinutes - period.startTimeMinutes;
            // Ensure totalDuration is positive to avoid division by zero or negative progress
             if (totalDuration <= 0) continue;

            const elapsed = currentTimeInMinutes - period.startTimeMinutes;
            // Remaining minutes (fractional) based on current time including seconds
            const remainingWithSeconds = (period.endTimeMinutes - currentTimeInMinutes) - (currentSeconds / 60);
            // Calculate progress including seconds
             const progress = ((elapsed + (currentSeconds / 60)) / totalDuration) * 100;


            return {
                inSession: true,
                name: period.name,
                timeRemaining: timeUtils.formatRemaining(remainingWithSeconds),
                // Ensure progress doesn't exceed 100 due to timing/rounding
                progress: Math.min(100, progress).toFixed(1)
            };
        }
    }

    return { inSession: false }; // No active period found in this schedule
}

// Find the next period - uses pre-calculated and sorted list
function getNextPeriodInfo(currentTimeInMinutes) {
    // OPTIMIZATION: Use the pre-sorted list 'allSortedPeriods'
    if (allSortedPeriods.length === 0) return { available: false };

    const now = new Date(); // Get current time again for seconds precision
    const currentSeconds = now.getSeconds();

    // Find the first period in the sorted list that starts after the current time
    for (const period of allSortedPeriods) {
        if (period.startTimeMinutes > currentTimeInMinutes) {
             // Calculate time until start including seconds adjustment
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


// Get current schedule information - calls optimized functions
function getCurrentScheduleInfo() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Calculate current time in minutes past midnight
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Handle weekend case first
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
        return {
            inSession: false,
            message: "Weekend - No School",
            needsTwoProgressBars: false,
            scheduleA: { inSession: false }, // Ensure these exist but are inactive
            scheduleB: { inSession: false },
            nextPeriod: { available: false }
        };
    }

    // Check if schedules were loaded for the weekday
    if (!currentSchedules[0]) { // If schedule A isn't loaded, assume none are
        return {
            inSession: false,
            message: "No schedule available",
            needsTwoProgressBars: false,
             scheduleA: { inSession: false },
            scheduleB: { inSession: false },
            nextPeriod: { available: false }
        };
    }

    // Get info for schedule A using the current time in minutes
    const scheduleAInfo = getCurrentPeriodInfo(currentSchedules[0], currentTimeInMinutes);

    // Get info for schedule B (if it exists)
    const scheduleBInfo = currentSchedules[1]
        ? getCurrentPeriodInfo(currentSchedules[1], currentTimeInMinutes)
        : { inSession: false }; // Default if no B schedule

    // Determine if we need both progress bars (only if B schedule is *currently* in session)
    const needsTwoProgressBars = scheduleBInfo.inSession;

     // Find the next period using the optimized function
     const nextPeriodInfo = getNextPeriodInfo(currentTimeInMinutes);


    return {
        inSession: scheduleAInfo.inSession || scheduleBInfo.inSession, // Overall session status
        needsTwoProgressBars,
        scheduleA: scheduleAInfo,
        scheduleB: scheduleBInfo,
        nextPeriod: nextPeriodInfo // Use the result from the optimized function
    };
}

// Update the schedule display - Called once per minute now
function updateScheduleDisplay() {
    const scheduleInfo = getCurrentScheduleInfo();

    // Determine the primary display info (active A period, active B period, next period, or end of day)
    let displayInfoA = { name: "Loading...", timeRemaining: "", progress: 0, active: false };
    let displayInfoB = { name: "", timeRemaining: "", progress: 0, active: false };
    let showBar1 = false;
    let showBar2 = false;

    if (scheduleInfo.inSession) {
        if (scheduleInfo.scheduleA.inSession) {
            displayInfoA = { ...scheduleInfo.scheduleA, active: true };
            showBar1 = true;
        }
        // Schedule B info is only relevant if it needs its own bar
        if (scheduleInfo.needsTwoProgressBars && scheduleInfo.scheduleB.inSession) {
             displayInfoB = { ...scheduleInfo.scheduleB, active: true };
             showBar2 = true;
             // If A wasn't in session but B is (e.g., during B lunch split), show B info in Bar 1
             if (!scheduleInfo.scheduleA.inSession) {
                displayInfoA = displayInfoB; // Copy B info to A display slot
                showBar1 = true;
                showBar2 = false; // Don't show the second bar in this specific case
             }
        } else if (!scheduleInfo.scheduleA.inSession && scheduleInfo.scheduleB.inSession) {
            // Case: Only B schedule is active (e.g., B Lunch), display it in Bar 1
            displayInfoA = { ...scheduleInfo.scheduleB, active: true };
            showBar1 = true;
        }
    } else if (scheduleInfo.nextPeriod.available) {
        // Not in session, but there's a next period
        displayInfoA = {
            name: `Next: ${scheduleInfo.nextPeriod.name}`,
            timeRemaining: `in ${scheduleInfo.nextPeriod.timeUntilStart}`,
            progress: 0, // No progress for future period
            active: false
        };
        showBar1 = true;
    } else {
         // Not in session and no more periods today (or weekend/no schedule)
         displayInfoA = {
             name: scheduleInfo.message || "End of School Day", // Use message if available (Weekend/No Schedule)
             timeRemaining: "",
             progress: 0,
             active: false
         };
         showBar1 = true; // Still show bar 1 for the message
    }


    // Update Bar 1 (Main Display)
    if (showBar1) {
        elements.bar1Name.textContent = displayInfoA.name;
        elements.bar1Remaining.textContent = displayInfoA.timeRemaining;
        elements.bar1Progress.style.width = displayInfoA.active ? `${displayInfoA.progress}%` : '0%';
        if (displayInfoA.active) {
            elements.bar1.classList.add('active');
        } else {
            elements.bar1.classList.remove('active');
        }
        elements.bar1.style.display = 'flex';
    } else {
        elements.bar1.style.display = 'none';
    }

    // Update Bar 2 (Secondary/B Schedule Display)
    if (showBar2) {
        elements.bar2Name.textContent = displayInfoB.name;
        elements.bar2Remaining.textContent = displayInfoB.timeRemaining;
        elements.bar2Progress.style.width = `${displayInfoB.progress}%`;
        elements.bar2.classList.add('active'); // Already checked B is active
        elements.bar2.style.display = 'flex';
    } else {
        elements.bar2.style.display = 'none';
    }
}

// Check for admin commands (already reasonably optimized with setTimeout)
async function checkCommands() {
    try {
        // Ensure using HTTPS for the command endpoint
        const devLink = "https://script.google.com/macros/s/AKfycbxZe6A-GKnGcv9efNxrMeSNvxcYC2MhOvqQkQLNpIiQOqcJCSuCTauq0k7Pwuz4OIcf/exec";
        const response = await fetch(devLink, { cache: "no-store" }); // Prevent potential caching issues
        if (!response.ok) {
             throw new Error(`Command fetch HTTP error! status: ${response.status}`);
        }
        const command = await response.text();

        if (command === "refresh") {
            location.reload();
        } else if (command === "wipe-storage") {
            localStorage.clear();
            location.reload(); // Reload after wiping to apply changes/clear state
        }
        // If no specific command, or after handling one, schedule the next check
        setTimeout(checkCommands, 300000); // Check again in 5 minutes

    } catch (error) {
        console.error("Command check error:", error);
        // Retry after 5 minutes even on error
        setTimeout(checkCommands, 300000);
    }
}

// --- Initialization ---

// Store timeout IDs to potentially clear them if re-initializing
let midnightUpdateTimeoutId = null;
let midnightScheduleResetTimeoutId = null;

function init() {
    console.log("Initializing Dashboard...");
    cacheElements();

    // Clear any existing timeouts (good practice if re-initializing)
    if (clockTimeoutId) clearTimeout(clockTimeoutId); // Clear clock timeout too
    if (midnightUpdateTimeoutId) clearTimeout(midnightUpdateTimeoutId);
    if (midnightScheduleResetTimeoutId) clearTimeout(midnightScheduleResetTimeoutId);

    initializeSchedules();

    // Set up clock (now starts the self-adjusting loop)
    setupClock(); // <-- This now calls runClockCycle which starts the loop

    setupWeather();
    setupDate();
    updateScheduleDisplay(); // Initial display update
    checkCommands();

    // Midnight schedule reset logic remains the same
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    midnightScheduleResetTimeoutId = setTimeout(() => {
        console.log("Midnight: Re-initializing schedules for the new day.");
        initializeSchedules();
        setInterval(() => {
            console.log("Midnight: Re-initializing schedules for the new day.");
            initializeSchedules();
        }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    console.log("Initialization Complete.");
}

// --- Start Everything ---
document.addEventListener('DOMContentLoaded', init);